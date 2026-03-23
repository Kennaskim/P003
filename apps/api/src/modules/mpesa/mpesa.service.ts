import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { InitiateStkPushDto } from './dto/mpesa.dto.js';
import { PaymentStatus } from '@prisma/client';
import { SmsService } from '../sms/sms.service.js';

@Injectable()
export class MpesaService {
    private readonly logger = new Logger(MpesaService.name);
    private readonly baseUrl: string;

    constructor(
        private config: ConfigService,
        private httpService: HttpService,
        private prisma: PrismaService,
        private smsService: SmsService,
    ) {
        // Phase 4: Environment-aware routing
        const env = this.config.get<string>('NODE_ENV');
        this.baseUrl = env === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    private async getAccessToken(): Promise<string> {
        const consumerKey = this.config.getOrThrow('MPESA_CONSUMER_KEY');
        const consumerSecret = this.config.getOrThrow('MPESA_CONSUMER_SECRET');
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
                    { headers: { Authorization: `Basic ${auth}` } },
                ),
            );
            return response.data.access_token;
        } catch (error) {
            this.logger.error('Failed to get M-Pesa access token', error);
            throw new InternalServerErrorException('Payment gateway unavailable');
        }
    }

    async initiateStkPush(dto: InitiateStkPushDto) {
        const invoice = await this.prisma.client.rentInvoice.findUnique({
            where: { id: dto.rentInvoiceId },
            include: { rentalAgreement: true },
        });

        if (!invoice) throw new NotFoundException('INVOICE_NOT_FOUND');

        const token = await this.getAccessToken();
        const shortcode = this.config.getOrThrow('MPESA_SHORTCODE');
        const passkey = this.config.getOrThrow('MPESA_PASSKEY');
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        // Safaricom expects standard KES
        const amountInKes = dto.amount;

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
                    {
                        BusinessShortCode: shortcode,
                        Password: password,
                        Timestamp: timestamp,
                        TransactionType: 'CustomerPayBillOnline',
                        Amount: amountInKes,
                        PartyA: dto.phone,
                        PartyB: shortcode,
                        PhoneNumber: dto.phone,
                        CallBackURL: this.config.getOrThrow('MPESA_CALLBACK_URL'),
                        AccountReference: invoice.id.substring(0, 12),
                        TransactionDesc: 'Rent Payment',
                    },
                    { headers: { Authorization: `Bearer ${token}` } },
                ),
            );

            // Create PENDING payment record
            return this.prisma.client.payment.create({
                data: {
                    tenantId: invoice.tenantId, // Ensure tenant isolation
                    rentalAgreementId: invoice.rentalAgreementId,
                    rentInvoiceId: invoice.id,
                    amount: amountInKes,
                    method: 'MPESA',
                    checkoutRequestId: response.data.CheckoutRequestID,
                    status: PaymentStatus.PENDING,
                },
            });
        } catch (error) {
            this.logger.error('STK Push failed', error);
            throw new InternalServerErrorException('Failed to initiate M-Pesa payment');
        }
    }

    /**
     * Phase 4: Secure Callback Processing with Prisma Transactions
     */
    async processCallback(callbackData: any) {
        const payload = callbackData.Body?.stkCallback;
        if (!payload) return;

        const checkoutRequestId = payload.CheckoutRequestID;
        const resultCode = payload.ResultCode; // 0 means Success
        const resultDesc = payload.ResultDesc;

        // 1. Validate that we actually initiated this request
        const payment = await this.prisma.client.payment.findUnique({
            where: { checkoutRequestId },
        });

        if (!payment) {
            this.logger.warn(`Received M-Pesa callback for unknown CheckoutRequestID: ${checkoutRequestId}`);
            return;
        }

        // Prevent double processing
        if (payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.FAILED) {
            return;
        }

        if (resultCode !== 0) {
            // Payment Failed or Cancelled by User
            await this.prisma.client.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.FAILED,
                    rawResponse: payload
                },
            });
            this.logger.log(`Payment ${payment.id} failed: ${resultDesc}`);
            return;
        }

        // Extract M-Pesa Receipt Number (e.g. QWE123RTY)
        const mpesaReceipt = payload.CallbackMetadata?.Item?.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
        const paymentWithDetails = await this.prisma.client.payment.findUnique({
            where: { id: payment.id },
            include: {
                rentalAgreement: { include: { renter: true } },
                rentInvoice: true
            }
        });

        if (!paymentWithDetails) return;

        // 2. ACID Transaction: Mark Payment as Completed AND Invoice as Paid simultaneously
        await this.prisma.client.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.COMPLETED,
                    mpesaReceipt,
                    rawResponse: payload,
                },
            });

            if (payment.rentInvoiceId) {
                await tx.rentInvoice.update({
                    where: { id: payment.rentInvoiceId },
                    data: { isPaid: true, paidAt: new Date() },
                });
            }
        });

        this.logger.log(`Payment ${payment.id} successfully completed. Receipt: ${mpesaReceipt}`);

        const renter = paymentWithDetails.rentalAgreement.renter;
        const amountStr = paymentWithDetails.amount.toLocaleString();

        // Example: "Confirmed. KES 15,000 received for Rent. Receipt: QWE123RTY. Thank you."
        const smsMessage = `Confirmed. KES ${amountStr} received for Rent. Receipt: ${mpesaReceipt}. Thank you.`;

        try {
            await this.smsService.sendSms(renter.phone, smsMessage);
            this.logger.log(`Receipt SMS sent to ${renter.phone}`);
        } catch (error) {
            this.logger.error(`Failed to send receipt SMS for payment ${payment.id}`, error);
        }
    }
    async checkStkPushStatus(checkoutRequestId: string): Promise<any> {
        const token = await this.getAccessToken();
        const shortcode = this.config.getOrThrow('MPESA_SHORTCODE');
        const passkey = this.config.getOrThrow('MPESA_PASSKEY');
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
                    {
                        BusinessShortCode: shortcode,
                        Password: password,
                        Timestamp: timestamp,
                        CheckoutRequestID: checkoutRequestId,
                    },
                    { headers: { Authorization: `Bearer ${token}` } },
                ),
            );
            return response.data;
        } catch (error: any) {
            // Daraja returns HTTP 400 or 500 with a specific error payload if the transaction failed
            // We catch it and return the payload so the cron job can process the exact failure reason
            this.logger.error(`STK Query failed for ${checkoutRequestId}`, error.response?.data || error.message);
            return error.response?.data || { errorMessage: 'Network error communicating with Safaricom' };
        }
    }
}

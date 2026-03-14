import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { InitiateStkPushDto } from './dto/mpesa.dto.js';
import { PaymentStatus } from '../../generated/prisma/client.js';

@Injectable()
export class MpesaService {
    private readonly logger = new Logger(MpesaService.name);

    constructor(
        private config: ConfigService,
        private httpService: HttpService,
        private prisma: PrismaService,
    ) { }

    private async getAccessToken(): Promise<string> {
        const consumerKey = this.config.getOrThrow('MPESA_CONSUMER_KEY');
        const consumerSecret = this.config.getOrThrow('MPESA_CONSUMER_SECRET');
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
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
        const invoice = await this.prisma.tenantClient.rentInvoice.findUnique({
            where: { id: dto.rentInvoiceId },
            include: { rentalAgreement: true },
        });

        if (!invoice) throw new NotFoundException('INVOICE_NOT_FOUND');

        const token = await this.getAccessToken();
        const shortcode = this.config.getOrThrow('MPESA_SHORTCODE');
        const passkey = this.config.getOrThrow('MPESA_PASSKEY');
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        // Safaricom expects standard KES, so we convert from our internal cents
        const amountInKes = Math.floor(dto.amountInCents / 100);

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
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

            return this.prisma.tenantClient.payment.create({
                data: {
                    rentalAgreementId: invoice.rentalAgreementId,
                    rentInvoiceId: invoice.id,
                    amount: dto.amountInCents, // Store safely as cents!
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
}
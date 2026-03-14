import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { MpesaCallbackDto } from './dto/mpesa.dto.js';
import { PaymentStatus } from '../../generated/prisma/client.js';

@Processor('mpesa-callbacks')
export class MpesaProcessor extends WorkerHost {
    private readonly logger = new Logger(MpesaProcessor.name);

    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async process(job: Job<MpesaCallbackDto, any, string>): Promise<void> {
        this.logger.log(`Processing M-Pesa callback for job ${job.id}`);
        const payload = job.data;
        const { ResultCode, CheckoutRequestID, CallbackMetadata } = payload.Body.stkCallback;

        try {
            if (ResultCode === 0 && CallbackMetadata) {
                const receiptItem = CallbackMetadata.Item.find((item) => item.Name === 'MpesaReceiptNumber');
                const mpesaReceipt = receiptItem?.Value?.toString() || 'UNKNOWN';

                // Use the base client because background jobs don't have an HTTP tenant context
                await this.prisma.client.$transaction(async (tx) => {
                    const payment = await tx.payment.update({
                        where: { checkoutRequestId: CheckoutRequestID },
                        data: {
                            status: PaymentStatus.COMPLETED,
                            mpesaReceipt,
                            rawResponse: payload as unknown as object, // Safe cast to Prisma JSON
                        },
                    });

                    if (payment.rentInvoiceId) {
                        await tx.rentInvoice.update({
                            where: { id: payment.rentInvoiceId },
                            data: { isPaid: true },
                        });
                    }
                });
            } else {
                // Failed payment
                await this.prisma.client.payment.update({
                    where: { checkoutRequestId: CheckoutRequestID },
                    data: {
                        status: PaymentStatus.FAILED,
                        rawResponse: payload as unknown as object,
                    },
                });
            }
        } catch (error) {
            this.logger.error(`Failed DB update for CheckoutRequestID: ${CheckoutRequestID}`, error);
            throw error; // If this throws, BullMQ will automatically retry the job later
        }
    }
}
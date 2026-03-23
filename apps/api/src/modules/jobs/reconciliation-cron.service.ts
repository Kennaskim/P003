import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { PaymentStatus } from '@prisma/client';
import { MpesaService } from '../mpesa/mpesa.service.js';

@Injectable()
export class ReconciliationCronService {
    private readonly logger = new Logger(ReconciliationCronService.name);

    constructor(
        private prisma: PrismaService,
        private mpesaService: MpesaService // Injecting the Mpesa service
    ) { }

    // Runs every hour to catch network drops
    @Cron('0 * * * *')
    async reconcileStuckPayments() {
        this.logger.log('Starting M-Pesa payment reconciliation...');

        // 1. Find payments stuck in PENDING for more than 2 hours
        const twoHoursAgo = new Date();
        twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

        const stuckPayments = await this.prisma.client.payment.findMany({
            where: {
                method: 'MPESA',
                status: PaymentStatus.PENDING,
                createdAt: { lt: twoHoursAgo },
                checkoutRequestId: { not: null }
            }
        });

        if (stuckPayments.length === 0) return;

        for (const payment of stuckPayments) {
            try {
                // Safely cast to string since we filtered for not: null
                const requestId = payment.checkoutRequestId as string;

                // Call the actual Safaricom API
                const statusResponse = await this.mpesaService.checkStkPushStatus(requestId);

                // ResultCode '0' means the payment was successfully completed by the user
                if (statusResponse?.ResultCode === '0') {
                    // ACID Transaction: Mark Payment as Completed AND Invoice as Paid
                    await this.prisma.client.$transaction(async (tx) => {
                        await tx.payment.update({
                            where: { id: payment.id },
                            data: {
                                status: PaymentStatus.COMPLETED,
                                rawResponse: statusResponse,
                            },
                        });

                        if (payment.rentInvoiceId) {
                            await tx.rentInvoice.update({
                                where: { id: payment.rentInvoiceId },
                                data: { isPaid: true },
                            });
                        }
                    });

                    this.logger.log(`Reconciled and COMPLETED payment ${payment.id}`);

                } else if (statusResponse?.ResultCode) {
                    // It has a ResultCode but it's not 0 (e.g., 1032 user cancelled, 1037 timeout)
                    await this.prisma.client.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: PaymentStatus.FAILED,
                            rawResponse: statusResponse
                        }
                    });

                    this.logger.log(`Reconciled and FAILED payment ${payment.id} - Reason: ${statusResponse.ResultDesc}`);
                }

                // If it lacks a ResultCode, Daraja might be having issues, so we leave it PENDING for the next run.

            } catch (error) {
                this.logger.error(`Failed to reconcile payment ${payment.id}`, error);
            }
        }

        this.logger.log(`Reconciliation complete. Processed ${stuckPayments.length} stuck payments.`);
    }
}

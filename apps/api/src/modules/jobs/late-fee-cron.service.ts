import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class LateFeeCronService {
    private readonly logger = new Logger(LateFeeCronService.name);

    constructor(private prisma: PrismaService) { }

    // Runs every day at 9:00 AM Nairobi time
    @Cron('0 9 * * *', { timeZone: 'Africa/Nairobi' })
    async applyLateFees() {
        this.logger.log('Starting daily late fee calculation...');
        const today = new Date();

        // 1. Find unpaid invoices where late fee hasn't been applied yet (lateFeeApplied === 0)
        const overdueInvoices = await this.prisma.client.rentInvoice.findMany({
            where: {
                isPaid: false,
                lateFeeApplied: 0, // FIXED: Now strictly checking for integer 0
                dueDate: { lt: today }
            },
            include: { rentalAgreement: true }
        });

        let appliedCount = 0;

        for (const invoice of overdueInvoices) {
            const agreement = invoice.rentalAgreement;

            // Calculate exact expiration date: dueDate + gracePeriodDays
            const expirationDate = new Date(invoice.dueDate);
            expirationDate.setDate(expirationDate.getDate() + agreement.gracePeriodDays);

            // If today is past the expiration date, apply the fee
            if (today > expirationDate) {
                let lateFee = 0;

                if (agreement.lateFeePercent && agreement.lateFeePercent > 0) {
                    lateFee = Math.floor((agreement.rentAmount * agreement.lateFeePercent) / 100);
                } else if (agreement.lateFeeAmount > 0) {
                    lateFee = agreement.lateFeeAmount;
                }

                if (lateFee > 0) {
                    // Update invoice: increase amount and log the fee applied
                    await this.prisma.client.rentInvoice.update({
                        where: { id: invoice.id },
                        data: {
                            amount: { increment: lateFee },
                            lateFeeApplied: lateFee // FIXED: Storing the integer amount instead of a boolean
                        }
                    });

                    // Triggering SMS can be added here
                    appliedCount++;
                }
            }
        }

        this.logger.log(`Late fee calculation complete. Applied fees to ${appliedCount} invoices.`);
    }
}

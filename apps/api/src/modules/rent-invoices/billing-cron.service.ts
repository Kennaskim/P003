import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { tenantStorage } from '../../common/storage/tenant.storage.js';

@Injectable()
export class BillingCronService {
    private readonly logger = new Logger(BillingCronService.name);

    constructor(
        private prisma: PrismaService,
        @InjectQueue('sms') private readonly smsQueue: Queue
    ) { }

    @Cron('0 0 1 * *', { timeZone: 'Africa/Nairobi' })
    async generateMonthlyInvoices() {
        this.logger.log('Starting automated monthly rent invoice generation...');

        const activeAgreements = await this.prisma.client.rentalAgreement.findMany({
            where: { isActive: true },
            include: {
                renter: true,
                unit: true
            },
        });

        let successCount = 0;
        const now = new Date();
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 5);

        for (const agreement of activeAgreements) {
            try {
                await tenantStorage.run({ tenantId: agreement.tenantId }, async () => {
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

                    const existingInvoice = await this.prisma.tenantClient.rentInvoice.findFirst({
                        where: {
                            rentalAgreementId: agreement.id,
                            dueDate: { gte: startOfMonth, lt: endOfMonth },
                        },
                    });

                    if (!existingInvoice) {
                        const period = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
                        const count = await this.prisma.tenantClient.rentInvoice.count({
                            where: { period }
                        });

                        const invoiceNumber = `INV-${period}-${String(count + 1).padStart(3, '0')}`;

                        await this.prisma.tenantClient.rentInvoice.create({
                            data: {
                                rentalAgreementId: agreement.id,
                                amount: agreement.rentAmount,
                                dueDate: dueDate.toISOString(),
                                invoiceNumber,
                                period,
                            },
                        });
                        successCount++;

                        await this.smsQueue.add('send-invoice-sms', {
                            renterName: agreement.renter.firstName,
                            phone: agreement.renter.phone,
                            amountInKes: agreement.rentAmount,
                            dueDate: dueDate.toISOString(),
                            unitName: agreement.unit.name,
                        }, {
                            attempts: 3,
                            backoff: { type: 'exponential', delay: 5000 }
                        });
                    }
                });
            } catch (error) {
                this.logger.error(`Failed to generate invoice for agreement ${agreement.id}`, error);
            }
        }
        this.logger.log(`Invoice generation complete. Created: ${successCount}`);
    }
}
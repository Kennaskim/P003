import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { tenantStorage } from '../../common/storage/tenant.storage';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BillingCronService {
    private readonly logger = new Logger(BillingCronService.name);

    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2 // <-- Inject the event emitter
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
                        await this.prisma.tenantClient.rentInvoice.create({
                            data: {
                                rentalAgreementId: agreement.id,
                                amount: agreement.rentAmount,
                                dueDate: dueDate.toISOString(),
                            } as any,
                        });
                        successCount++;

                        // <-- FIRE THE SMS NOTIFICATION EVENT -->
                        this.eventEmitter.emit('invoice.created', {
                            renterName: agreement.renter.firstName,
                            phone: agreement.renter.phone,
                            amount: agreement.rentAmount,
                            dueDate: dueDate.toISOString(),
                            unitName: agreement.unit.name,
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
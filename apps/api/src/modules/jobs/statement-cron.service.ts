import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class StatementCronService {
    private readonly logger = new Logger(StatementCronService.name);

    constructor(
        @InjectQueue('reports-queue') private readonly reportsQueue: Queue,
        private readonly prisma: PrismaService, // <-- Inject Prisma to read the DB
    ) { }

    // Runs at 06:00 AM on the 5th of every month
    @Cron('0 6 5 * *')
    async scheduleMonthlyStatements() {
        this.logger.log('Waking up to schedule monthly owner statements...');

        const currentMonth = new Date().toISOString().slice(0, 7); // e.g., "2026-03"

        try {
            // 1. Query the DB for all active tenants (agencies / landlords)
            // If you added subscriptionStatus in Phase 3, you can filter by that here
            const tenants = await this.prisma.client.tenant.findMany({
                where: {
                    deletedAt: null, // Only active accounts
                },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            });

            if (tenants.length === 0) {
                this.logger.log('No active tenants found. Skipping statement generation.');
                return;
            }

            this.logger.log(`Found ${tenants.length} active accounts. Queuing jobs...`);

            // 2. Map the DB results into BullMQ job payloads
            const jobs = tenants.map((tenant: any) => ({
                name: 'generate-owner-statements',
                data: {
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    tenantEmail: tenant.email,
                    month: currentMonth,
                },
                opts: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                    removeOnComplete: true, // Keeps Redis memory clean
                },
            }));

            // 3. Use addBulk for high-performance enqueuing
            await this.reportsQueue.addBulk(jobs);

            this.logger.log(`Successfully queued ${jobs.length} statement generation jobs for ${currentMonth}.`);

        } catch (error) {
            this.logger.error('Failed to schedule monthly statements', error.stack);
        }
    }
}
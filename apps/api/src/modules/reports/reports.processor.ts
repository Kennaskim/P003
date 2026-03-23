import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ReportsService } from './reports.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Processor('reports-queue')
export class ReportsProcessor extends WorkerHost {
    private readonly logger = new Logger(ReportsProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly reportsService: ReportsService,
        private readonly notificationsService: NotificationsService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing job ${job.id} of type ${job.name}...`);

        if (job.name === 'generate-owner-statements') {
            await this.handleOwnerStatement(job.data);
        }
    }

    private async handleOwnerStatement(data: { tenantId: string; tenantName: string; tenantEmail: string; month: string }) {
        const { tenantId, tenantName, tenantEmail, month } = data;

        try {
            // 1. Calculate Date Range (e.g., "2026-03" -> March 1st to March 31st)
            const [year, monthNum] = month.split('-');
            const startDate = new Date(Date.UTC(parseInt(year), parseInt(monthNum) - 1, 1));
            const endDate = new Date(Date.UTC(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999));

            // 2. Query Financial Data for the Tenant
            // Gross Rent Collected
            const payments = await this.prisma.client.payment.aggregate({
                where: {
                    tenantId,
                    status: 'COMPLETED',
                    createdAt: { gte: startDate, lte: endDate },
                },
                _sum: { amount: true },
            });
            const grossIncome = payments._sum.amount || 0;

            // Total Expenses (Phase 3 feature)
            const expensesAgg = await this.prisma.client.expense.aggregate({
                where: {
                    tenantId,
                    date: { gte: startDate, lte: endDate },
                },
                _sum: { amount: true },
            });
            const expenses = expensesAgg._sum.amount || 0;

            // Active Properties List
            const properties = await this.prisma.client.property.findMany({
                where: { tenantId, deletedAt: null },
                select: { name: true },
            });
            const propertyNames = properties.map((p: any) => p.name);

            // 3. Calculate Net Payout (Assuming 10% Management Fee for this example)
            const managementFee = Math.floor(grossIncome * 0.10);
            const netPayout = grossIncome - expenses - managementFee;

            this.logger.log(`[${tenantName}] Calculated finances: Gross KES ${grossIncome}, Net KES ${netPayout}`);

            // 4. Generate the PDF Buffer
            const pdfBuffer = await this.reportsService.generateOwnerStatementPdf({
                ownerName: tenantName,
                month,
                grossIncome,
                managementFee,
                expenses,
                netPayout,
                propertyNames: propertyNames.length > 0 ? propertyNames : ['No Active Properties'],
            });

            // 5. Send the Email with the PDF attached
            await this.notificationsService.sendOwnerStatementEmail(
                tenantEmail,
                tenantName,
                month,
                netPayout,
                pdfBuffer,
            );

            this.logger.log(`Successfully generated and emailed statement for ${tenantName}`);
        } catch (error) {
            this.logger.error(`Failed to generate statement for tenant ${tenantId}`, error.stack);
            throw error; // Throwing tells BullMQ to retry the job according to our backoff strategy
        }
    }
}

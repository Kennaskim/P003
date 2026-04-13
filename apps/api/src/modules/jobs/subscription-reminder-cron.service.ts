import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { SmsService } from '../sms/sms.service.js';

@Injectable()
export class SubscriptionReminderCronService {
    private readonly logger = new Logger(SubscriptionReminderCronService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly smsService: SmsService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async notifyExpiringTrials() {
        this.logger.log('Running subscription reminder job...');

        const now = new Date();
        const in5Days = new Date(now.getTime() + 5 * 86400000);
        const in1Day = new Date(now.getTime() + 1 * 86400000);

        // This query assumes you have the admin/owner phone in the tenant model or you fetch the Super Admin user
        const tenants = await this.prisma.client.tenant.findMany({
            where: {
                subscriptionStatus: 'TRIAL',
            },
            include: { users: { where: { role: 'SUPER_ADMIN' }, take: 1 } }
        });

        for (const tenant of tenants) {
            const trialEnd = new Date(tenant.createdAt.getTime() + 14 * 86400000);
            const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000);
            const adminPhone = tenant.phone; // Assuming tenant has a main contact phone

            if (adminPhone && (daysLeft === 5 || daysLeft === 1)) {
                await this.smsService.sendSms(
                    adminPhone,
                    `Hello ${tenant.name}, your RMS trial expires in ${daysLeft} day(s). Please renew your subscription to avoid service interruption. Reply for help.`
                );
            }
        }
    }
}
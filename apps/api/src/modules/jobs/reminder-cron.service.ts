import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { SmsService } from '../sms/sms.service.js'; // FIXED: Correct import

@Injectable()
export class ReminderCronService {
    private readonly logger = new Logger(ReminderCronService.name);

    constructor(
        private prisma: PrismaService,
        private smsService: SmsService // FIXED: Correct dependency injection
    ) { }

    @Cron('0 8 * * *', { timeZone: 'Africa/Nairobi' }) // 8:00 AM EAT
    async sendRentReminders() {
        this.logger.log('Starting daily rent reminder check...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetD3 = new Date(today);
        targetD3.setDate(today.getDate() + 3);

        const targetD1 = new Date(today);
        targetD1.setDate(today.getDate() + 1);

        const upcomingInvoices = await this.prisma.client.rentInvoice.findMany({
            where: {
                isPaid: false,
                dueDate: {
                    in: [targetD3, targetD1]
                }
            },
            include: {
                rentalAgreement: {
                    include: { renter: true }
                }
            }
        });

        for (const invoice of upcomingInvoices) {
            const daysAway = invoice.dueDate.getTime() === targetD3.getTime() ? 3 : 1;
            const renter = invoice.rentalAgreement.renter;
            const amountStr = invoice.amount.toLocaleString();

            const message = `Hello ${renter.firstName}, your rent of KES ${amountStr} is due in ${daysAway} day(s). Please pay via your portal to avoid late fees.`;

            try {
                // FIXED: Actually sending the SMS using your service
                await this.smsService.sendSms(renter.phone, message);
                this.logger.log(`Reminder sent to Renter ${renter.id} (D-${daysAway})`);
            } catch (error) {
                this.logger.error(`Failed to send reminder to Renter ${renter.id}`, error);
            }
        }
    }
}

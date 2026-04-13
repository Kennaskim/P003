import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { SmsModule } from '../sms/sms.module.js';
import { MpesaModule } from '../mpesa/mpesa.module.js';
import { StatementCronService } from './statement-cron.service.js';
import { LateFeeCronService } from './late-fee-cron.service.js';
import { ReminderCronService } from './reminder-cron.service.js';
import { ReconciliationCronService } from './reconciliation-cron.service.js';
import { SubscriptionReminderCronService } from './subscription-reminder-cron.service.js';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        BullModule.registerQueue({
            name: 'reports-queue',
        }),
        SmsModule,
        MpesaModule
    ],
    providers: [
        StatementCronService,
        LateFeeCronService,
        ReminderCronService,
        ReconciliationCronService,
        SubscriptionReminderCronService
    ],
})
export class JobsModule { }
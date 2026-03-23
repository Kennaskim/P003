import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { SmsModule } from '../sms/sms.module.js';
import { MpesaModule } from '../mpesa/mpesa.module.js'; // <-- 1. Import MpesaModule
import { StatementCronService } from './statement-cron.service.js';
import { LateFeeCronService } from './late-fee-cron.service.js';
import { ReminderCronService } from './reminder-cron.service.js';
import { ReconciliationCronService } from './reconciliation-cron.service.js';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        BullModule.registerQueue({
            name: 'reports-queue',
        }),
        SmsModule,
        MpesaModule // <-- 2. Add it to the imports array here
    ],
    providers: [
        StatementCronService,
        LateFeeCronService,
        ReminderCronService,
        ReconciliationCronService
    ],
})
export class JobsModule { }
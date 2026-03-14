import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RentInvoicesService } from './rent-invoices.service.js';
import { RentInvoicesController } from './rent-invoices.controller.js';
import { BillingCronService } from './billing-cron.service.js';

@Module({
    imports: [
        // Register the queue so the cron job can push SMS tasks to Redis
        BullModule.registerQueue({
            name: 'sms',
        }),
    ],
    controllers: [RentInvoicesController],
    providers: [RentInvoicesService, BillingCronService],
})
export class RentInvoicesModule { }
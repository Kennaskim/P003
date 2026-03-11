import { Module } from '@nestjs/common';
import { RentInvoicesService } from './rent-invoices.service';
import { RentInvoicesController } from './rent-invoices.controller';
import { BillingCronService } from './billing-cron.service';

@Module({
    controllers: [RentInvoicesController],
    providers: [RentInvoicesService, BillingCronService],
})
export class RentInvoicesModule { }
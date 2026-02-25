import { Module } from '@nestjs/common';
import { RentInvoicesService } from './rent-invoices.service';
import { RentInvoicesController } from './rent-invoices.controller';

@Module({
    controllers: [RentInvoicesController],
    providers: [RentInvoicesService],
})
export class RentInvoicesModule { }
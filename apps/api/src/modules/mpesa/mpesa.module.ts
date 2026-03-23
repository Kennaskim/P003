import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { MpesaService } from './mpesa.service.js';
import { MpesaController } from './mpesa.controller.js';
import { MpesaProcessor } from './mpesa.processor.js';
import { SmsModule } from '../sms/sms.module.js';

@Module({
    imports: [
        HttpModule,
        BullModule.registerQueue({
            name: 'mpesa-callbacks',
        }),
        SmsModule,
    ],
    controllers: [MpesaController],
    providers: [MpesaService, MpesaProcessor],
    exports: [MpesaService],
})
export class MpesaModule { }
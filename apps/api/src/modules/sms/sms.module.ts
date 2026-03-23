import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SmsService } from './sms.service.js';
import { SmsProcessor } from './sms.processor.js';

@Module({
    imports: [
        // Register the queue so the processor can bind to it
        BullModule.registerQueue({
            name: 'sms',
        }),
    ],
    providers: [SmsService, SmsProcessor],
    exports: [SmsService], // Exported in case other modules need to send urgent synchronous SMS
})
export class SmsModule { }

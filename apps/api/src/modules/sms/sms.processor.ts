import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SmsService } from './sms.service.js';

@Processor('sms')
export class SmsProcessor extends WorkerHost {
    private readonly logger = new Logger(SmsProcessor.name);

    constructor(private readonly smsService: SmsService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<void> {
        this.logger.log(`Processing SMS job: ${job.name} (Job ID: ${job.id})`);

        try {
            if (job.name === 'send-invoice-sms') {
                await this.handleInvoiceSms(job.data);
            }
            // You can add more job.name checks here later for (e.g., 'send-receipt-sms', 'send-maintenance-update')
        } catch (error) {
            this.logger.error(`Failed to process SMS job ${job.id}`, error);
            throw error; // Triggers BullMQ's automatic retry mechanism
        }
    }

    private async handleInvoiceSms(data: {
        renterName: string;
        phone: string;
        amountInCents: number;
        dueDate: string;
        unitName: string;
    }) {
        // Strict formatting rule: Convert integer cents back to KES for display
        const amountInKes = Math.floor(data.amountInCents / 100).toLocaleString('en-KE');
        const formattedDate = new Date(data.dueDate).toLocaleDateString('en-KE', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        // Construct the SMS message
        const message = `Hello ${data.renterName}, your rent invoice for ${data.unitName} is ready. Amount: KES ${amountInKes}. Due date: ${formattedDate}. Please pay via M-Pesa.`;

        // Send it via the service
        await this.smsService.sendSms(data.phone, message);
    }
}

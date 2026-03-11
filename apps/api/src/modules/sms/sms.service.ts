import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
// @ts-ignore - africastalking doesn't have official types
import * as Africastalking from 'africastalking';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private africastalking: any;

    constructor(private config: ConfigService) {
        const credentials = {
            apiKey: this.config.getOrThrow<string>('AT_API_KEY'),
            username: this.config.getOrThrow<string>('AT_USERNAME'),
        };
        this.africastalking = Africastalking(credentials);
    }

    async sendSms(to: string, message: string) {
        try {
            const sms = this.africastalking.SMS;
            const response = await sms.send({
                to: [to],
                message: message,
                // Optional: If you have a registered alphanumeric sender ID, add it to your .env
                from: this.config.get<string>('AT_SENDER_ID'),
            });
            this.logger.log(`SMS dispatched to ${to}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to send SMS to ${to}`, error);
        }
    }

    // Listen for the event emitted by the Billing Cron Job
    @OnEvent('invoice.created')
    async handleInvoiceCreatedEvent(payload: {
        renterName: string;
        phone: string;
        amount: number;
        dueDate: string;
        unitName: string;
    }) {
        // Format the integer KES nicely for the SMS
        const formattedAmount = new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(payload.amount);

        const formattedDate = new Date(payload.dueDate).toLocaleDateString('en-KE');

        const message = `Hello ${payload.renterName}, your rent invoice for ${payload.unitName} is ready. Amount due is ${formattedAmount} by ${formattedDate}. Please log in or wait for the M-Pesa prompt.`;

        await this.sendSms(payload.phone, message);
    }
}
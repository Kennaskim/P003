import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AfricasTalking from 'africastalking';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private readonly sms: any;
    private readonly isDev: boolean;

    constructor(private configService: ConfigService) {
        this.isDev = this.configService.get<string>('NODE_ENV') !== 'production';

        // Initialize Africa's Talking SDK
        const credentials = {
            apiKey: this.configService.getOrThrow<string>('AT_API_KEY'),
            username: this.configService.getOrThrow<string>('AT_USERNAME'),
        };

        const at = AfricasTalking(credentials);
        this.sms = at.SMS;
    }

    /**
     * Sends an SMS message to a specific Kenyan phone number
     */
    async sendSms(to: string, message: string): Promise<boolean> {
        // Ensure the phone number has the + prefix for Africa's Talking
        const formattedPhone = to.startsWith('+') ? to : `+${to}`;

        this.logger.log(`Preparing to send SMS to ${formattedPhone}`);

        if (this.isDev) {
            this.logger.debug(`[DEV MOCK SMS] To: ${formattedPhone} | Message: ${message}`);
            return true; // Don't actually spend SMS credits in development
        }

        try {
            const options = {
                to: [formattedPhone],
                message: message,
                // Uncomment and add your registered shortcode/alphanumeric sender ID here if you have one
                // from: this.configService.get<string>('AT_SENDER_ID'), 
            };

            const response = await this.sms.send(options);
            this.logger.log(`SMS sent successfully to ${formattedPhone}. AT Response:`, response);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send SMS to ${formattedPhone}`, error);
            throw error; // Let BullMQ catch this so it can retry the job
        }
    }
}
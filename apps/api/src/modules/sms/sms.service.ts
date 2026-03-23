import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AfricasTalking from 'africastalking';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private readonly sms: any;
    private readonly isDev: boolean;
    private readonly senderId: string | undefined;

    constructor(private configService: ConfigService) {
        this.isDev = this.configService.get<string>('NODE_ENV') !== 'production';
        this.senderId = this.configService.get<string>('AT_SENDER_ID');

        const credentials = {
            apiKey: this.configService.getOrThrow<string>('AT_API_KEY'),
            username: this.configService.getOrThrow<string>('AT_USERNAME'),
        };

        const at = AfricasTalking(credentials);
        this.sms = at.SMS;
    }

    async sendSms(to: string, message: string): Promise<boolean> {
        const formattedPhone = to.startsWith('+') ? to : `+${to}`;

        this.logger.log(`Preparing to send SMS to ${formattedPhone}`);

        if (this.isDev) {
            this.logger.debug(`[DEV MOCK SMS] To: ${formattedPhone} | Message: ${message}`);
            return true;
        }

        try {
            const options: any = {
                to: [formattedPhone],
                message: message,
            };

            if (this.senderId) {
                options.from = this.senderId;
            }

            const response = await this.sms.send(options);
            this.logger.log(`SMS sent successfully to ${formattedPhone}. AT Response:`, response);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send SMS to ${formattedPhone}`, error);
            throw error;
        }
    }
}
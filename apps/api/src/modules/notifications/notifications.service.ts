import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT', 587),
            secure: this.configService.get<number>('SMTP_PORT') === 465,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    /**
     * Core method to send an email
     */
    async sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
        try {
            const from = this.configService.get<string>('SMTP_FROM', 'noreply@rentalapp.co.ke');

            const info = await this.transporter.sendMail({
                from,
                to,
                subject,
                html,
                attachments,
            });

            this.logger.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error.stack);
            // In production, we might want to throw the error so BullMQ can retry the job
            throw error;
        }
    }

    /**
     * Phase 3 specific: Send Monthly Statement to Property Owner
     */
    async sendOwnerStatementEmail(ownerEmail: string, ownerName: string, month: string, netPayout: number, pdfBuffer: Buffer) {
        const subject = `Your Monthly Property Statement - ${month}`;

        // Simple HTML template for the email body
        const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Hello ${ownerName},</h2>
        <p>Your property management statement for <strong>${month}</strong> is now available.</p>
        <p>Your net disbursement for this period is: <strong style="color: #2e7d32;">KES ${netPayout.toLocaleString()}</strong>.</p>
        <p>Please find your detailed PDF statement attached to this email.</p>
        <br/>
        <p>Thank you,</p>
        <p>Your Property Management Team</p>
      </div>
    `;

        const attachments = [
            {
                filename: `Statement_${month}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
            },
        ];

        return this.sendEmail(ownerEmail, subject, html, attachments);
    }
}

import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SafaricomIpGuard implements CanActivate {
    private readonly logger = new Logger(SafaricomIpGuard.name);

    // Official Safaricom Production & Sandbox IP Subnets
    private readonly allowedIps = [
        '196.201.214',
        '196.201.213',
        '196.201.212',
        '196.201.211',
        // You can add your localhost IP here for testing via Ngrok/Localtonnel
        '127.0.0.1',
        '::1'
    ];

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        // Handle reverse proxies (like Railway/Vercel)
        const ip = (request.headers['x-forwarded-for'] as string || request.socket.remoteAddress || '').split(',')[0].trim();

        const isAllowed = this.allowedIps.some(allowedIp => ip.startsWith(allowedIp));

        if (!isAllowed) {
            this.logger.warn(`Blocked M-Pesa Callback attempt from unauthorized IP: ${ip}`);
            throw new ForbiddenException('Invalid Origin');
        }

        return true;
    }
}

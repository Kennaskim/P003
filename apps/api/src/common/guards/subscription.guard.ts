import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(ctx: ExecutionContext) {
        const req = ctx.switchToHttp().getRequest();
        if (!req.user || !req.user.tenantId) return true; // Let standard auth handle missing users

        const tenant = await this.prisma.client.tenant.findUnique({
            where: { id: req.user.tenantId }
        });

        if (!tenant) throw new ForbiddenException('TENANT_NOT_FOUND');

        const trialEnd = new Date(tenant.createdAt.getTime() + 14 * 86400000);
        const expiryDate = tenant.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt) : new Date(0);

        const active = tenant.subscriptionStatus === 'ACTIVE' && new Date() < expiryDate;
        const trial = tenant.subscriptionStatus === 'TRIAL' && new Date() < trialEnd;

        if (!active && !trial) {
            throw new ForbiddenException('SUBSCRIPTION_EXPIRED');
        }

        return true;
    }
}
import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { AppException } from '../../common/exceptions/app.exception.js';

@Injectable()
export class TenantsService {
    constructor(private prisma: PrismaService) { }

    async getTenantProfile(tenantId: string) {
        const tenant = await this.prisma.client.tenant.findUnique({
            where: { id: tenantId },
            select: { 
                id: true, 
                name: true, 
                subscriptionPlan: true, 
                subscriptionStatus: true,
                createdAt: true
            }
        });

        if (!tenant) throw new AppException('Tenant not found', 'TENANT_NOT_FOUND', HttpStatus.NOT_FOUND);

        // Map properties to what the frontend expects without modifying the DB schema
        const trialDays = 14;
        const trialEndsAt = new Date(tenant.createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
        const isActive = tenant.subscriptionStatus === 'ACTIVE' || 
                        (tenant.subscriptionStatus === 'TRIAL' && new Date() < trialEndsAt);

        return {
            id: tenant.id,
            name: tenant.name,
            plan: tenant.subscriptionPlan,
            status: tenant.subscriptionStatus,
            trialEndsAt: tenant.subscriptionStatus === 'TRIAL' ? trialEndsAt : null,
            isActive
        };
    }

    async updateProfile(tenantId: string, name: string) {
        return this.prisma.client.tenant.update({
            where: { id: tenantId },
            data: { name },
            select: { id: true, name: true }
        });
    }
}

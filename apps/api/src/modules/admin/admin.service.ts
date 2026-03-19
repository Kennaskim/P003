import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async getAuditLogs(tenantId: string, skip: number = 0, take: number = 50) {
        const [logs, total] = await Promise.all([
            this.prisma.client.auditLog.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: {
                    user: {
                        select: { email: true, role: true }, // Join user details for the UI
                    },
                },
            }),
            this.prisma.client.auditLog.count({ where: { tenantId } })
        ]);


        return {
            data: logs,
            meta: {
                total,
                skip,
                take,
            }
        };
    }

    /**
     * Fetch all SaaS tenants (agencies/landlords) on the platform
     */
    async getAllTenants() {
        return this.prisma.client.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        properties: true,
                        users: true,
                        units: true
                    }
                }
            }
        });
    }

    /**
     * Update a tenant's SaaS subscription plan and status
     */
    async updateTenantSubscription(tenantId: string, plan: string, status: string) {
        const tenant = await this.prisma.client.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Tenant not found');

        return this.prisma.client.tenant.update({
            where: { id: tenantId },
            data: {
                subscriptionPlan: plan,
                subscriptionStatus: status,
            }
        });
    }
}
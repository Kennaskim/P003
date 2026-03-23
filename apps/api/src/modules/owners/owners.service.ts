import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { AppException } from '../../common/exceptions/app.exception.js';

@Injectable()
export class OwnersService {
    constructor(private prisma: PrismaService) { }

    async createOwner(tenantId: string, data: any) {
        // Prevent duplicate emails within the same tenant
        const existing = await this.prisma.client.owner.findFirst({
            where: { tenantId, email: data.email }
        });

        if (existing) {
            throw new AppException('Owner with this email already exists', 'DUPLICATE_OWNER', HttpStatus.CONFLICT);
        }

        return this.prisma.client.owner.create({
            data: {
                tenantId,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
            }
        });
    }

    async getOwners(tenantId: string) {
        return this.prisma.client.owner.findMany({
            where: { tenantId, isActive: true },
            include: {
                _count: { select: { properties: true } } // Show how many properties they own
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // This powers the Owner Portal Dashboard
    async getOwnerPortfolioSummary(tenantId: string, ownerId: string) {
        const properties = await this.prisma.client.property.findMany({
            where: { tenantId, ownerId, deletedAt: null },
            include: {
                units: {
                    select: { rentAmount: true, status: true }
                }
            }
        });

        const totalUnits = properties.reduce((acc, prop) => acc + prop.units.length, 0);
        const occupiedUnits = properties.reduce((acc, prop) =>
            acc + prop.units.filter(u => u.status === 'OCCUPIED').length, 0);

        const expectedMonthlyRevenue = properties.reduce((acc, prop) =>
            acc + prop.units.reduce((sum, u) => sum + (u.status === 'OCCUPIED' ? u.rentAmount : 0), 0), 0);

        return {
            totalProperties: properties.length,
            totalUnits,
            occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
            expectedMonthlyRevenue
        };
    }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UnitStatus, RenterStatus } from '../../generated/prisma/client.js';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getMetrics() {
        const [
            totalProperties,
            totalUnits,
            occupiedUnits,
            activeRenters,
            financials
        ] = await Promise.all([
            this.prisma.tenantClient.property.count({ where: { deletedAt: null } }),
            this.prisma.tenantClient.unit.count({ where: { deletedAt: null } }),
            this.prisma.tenantClient.unit.count({ where: { status: UnitStatus.OCCUPIED, deletedAt: null } }),
            this.prisma.tenantClient.renter.count({ where: { status: RenterStatus.ACTIVE, deletedAt: null } }),

            // Calculate total collected vs pending rent
            this.prisma.tenantClient.rentInvoice.groupBy({
                by: ['isPaid'],
                _sum: {
                    amount: true,
                },
            })
        ]);
        type FinancialGroup = { isPaid: boolean; _sum: { amount: number | null } };
        const collectedRent = financials.find((f: FinancialGroup) => f.isPaid)?._sum?.amount || 0;
        const pendingRent = financials.find((f: FinancialGroup) => !f.isPaid)?._sum?.amount || 0;

        return {
            totalProperties,
            totalUnits,
            occupiedUnits,
            vacancyRate: totalUnits > 0 ? ((totalUnits - occupiedUnits) / totalUnits) * 100 : 0,
            activeRenters,
            collectedRent,
            pendingRent,
        };
    }
}
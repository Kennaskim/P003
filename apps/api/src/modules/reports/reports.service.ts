import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getPropertyIncomeReport(propertyId: string, month: number, year: number) {
        const property = await this.prisma.tenantClient.property.findFirst({
            where: { id: propertyId, deletedAt: null },
        });

        if (!property) throw new NotFoundException('PROPERTY_NOT_FOUND');

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 1);

        const invoices = await this.prisma.tenantClient.rentInvoice.findMany({
            where: {
                rentalAgreement: {
                    unit: { propertyId: propertyId }
                },
                dueDate: {
                    gte: startOfMonth,
                    lt: endOfMonth,
                }
            },
            include: {
                rentalAgreement: {
                    include: { unit: true, renter: true }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        let expectedIncome = 0;
        let collectedIncome = 0;

        const details = invoices.map(inv => {
            expectedIncome += inv.amount;
            if (inv.isPaid) collectedIncome += inv.amount;

            return {
                id: inv.id,
                unit: inv.rentalAgreement.unit.name,
                renter: `${inv.rentalAgreement.renter.firstName} ${inv.rentalAgreement.renter.lastName}`,
                amount: inv.amount,
                isPaid: inv.isPaid,
            };
        });

        return {
            property: { id: property.id, name: property.name },
            period: { month, year },
            summary: {
                expectedIncome,
                collectedIncome,
                arrears: expectedIncome - collectedIncome,
                collectionRate: expectedIncome > 0 ? Number(((collectedIncome / expectedIncome) * 100).toFixed(1)) : 0,
            },
            details,
        };
    }
}
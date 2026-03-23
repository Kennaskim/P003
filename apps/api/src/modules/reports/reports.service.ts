import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { GetReportsQueryDto } from './dto/reports.dto.js';
import { UnitStatus, Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit'; // <-- Added for PDF generation

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getFinancialReport(query: GetReportsQueryDto) {
        const whereClause: Prisma.RentInvoiceWhereInput = {};

        if (query.startDate && query.endDate) {
            whereClause.dueDate = {
                gte: new Date(query.startDate),
                lte: new Date(query.endDate),
            };
        }

        const invoices = await this.prisma.tenantClient.rentInvoice.findMany({
            where: whereClause,
            select: { amount: true, isPaid: true, lateFeeApplied: true },
        });

        let totalExpected = 0;
        let totalCollected = 0;
        let totalPending = 0;

        invoices.forEach((inv: { amount: number; isPaid: boolean; lateFeeApplied: number | null }) => {
            const totalInvoiceAmount = inv.amount + (inv.lateFeeApplied || 0);
            totalExpected += totalInvoiceAmount;

            if (inv.isPaid) {
                totalCollected += totalInvoiceAmount;
            } else {
                totalPending += totalInvoiceAmount;
            }
        });

        return {
            totalExpectedInCents: totalExpected,
            totalCollectedInCents: totalCollected,
            totalPendingInCents: totalPending,
            collectionRate: totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(2) : '0.00',
        };
    }

    async getOccupancyReport() {
        const units = await this.prisma.tenantClient.unit.groupBy({
            by: ['status'],
            _count: { id: true },
        });

        const report = {
            VACANT: 0,
            OCCUPIED: 0,
            MAINTENANCE: 0,
            total: 0,
        };

        units.forEach((u: { status: string; _count: { id: number } }) => {
            if (u.status === UnitStatus.VACANT) report.VACANT = u._count.id;
            if (u.status === UnitStatus.OCCUPIED) report.OCCUPIED = u._count.id;
            if (u.status === UnitStatus.MAINTENANCE) report.MAINTENANCE = u._count.id;
            report.total += u._count.id;
        });

        return report;
    }

    async getArrearsReport() {
        const now = new Date();

        return this.prisma.tenantClient.rentInvoice.findMany({
            where: {
                isPaid: false,
                dueDate: { lt: now },
            },
            include: {
                rentalAgreement: {
                    include: {
                        renter: { select: { firstName: true, lastName: true, phone: true } },
                        unit: { select: { name: true, property: { select: { name: true } } } },
                    }
                }
            },
            orderBy: { dueDate: 'asc' },
        });
    }

    async getPropertyIncomeReport(propertyId: string, month: number, year: number) {
        const property = await this.prisma.tenantClient.property.findFirst({
            where: { id: propertyId, deletedAt: null }, // Property DOES have deletedAt, so this stays!
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
                },
            },
            include: {
                rentalAgreement: {
                    include: { unit: true, renter: true }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        let expectedIncomeCents = 0;
        let collectedIncomeCents = 0;

        const details = invoices.map((inv: {
            id: string;
            amount: number;
            isPaid: boolean;
            rentalAgreement: {
                unit: { name: string };
                renter: { firstName: string; lastName: string }
            }
        }) => {
            expectedIncomeCents += inv.amount;
            if (inv.isPaid) collectedIncomeCents += inv.amount;

            return {
                id: inv.id,
                unit: inv.rentalAgreement.unit.name,
                renter: `${inv.rentalAgreement.renter.firstName} ${inv.rentalAgreement.renter.lastName}`,
                amountInCents: inv.amount,
                isPaid: inv.isPaid,
            };
        });

        return {
            property: { id: property.id, name: property.name },
            period: { month, year },
            summary: {
                expectedIncomeInCents: expectedIncomeCents,
                collectedIncomeInCents: collectedIncomeCents,
                arrearsInCents: expectedIncomeCents - collectedIncomeCents,
                collectionRate: expectedIncomeCents > 0 ? Number(((collectedIncomeCents / expectedIncomeCents) * 100).toFixed(1)) : 0,
            },
            details,
        };
    }

    async generateOwnerStatementPdf(data: {
        ownerName: string;
        month: string;
        grossIncome: number;
        managementFee: number;
        expenses: number;
        netPayout: number;
        propertyNames: string[];
    }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            // Initialize the PDF document
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers: Buffer[] = [];

            // Collect data chunks as the PDF is generated
            doc.on('data', buffers.push.bind(buffers));
            doc.on('error', reject);
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // --- DRAW THE PDF --- //

            // Header
            doc.fontSize(20).font('Helvetica-Bold').text('Monthly Owner Statement', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
            doc.moveDown(2);

            // Owner Info
            doc.fontSize(14).font('Helvetica-Bold').text('Account Details');
            doc.fontSize(12).font('Helvetica')
                .text(`Owner: ${data.ownerName}`)
                .text(`Statement Period: ${data.month}`)
                .text(`Properties: ${data.propertyNames.join(', ')}`);
            doc.moveDown(2);

            // Financial Summary
            doc.fontSize(14).font('Helvetica-Bold').text('Financial Summary');
            doc.moveDown(0.5);

            doc.fontSize(12).font('Helvetica');
            doc.text(`Gross Rent Collected:`, { continued: true }).text(`KES ${data.grossIncome.toLocaleString()}`, { align: 'right' });
            doc.text(`Management Fees:`, { continued: true }).text(`- KES ${data.managementFee.toLocaleString()}`, { align: 'right' });
            doc.text(`Maintenance & Expenses:`, { continued: true }).text(`- KES ${data.expenses.toLocaleString()}`, { align: 'right' });

            doc.moveDown();

            // Divider line
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // Net Payout
            doc.fontSize(14).font('Helvetica-Bold')
                .text(`Net Payout:`, { continued: true })
                .text(`KES ${data.netPayout.toLocaleString()}`, { align: 'right' });

            doc.moveDown(3);

            // Footer
            doc.fontSize(10).font('Helvetica-Oblique').fillColor('gray').text('Thank you for trusting us with your property management.', { align: 'center' });

            // Finalize the PDF
            doc.end();
        });
    }
}

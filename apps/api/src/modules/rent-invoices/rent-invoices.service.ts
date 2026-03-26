import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateRentInvoiceDto, UpdateRentInvoiceDto } from './dto/rent-invoice.dto.js';

@Injectable()
export class RentInvoicesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateRentInvoiceDto) {
        // Checking for 'status: ACTIVE' instead of 'isActive: true' based on the schema
        const agreement = await this.prisma.tenantClient.rentalAgreement.findFirst({
            where: { id: dto.rentalAgreementId, isActive: true },
        });

        if (!agreement) throw new NotFoundException('ACTIVE_RENTAL_AGREEMENT_NOT_FOUND');

        // Auto-generate invoiceNumber and period
        const dueDate = new Date(dto.dueDate);
        const period = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;

        // Count existing invoices in this period to generate a sequential number
        const existingCount = await this.prisma.tenantClient.rentInvoice.count({
            where: {
                period,
            },
        });

        const invoiceNumber = `INV-${period}-${String(existingCount + 1).padStart(3, '0')}`;

        return this.prisma.tenantClient.rentInvoice.create({
            data: {
                ...dto,
                invoiceNumber,
                period,
            },
        });
    }

    async findAll() {
        return this.prisma.tenantClient.rentInvoice.findMany({
            include: {
                rentalAgreement: {
                    include: {
                        unit: { include: { property: true } },
                        renter: true
                    }
                }
            },
            orderBy: { dueDate: 'desc' },
        });
    }

    async findOne(id: string) {
        const invoice = await this.prisma.tenantClient.rentInvoice.findFirst({
            where: { id },
            include: {
                rentalAgreement: {
                    include: {
                        unit: { include: { property: true } },
                        renter: true
                    }
                },
                payments: { orderBy: { createdAt: 'desc' } }
            },
        });

        if (!invoice) throw new NotFoundException('INVOICE_NOT_FOUND');
        return invoice;
    }

    async update(id: string, dto: UpdateRentInvoiceDto) {
        await this.findOne(id); // Ensure it exists and belongs to the tenant

        return this.prisma.tenantClient.rentInvoice.update({
            where: { id },
            data: dto,
        });
    }
}

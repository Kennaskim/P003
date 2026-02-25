import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRentInvoiceDto, UpdateRentInvoiceDto } from './dto/rent-invoice.dto';

@Injectable()
export class RentInvoicesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateRentInvoiceDto) {
        // Verify the active rental agreement exists and belongs to this tenant
        const agreement = await this.prisma.tenantClient.rentalAgreement.findFirst({
            where: { id: dto.rentalAgreementId, isActive: true },
        });

        if (!agreement) throw new NotFoundException('ACTIVE_RENTAL_AGREEMENT_NOT_FOUND');

        return this.prisma.tenantClient.rentInvoice.create({
            data: dto as any,
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
                payments: { orderBy: { createdAt: 'desc' } } // Bring in payment history
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
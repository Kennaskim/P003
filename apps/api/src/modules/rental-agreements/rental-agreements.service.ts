import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRentalAgreementDto } from './dto/rental-agreement.dto';
import { UnitStatus } from '../../generated/prisma/client';

@Injectable()
export class RentalAgreementsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateRentalAgreementDto) {
        // 1. Verify the unit exists and belongs to the tenant
        const unit = await this.prisma.tenantClient.unit.findFirst({
            where: { id: dto.unitId, deletedAt: null },
        });

        if (!unit) throw new NotFoundException('UNIT_NOT_FOUND');

        // 2. Prevent double-booking
        if (unit.status !== UnitStatus.VACANT) {
            throw new ConflictException('UNIT_NOT_VACANT');
        }

        // 3. Verify the renter exists
        const renter = await this.prisma.tenantClient.renter.findFirst({
            where: { id: dto.renterId, deletedAt: null },
        });

        if (!renter) throw new NotFoundException('RENTER_NOT_FOUND');

        // 4. Execute as a transaction
        return this.prisma.tenantClient.$transaction(async (tx) => {
            const agreement = await tx.rentalAgreement.create({
                data: {
                    unitId: dto.unitId,
                    renterId: dto.renterId,
                    startDate: new Date(dto.startDate),
                    rentAmount: dto.rentAmount,
                    deposit: dto.deposit,
                    isActive: true,
                } as any,
            });

            await tx.unit.update({
                where: { id: dto.unitId },
                data: { status: UnitStatus.OCCUPIED },
            });

            return agreement;
        });
    }

    async findAllActive() {
        return this.prisma.tenantClient.rentalAgreement.findMany({
            where: { isActive: true },
            include: {
                unit: { include: { property: true } },
                renter: true,
            },
            orderBy: { startDate: 'desc' },
        });
    }

    async findOne(id: string) {
        const agreement = await this.prisma.tenantClient.rentalAgreement.findFirst({
            where: { id },
            include: {
                unit: { include: { property: true } },
                renter: true,
                rentInvoices: { orderBy: { dueDate: 'desc' } },
            },
        });

        if (!agreement) throw new NotFoundException('RENTAL_AGREEMENT_NOT_FOUND');
        return agreement;
    }

    async terminate(id: string) {
        const agreement = await this.findOne(id);

        if (!agreement.isActive) {
            throw new ConflictException('AGREEMENT_ALREADY_TERMINATED');
        }

        return this.prisma.tenantClient.$transaction(async (tx) => {
            const terminated = await tx.rentalAgreement.update({
                where: { id },
                data: {
                    isActive: false,
                    endDate: new Date()
                },
            });

            await tx.unit.update({
                where: { id: agreement.unitId },
                data: { status: UnitStatus.VACANT },
            });

            return terminated;
        });
    }
}
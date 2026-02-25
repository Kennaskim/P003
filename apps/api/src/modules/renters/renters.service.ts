import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRenterDto, UpdateRenterDto } from './dto/renter.dto';

@Injectable()
export class RentersService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateRenterDto) {
        // Check if phone number already exists within this specific tenant's ecosystem
        const existingRenter = await this.prisma.tenantClient.renter.findFirst({
            where: { phone: dto.phone, deletedAt: null },
        });

        if (existingRenter) {
            throw new ConflictException('RENTER_PHONE_ALREADY_EXISTS');
        }

        return this.prisma.tenantClient.renter.create({
            data: dto as any,
        });
    }

    async findAll() {
        return this.prisma.tenantClient.renter.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const renter = await this.prisma.tenantClient.renter.findFirst({
            where: { id, deletedAt: null },
            include: {
                rentalAgreements: {
                    include: { unit: { include: { property: true } } }
                }
            }
        });

        if (!renter) throw new NotFoundException('RENTER_NOT_FOUND');
        return renter;
    }

    async update(id: string, dto: UpdateRenterDto) {
        await this.findOne(id);
        return this.prisma.tenantClient.renter.update({
            where: { id },
            data: dto,
        });
    }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';

@Injectable()
export class UnitsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateUnitDto) {
        // Verify the property exists and belongs to this tenant
        const property = await this.prisma.tenantClient.property.findFirst({
            where: { id: dto.propertyId, deletedAt: null },
        });

        if (!property) throw new NotFoundException('PROPERTY_NOT_FOUND');

        return this.prisma.tenantClient.unit.create({
            data: dto as any,
        });
    }

    async findAllByProperty(propertyId: string) {
        return this.prisma.tenantClient.unit.findMany({
            where: { propertyId, deletedAt: null },
            orderBy: { name: 'asc' },
        });
    }

    async update(id: string, dto: UpdateUnitDto) {
        const unit = await this.prisma.tenantClient.unit.findFirst({
            where: { id, deletedAt: null },
        });
        if (!unit) throw new NotFoundException('UNIT_NOT_FOUND');

        return this.prisma.tenantClient.unit.update({
            where: { id },
            data: dto,
        });
    }
}
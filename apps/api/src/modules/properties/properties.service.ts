import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';

@Injectable()
export class PropertiesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreatePropertyDto) {
        // tenantId is injected automatically by our Prisma extension!
        return this.prisma.tenantClient.property.create({
            data: dto as any,
        });
    }

    async findAll() {
        return this.prisma.tenantClient.property.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { units: true }
                }
            }
        });
    }

    async findOne(id: string) {
        const property = await this.prisma.tenantClient.property.findFirst({
            where: { id, deletedAt: null },
            include: { units: true }, // Bring in the units for the detail view
        });

        if (!property) throw new NotFoundException('PROPERTY_NOT_FOUND');
        return property;
    }

    async update(id: string, dto: UpdatePropertyDto) {
        await this.findOne(id); // Ensure it exists and belongs to the tenant
        return this.prisma.tenantClient.property.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        // Soft delete rule enforcement
        return this.prisma.tenantClient.property.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
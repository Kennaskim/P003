import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from './dto/maintenance.dto.js';

@Injectable()
export class MaintenanceService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateMaintenanceDto) {
        // Verify the unit exists and belongs to the current tenant
        const unit = await this.prisma.tenantClient.unit.findFirst({
            where: { id: dto.unitId, deletedAt: null },
        });

        if (!unit) throw new NotFoundException('UNIT_NOT_FOUND');

        return this.prisma.tenantClient.maintenanceRequest.create({
            data: dto,
        });
    }

    async findAll() {
        return this.prisma.tenantClient.maintenanceRequest.findMany({
            include: {
                unit: {
                    include: { property: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const request = await this.prisma.tenantClient.maintenanceRequest.findFirst({
            where: { id },
            include: {
                unit: {
                    include: { property: true },
                },
            },
        });

        if (!request) throw new NotFoundException('MAINTENANCE_REQUEST_NOT_FOUND');
        return request;
    }

    async update(id: string, dto: UpdateMaintenanceDto) {
        await this.findOne(id); // Ensure it exists and belongs to the tenant

        return this.prisma.tenantClient.maintenanceRequest.update({
            where: { id },
            data: dto,
        });
    }
}

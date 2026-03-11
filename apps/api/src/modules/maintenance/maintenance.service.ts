import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from './dto/maintenance.dto';

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
            data: dto as any,
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

    async updateStatus(id: string, dto: UpdateMaintenanceDto) {
        const request = await this.prisma.tenantClient.maintenanceRequest.findFirst({
            where: { id },
        });

        if (!request) throw new NotFoundException('MAINTENANCE_REQUEST_NOT_FOUND');

        return this.prisma.tenantClient.maintenanceRequest.update({
            where: { id },
            data: dto,
        });
    }
}
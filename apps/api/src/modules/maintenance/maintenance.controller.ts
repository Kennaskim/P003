import { Controller, Get, Post, Body, Param, Patch, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service.js';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from './dto/maintenance.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../generated/prisma/client.js';
import { Audit } from '../../common/decorators/audit.decorator.js';

@ApiTags('Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
// Added TENANT so they can actually log requests
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD, UserRole.MAINTENANCE_STAFF, UserRole.TENANT)
@Controller('maintenance')
export class MaintenanceController {
    constructor(private readonly maintenanceService: MaintenanceService) { }

    @ApiOperation({ summary: 'Log a new maintenance request' })
    @Post()
    @Audit('CREATE_MAINTENANCE', 'MAINTENANCE')
    async create(@Body() dto: CreateMaintenanceDto) {
        const data = await this.maintenanceService.create(dto);
        return { success: true, data, message: 'Maintenance request logged' };
    }

    @ApiOperation({ summary: 'Get all maintenance requests for the current tenant' })
    @Get()
    async findAll() {
        const data = await this.maintenanceService.findAll();
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Get a specific maintenance request' })
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const data = await this.maintenanceService.findOne(id);
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Update a maintenance request (status, urgency, etc.)' })
    @Patch(':id') // Changed from ':id/status' to standard REST pattern
    @Audit('UPDATE_MAINTENANCE', 'MAINTENANCE')
    async update(@Param('id') id: string, @Body() dto: UpdateMaintenanceDto) {
        const data = await this.maintenanceService.update(id, dto);
        return { success: true, data, message: 'Maintenance request updated' };
    }
}
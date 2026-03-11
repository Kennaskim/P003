import { Controller, Get, Post, Body, Param, Patch, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from './dto/maintenance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client.js';

@ApiTags('Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD, UserRole.MAINTENANCE_STAFF)
@Controller('maintenance')
export class MaintenanceController {
    constructor(private readonly maintenanceService: MaintenanceService) { }

    @ApiOperation({ summary: 'Log a new maintenance request' })
    @Post()
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

    @ApiOperation({ summary: 'Update the resolution status of a maintenance request' })
    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body() dto: UpdateMaintenanceDto) {
        const data = await this.maintenanceService.updateStatus(id, dto);
        return { success: true, data, message: 'Status updated' };
    }
}
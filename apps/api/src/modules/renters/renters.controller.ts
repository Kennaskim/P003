import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RentersService } from './renters.service.js';
import { CreateRenterDto, UpdateRenterDto } from './dto/renter.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator.js';

@ApiTags('Renters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD)
@Controller('renters')
export class RentersController {
    constructor(private readonly rentersService: RentersService) { }

    @ApiOperation({ summary: 'Register a new renter' })
    @ApiResponse({ status: 201, description: 'Renter created successfully.' })
    @Post()
    @Audit('CREATE_RENTER', 'RENTER')
    async create(@Body() createRenterDto: CreateRenterDto) {
        const data = await this.rentersService.create(createRenterDto);
        return { success: true, data, message: 'Renter created successfully' };
    }

    @ApiOperation({ summary: 'Get all renters for the current tenant' })
    @ApiResponse({ status: 200, description: 'List of all renters retrieved successfully.' })
    @Get()
    async findAll() {
        const data = await this.rentersService.findAll();
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Get a specific renter by ID' })
    @ApiResponse({ status: 200, description: 'Renter details retrieved successfully.' })
    @ApiResponse({ status: 404, description: 'Renter not found.' })
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const data = await this.rentersService.findOne(id);
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Update a specific renter' })
    @ApiResponse({ status: 200, description: 'Renter updated successfully.' })
    @ApiResponse({ status: 404, description: 'Renter not found.' })
    @Patch(':id')
    @Audit('UPDATE_RENTER', 'RENTER')
    async update(@Param('id') id: string, @Body() updateRenterDto: UpdateRenterDto) {
        const data = await this.rentersService.update(id, updateRenterDto);
        return { success: true, data, message: 'Renter updated successfully' };
    }

    @ApiOperation({ summary: 'Delete a renter (Soft Delete)' })
    @ApiResponse({ status: 200, description: 'Renter deleted successfully.' })
    @Delete(':id')
    @Audit('DELETE_RENTER', 'RENTER')
    async remove(@Param('id') id: string) {
        await this.rentersService.remove(id);
        return { success: true, message: 'Renter deleted successfully' };
    }
}

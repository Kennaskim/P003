import { Controller, Get, Post, Body, Param, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RentersService } from './renters.service';
import { CreateRenterDto, UpdateRenterDto } from './dto/renter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client.js';

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
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateRenterDto: UpdateRenterDto) {
        const data = await this.rentersService.update(id, updateRenterDto);
        return { success: true, data, message: 'Renter updated successfully' };
    }
}
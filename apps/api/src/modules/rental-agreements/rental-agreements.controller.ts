import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RentalAgreementsService } from './rental-agreements.service.js';
import { CreateRentalAgreementDto } from './dto/rental-agreement.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Rental Agreements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD)
@Controller('rental-agreements')
export class RentalAgreementsController {
    constructor(private readonly rentalAgreementsService: RentalAgreementsService) { }

    @ApiOperation({ summary: 'Create a new rental agreement and occupy a unit' })
    @Post()
    async create(@Body() createDto: CreateRentalAgreementDto) {
        const data = await this.rentalAgreementsService.create(createDto);
        return { success: true, data, message: 'Rental Agreement created and Unit occupied' };
    }

    @ApiOperation({ summary: 'Get all active rental agreements' })
    @Get()
    async findAllActive() {
        const data = await this.rentalAgreementsService.findAllActive();
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Get a specific rental agreement by ID' })
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const data = await this.rentalAgreementsService.findOne(id);
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Terminate an agreement and vacate the unit' })
    @Patch(':id/terminate')
    async terminate(@Param('id') id: string) {
        const data = await this.rentalAgreementsService.terminate(id);
        return { success: true, data, message: 'Agreement terminated and Unit vacated' };
    }
}

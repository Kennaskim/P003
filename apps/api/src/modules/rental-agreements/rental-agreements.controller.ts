import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, Patch } from '@nestjs/common';
import { RentalAgreementsService } from './rental-agreements.service';
import { CreateRentalAgreementDto } from './dto/rental-agreement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD)
@Controller('rental-agreements')
export class RentalAgreementsController {
    constructor(private readonly rentalAgreementsService: RentalAgreementsService) { }

    @Post()
    async create(@Body() createDto: CreateRentalAgreementDto) {
        const data = await this.rentalAgreementsService.create(createDto);
        return { success: true, data, message: 'Rental Agreement created and Unit occupied' };
    }

    @Get()
    async findAllActive() {
        const data = await this.rentalAgreementsService.findAllActive();
        return { success: true, data };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const data = await this.rentalAgreementsService.findOne(id);
        return { success: true, data };
    }

    @Patch(':id/terminate')
    async terminate(@Param('id') id: string) {
        const data = await this.rentalAgreementsService.terminate(id);
        return { success: true, data, message: 'Agreement terminated and Unit vacated' };
    }
}
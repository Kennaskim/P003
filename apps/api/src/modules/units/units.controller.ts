import { Controller, Get, Post, Body, Param, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD)
@Controller('units')
export class UnitsController {
    constructor(private readonly unitsService: UnitsService) { }

    @Post()
    async create(@Body() createUnitDto: CreateUnitDto) {
        const data = await this.unitsService.create(createUnitDto);
        return { success: true, data };
    }

    @Get('property/:propertyId')
    async findAllByProperty(@Param('propertyId') propertyId: string) {
        const data = await this.unitsService.findAllByProperty(propertyId);
        return { success: true, data };
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto) {
        const data = await this.unitsService.update(id, updateUnitDto);
        return { success: true, data };
    }
}
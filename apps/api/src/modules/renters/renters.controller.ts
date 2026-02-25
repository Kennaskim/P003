import { Controller, Get, Post, Body, Param, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { RentersService } from './renters.service';
import { CreateRenterDto, UpdateRenterDto } from './dto/renter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD)
@Controller('renters')
export class RentersController {
    constructor(private readonly rentersService: RentersService) { }

    @Post()
    async create(@Body() createRenterDto: CreateRenterDto) {
        const data = await this.rentersService.create(createRenterDto);
        return { success: true, data };
    }

    @Get()
    async findAll() {
        const data = await this.rentersService.findAll();
        return { success: true, data };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const data = await this.rentersService.findOne(id);
        return { success: true, data };
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateRenterDto: UpdateRenterDto) {
        const data = await this.rentersService.update(id, updateRenterDto);
        return { success: true, data };
    }
}
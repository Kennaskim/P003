import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, UseInterceptors } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD)
@Controller('properties')
export class PropertiesController {
    constructor(private readonly propertiesService: PropertiesService) { }

    @Post()
    async create(@Body() createPropertyDto: CreatePropertyDto) {
        const data = await this.propertiesService.create(createPropertyDto);
        return { success: true, data };
    }

    @Get()
    async findAll() {
        const data = await this.propertiesService.findAll();
        return { success: true, data };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const data = await this.propertiesService.findOne(id);
        return { success: true, data };
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
        const data = await this.propertiesService.update(id, updatePropertyDto);
        return { success: true, data };
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.propertiesService.remove(id);
        return { success: true, message: 'Property deleted successfully' };
    }
}
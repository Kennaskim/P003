import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client.js';

@ApiTags('Properties') // Groups these endpoints under "Properties" in the Swagger UI
@ApiBearerAuth()       // Adds the padlock icon requiring the JWT token
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD)
@Controller('properties')
export class PropertiesController {
    constructor(private readonly propertiesService: PropertiesService) { }

    @ApiOperation({ summary: 'Create a new property' })
    @Post()
    async create(@Body() createPropertyDto: CreatePropertyDto) {
        const data = await this.propertiesService.create(createPropertyDto);
        // Added the message string to match your other standard responses
        return { success: true, data, message: 'Property created successfully' };
    }

    @ApiOperation({ summary: 'Get all properties for the current tenant' })
    @Get()
    async findAll() {
        const data = await this.propertiesService.findAll();
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Get a specific property by ID' })
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const data = await this.propertiesService.findOne(id);
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Update a property by ID' })
    @Patch(':id')
    async update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
        const data = await this.propertiesService.update(id, updatePropertyDto);
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Delete a property by ID (Soft delete)' })
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.propertiesService.remove(id);
        return { success: true, message: 'Property deleted successfully' };
    }
}
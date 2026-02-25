import { Controller, Get, Post, Body, Param, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { RentInvoicesService } from './rent-invoices.service';
import { CreateRentInvoiceDto, UpdateRentInvoiceDto } from './dto/rent-invoice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD, UserRole.ACCOUNTANT)
@Controller('rent-invoices')
export class RentInvoicesController {
    constructor(private readonly rentInvoicesService: RentInvoicesService) { }

    @Post()
    async create(@Body() createDto: CreateRentInvoiceDto) {
        const data = await this.rentInvoicesService.create(createDto);
        return { success: true, data, message: 'Invoice generated successfully' };
    }

    @Get()
    async findAll() {
        const data = await this.rentInvoicesService.findAll();
        return { success: true, data };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const data = await this.rentInvoicesService.findOne(id);
        return { success: true, data };
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateDto: UpdateRentInvoiceDto) {
        const data = await this.rentInvoicesService.update(id, updateDto);
        return { success: true, data };
    }
}
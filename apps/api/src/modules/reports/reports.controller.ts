import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../generated/prisma/client.js';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD, UserRole.ACCOUNTANT)
@Controller('v1/reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @ApiOperation({ summary: 'Generate a monthly financial report for a property' })
    @ApiQuery({ name: 'propertyId', type: String, required: true, description: 'ID of the property to generate the report for' })
    @ApiQuery({ name: 'month', type: String, required: true, example: '4', description: 'Month number (1-12)' })
    @ApiQuery({ name: 'year', type: String, required: true, example: '2026', description: 'Full year (e.g., 2026)' })
    @Get('income')
    async getIncomeReport(
        @Query('propertyId') propertyId: string,
        @Query('month') month: string,
        @Query('year') year: string,
    ) {
        const data = await this.reportsService.getPropertyIncomeReport(
            propertyId,
            parseInt(month, 10),
            parseInt(year, 10)
        );
        return { success: true, data };
    }

}
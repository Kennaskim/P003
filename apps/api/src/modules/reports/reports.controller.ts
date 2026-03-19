import { Controller, Get, Query, UseGuards, UseInterceptors, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { GetReportsQueryDto } from './dto/reports.dto.js';
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
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @ApiOperation({ summary: 'Get overall financials (expected vs collected vs pending)' })
    @Get('financials')
    async getFinancials(@Query() query: GetReportsQueryDto) {
        const data = await this.reportsService.getFinancialReport(query);
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Get overall unit occupancy rates' })
    @Get('occupancy')
    async getOccupancy() {
        const data = await this.reportsService.getOccupancyReport();
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Get a list of all current arrears' })
    @Get('arrears')
    async getArrears() {
        const data = await this.reportsService.getArrearsReport();
        return { success: true, data };
    }

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

    @ApiOperation({ summary: 'Download a monthly property statement as a PDF' })
    @ApiQuery({ name: 'month', type: String, required: true, example: '2026-03', description: 'Year-month string (e.g., 2026-03)' })
    @ApiQuery({ name: 'propertyId', type: String, required: true, description: 'ID of the property' })
    @Get('statement/download')
    async downloadStatement(
        @Query('month') month: string,
        @Query('propertyId') propertyId: string,
        @Res({ passthrough: true }) res: any,
    ): Promise<StreamableFile> {
        // Parse "2026-03" into month and year numbers
        const [yearStr, monthStr] = month.split('-');
        const yearNum = parseInt(yearStr, 10);
        const monthNum = parseInt(monthStr, 10);

        // Reuse existing income report logic to gather data
        const report = await this.reportsService.getPropertyIncomeReport(propertyId, monthNum, yearNum);

        // Calculate basic financials for the PDF
        const grossIncome = report.summary.expectedIncomeInCents;
        const managementFee = Math.floor(grossIncome * 0.10);
        const expenses = report.summary.arrearsInCents;
        const netPayout = grossIncome - managementFee - expenses;

        // Generate the PDF buffer
        const pdfBuffer = await this.reportsService.generateOwnerStatementPdf({
            ownerName: report.property.name,
            month,
            grossIncome,
            managementFee,
            expenses,
            netPayout,
            propertyNames: [report.property.name],
        });

        // Set response headers for file download
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Statement_${month}.pdf"`,
        });

        return new StreamableFile(pdfBuffer);
    }

}
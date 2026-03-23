import { Controller, Get, Patch, Body, Param, Query, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator.js';

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN) // STRICT ENFORCEMENT: Only Super Admins can hit these routes
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @ApiOperation({ summary: 'Get paginated audit logs for the tenant' })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiQuery({ name: 'take', required: false, type: Number })
    @Get('audit-logs')
    async getAuditLogs(
        @Request() req: any,
        @Query('skip') skip?: string,
        @Query('take') take?: string,
    ) {
        const result = await this.adminService.getAuditLogs(
            req.tenantId,
            skip ? parseInt(skip, 10) : 0,
            take ? parseInt(take, 10) : 50,
        );

        return { success: true, ...result };
    }

    @ApiOperation({ summary: 'Get all SaaS tenants' })
    @Get('tenants')
    async getAllTenants() {
        const data = await this.adminService.getAllTenants();
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Update tenant subscription' })
    @Patch('tenants/:id/subscription')
    @Audit('UPDATE_SUBSCRIPTION', 'TENANT')
    async updateSubscription(
        @Param('id') tenantId: string,
        @Body() dto: { plan: string; status: string }
    ) {
        const data = await this.adminService.updateTenantSubscription(tenantId, dto.plan, dto.status);
        return { success: true, data, message: 'Subscription updated successfully' };
    }
}

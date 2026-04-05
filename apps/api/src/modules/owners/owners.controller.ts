import { Controller, Get, Post, Body, Param, UseGuards, Req, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OwnersService } from './owners.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';

@ApiTags('Owners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER)
@Controller('owners')
export class OwnersController {
    constructor(private readonly ownersService: OwnersService) { }

    @ApiOperation({ summary: 'Create a new property owner' })
    @Post()
    async createOwner(@Req() req: any, @Body() body: any) {
        // Note: Using any for body temporarily, consider adding a CreateOwnerDto
        const data = await this.ownersService.createOwner(req.user.tenantId, body);
        return { success: true, data, message: 'Owner created successfully' };
    }

    @ApiOperation({ summary: 'Get all property owners for the tenant' })
    @Get()
    async getOwners(@Req() req: any) {
        const data = await this.ownersService.getOwners(req.user.tenantId);
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Get portfolio performance summary for a specific owner' })
    @Get(':id/portfolio')
    async getPortfolioSummary(@Req() req: any, @Param('id') ownerId: string) {
        const data = await this.ownersService.getOwnerPortfolioSummary(req.user.tenantId, ownerId);
        return { success: true, data };
    }
}
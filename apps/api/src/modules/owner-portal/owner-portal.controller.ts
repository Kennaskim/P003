import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { OwnerPortalService } from './owner-portal.service.js';

@ApiTags('Owner Portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD)
@Controller('owner-portal')
export class OwnerPortalController {
    constructor(private readonly ownerPortalService: OwnerPortalService) { }

    @ApiOperation({ summary: 'Get owner dashboard metrics' })
    @Get('dashboard')
    async getDashboard(@Req() req: any) {
        const data = await this.ownerPortalService.getDashboardData(req.user.id);
        return { success: true, data };
    }
}
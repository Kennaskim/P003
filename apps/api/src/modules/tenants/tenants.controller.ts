import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Get('me')
    async getProfile(@Req() req: any) {
        const data = await this.tenantsService.getTenantProfile(req.user.tenantId);
        return { success: true, data };
    }

    @Patch('me')
    async updateProfile(@Req() req: any, @Body('name') name: string) {
        const data = await this.tenantsService.updateProfile(req.user.tenantId, name);
        return { success: true, message: 'Profile updated', data };
    }
}

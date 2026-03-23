import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OwnersService } from './owners.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Owners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('owners')
export class OwnersController {
    constructor(private readonly ownersService: OwnersService) { }

    @Post()
    async createOwner(@Req() req: any, @Body() body: any) {
        const data = await this.ownersService.createOwner(req.user.tenantId, body);
        return { success: true, data };
    }

    @Get()
    async getOwners(@Req() req: any) {
        const data = await this.ownersService.getOwners(req.user.tenantId);
        return { success: true, data };
    }

    @Get(':id/portfolio')
    async getPortfolioSummary(@Req() req: any, @Param('id') ownerId: string) {
        const data = await this.ownersService.getOwnerPortfolioSummary(req.user.tenantId, ownerId);
        return { success: true, data };
    }
}

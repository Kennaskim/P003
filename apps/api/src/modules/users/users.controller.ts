import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { InviteUserDto, UpdateRoleDto } from './dto/users.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    async getTeamMembers(@Req() req: any) {
        const data = await this.usersService.getTeamMembers(req.user.tenantId);
        return { success: true, data };
    }

    @Post('invite')
    // TODO: Add @RolesGuard to restrict to MANAGER/LANDLORD
    async inviteUser(@Req() req: any, @Body() dto: InviteUserDto) {
        const data = await this.usersService.inviteUser(req.user.tenantId, dto);
        return { success: true, message: 'User invited successfully', data };
    }

    @Patch(':id/role')
    async updateRole(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
        const data = await this.usersService.updateUserRole(req.user.tenantId, id, dto);
        return { success: true, data };
    }

    @Patch(':id/deactivate')
    async deactivateUser(@Req() req: any, @Param('id') id: string) {
        await this.usersService.toggleStatus(req.user.tenantId, id, false);
        return { success: true, message: 'User deactivated' };
    }
}

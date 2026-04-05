import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { InviteUserDto, UpdateRoleDto } from './dto/users.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

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
    @Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD)
    @UseGuards(RolesGuard)
    async inviteUser(@Req() req: any, @Body() dto: InviteUserDto) {
        const data = await this.usersService.inviteUser(req.user.tenantId, dto);
        return { success: true, message: 'User invited successfully', data };
    }

    @Patch(':id/role')
    @Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD)
    @UseGuards(RolesGuard)
    async updateRole(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
        const data = await this.usersService.updateUserRole(req.user.tenantId, id, dto);
        return { success: true, data };
    }

    @Patch(':id/deactivate')
    @Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD)
    @UseGuards(RolesGuard)
    async deactivateUser(@Req() req: any, @Param('id') id: string) {
        await this.usersService.toggleStatus(req.user.tenantId, id, false);
        return { success: true, message: 'User deactivated' };
    }
}
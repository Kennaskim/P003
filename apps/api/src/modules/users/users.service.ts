import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { InviteUserDto, UpdateRoleDto } from './dto/users.dto.js';
import { AppException } from '../../common/exceptions/app.exception.js';
import * as bcrypt from 'bcrypt';
import { NotificationsService } from '../notifications/notifications.service.js';
// import { ResendService } from '../notifications/resend.service.js'; // Assuming you have an email service

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService, private notificationsService: NotificationsService) { }

    async getTeamMembers(tenantId: string) {
        return this.prisma.client.user.findMany({
            where: { tenantId, deletedAt: null },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, lastLoginAt: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async inviteUser(tenantId: string, dto: InviteUserDto) {
        // 1. Check if user already exists across the system
        const existing = await this.prisma.client.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new AppException('Email already in use', 'EMAIL_EXISTS', HttpStatus.CONFLICT);
        }

        // 2. Generate a random temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // 3. Create user isolated to this tenant
        const user = await this.prisma.client.user.create({
            data: {
                tenantId,
                email: dto.email,
                firstName: dto.firstName,
                lastName: dto.lastName,
                role: dto.role,
                password: hashedPassword,
            },
            select: { id: true, email: true, role: true }
        });
        const subject = `You've been invited to join the RMS Portal`;
        const body = `Hello ${dto.firstName},<br><br>You've been invited to join our management system. Your temporary password is: <b>${tempPassword}</b><br><br>Please login and change it immediately.`;
        await this.notificationsService.sendEmail(dto.email, subject, body);

        // Email sent above via notificationsService

        return user;
    }

    async updateUserRole(tenantId: string, userId: string, dto: UpdateRoleDto) {
        try {
            return await this.prisma.client.user.update({
                where: { id: userId, tenantId }, // Ensure tenant isolation
                data: { role: dto.role },
                select: { id: true, email: true, role: true }
            });
        } catch (error) {
            throw new AppException('User not found or access denied', 'USER_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
    }

    async toggleStatus(tenantId: string, userId: string, isActive: boolean) {
        return this.prisma.client.user.update({
            where: { id: userId, tenantId },
            data: { isActive }
        });
    }
}

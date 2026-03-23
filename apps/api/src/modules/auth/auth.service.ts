import { Injectable, HttpStatus, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';
import { UserRole } from '@prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    // Helper method for logging auth events
    async logAuthEvent(tenantId: string, userId: string, action: string, ipAddress?: string) {
        return this.prisma.client.auditLog.create({
            data: {
                tenantId,
                userId,
                action,
                ipAddress,
            }
        });
    }

    async register(dto: RegisterDto, ipAddress?: string) {
        // Check if user already exists
        const existingUser = await this.prisma.client.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('USER_ALREADY_EXISTS');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Use a transaction to ensure both Tenant and User are created together 
        const result = await this.prisma.client.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: dto.companyName,
                    email: dto.email,
                },
            });

            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    email: dto.email,
                    password: hashedPassword,
                    role: UserRole.LANDLORD, // First user is the Landlord/Owner
                },
            });

            return { tenant, user };
        });

        // Audit Log: Registration
        await this.logAuthEvent(result.tenant.id, result.user.id, 'REGISTER', ipAddress);

        return this.generateTokens(result.user.id, result.tenant.id, result.user.role, result.user.email);
    }

    async login(dto: LoginDto, ipAddress?: string) {
        const user = await this.prisma.client.user.findUnique({
            where: { email: dto.email },
        });

        if (!user || !(await bcrypt.compare(dto.password, user.password))) {
            throw new UnauthorizedException('INVALID_CREDENTIALS');
        }

        // Audit Log: Login
        await this.logAuthEvent(user.tenantId, user.id, 'LOGIN', ipAddress);

        return this.generateTokens(user.id, user.tenantId, user.role, user.email);
    }
    async requestPasswordReset(email: string) {
        const user = await this.prisma.client.user.findUnique({ where: { email } });
        if (!user) return;

        // FIXED: Store token in database with expiry (15 mins)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await this.prisma.client.user.update({
            where: { id: user.id },
            data: { passwordResetToken: resetToken, passwordResetExpiresAt: expiresAt }
        });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        console.log(`Reset link for ${email}: ${resetLink}`);
        // TODO: Send via Resend
    }

    async resetPassword(token: string, newPassword: string) {
        // FIXED: Validate token against DB and check expiry
        const user = await this.prisma.client.user.findUnique({
            where: { passwordResetToken: token }
        });

        if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
            throw new AppException('Invalid or expired reset token', 'INVALID_TOKEN', HttpStatus.BAD_REQUEST);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.prisma.client.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null, // FIXED: Invalidate token after use
                passwordResetExpiresAt: null
            }
        });

        await this.logAuthEvent(user.tenantId, user.id, 'PASSWORD_RESET');
    }

    private async generateTokens(userId: string, tenantId: string, role: string, email: string) {
        const payload = { sub: userId, email, tenantId, role };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, { expiresIn: '15m' }),
            this.jwtService.signAsync(payload, { expiresIn: '7d' }),
        ]);

        return {
            accessToken,
            refreshToken,
            user: {
                id: userId,
                role,
                tenantId,
                email
            }
        };
    }
    async refresh(refreshToken: string) {
        try {
            // Verify the refresh token
            const payload = await this.jwtService.verifyAsync(refreshToken);

            // Generate a fresh pair of tokens
            return this.generateTokens(payload.sub, payload.tenantId, payload.role, payload.email);
        } catch (error) {
            throw new AppException('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', HttpStatus.UNAUTHORIZED);
        }
    }
}

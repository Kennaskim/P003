import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';
import { UserRole } from '../../generated/prisma/client.js';

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
}
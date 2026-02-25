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

    async register(dto: RegisterDto) {
        // Check if user already exists
        const existingUser = await this.prisma.client.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new ConflictException('USER_ALREADY_EXISTS'); // Machine-readable error code [cite: 68]
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Use a transaction to ensure both Tenant and User are created together [cite: 81]
        const result = await this.prisma.client.$transaction(async (tx: any) => {
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

        return this.generateTokens(result.user.id, result.tenant.id, result.user.role);
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.client.user.findUnique({
            where: { email: dto.email },
        });

        if (!user || !(await bcrypt.compare(dto.password, user.password))) {
            throw new UnauthorizedException('INVALID_CREDENTIALS'); // 401 unauthenticated [cite: 70]
        }

        return this.generateTokens(user.id, user.tenantId, user.role);
    }

    private async generateTokens(userId: string, tenantId: string, role: string) {
        const payload = { userId, tenantId, role };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, { expiresIn: '15m' }), // 15-minute expiry 
            this.jwtService.signAsync(payload, { expiresIn: '7d' }),  // 7-day refresh token [cite: 186]
        ]);

        return { accessToken, refreshToken, user: { id: userId, role, tenantId } };
    }
}
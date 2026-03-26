import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AppException } from '../../common/exceptions/app.exception.js';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OwnersService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async createOwner(tenantId: string, data: any) {
        // Prevent duplicate emails within the same tenant
        const existing = await this.prisma.client.owner.findFirst({
            where: { tenantId, email: data.email }
        });

        if (existing) {
            throw new AppException('Owner with this email already exists', 'DUPLICATE_OWNER', HttpStatus.CONFLICT);
        }

        // Check if a user with this email already exists
        const existingUser = await this.prisma.client.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            throw new AppException('A user with this email already exists', 'EMAIL_EXISTS', HttpStatus.CONFLICT);
        }

        // Generate a temporary password for the owner's login
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create both User and Owner in a transaction so the owner can log in
        const result = await this.prisma.client.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    tenantId,
                    email: data.email,
                    password: hashedPassword,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: UserRole.LANDLORD,
                }
            });

            const owner = await tx.owner.create({
                data: {
                    tenantId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    userId: user.id,
                }
            });

            return { user, owner };
        });

        // Send the owner an email with their login credentials
        try {
            const subject = `Welcome to the Property Owner Portal`;
            const body = `Hello ${data.firstName},<br><br>You've been added as a property owner. You can now log in to the owner portal.<br><br>Email: <b>${data.email}</b><br>Temporary Password: <b>${tempPassword}</b><br><br>Please log in and change your password immediately.`;
            await this.notificationsService.sendEmail(data.email, subject, body);
        } catch (error) {
            // Don't fail the owner creation if email sending fails
            console.error('Failed to send owner invite email:', error);
        }

        return result.owner;
    }

    async getOwners(tenantId: string) {
        return this.prisma.client.owner.findMany({
            where: { tenantId, isActive: true },
            include: {
                _count: { select: { properties: true } } // Show how many properties they own
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // This powers the Owner Portal Dashboard
    async getOwnerPortfolioSummary(tenantId: string, ownerId: string) {
        const properties = await this.prisma.client.property.findMany({
            where: { tenantId, ownerId, deletedAt: null },
            include: {
                units: {
                    select: { rentAmount: true, status: true }
                }
            }
        });

        const totalUnits = properties.reduce((acc, prop) => acc + prop.units.length, 0);
        const occupiedUnits = properties.reduce((acc, prop) =>
            acc + prop.units.filter(u => u.status === 'OCCUPIED').length, 0);

        const expectedMonthlyRevenue = properties.reduce((acc, prop) =>
            acc + prop.units.reduce((sum, u) => sum + (u.status === 'OCCUPIED' ? u.rentAmount : 0), 0), 0);

        return {
            totalProperties: properties.length,
            totalUnits,
            occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
            expectedMonthlyRevenue
        };
    }
}

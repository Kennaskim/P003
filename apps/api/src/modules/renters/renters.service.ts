import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateRenterDto, UpdateRenterDto } from './dto/renter.dto.js';

@Injectable()
export class RentersService {
    constructor(private prisma: PrismaService) { }

    // Helper to enforce E.164 format strictly before DB storage
    private normalizePhone(phone: string): string {
        let cleanPhone = phone.replace(/\s+/g, '');
        if (cleanPhone.startsWith('0')) {
            return '+254' + cleanPhone.substring(1);
        } else if (cleanPhone.startsWith('254')) {
            return '+' + cleanPhone;
        } else if (!cleanPhone.startsWith('+')) {
            return '+254' + cleanPhone;
        }
        return cleanPhone;
    }

    async create(dto: CreateRenterDto) {
        const normalizedPhone = this.normalizePhone(dto.phone);
        const normalizedEmergency = dto.emergencyContact ? this.normalizePhone(dto.emergencyContact) : undefined;

        const existingRenter = await this.prisma.tenantClient.renter.findFirst({
            where: { phone: normalizedPhone, deletedAt: null },
        });

        if (existingRenter) {
            throw new ConflictException('RENTER_PHONE_ALREADY_EXISTS');
        }

        return this.prisma.tenantClient.renter.create({
            data: {
                ...dto,
                phone: normalizedPhone,
                emergencyContact: normalizedEmergency,
            },
        });
    }

    async findAll() {
        return this.prisma.tenantClient.renter.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const renter = await this.prisma.tenantClient.renter.findFirst({
            where: { id, deletedAt: null },
            include: {
                rentalAgreements: {
                    include: { unit: { include: { property: true } } }
                }
            }
        });

        if (!renter) throw new NotFoundException('RENTER_NOT_FOUND');
        return renter;
    }

    async update(id: string, dto: UpdateRenterDto) {
        await this.findOne(id); // Ensure it exists

        const dataToUpdate: any = { ...dto };

        // If phone is being updated, normalize it and check for conflicts
        if (dto.phone) {
            dataToUpdate.phone = this.normalizePhone(dto.phone);
            const existing = await this.prisma.tenantClient.renter.findFirst({
                where: { phone: dataToUpdate.phone, id: { not: id }, deletedAt: null },
            });
            if (existing) throw new ConflictException('RENTER_PHONE_ALREADY_EXISTS');
        }

        if (dto.emergencyContact) {
            dataToUpdate.emergencyContact = this.normalizePhone(dto.emergencyContact);
        }

        return this.prisma.tenantClient.renter.update({
            where: { id },
            data: dataToUpdate,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        // Soft Delete Enforcement
        return this.prisma.tenantClient.renter.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}

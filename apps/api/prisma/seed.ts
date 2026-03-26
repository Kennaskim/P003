import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create the demo tenant (agency)
    const tenant = await prisma.tenant.upsert({
        where: { email: 'demo@agency.com' },
        update: {},
        create: { name: 'Demo Agency', email: 'demo@agency.com' }
    });

    // 2. Create the admin user (Property Manager)
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@agency.com' },
        update: {
            tenantId: tenant.id,
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: UserRole.PROPERTY_MANAGER
        },
        create: {
            tenantId: tenant.id,
            email: 'admin@agency.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: UserRole.PROPERTY_MANAGER
        }
    });

    // 3. Create a sample property
    const property = await prisma.property.upsert({
        where: { id: 'seed-property-001' },
        update: {},
        create: {
            id: 'seed-property-001',
            tenantId: tenant.id,
            name: 'Sunrise Apartments',
            address: 'Kilimani, Nairobi',
            type: 'APARTMENT',
        }
    });

    // 4. Create sample units
    const units = [];
    for (let i = 1; i <= 4; i++) {
        const unitId = `seed-unit-00${i}`;
        const rentAmounts = [15000, 20000, 25000, 30000];
        const statuses = ['OCCUPIED', 'OCCUPIED', 'VACANT', 'OCCUPIED'] as const;

        const unit = await prisma.unit.upsert({
            where: { id: unitId },
            update: {},
            create: {
                id: unitId,
                tenantId: tenant.id,
                propertyId: property.id,
                name: `A${i}`,
                rentAmount: rentAmounts[i - 1],
                status: statuses[i - 1],
            }
        });
        units.push(unit);
    }

    // 5. Create sample renters
    const renter1 = await prisma.renter.upsert({
        where: { phone: '+254700100100' },
        update: {},
        create: {
            id: 'seed-renter-001',
            tenantId: tenant.id,
            firstName: 'Jane',
            lastName: 'Wanjiku',
            phone: '+254700100100',
            email: 'jane@example.com',
            nationalId: '12345678',
            status: 'ACTIVE',
        }
    });

    const renter2 = await prisma.renter.upsert({
        where: { phone: '+254700200200' },
        update: {},
        create: {
            id: 'seed-renter-002',
            tenantId: tenant.id,
            firstName: 'John',
            lastName: 'Kamau',
            phone: '+254700200200',
            email: 'john@example.com',
            nationalId: '87654321',
            status: 'ACTIVE',
        }
    });

    // 6. Create rental agreements
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const agreement1 = await prisma.rentalAgreement.upsert({
        where: { id: 'seed-agreement-001' },
        update: {},
        create: {
            id: 'seed-agreement-001',
            tenantId: tenant.id,
            unitId: units[0].id,
            renterId: renter1.id,
            startDate: startOfMonth,
            rentAmount: units[0].rentAmount,
            deposit: units[0].rentAmount,
            depositPaid: true,
            isActive: true,
        }
    });

    const agreement2 = await prisma.rentalAgreement.upsert({
        where: { id: 'seed-agreement-002' },
        update: {},
        create: {
            id: 'seed-agreement-002',
            tenantId: tenant.id,
            unitId: units[1].id,
            renterId: renter2.id,
            startDate: startOfMonth,
            rentAmount: units[1].rentAmount,
            deposit: units[1].rentAmount,
            depositPaid: false,
            isActive: true,
        }
    });

    // 7. Create a sample rent invoice
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 5);
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await prisma.rentInvoice.upsert({
        where: { invoiceNumber: `INV-${period}-001` },
        update: {},
        create: {
            tenantId: tenant.id,
            rentalAgreementId: agreement1.id,
            invoiceNumber: `INV-${period}-001`,
            period,
            amount: agreement1.rentAmount,
            dueDate,
        }
    });

    await prisma.rentInvoice.upsert({
        where: { invoiceNumber: `INV-${period}-002` },
        update: {},
        create: {
            tenantId: tenant.id,
            rentalAgreementId: agreement2.id,
            invoiceNumber: `INV-${period}-002`,
            period,
            amount: agreement2.rentAmount,
            dueDate,
        }
    });

    console.log('✅ Seed completed successfully!');
    console.log('   Login: admin@agency.com / password123');
    console.log(`   Created: 1 tenant, 1 user, 1 property, ${units.length} units, 2 renters, 2 agreements, 2 invoices`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
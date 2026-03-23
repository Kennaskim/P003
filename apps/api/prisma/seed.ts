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

    const tenant = await prisma.tenant.upsert({
        where: { email: 'demo@agency.com' },
        update: {},
        create: { name: 'Demo Agency', email: 'demo@agency.com' }
    });

    await prisma.user.upsert({
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

    console.log('Seed completed. Login with admin@agency.com / password123');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
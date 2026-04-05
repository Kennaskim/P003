import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    const invoices = await prisma.rentInvoice.findMany({
        take: 5,
        include: {
            rentalAgreement: {
                include: {
                    unit: true,
                    renter: true
                }
            }
        }
    });

    console.log('--- INVOICES ---');
    invoices.forEach(inv => {
        console.log(`ID: ${inv.id}`);
        console.log(`Invoice #: ${inv.invoiceNumber}`);
        console.log(`Amount: ${inv.amount}`);
        console.log(`Unit Rent: ${inv.rentalAgreement.unit.rentAmount}`);
        console.log(`Renter: ${inv.rentalAgreement.renter.firstName} ${inv.rentalAgreement.renter.lastName}`);
        console.log('---');
    });

    const agreements = await prisma.rentalAgreement.findMany({ take: 5 });
    console.log('--- AGREEMENTS ---');
    agreements.forEach(ag => {
        console.log(`ID: ${ag.id}, Rent: ${ag.rentAmount}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

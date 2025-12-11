import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    const tenantA = await prisma.tenant.upsert({
        where: { id: 'tenant-a' },
        update: {},
        create: {
            id: 'tenant-a',
            name: 'Tenant A',
        },
    });
    console.log('Created Tenant A:', tenantA);

    const tenantB = await prisma.tenant.upsert({
        where: { id: 'tenant-b' },
        update: {},
        create: {
            id: 'tenant-b',
            name: 'Tenant B',
        },
    });
    console.log('Created Tenant B:', tenantB);

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

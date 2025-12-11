
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function seed() {
    const tenantId = 'tenant-rock-123';

    console.log("🛠️ Seeding Tenant Config for 'Barbearia Rock'...");

    // Ensure tenant exists
    await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: { id: tenantId, name: 'Barbearia Rock' }
    });

    // Upsert Config with Custom Persona
    await prisma.tenantConfig.upsert({
        where: { tenantId },
        update: {
            agentName: 'RockBot',
            agentGreeting: 'E aí mano! Bem vindo à Barbearia Rock 🤘',
            agentPersonality: 'You are RockBot, a heavy metal barber assistant. You speak with slang and use "🤘" often. Be radical.',
            agentTone: 'casual'
        },
        create: {
            tenantId,
            agentName: 'RockBot',
            agentGreeting: 'E aí mano! Bem vindo à Barbearia Rock 🤘',
            agentPersonality: 'You are RockBot, a heavy metal barber assistant. You speak with slang and use "🤘" often. Be radical.',
            agentTone: 'casual'
        }
    });
    console.log("✅ Config seeded.");
}

seed()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

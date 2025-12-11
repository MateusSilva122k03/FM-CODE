import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AgentConfig {
    agentName: string;
    agentGreeting: string;
    agentPersonality: string | null;
    agentTone: string;
    publicName: string | null;
}

const DEFAULT_SYSTEM_INSTRUCTION = `You are a friendly barbershop assistant. Help customers schedule appointments, check availability, and answer questions about services. Be polite, concise, and helpful.`;

export const getAgentConfig = async (tenantId: string): Promise<AgentConfig> => {
    const config = await prisma.tenantConfig.findUnique({
        where: { tenantId }
    });

    if (!config) {
        // Return defaults if no config exists
        return {
            agentName: 'Assistente FlowMaster',
            agentGreeting: 'Olá! Sou o assistente virtual. Como posso ajudar?',
            agentPersonality: DEFAULT_SYSTEM_INSTRUCTION,
            agentTone: 'friendly',
            publicName: null
        };
    }

    // Build personality based on tone if not custom
    let personality = config.agentPersonality;
    if (!personality) {
        const toneInstructions: Record<string, string> = {
            friendly: 'Be warm, friendly, and use casual language. Use emojis occasionally.',
            formal: 'Be professional and formal. Use proper grammar and avoid slang.',
            casual: 'Be super relaxed and informal. Use slang and be like a friend chatting.'
        };
        const toneInstruction = toneInstructions[config.agentTone || 'friendly'] || toneInstructions.friendly;
        personality = `You are ${config.agentName || 'an assistant'} for ${config.publicName || 'a barbershop'}. ${toneInstruction} Help customers schedule appointments, check availability, and answer questions about services.`;
    }

    return {
        agentName: config.agentName || 'Assistente FlowMaster',
        agentGreeting: config.agentGreeting || 'Olá! Sou o assistente virtual. Como posso ajudar?',
        agentPersonality: personality,
        agentTone: config.agentTone || 'friendly',
        publicName: config.publicName
    };
};

export const updateAgentConfig = async (tenantId: string, data: Partial<AgentConfig>) => {
    return prisma.tenantConfig.upsert({
        where: { tenantId },
        update: {
            agentName: data.agentName,
            agentGreeting: data.agentGreeting,
            agentPersonality: data.agentPersonality,
            agentTone: data.agentTone
        },
        create: {
            tenantId,
            agentName: data.agentName || 'Assistente FlowMaster',
            agentGreeting: data.agentGreeting || 'Olá! Sou o assistente virtual. Como posso ajudar?',
            agentPersonality: data.agentPersonality,
            agentTone: data.agentTone || 'friendly'
        }
    });
};

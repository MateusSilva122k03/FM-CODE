-- AlterTable
ALTER TABLE "TenantConfig" ADD COLUMN     "agentGreeting" TEXT DEFAULT 'Olá! Sou o assistente virtual. Como posso ajudar?',
ADD COLUMN     "agentName" TEXT DEFAULT 'Assistente FlowMaster',
ADD COLUMN     "agentPersonality" TEXT,
ADD COLUMN     "agentTone" TEXT DEFAULT 'friendly';

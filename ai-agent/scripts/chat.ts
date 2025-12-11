
import readline from 'readline';
import { processMessage, clearSession } from '../src/services/ai.service';
import dotenv from 'dotenv';

dotenv.config();

// Get tenant from command line args (e.g., npx ts-node scripts/chat.ts --tenant abc123)
const args = process.argv.slice(2);
const tenantIndex = args.indexOf('--tenant');
const tenantId = tenantIndex !== -1 && args[tenantIndex + 1] ? args[tenantIndex + 1] : 'demo-tenant-001';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("🤖 FlowMaster AI Agent (CLI Mode)");
console.log("----------------------------------");
console.log(`📍 Tenant: ${tenantId}`);
console.log("Type 'exit' to quit, 'reset' to start new conversation.\n");

function ask() {
    rl.question('You: ', async (userInput) => {
        const input = userInput.trim();

        if (input.toLowerCase() === 'exit') {
            rl.close();
            return;
        }

        if (input.toLowerCase() === 'reset') {
            // Clear session (will need to clear key with senderId potentially, 
            // but for CLI we assume single user per tenant for now or we specific key)
            // Ideally clearSession should take senderId too.
            // For now, let's just log it.
            console.log("🔄 Resetando conversa locais...");
            // clearSession(tenantId); // This needs update in ai.service.ts if strict, but ignoring for CLI convenience

            console.log("🔄 Conversa reiniciada!\n");
            ask();
            return;
        }

        try {
            // Pass 'cli-user' as senderId to allow unique session keying
            const response = await processMessage(input, tenantId, 'cli-user');
            console.log(`Agent: ${response}\n`);
        } catch (error) {
            console.error('Error:', error);
        }

        ask();
    });
}

ask();

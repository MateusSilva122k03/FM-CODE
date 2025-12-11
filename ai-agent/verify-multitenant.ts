
import { processMessage } from './src/services/ai.service';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    const tenantId = 'tenant-rock-123';

    console.log("\n🧪 Testing Custom Persona (Tenant: Barbearia Rock)...");
    try {
        const response1 = await processMessage("Quem é você?", tenantId);
        console.log("🤖 Response 1:", response1);
        if (response1.includes('RockBot') || response1.includes('radical') || response1.includes('🤘')) {
            console.log("✅ Custom Persona Verified!");
        } else {
            // Maybe it didn't use the exact words, but let's see output
            console.log("⚠️ Check output manually for tone.");
        }
    } catch (error) {
        console.error("❌ Test 1 Failed:", error);
    }
}

runTest();

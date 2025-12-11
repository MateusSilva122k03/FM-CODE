
import { processMessage } from './src/services/ai.service';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    console.log("🤖 Asking AI: 'Quais serviços vocês têm?'...");
    try {
        const response = await processMessage("Quais serviços vocês têm?");
        console.log("\n✨ AI Response:\n", response);
    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

runTest();

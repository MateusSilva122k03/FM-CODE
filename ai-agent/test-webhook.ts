
import axios from 'axios';

const API_URL = 'http://localhost:4000/whatsapp/inbound';

async function testWebhook() {
    console.log("📡 Testing AI Agent Webhook via HTTP...");

    const payload = {
        message: "Quais serviços vocês tem e qual o preço?",
        tenantId: "tenant-rock-123", // Using the Rock Barbershop tenant
        senderId: "tester-001"
    };

    try {
        console.log("📤 Sending:", payload);
        const start = Date.now();

        const response = await axios.post(API_URL, payload);

        const duration = Date.now() - start;
        console.log(`✅ Response (${duration}ms):`, JSON.stringify(response.data, null, 2));

        // Validation
        const text = response.data.response || '';
        if (text.toLowerCase().includes('corte') && text.includes('R$')) {
            console.log("✅ Success: AI listed services/prices.");
        } else {
            console.warn("⚠️ Warning: AI response might be unexpected. Check output.");
        }

        // Check for persona
        if (text.includes('🤘') || text.includes('radical') || text.includes('Rock')) {
            console.log("✅ Success: Multi-tenant Persona preserved (RockBot).");
        } else {
            console.warn("⚠️ Warning: Persona tone not detected via Webhook.");
        }

    } catch (error: any) {
        console.error("❌ Error:", error.response?.data || error.message);
    }
}

testWebhook();

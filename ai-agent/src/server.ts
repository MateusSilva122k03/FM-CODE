import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000; // 4000 to avoid conflict with FlowMaster (3000)

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'FlowMaster AI Agent',
        timestamp: new Date().toISOString()
    });
});

import { processMessage } from './services/ai.service';

// Webhook for WhatsApp (or HTTP Simulation)
app.post('/whatsapp/inbound', async (req, res) => {
    try {
        console.log('📨 Message received:', JSON.stringify(req.body, null, 2));

        // 1. Adapter Layer: Extract core message from various formats
        // Support both simple HTTP POST { message, tenantId } ...
        // ... and future WhatsApp Cloud API structure
        let message = '';
        let tenantId = 'default-tenant';
        let senderId = 'unknown';

        if (req.body.message) {
            // Simple HTTP format (for simulation)
            message = req.body.message;
            tenantId = req.body.tenantId || 'default-tenant';
            senderId = req.body.senderId || 'simulator';
        } else if (req.body.entry) {
            // WhatsApp Cloud API format (Basic extraction)
            // TODO: Implement full extraction logic when approved
            // For now, let's keep it robust so it doesn't crash on garbage
            const change = req.body.entry?.[0]?.changes?.[0];
            const msg = change?.value?.messages?.[0];
            if (msg && msg.type === 'text') {
                message = msg.text.body;
                senderId = msg.from;
                // Tenant derivation logic would go here (e.g. map phone number to tenant)
            }
        }

        if (!message) {
            console.warn('⚠️ No text message found in payload');
            return res.sendStatus(200); // Always 200 to Meta to acknowledge
        }

        // 2. AI Processing
        console.log(`🧠 Processing for ${tenantId} (User: ${senderId}): "${message}"`);
        const aiResponse = await processMessage(message, tenantId, senderId);
        console.log(`🤖 AI Response: "${aiResponse}"`);

        // 3. Response Layer
        // For HTTP simulation, we return JSON.
        // For Real WhatsApp, we would call the WhatsApp Send API here.
        if (req.body.message) {
            res.json({
                status: 'success',
                response: aiResponse
            });
        } else {
            // WhatsApp waits for 200OK only. We send response async (not implemented yet).
            res.sendStatus(200);
        }

    } catch (error) {
        console.error('❌ Webhook Error:', error);
        res.sendStatus(500);
    }
});

// Verification Endpoint for Meta (GET)
app.get('/whatsapp/inbound', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verify token (we will set this in .env later)
    if (mode && token) {
        if (mode === 'subscribe' && token === (process.env.WHATSAPP_VERIFY_TOKEN || 'temp-token')) {
            console.log('✅ Webhook verified');
            res.status(200).send(challenge);
        } else {
            console.log('❌ Webhook verification failed');
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

app.listen(PORT, () => {
    console.log(`🤖 AI Agent running on port ${PORT}`);
});

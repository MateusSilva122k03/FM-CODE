import { Router } from 'express';
import { getAgentConfig, updateAgentConfig } from '../services/ai-config.service';

const router = Router();

// Public endpoint for AI Agent to fetch tenant-specific config
router.get('/public/agent-config', async (req, res, next) => {
    try {
        const { tenantId } = req.query;

        if (!tenantId || typeof tenantId !== 'string') {
            return res.status(400).json({ error: 'tenantId query parameter is required' });
        }

        const config = await getAgentConfig(tenantId);
        res.json(config);
    } catch (error: any) {
        next(error);
    }
});

// Admin endpoint to update agent config (requires auth)
router.put('/config/agent', async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            return res.status(401).json({ error: 'Tenant context required' });
        }

        const { agentName, agentGreeting, agentPersonality, agentTone } = req.body;

        const updated = await updateAgentConfig(tenantId, {
            agentName,
            agentGreeting,
            agentPersonality,
            agentTone
        });

        res.json(updated);
    } catch (error: any) {
        next(error);
    }
});

export default router;

import { Router } from 'express';
import { prismaClient } from '../lib/prisma';

import { getServices } from '../services/services.service';
import { getAvailableSlots } from '../services/availability.service';

const router = Router();

// GET /api/config/payment (Public)
// Requires ?tenantId=... query param since we don't have auth token
router.get('/config/payment', async (req, res, next) => {
    try {
        const { tenantId } = req.query;

        if (!tenantId || typeof tenantId !== 'string') {
            return res.status(400).json({ error: 'tenantId query parameter is required for public access' });
        }

        const config = await prismaClient.tenantConfig.findUnique({
            where: { tenantId }
        });

        if (!config) {
            return res.status(404).json({ error: 'Tenant configuration not found' });
        }

        // Return only safe public info
        res.json({
            pixKey: config.pixKey,
            logoUrl: config.logoUrl,
            publicName: config.publicName,
            themeColor: config.themeColor
        });
    } catch (error: any) {
        next(error);
    }
});

// GET /api/public/services
router.get('/public/services', async (req, res, next) => {
    try {
        const { tenantId } = req.query;
        if (!tenantId || typeof tenantId !== 'string') {
            return res.status(400).json({ error: 'tenantId query parameter is required' });
        }

        const services = await getServices(tenantId);
        res.json(services);
    } catch (error: any) {
        next(error);
    }
});

// GET /api/public/availability
router.get('/public/availability', async (req, res, next) => {
    try {
        const { tenantId, professionalId, date } = req.query;

        if (!tenantId || typeof tenantId !== 'string') {
            return res.status(400).json({ error: 'tenantId is required' });
        }
        if (!professionalId || typeof professionalId !== 'string') {
            return res.status(400).json({ error: 'professionalId is required' });
        }
        if (!date || typeof date !== 'string') {
            return res.status(400).json({ error: 'date is required' });
        }

        const slots = await getAvailableSlots(professionalId, date, tenantId);
        res.json(slots);
    } catch (error: any) {
        next(error);
    }
});

export default router;

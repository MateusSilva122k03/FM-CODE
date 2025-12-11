import { Router } from 'express';
import { getTenantConfig, updateTenantConfig } from '../services/config.service';

const router = Router();

// GET /api/config
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.user!.tenantId;
        const config = await getTenantConfig(tenantId);
        res.json(config);
    } catch (error: any) {
        next(error);
    }
});

// PUT /api/config
router.put('/', async (req, res, next) => {
    try {
        const tenantId = req.user!.tenantId;
        const config = await updateTenantConfig(tenantId, req.body);
        res.json(config);
    } catch (error: any) {
        next(error);
    }
});

export default router;

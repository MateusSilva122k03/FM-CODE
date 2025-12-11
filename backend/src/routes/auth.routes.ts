import { Router } from 'express';
import { registerUser, loginUser, generateServiceToken } from '../services/auth.service';

const router = Router();

router.post('/register', async (req, res, next) => {
    try {
        const user = await registerUser(req.body);
        res.status(201).json(user);
    } catch (error: any) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const result = await loginUser(req.body);
        res.json(result);
    } catch (error: any) {
        next(error);
        next(error);
    }
});

router.post('/service-token', async (req, res, next) => {
    try {
        const { apiKey, tenantId } = req.body;
        if (!apiKey || !tenantId) {
            return res.status(400).json({ error: 'apiKey and tenantId are required' });
        }
        const result = await generateServiceToken(apiKey, tenantId);
        res.json(result);
    } catch (error: any) {
        if (error.message === 'Invalid API Key') {
            return res.status(401).json({ error: 'Invalid API Key' });
        }
        next(error);
    }
});

export default router;

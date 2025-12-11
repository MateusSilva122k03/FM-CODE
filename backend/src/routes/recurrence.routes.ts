import { Router } from 'express';
import { createRecurringSeries, getRecurrenceRules, deleteRecurrenceRule } from '../services/recurrence.service';

const router = Router();

// POST /api/appointments/recurring
router.post('/appointments/recurring', async (req, res, next) => {
    try {
        const tenantId = req.user!.tenantId;
        const userId = (req.user as any).userId || (req.user as any).id;
        const result = await createRecurringSeries({ ...req.body, userId }, tenantId);
        res.status(201).json(result);
    } catch (error: any) {
        next(error);
    }
});

// GET /api/recurrence-rules
router.get('/recurrence-rules', async (req, res, next) => {
    try {
        const tenantId = req.user!.tenantId;
        const rules = await getRecurrenceRules(tenantId);
        res.json(rules);
    } catch (error: any) {
        next(error);
    }
});

// DELETE /api/recurrence-rules/:id
router.delete('/recurrence-rules/:id', async (req, res, next) => {
    try {
        const tenantId = req.user!.tenantId;
        await deleteRecurrenceRule(req.params.id, tenantId);
        res.status(204).send();
    } catch (error: any) {
        next(error);
    }
});

export default router;

import { Router } from 'express';
import * as availabilityService from '../services/availability.service';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
    try {
        const { professionalId } = req.params as { professionalId: string };
        const { date } = req.query;

        if (!date || typeof date !== 'string') {
            return res.status(400).json({ error: 'Date query parameter is required' });
        }

        const slots = await availabilityService.getAvailableSlots(
            professionalId,
            date,
            req.user!.tenantId
        );
        res.json(slots);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;

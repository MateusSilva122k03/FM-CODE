import { Router } from 'express';
import { createReview } from '../services/reviews.service';

const router = Router();

// POST /api/reviews
router.post('/', async (req, res, next) => {
    try {
        const userId = (req.user as any).userId; // Authenticated user
        const tenantId = (req.user as any).tenantId;
        const { appointmentId, rating, comment } = req.body;

        const review = await createReview({
            appointmentId,
            rating,
            comment,
            userId,
            tenantId
        });

        res.status(201).json(review);
    } catch (error: any) {
        next(error);
    }
});

export default router;

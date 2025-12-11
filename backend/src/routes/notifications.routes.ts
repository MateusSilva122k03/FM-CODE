import { Router } from 'express';
import { runReminderJob } from '../services/notifications.service';
import { prismaClient } from '../lib/prisma';

const router = Router();

// GET /api/notifications
// List user notifications
router.get('/', async (req, res, next) => {
    try {
        const userId = (req.user as any).userId;
        const notifications = await prismaClient.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (error: any) {
        next(error);
    }
});

// POST /api/notifications/run-job
// Trigger the job manually (Protected, maybe ADMIN only in future)
router.post('/run-job', async (req, res, next) => {
    try {
        const count = await runReminderJob();
        res.json({ message: 'Job executed', notificationsCreated: count });
    } catch (error: any) {
        next(error);
    }
});

export default router;

import { Router } from 'express';

const router = Router();

router.get('/profile', async (req, res, next) => {
    try {
        // Uses the shielded client!
        // Should only return the user if they belong to the tenant
        const user = await req.prisma.user.findUnique({
            where: { id: req.user?.userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        next(error);
    }
});

export default router;

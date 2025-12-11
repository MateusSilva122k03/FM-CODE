import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwt.service';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>

        try {
            const payload = verifyToken(token);
            // Attach payload to request
            // Note: We need to extend Request type definition to include 'user'
            (req as any).user = payload;
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    } else {
        // If no token provided, we can either block or allow (if optional).
        // For protected routes, we block.
        // But maybe we want to allow public access?
        // Usually this middleware is used on protected routes.
        return res.status(401).json({ error: 'Authorization header missing' });
    }
};

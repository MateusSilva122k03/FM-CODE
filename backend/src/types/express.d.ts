import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
            user?: {
                userId: string;
                tenantId: string;
                email: string;
            };
            prisma?: any; // Typed as the extended client
        }
    }
}

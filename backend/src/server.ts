import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { prismaClient } from './lib/prisma';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import servicesRoutes from './routes/services.routes';
import professionalsRoutes from './routes/professionals.routes';
import appointmentsRoutes from './routes/appointments.routes';
import uploadRoutes from './routes/upload.routes';
import configRoutes from './routes/config.routes';
import reviewsRoutes from './routes/reviews.routes';
import notificationsRoutes from './routes/notifications.routes';
import recurrenceRoutes from './routes/recurrence.routes';
import financeRoutes from './routes/finance.routes';
import publicRoutes from './routes/public.routes';
import aiConfigRoutes from './routes/ai-config.routes';
import { authenticateJWT } from './middleware/auth.middleware';
import { ensureTenantContext } from './middleware/tenantMiddleware';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

// Serve Uploads Static Directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/api', publicRoutes); // Public API routes (bypass auth)
app.use('/api', aiConfigRoutes); // AI Agent public config (bypass auth for /api/public/*)

// Protected Routes (Tenant Context Required)
// Apply authenticateJWT BEFORE ensureTenantContext because ensureTenantContext needs req.user
app.use('/api', authenticateJWT, ensureTenantContext);
app.use('/api/users', userRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/professionals', professionalsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/appointments', uploadRoutes);
app.use('/api/config', configRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/notifications', notificationsRoutes); // Sprint 6
app.use('/api', recurrenceRoutes); // Sprint 7
app.use('/api/finance', financeRoutes); // Sprint 8 (Paths defined internally)
app.use('/api', aiConfigRoutes); // Sprint 13: AI Agent config (protected PUT /api/config/agent)

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`[Dev] Server restarted at ${new Date().toISOString()}`);
});

// Graceful Shutdown
const shutdown = async () => {
    console.log('🛑 Shutting down server...');
    server.close(() => {
        console.log('HTTP server closed');
    });

    try {
        await prismaClient.$disconnect();
        console.log('Database connection closed');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown', err);
        process.exit(1);
    }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

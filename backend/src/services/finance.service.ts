import { prismaClient } from '../lib/prisma';
import { BadRequestError } from '../errors/AppError';
import { Prisma } from '@prisma/client';

/**
 * Calculates financial summary (gross revenue, total appointments) for current month.
 */
export const getFinancialSummary = async (tenantId: string) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const appointments = await prismaClient.appointment.findMany({
        where: {
            tenantId,
            status: 'COMPLETED',
            date: {
                gte: startOfMonth,
                lte: endOfMonth
            }
        },
        include: {
            service: true
        }
    });

    const totalRevenue = appointments.reduce((sum, app) => {
        return sum + Number(app.service.price);
    }, 0);

    const totalAppointments = appointments.length;

    return {
        month: now.toLocaleString('default', { month: 'long' }),
        totalRevenue: totalRevenue.toFixed(2),
        totalAppointments
    };
};

/**
 * Generates detailed report with commission calculation.
 */
export const getDetailedReport = async (
    tenantId: string,
    startDate?: string,
    endDate?: string,
    professionalId?: string
) => {
    const filter: any = {
        tenantId,
        status: 'COMPLETED'
    };

    if (startDate && endDate) {
        filter.date = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    if (professionalId) {
        filter.professionalId = professionalId;
    }

    const appointments = await prismaClient.appointment.findMany({
        where: filter,
        include: {
            service: true,
            professional: true
            // user relation might be tricky or optional, so we skip for now or fetch separately if needed
            // For MVP, if 'user' is null in include but we have 'userId', we just show userId or 'Unknown'
        },
        orderBy: { date: 'desc' }
    });

    // Transform and Calculate Commission
    const report = appointments.map(app => {
        const price = Number(app.service.price);
        const commissionRate = app.professional ? Number(app.professional.commissionRate) : 0;
        const commissionAmount = price * (commissionRate / 100);

        // Safety check for user name
        const clientName = (app as any).userId || 'Unknown';

        return {
            date: app.date,
            client: clientName,
            service: app.service.name,
            professional: app.professional?.name,
            price: price.toFixed(2),
            commissionRate: `${commissionRate}%`,
            commissionAmount: commissionAmount.toFixed(2)
        };
    });

    return report;
};

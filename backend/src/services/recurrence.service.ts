import { prismaClient } from '../lib/prisma';
import { createAppointment } from './appointments.service';
import { BadRequestError } from '../errors/AppError';

interface RecurrencePayload {
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    interval?: number;
    count?: number;
    endDate?: string;
    dayOfWeek?: number; // 0-6
    serviceId: string;
    professionalId: string;
    startTime: string; // Base time (HH:mm) and first date
    userId?: string;
}

/**
 * Generates dates based on recurrence rule.
 * Simple implementation for MVP (supports WEEKLY primarily).
 */
const generateDates = (
    start: Date,
    frequency: string,
    interval: number,
    count?: number,
    endDate?: Date
): Date[] => {
    const dates: Date[] = [];
    let current = new Date(start);
    const limitDate = endDate ? new Date(endDate) : null;
    const limitCount = count || (limitDate ? 1000 : 10); // Default safety limit

    // Adjust start if dayOfWeek is specified and different? 
    // For MVP, assume 'start' is the first valid occurrence.

    for (let i = 0; i < limitCount; i++) {
        if (limitDate && current > limitDate) break;

        dates.push(new Date(current));

        // Logic for next date
        if (frequency === 'WEEKLY') {
            current.setDate(current.getDate() + (7 * interval));
        } else if (frequency === 'BIWEEKLY') {
            current.setDate(current.getDate() + (14 * interval));
        } else if (frequency === 'MONTHLY') {
            current.setMonth(current.getMonth() + interval);
        }
    }

    return dates;
};

export const createRecurringSeries = async (data: RecurrencePayload, tenantId: string) => {
    const { frequency, interval = 1, count, endDate, dayOfWeek, serviceId, professionalId, startTime, userId } = data;

    // 1. Create Rule
    const rule = await prismaClient.recurrenceRule.create({
        data: {
            frequency,
            interval,
            count,
            endDate: endDate ? new Date(endDate) : null,
            dayOfWeek,
            tenantId
        }
    });

    // 2. Generate Dates
    const start = new Date(startTime);
    const targetDates = generateDates(start, frequency, interval, count, endDate ? new Date(endDate) : undefined);

    const results = {
        created: 0,
        skipped: 0,
        errors: [] as string[]
    };

    // 3. Create Appointments (Series)
    // We run this sequentially to respect concurrency locks per slot
    for (const date of targetDates) {
        try {
            await createAppointment({
                serviceId,
                professionalId,
                startTime: date.toISOString(),
                userId,
                recurrenceRuleId: rule.id // We'll need to update createAppointment to accept this optional field
            }, tenantId);
            results.created++;
        } catch (error: any) {
            // If slot is busy or invalid, we skip it but continue the series
            results.skipped++;
            results.errors.push(`Skipped ${date.toISOString()}: ${error.message}`);
        }
    }

    return { rule, summary: results };
};

export const getRecurrenceRules = async (tenantId: string) => {
    return prismaClient.recurrenceRule.findMany({
        where: { tenantId },
        include: { _count: { select: { appointments: true } } }
    });
};

export const deleteRecurrenceRule = async (id: string, tenantId: string) => {
    const rule = await prismaClient.recurrenceRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new BadRequestError('Rule not found');

    // Delete future appointments? Or all?
    // Usually, we delete only future ones or detach them.
    // For MVP, let's delete all associated appointments associated with this rule.
    // Be careful with Completed ones -> In real app, we allow 'detaching'.

    // Deleting the rule might cascade depending on schema, but safe approach:
    // Delete Future Appointments
    const now = new Date();
    await prismaClient.appointment.deleteMany({
        where: {
            recurrenceRuleId: id,
            date: { gte: now },
            status: { not: 'COMPLETED' }
        }
    });

    // We keep the rule for history or delete if cascade?
    // Let's delete the rule itself now (Prisma might error if we have past appointments linked).
    // So we might just leave the rule or set it to 'inactive' if we had that flag.
    // For this Sprint, we delete the rule row. If DB fails due to foreign key of past appointments, we'll know.
    try {
        await prismaClient.recurrenceRule.delete({ where: { id } });
    } catch (e) {
        // If has past appointments, maybe we can't delete the rule hard.
        // Ignore for MVP or handle gracefully.
    }

    return { message: 'Series cancelled (future appointments deleted)' };
};

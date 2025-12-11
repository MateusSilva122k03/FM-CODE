import { prismaClient } from '../lib/prisma';
import { BadRequestError } from '../errors/AppError';

// Constants
const SLOT_DURATION_MINUTES = 30;

export const getAvailableSlots = async (professionalId: string, dateString: string, tenantId: string) => {
    // 1. Validate date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new BadRequestError('Invalid date format');
    }

    const dayOfWeek = date.getUTCDay(); // 0=Sunday, 1=Monday... Use UTC to avoid timezone shift

    // 2. Get Professional Schedule
    const schedule = await prismaClient.professionalSchedule.findFirst({
        where: {
            professionalId,
            dayOfWeek,
            tenantId
        }
    });

    if (!schedule) {
        return []; // No work on this day
    }

    // 3. Generate all possible slots
    const slots = [];
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

    let current = new Date(date);
    current.setUTCHours(startHour, startMinute, 0, 0);

    const end = new Date(date);
    end.setUTCHours(endHour, endMinute, 0, 0);

    while (current < end) {
        slots.push(current.toISOString());
        current.setUTCMinutes(current.getUTCMinutes() + SLOT_DURATION_MINUTES);
    }

    // 4. Fetch existing appointments to exclude occupied slots
    // We check for range [start of day, end of day] to be safe, or just matching start times.
    // For simplicity with 30min fixed slots, we can just check 'date' equality if stored as specific timestamp.
    // However, safest is to match range occupancy.

    // Day range for query
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const appointments = await prismaClient.appointment.findMany({
        where: {
            professionalId,
            tenantId,
            date: {
                gte: dayStart,
                lte: dayEnd
            },
            status: {
                not: 'CANCELLED'
            }
        }
    });

    const occupiedTimes = new Set(appointments.map(a => a.date.toISOString()));

    // 5. Filter successful slots
    return slots.filter(slot => !occupiedTimes.has(slot));
};

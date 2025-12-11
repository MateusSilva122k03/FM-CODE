import { prismaClient } from '../lib/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors/AppError';

export const createReview = async (data: {
    appointmentId: string;
    rating: number;
    comment?: string;
    userId: string;
    tenantId: string;
}) => {
    const { appointmentId, rating, comment, userId, tenantId } = data;

    // 1. Validations
    if (rating < 1 || rating > 5) {
        throw new BadRequestError('Rating must be between 1 and 5');
    }

    const appointment = await prismaClient.appointment.findUnique({
        where: { id: appointmentId },
        include: { service: true, professional: true }
    });

    if (!appointment) {
        throw new NotFoundError('Appointment not found');
    }

    if (appointment.tenantId !== tenantId) {
        throw new ForbiddenError('Access denied');
    }

    // Business Rule: Only COMPLETED appointments can be reviewed
    // Allow PAID as well if that implies completion in some workflows, 
    // but strictly speaking, Review implies post-service.
    if (appointment.status !== 'COMPLETED') {
        throw new BadRequestError('Only completed appointments can be reviewed');
    }

    // Check if review already exists (schema enforces unique appointmentId, but good to check)
    const existingReview = await prismaClient.review.findUnique({
        where: { appointmentId }
    });

    if (existingReview) {
        throw new BadRequestError('Appointment already reviewed');
    }

    // 2. Create Review and Update Professional Rating Transactionally
    const review = await prismaClient.$transaction(async (tx) => {
        // Create
        const newReview = await tx.review.create({
            data: {
                rating,
                comment,
                appointmentId,
                serviceId: appointment.serviceId,
                professionalId: appointment.professionalId!, // Assumes appointment has professional
                userId,
                tenantId
            }
        });

        // Recalculate Average Logic
        // In a high-scale system, this might be a background job. 
        // For FlowMaster MVP, we calculate on write (read-heavy optimization).
        const aggregates = await tx.review.aggregate({
            _avg: { rating: true },
            where: {
                professionalId: appointment.professionalId!
            }
        });

        const newAverage = aggregates._avg.rating || 0;

        await tx.professional.update({
            where: { id: appointment.professionalId! },
            data: { averageRating: newAverage }
        });

        return newReview;
    });

    return review;
};

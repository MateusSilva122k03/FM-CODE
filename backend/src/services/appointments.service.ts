import { prismaClient } from '../lib/prisma';
import { ConflictError, BadRequestError } from '../errors/AppError';
import { Prisma } from '@prisma/client';
import { getAvailableSlots } from './availability.service';
import { createNotification } from './notifications.service';

export const createAppointment = async (data: any, tenantId: string) => {
    const { serviceId, professionalId, startTime, userId, recurrenceRuleId } = data;
    const date = new Date(startTime);

    // 0. Validate if slot is in availability window (Application Level Check)
    if (professionalId) {
        const availableSlots = await getAvailableSlots(professionalId, startTime, tenantId);
        // Normalize for comparison
        const requestedSlot = date.toISOString();
        if (!availableSlots.includes(requestedSlot)) {
            throw new BadRequestError('Requested slot is not available in professional schedule');
        }
    }

    return prismaClient.$transaction(async (tx) => {
        // 1. Validate Service exists and belongs to tenant
        const service = await tx.service.findFirst({
            where: { id: serviceId, tenantId }
        });

        if (!service) {
            throw new Error('Service not found or does not belong to this tenant');
        }

        // 2. Validate Professional exists and belongs to tenant
        if (professionalId) {
            const professional = await tx.professional.findFirst({
                where: { id: professionalId, tenantId }
            });

            if (!professional) {
                throw new Error('Professional not found or does not belong to this tenant');
            }

            // 3. CONCURRENCY CHECK with PARENT LOCKING
            // To prevent "Check-then-Act" race condition on Inserts, we must lock a parent resource.
            // We lock the Professional row. This serializes all appointment creations for this professional.
            // PostgreSQL "SELECT FOR UPDATE" is ideal here.
            await tx.$executeRaw`SELECT * FROM "Professional" WHERE id = ${professionalId} FOR UPDATE`;

            // Check if any active appointment overlaps/exists at this exact time
            const existing = await tx.$queryRaw`
                SELECT id FROM "Appointment"
                WHERE "professionalId" = ${professionalId}
                AND "date" = ${date}
                AND "status" != 'CANCELLED'
            `;

            if ((existing as any[]).length > 0) {
                throw new ConflictError('Slot already booked (Concurrency Lock Active)');
            }
        }

        // 4. Create Appointment
        return tx.appointment.create({
            data: {
                date: date,
                serviceId,
                professionalId,
                tenantId,
                userId,
                recurrenceRuleId
            },
            include: {
                service: true,
                professional: true
            }
        });
    });
};

export const getAppointments = async (tenantId: string) => {
    return prismaClient.appointment.findMany({
        where: { tenantId },
        include: {
            service: true,
            professional: true
        }
    });
};

export const getAppointmentById = async (id: string, tenantId: string) => {
    return prismaClient.appointment.findFirst({
        where: { id, tenantId },
        include: {
            service: true,
            professional: true
        }
    });
};

export const updateAppointment = async (id: string, data: any, tenantId: string) => {
    const appointment = await prismaClient.appointment.findFirst({
        where: { id, tenantId }
    });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    const { startTime, serviceId, professionalId, status } = data;
    const updateData: any = {};

    if (startTime) updateData.date = new Date(startTime);
    if (serviceId) updateData.serviceId = serviceId;
    if (professionalId) updateData.professionalId = professionalId;
    if (status) updateData.status = status;

    return prismaClient.appointment.update({
        where: { id },
        data: updateData,
        include: {
            service: true,
            professional: true
        }
    });
};

export const deleteAppointment = async (id: string, tenantId: string) => {
    const appointment = await prismaClient.appointment.findFirst({
        where: { id, tenantId }
    });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    return prismaClient.appointment.delete({
        where: { id }
    });
};

export const approvePayment = async (id: string, tenantId: string) => {
    // Cannot include 'user' because relation might overlap or be missing in Prisma logic depending on schema details.
    // For now we rely on userId existing on Appointment.
    const appointment = await prismaClient.appointment.findFirst({
        where: { id, tenantId }
    });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    if (appointment.paymentStatus === 'PAID') {
        throw new BadRequestError('Payment already approved');
    }

    const updated = await prismaClient.appointment.update({
        where: { id },
        data: { paymentStatus: 'PAID' }
    });

    // Notify User
    if (appointment.userId) {
        await createNotification({
            userId: appointment.userId,
            tenantId,
            title: 'Pagamento Aprovado! 🎉',
            message: `Seu pagamento para o agendamento de ${appointment.date.toLocaleString()} foi confirmado.`,
            type: 'PAYMENT_CONFIRMATION',
            metadata: { appointmentId: id }
        });
    }

    return updated;
};

export const rejectPayment = async (id: string, tenantId: string) => {
    const appointment = await prismaClient.appointment.findFirst({
        where: { id, tenantId }
    });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    const updated = await prismaClient.appointment.update({
        where: { id },
        data: {
            paymentStatus: 'REJECTED',
            status: 'CANCELLED'
        }
    });

    // Notify User
    if (appointment.userId) {
        await createNotification({
            userId: appointment.userId,
            tenantId,
            title: 'Pagamento Rejeitado ❌',
            message: `Houve um problema com seu comprovante para o agendamento de ${appointment.date.toLocaleString()}. Entre em contato.`,
            type: 'PAYMENT_REJECTION',
            metadata: { appointmentId: id }
        });
    }

    return updated;
};

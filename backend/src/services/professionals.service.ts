import { prismaClient, Professional } from '../lib/prisma';

export const createProfessional = async (data: any, tenantId: string): Promise<Professional> => {
    return prismaClient.professional.create({
        data: {
            ...data,
            tenantId
        }
    });
};

export const getProfessionals = async (tenantId: string): Promise<Professional[]> => {
    return prismaClient.professional.findMany({
        where: { tenantId }
    });
};

export const getProfessionalById = async (id: string, tenantId: string): Promise<Professional | null> => {
    return prismaClient.professional.findFirst({
        where: { id, tenantId }
    });
};

export const updateProfessional = async (id: string, data: any, tenantId: string): Promise<Professional> => {
    const professional = await prismaClient.professional.findFirst({
        where: { id, tenantId }
    });

    if (!professional) {
        throw new Error('Professional not found');
    }

    return prismaClient.professional.update({
        where: { id },
        data
    });
};

export const deleteProfessional = async (id: string, tenantId: string): Promise<Professional> => {
    const professional = await prismaClient.professional.findFirst({
        where: { id, tenantId }
    });

    if (!professional) {
        throw new Error('Professional not found');
    }

    return prismaClient.$transaction(async (tx) => {
        await tx.professionalSchedule.deleteMany({
            where: { professionalId: id }
        });

        return tx.professional.delete({
            where: { id }
        });
    });
};

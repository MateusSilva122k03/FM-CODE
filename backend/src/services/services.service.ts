import { prismaClient } from '../lib/prisma';

export const createService = async (data: any, tenantId: string) => {
    return prismaClient.service.create({
        data: {
            ...data,
            tenantId
        }
    });
};

export const getServices = async (tenantId: string) => {
    return prismaClient.service.findMany({
        where: { tenantId }
    });
};

export const getServiceById = async (id: string, tenantId: string) => {
    return prismaClient.service.findFirst({
        where: { id, tenantId }
    });
};

export const updateService = async (id: string, data: any, tenantId: string) => {
    // Ensure service belongs to tenant
    const service = await prismaClient.service.findFirst({
        where: { id, tenantId }
    });

    if (!service) {
        throw new Error('Service not found');
    }

    return prismaClient.service.update({
        where: { id },
        data
    });
};

export const deleteService = async (id: string, tenantId: string) => {
    // Ensure service belongs to tenant
    const service = await prismaClient.service.findFirst({
        where: { id, tenantId }
    });

    if (!service) {
        throw new Error('Service not found');
    }

    return prismaClient.service.delete({
        where: { id }
    });
};

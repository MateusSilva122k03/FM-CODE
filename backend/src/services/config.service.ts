import { prismaClient } from '../lib/prisma';

export const getTenantConfig = async (tenantId: string) => {
    let config = await prismaClient.tenantConfig.findUnique({
        where: { tenantId }
    });

    if (!config) {
        // Auto-create default config if not exists
        config = await prismaClient.tenantConfig.create({
            data: { tenantId }
        });
    }

    return config;
};

export const updateTenantConfig = async (tenantId: string, data: any) => {
    // Ensure exists
    await getTenantConfig(tenantId);

    const { publicName, themeColor, logoUrl, pixKey } = data;

    return prismaClient.tenantConfig.update({
        where: { tenantId },
        data: {
            publicName,
            themeColor,
            logoUrl,
            pixKey
        }
    });
};

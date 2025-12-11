import { PrismaClient, Professional, Service, Appointment, User, Tenant } from '@prisma/client';

export { Professional, Service, Appointment, User, Tenant };

const prisma = new PrismaClient();

// Force type refresh
export const prismaClient = prisma.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }: { model: any, operation: any, args: any, query: any }) {
                // Skip tenant check for specific models if needed (e.g. Tenant itself during creation)
                // But for strict multi-tenancy, we usually want to enforce it or have a specific 'sudo' client.

                // We will rely on the context passed to the function to get the tenantId.
                // However, Prisma extensions don't easily access request context directly without AsyncLocalStorage or passing it explicitly.
                // For this implementation, we'll assume the usage pattern: 
                // prisma.user.findMany({ where: { tenantId: ... } }) is enforced by the wrapper 
                // OR we use a factory function to get a tenant-scoped client.

                // Better approach for "The Shield":
                // We export a function `getTenantClient(tenantId: string)` that returns a client with the filter applied.

                return query(args);
            },
        },
    },
});

// Factory function to get a tenant-scoped Prisma Client
export const getTenantClient = (tenantId: string) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async findMany({ args, query }: { args: any, query: any }) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async findFirst({ args, query }: { args: any, query: any }) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async findUnique({ args, query }: { args: any, query: any }) {
                    // findUnique requires a unique constraint. If we want to enforce tenantId, 
                    // we often need to change it to findFirst or ensure the unique key includes tenantId.
                    // For simplicity in this sprint, we'll rely on findFirst for tenant-scoped checks 
                    // or assume the ID is globally unique but we still want to check ownership.
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async create({ args, query }: { args: any, query: any }) {
                    (args.data as any).tenantId = tenantId;
                    return query(args);
                },
                async update({ args, query }: { args: any, query: any }) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async delete({ args, query }: { args: any, query: any }) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                // Add other operations as needed
            },
        },
    });
};

export default prisma;

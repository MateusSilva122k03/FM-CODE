import bcrypt from 'bcrypt';
import { prismaClient } from '../lib/prisma';
import { generateToken } from './jwt.service';

const SALT_ROUNDS = 10;

export const registerUser = async (data: any) => {
    const { email, password, name, tenantId } = data;

    // Check if user exists in the tenant
    // Note: We need to ensure tenant exists first, but for now we assume tenantId is valid or checked elsewhere
    const existingUser = await prismaClient.user.findFirst({
        where: {
            email,
            tenantId // Email must be unique per tenant (or globally, depending on requirements. Schema says unique globally currently)
        }
    });

    // Schema has @unique on email, so it's globally unique.
    // If we want per-tenant uniqueness, we'd need to change schema.
    // For now, let's respect the current schema which enforces global uniqueness.
    const globalUser = await prismaClient.user.findUnique({
        where: { email }
    });

    if (globalUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prismaClient.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            tenantId
        }
    });

    // Generate token immediately? Or just return user?
    // Usually register -> login, but we can return token too.
    // Let's just return user for now.
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

export const loginUser = async (data: any) => {
    const { email, password } = data;

    const user = await prismaClient.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    const token = generateToken({
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email
    });

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
};

export const generateServiceToken = async (apiKey: string, tenantId: string) => {
    // Ideally this comes from process.env.AI_AGENT_KEY, but for now we enforce it here if env is not readable or set
    const VALID_API_KEY = process.env.AI_AGENT_KEY || 'ai-agent-secret-key-123';

    if (apiKey !== VALID_API_KEY) {
        throw new Error('Invalid API Key');
    }

    // Generate a long-lived token
    const token = generateToken({
        userId: 'service-agent',
        tenantId,
        email: 'ai-agent@system.local',
        role: 'ADMIN' // Agent needs admin privileges to manage appointments
    });

    return { token };
};

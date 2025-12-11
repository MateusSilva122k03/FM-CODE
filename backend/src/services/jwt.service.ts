import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'default-secret';
const EXPIRES_IN = '7d';

export interface JWTPayload {
    userId: string;
    tenantId: string;
    email: string;
    role?: string;
}

export const generateToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
};

export const verifyToken = (token: string): JWTPayload => {
    try {
        return jwt.verify(token, SECRET) as JWTPayload;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

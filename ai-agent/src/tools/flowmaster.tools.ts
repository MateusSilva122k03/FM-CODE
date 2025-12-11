import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.FLOWMASTER_API_URL || 'http://localhost:3000/api';
const AGENT_KEY = process.env.AI_AGENT_KEY || 'ai-agent-secret-key-123';

// Cache tokens per tenant
const tokenCache: Record<string, string> = {};

async function getAuthToken(tenantId: string): Promise<string> {
    if (tokenCache[tenantId]) return tokenCache[tenantId];

    try {
        const response = await axios.post(`${API_URL}/../auth/service-token`, {
            apiKey: AGENT_KEY,
            tenantId
        });
        tokenCache[tenantId] = response.data.token;
        return tokenCache[tenantId];
    } catch (error) {
        console.error('Failed to authenticate agent:', error);
        throw new Error('Authentication failed');
    }
}

// Tool 1: List Services (Public) - Now accepts tenantId
export const listServices = async (tenantId: string) => {
    try {
        const response = await axios.get(`${API_URL}/public/services`, {
            params: { tenantId }
        });
        return response.data;
    } catch (error) {
        console.error('Error listing services:', error);
        return [];
    }
};

// Tool 2: Check Availability (Public) - Now accepts tenantId
export const checkAvailability = async (professionalId: string, date: string, tenantId: string) => {
    try {
        const response = await axios.get(`${API_URL}/public/availability`, {
            params: {
                tenantId,
                professionalId,
                date
            }
        });
        return response.data;
    } catch (error: any) {
        console.error('Error checking availability:', error.response?.data || error.message);
        return [];
    }
};

// Tool 3: Create Appointment (Protected) - Now accepts tenantId
export const createAppointment = async (
    serviceId: string,
    professionalId: string,
    startTime: string,
    customerName: string,
    customerPhone: string,
    tenantId: string
) => {
    try {
        const token = await getAuthToken(tenantId);
        const response = await axios.post(`${API_URL}/appointments`, {
            serviceId,
            professionalId,
            startTime,
            userId: 'whatsapp-guest-' + customerPhone.replace(/\D/g, '')
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error: any) {
        console.error('Error creating appointment:', error.response?.data || error.message);
        throw new Error('Failed to create appointment');
    }
};

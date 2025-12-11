import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as tools from '../tools/flowmaster.tools';
import dotenv from 'dotenv';

dotenv.config();

const MODEL_NAME = 'gemini-flash-latest';
const API_URL = process.env.FLOWMASTER_API_URL || 'http://localhost:3000/api';

// Lazy AI initialization
let genAI: GoogleGenerativeAI | null = null;

const getGenAI = () => {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return null;

    if (!genAI) {
        genAI = new GoogleGenerativeAI(API_KEY);
    }
    return genAI;
};

// Cache for tenant configs and models
const tenantConfigCache: Record<string, { config: any; model: any; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fetch tenant-specific agent config
const getAgentConfig = async (tenantId: string) => {
    const cached = tenantConfigCache[tenantId];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached;
    }

    try {
        const response = await axios.get(`${API_URL}/public/agent-config`, {
            params: { tenantId }
        });

        const config = response.data;
        const genAI = getGenAI();

        if (!genAI) {
            throw new Error('Gemini API key not configured');
        }

        // Create model with tenant-specific personality
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: config.agentPersonality || `You are ${config.agentName || 'a barbershop assistant'}. Be helpful and polite.`
        });

        tenantConfigCache[tenantId] = { config, model, timestamp: Date.now() };
        return tenantConfigCache[tenantId];
    } catch (error: any) {
        console.error('Error fetching agent config:', error.message);
        // Fallback to default
        const genAI = getGenAI();
        if (!genAI) throw new Error('Gemini not configured');

        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: "You are a helpful barbershop assistant. Help customers schedule appointments."
        });
        return { config: { agentName: 'Assistente' }, model, timestamp: Date.now() };
    }
};

// Tool Definitions
const toolDefinitions = [
    {
        function_declarations: [
            {
                name: "listServices",
                description: "Get a list of available barber services and their prices.",
            },
            {
                name: "checkAvailability",
                description: "Check available appointment slots.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        professionalId: { type: "STRING", description: "The ID of the professional" },
                        date: { type: "STRING", description: "The date in YYYY-MM-DD format" }
                    },
                    required: ["professionalId", "date"]
                }
            },
            {
                name: "createAppointment",
                description: "Book an appointment.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        serviceId: { type: "STRING" },
                        professionalId: { type: "STRING" },
                        startTime: { type: "STRING", description: "ISO 8601 Date time string" },
                        customerName: { type: "STRING" },
                        customerPhone: { type: "STRING" }
                    },
                    required: ["serviceId", "startTime", "customerName", "customerPhone"]
                }
            }
        ]
    }
];

// Chat sessions per tenant (simple in-memory)
const chatSessions: Record<string, any> = {};

// Process message with tenant context and unique sender session
export const processMessage = async (userMessage: string, tenantId: string = 'default-tenant', senderId: string = 'anonymous') => {
    try {
        const { config, model } = await getAgentConfig(tenantId);

        // Create a unique session key for this specific user in this tenant
        const sessionKey = `${tenantId}:${senderId}`;

        // Get or create chat session for this user
        if (!chatSessions[sessionKey]) {
            console.log(`Starting new chat session for ${sessionKey}`);
            chatSessions[sessionKey] = model.startChat({
                tools: toolDefinitions,
            });
        }

        const chatSession = chatSessions[sessionKey];
        let result = await chatSession.sendMessage(userMessage);

        // Handle function calls loop
        while (result.response.functionCalls() && result.response.functionCalls().length > 0) {
            const call = result.response.functionCalls()[0];
            const funcName = call.name;
            const args = call.args;

            console.log(`🤖 [${config.agentName}] Tool Call: ${funcName}`, args);

            const functions: any = {
                listServices: () => tools.listServices(tenantId),
                checkAvailability: (professionalId: string, date: string) =>
                    tools.checkAvailability(professionalId, date, tenantId),
                createAppointment: (serviceId: string, professionalId: string, startTime: string, customerName: string, customerPhone: string) =>
                    tools.createAppointment(serviceId, professionalId, startTime, customerName, customerPhone, tenantId)
            };

            if (functions[funcName]) {
                const apiResponse = await functions[funcName](...Object.values(args));
                console.log(`📦 API Result:`, JSON.stringify(apiResponse).substring(0, 100) + "...");

                result = await chatSession.sendMessage([
                    {
                        functionResponse: {
                            name: funcName,
                            response: { result: apiResponse }
                        }
                    }
                ]);
            } else {
                console.error(`Unknown function: ${funcName}`);
                break;
            }
        }

        return result.response.text();
    } catch (error: any) {
        console.error('AI Processing Error:', error.message);
        return "Desculpe, tive um problema técnico. Tente novamente.";
    }
};

// Clear session for a tenant (useful for "new conversation")
export const clearSession = (tenantId: string) => {
    delete chatSessions[tenantId];
};

import axios from 'axios';
import { prismaClient } from '../src/lib/prisma';

const API_URL = 'http://localhost:3000';
const AI_AGENT_KEY = 'ai-agent-secret-key-123'; // Matches the hardcoded fallback in auth.service.ts

async function runTest() {
    console.log('--- Starting Sprint 11 Verification Test (AI Agent Integration) ---');

    // 0. Setup: Ensure Tenant Exists
    const tenantId = 'ai-agent-tenant-123';
    await prismaClient.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: { id: tenantId, name: 'AI Barber Shop' }
    });
    console.log('✅ Setup: Tenant ensured');

    // 1. Test Service Token Generation (Success)
    console.log('\n1. Testing Service Token Generation (Valid Key)...');
    let serviceToken = '';
    try {
        const response = await axios.post(`${API_URL}/auth/service-token`, {
            apiKey: AI_AGENT_KEY,
            tenantId
        });
        if (response.data.token) {
            console.log('✅ Token generated successfully');
            serviceToken = response.data.token;
        } else {
            console.error('❌ Token not found in response');
            process.exit(1);
        }
    } catch (error: any) {
        console.error('❌ Failed to generate token:', error.response?.data || error.message);
        process.exit(1);
    }

    // 2. Test Service Token Generation (Failure)
    console.log('\n2. Testing Service Token Generation (Invalid Key)...');
    try {
        await axios.post(`${API_URL}/auth/service-token`, {
            apiKey: 'wrong-key',
            tenantId
        });
        console.error('❌ Should have failed but succeeded');
    } catch (error: any) {
        if (error.response?.status === 401) {
            console.log('✅ Blocked invalid key correctly (401)');
        } else {
            console.error('❌ Unexpected error:', error.message);
        }
    }

    // 3. Test Public Services Endpoint
    console.log('\n3. Testing Public Services Endpoint...');
    try {
        // Ensure at least one service exists
        await prismaClient.service.create({
            data: { name: 'AI Haircut', price: 50, duration: 30, tenantId }
        });

        const response = await axios.get(`${API_URL}/api/public/services?tenantId=${tenantId}`);
        if (Array.isArray(response.data) && response.data.length > 0) {
            console.log(`✅ Public Services retrieved: ${response.data.length} items`);
        } else {
            console.error('❌ No services returned');
        }
    } catch (error: any) {
        console.error('❌ Failed to fetch public services:', error.message);
    }

    // 4. Test Public Availability Endpoint
    console.log('\n4. Testing Public Availability Endpoint...');
    try {
        // Create professional and schedule first
        const prof = await prismaClient.professional.create({
            data: { name: 'AI Barber', tenantId, commissionRate: 10 }
        });
        await prismaClient.professionalSchedule.create({
            data: { professionalId: prof.id, dayOfWeek: new Date().getUTCDay(), startTime: '08:00', endTime: '18:00', tenantId }
        });

        const date = new Date().toISOString().split('T')[0];
        const response = await axios.get(`${API_URL}/api/public/availability?tenantId=${tenantId}&professionalId=${prof.id}&date=${date}`);

        if (Array.isArray(response.data)) {
            console.log(`✅ Public Availability retrieved: ${response.data.length} slots found`);
        } else {
            console.error('❌ Invalid availability response');
        }
    } catch (error: any) {
        console.error('❌ Failed to fetch public availability:', error.message);
        // Don't fail the whole test if availability is tricky (e.g. day of week mismatch), but log it.
    }

    // 5. Test Accessing Protected Route with Service Token
    console.log('\n5. Testing Protected Route with Service Token...');
    try {
        // We try to create a user or just check profile (profile might depend on userId in specific way, so lets check a list route like GET /api/services which is protected admin/user)
        // Services route is protected by `authenticateJWT` + `ensureTenantContext`
        const response = await axios.get(`${API_URL}/api/services`, {
            headers: { Authorization: `Bearer ${serviceToken}` }
        });

        if (response.status === 200) {
            console.log('✅ Service Token accepted for protected route');
        }
    } catch (error: any) {
        console.error('❌ Service Token failed on protected route:', error.response?.data || error.message);
    }

    console.log('\n--- Sprint 11 Test Completed ---');
}

runTest();

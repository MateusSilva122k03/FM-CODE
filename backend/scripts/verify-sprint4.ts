import axios from 'axios';
import { prismaClient } from '../src/lib/prisma'; // Use direct import for seeding if needed

const API_URL = 'http://localhost:3000';

async function runTest() {
    try {
        console.log('--- Starting Sprint 4 Concurrency & Availability Test ---');

        // 0. Ensure Tenant Exists
        const tenantId = 'tenant-sprint4';
        const tenantName = 'Sprint 4 Barbershop';

        try {
            await prismaClient.tenant.upsert({
                where: { id: tenantId },
                update: {},
                create: { id: tenantId, name: tenantName }
            });
            console.log('✅ Tenant ensured');
        } catch (e) {
            console.log('Warning: Tenant upsert failed, might exist via other means');
        }

        // 1. Authenticate
        console.log('\n1. Authenticating...');
        const email = `test-sprint4-${Date.now()}@example.com`;
        const password = 'password123';

        await axios.post(`${API_URL}/auth/register`, {
            email, password, name: 'Sprint 4 Tester', tenantId
        });

        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Authenticated');

        // 2. Setup Data (Service & Professional & Schedule)
        console.log('\n2. Setting up Professional Schedule...');

        // Create Service
        const serviceRes = await axios.post(`${API_URL}/api/services`, {
            name: 'Fast Cut', price: 30, duration: 30
        }, { headers });
        const serviceId = serviceRes.data.id;

        // Create Professional
        const profRes = await axios.post(`${API_URL}/api/professionals`, {
            name: 'Speedy Gonzales'
        }, { headers });
        const professionalId = profRes.data.id;

        // Create Schedule directly via Prisma (since we don't have an API for it yet)
        // Schedule: Today, 09:00 - 18:00
        const date = new Date();
        const dayOfWeek = date.getDay();
        const startTime = "09:00";
        const endTime = "18:00";

        // Direct DB insert for schedule
        try {
            await prismaClient.professionalSchedule.create({
                data: {
                    professionalId,
                    dayOfWeek,
                    startTime,
                    endTime,
                    tenantId
                }
            });
            console.log(`✅ Schedule created for Day ${dayOfWeek}: 09:00-18:00`);
        } catch (e) {
            console.log('Warning: Schedule might already exist');
        }

        // 3. Test Availability Endpoint
        console.log('\n3. Testing Availability Endpoint...');
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const availRes = await axios.get(`${API_URL}/api/professionals/${professionalId}/availability?date=${dateStr}`, { headers });

        // Find a valid slot (e.g., 10:00)
        // Construct 10:00 ISO string for today (UTC aligned)
        const targetDate = new Date(dateStr);
        targetDate.setUTCHours(10, 0, 0, 0);
        const targetSlot = targetDate.toISOString();

        console.log(`Target Slot: ${targetSlot}`);
        console.log(`Available Slots:`, availRes.data);

        if (availRes.data.includes(targetSlot)) {
            console.log('✅ Slot 10:00 is available as expected');
        } else {
            console.error('❌ Slot 10:00 NOT found in availability');
            process.exit(1);
        }

        // 4. Concurrency Test
        console.log('\n4. Testing CONCURRENCY (Race Condition)...');
        console.log('⚡ Launching 5 simultaneous requests for the SAME slot...');

        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(
                axios.post(`${API_URL}/api/appointments`, {
                    serviceId,
                    professionalId,
                    startTime: targetSlot
                }, { headers })
                    .then(res => ({ status: 'success', data: res.data }))
                    .catch(err => ({ status: 'error', code: err.response?.status, msg: err.response?.data?.error }))
            );
        }

        // Define a type for the result
        type Result = { status: 'success', data?: any } | { status: 'error', code?: number, msg?: string };
        const results = await Promise.all(promises) as Result[];

        let successCount = 0;
        let conflictCount = 0;

        results.forEach((r, index) => {
            if (r.status === 'success') {
                successCount++;
                console.log(`Request ${index}: 🟢 Success`);
            } else {
                // Now safely access properties because we defined the union type
                if (r.status === 'error' && (r.code === 409 || r.msg?.includes('booked'))) {
                    conflictCount++;
                    console.log(`Request ${index}: 🔴 Conflict (Blocked correctly)`);
                } else {
                    console.log(`Request ${index}: ❌ Error ${r.code}: ${r.msg}`);
                }
            }
        });

        if (successCount === 1 && conflictCount === 4) {
            console.log('\n✅ CONCURRENCY TEST PASSED: Only 1 winner, 4 conflicts.');
        } else {
            console.error(`\n❌ CONCURRENCY TEST FAILED: Successes=${successCount}, Conflicts=${conflictCount}`);
        }

        // 5. Verify Slot is now Removed from Availability
        console.log('\n5. Verifying Slot Removal...');
        const availRes2 = await axios.get(`${API_URL}/api/professionals/${professionalId}/availability?date=${dateStr}`, { headers });

        if (!availRes2.data.includes(targetSlot)) {
            console.log('✅ Slot 10:00 is correctly removed from availability');
        } else {
            console.error('❌ Slot 10:00 still appears available!');
            console.log('Available:', availRes2.data);

            // Debug: Check actual appointments in DB
            const actualAppts = await prismaClient.appointment.findMany({
                where: { professionalId, date: targetDate }
            });
            console.log('Actual Appointments in DB for this slot:', actualAppts);
        }

        console.log('\n--- Sprint 4 Test Completed ---');

    } catch (error: any) {
        console.error('Unexpected error:', error.response?.data || error.message);
    }
}

runTest();

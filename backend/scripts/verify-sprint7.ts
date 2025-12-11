import axios from 'axios';
import { prismaClient } from '../src/lib/prisma';

const API_URL = 'http://localhost:3000';

async function runTest() {
    try {
        console.log('--- Starting Sprint 7 Verification Test (Recurrence) ---');

        // 1. Authenticate
        console.log('\n1. Authenticating...');
        const email = `test-sprint7-${Date.now()}@example.com`;
        const password = 'password123';
        const tenantId = 'tenant-sprint7';

        // Ensure Tenant
        await prismaClient.tenant.upsert({
            where: { id: tenantId },
            update: {},
            create: { id: tenantId, name: 'Sprint 7 Tenant' }
        });

        await axios.post(`${API_URL}/auth/register`, {
            email, password, name: 'Sprint 7 User', tenantId
        });
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Authenticated');

        // 2. Setup Service & Professional
        console.log('\n2. Setup Resources...');
        const sRes = await axios.post(`${API_URL}/api/services`, { name: 'Weekly Therapy', price: 100, duration: 60 }, { headers });
        const pRes = await axios.post(`${API_URL}/api/professionals`, { name: 'Dr. Strange' }, { headers });
        const serviceId = sRes.data.id;
        const professionalId = pRes.data.id;

        // Ensure Availability (All days)
        for (let i = 0; i < 7; i++) {
            await prismaClient.professionalSchedule.create({
                data: { professionalId, tenantId, dayOfWeek: i, startTime: '00:00', endTime: '23:59' }
            });
        }
        console.log('✅ Resources Ready');

        // 3. Create Recurrence Series (Weekly, 4 times)
        console.log('\n3. Creating Weekly Series (4 weeks)...');

        // Start date: tomorrow at 10:00
        const start = new Date();
        start.setDate(start.getDate() + 1);
        start.setUTCHours(10, 0, 0, 0);

        const payload = {
            frequency: 'WEEKLY',
            interval: 1,
            count: 4,
            serviceId,
            professionalId,
            startTime: start.toISOString()
        };

        const res = await axios.post(`${API_URL}/api/appointments/recurring`, payload, { headers });
        const { rule, summary } = res.data;

        console.log(`Created: ${summary.created}, Skipped: ${summary.skipped}`);

        if (summary.created === 4) console.log('✅ Created 4 appointments successfully');
        else console.error(`❌ Expected 4, got ${summary.created}`);

        const ruleId = rule.id;

        // 4. Test Conflict Skipping
        console.log('\n4. Testing Conflict Skipping...');

        // Create a conflict manually for the NEXT slot in the series (start date + 1 week)
        const conflictDate = new Date(start);
        conflictDate.setDate(conflictDate.getDate() + 7); // The second recurrence
        // But wait, the series is already created. To test skipping, we need a NEW series.

        // Let's create a BLOCKING appointment for a new time slot
        const time2 = new Date(start);
        time2.setUTCHours(14, 0, 0, 0); // Different time

        // Block the specific slot 1 week from now
        const conflictTime = new Date(time2);
        conflictTime.setDate(conflictTime.getDate() + 7);

        await prismaClient.appointment.create({
            data: {
                date: conflictTime,
                serviceId,
                professionalId,
                tenantId,
                status: 'SCHEDULED'
            }
        });
        console.log(`Blocked slot at ${conflictTime.toISOString()}`);

        // Try to create a series that hits that conflict
        const res2 = await axios.post(`${API_URL}/api/appointments/recurring`, {
            frequency: 'WEEKLY',
            interval: 1,
            count: 3,
            serviceId,
            professionalId,
            startTime: time2.toISOString() // This is week 0 (free), week 1 (blocked), week 2 (free)
        }, { headers });

        const summary2 = res2.data.summary;
        console.log(`Series 2 -> Created: ${summary2.created}, Skipped: ${summary2.skipped}`);

        if (summary2.created === 2 && summary2.skipped === 1) {
            console.log('✅ Correctly skipped the conflicting slot');
        } else {
            console.error(`❌ Conflict check failed. Created: ${summary2.created}, Skipped: ${summary2.skipped}`);
        }

        // 5. Cleanup / Delete Rule
        console.log('\n5. Deleting Recurrence Rule...');
        await axios.delete(`${API_URL}/api/recurrence-rules/${ruleId}`, { headers });

        // Verify future appointments are gone
        const remaining = await prismaClient.appointment.count({
            where: { recurrenceRuleId: ruleId }
        });

        if (remaining === 0) console.log('✅ Future appointments deleted');
        else console.error(`❌ Failed to delete appointments. Remaining: ${remaining}`);

        console.log('\n--- Sprint 7 Test Completed ---');

    } catch (error: any) {
        console.error('Unexpected error:', error.response?.data || error.message);
        process.exit(1);
    }
}

runTest();

import axios from 'axios';
import { prismaClient } from '../src/lib/prisma';

const API_URL = 'http://localhost:3000';

async function runTest() {
    try {
        console.log('--- Starting Sprint 6 Verification Test ---');

        // 1. Authenticate (Client)
        console.log('\n1. Authenticating Client...');
        const email = `test-sprint6-${Date.now()}@example.com`;
        const password = 'password123';
        const tenantId = 'tenant-sprint6';

        // Ensure Tenant
        await prismaClient.tenant.upsert({
            where: { id: tenantId },
            update: {},
            create: { id: tenantId, name: 'Sprint 6 Tenant' }
        });

        await axios.post(`${API_URL}/auth/register`, {
            email, password, name: 'Sprint 6 User', tenantId
        });
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Authenticated');

        // 2. Setup: Service, Professional, Schedule
        console.log('\n2. Setting up Service & Professional...');
        const sRes = await axios.post(`${API_URL}/api/services`, { name: 'Massage', price: 50, duration: 60 }, { headers });
        const pRes = await axios.post(`${API_URL}/api/professionals`, { name: 'Bob' }, { headers });
        const serviceId = sRes.data.id;
        const professionalId = pRes.data.id;

        // Create availability for ALL days to avoid date mismatch issues in CI/Test
        for (let i = 0; i < 7; i++) {
            await prismaClient.professionalSchedule.create({
                data: { professionalId, tenantId, dayOfWeek: i, startTime: '00:00', endTime: '23:59' }
            });
        }
        console.log('✅ Setup Complete');

        // 3. Review Flow
        console.log('\n3. Testing Review Logic...');

        // 3a. Create Scheduled Appointment (Should fail review)
        const now = new Date();
        now.setUTCHours(10, 0, 0, 0);
        const aRes = await axios.post(`${API_URL}/api/appointments`, {
            serviceId, professionalId, startTime: now.toISOString()
        }, { headers });
        const appointmentId = aRes.data.id;

        try {
            await axios.post(`${API_URL}/api/reviews`, {
                appointmentId, rating: 5, comment: 'Premature review'
            }, { headers });
            console.error('❌ Failed: Review allowed on SCHEDULED appointment');
        } catch (e: any) {
            if (e.response.status === 400) console.log('✅ Correctly rejected review for SCHEDULED appointment');
            else console.error('❌ Unexpected error', e.message);
        }

        // 3b. Complete Appointment & Review
        await prismaClient.appointment.update({
            where: { id: appointmentId },
            data: { status: 'COMPLETED' }
        });

        const reviewRes = await axios.post(`${API_URL}/api/reviews`, {
            appointmentId, rating: 5, comment: 'Great service!'
        }, { headers });

        if (reviewRes.data.id) console.log('✅ Review created for COMPLETED appointment');

        // 3c. Verify Professional Rating
        const profCheck = await prismaClient.professional.findUnique({ where: { id: professionalId } }) as any;
        if (profCheck?.averageRating === 5) console.log('✅ Professional rating updated to 5.0');
        else console.error(`❌ Rating mismatch: ${profCheck?.averageRating}`);


        // 4. Notification Job Flow
        console.log('\n4. Testing Notification Job...');

        // Create an appointment for 20 hours from now (within 24h window)
        const now2 = new Date();
        const futureTime = new Date(now2.getTime() + 20 * 60 * 60 * 1000);
        // Align to next full hour to satisfy strict slot validation (e.g. 14:00:00)
        futureTime.setMinutes(0, 0, 0);

        console.log(`Creating appointment for: ${futureTime.toISOString()}`);

        const aTomorrowRes = await axios.post(`${API_URL}/api/appointments`, {
            serviceId, professionalId, startTime: futureTime.toISOString()
        }, { headers });

        // Trigger Job Manually
        const jobRes = await axios.post(`${API_URL}/api/notifications/run-job`, {}, { headers });
        console.log(`Job Result: Created ${jobRes.data.notificationsCreated} notifications`);

        // Verify Notification exists
        const notifRes = await axios.get(`${API_URL}/api/notifications`, { headers });
        const reminder = notifRes.data.find((n: any) => n.metadata?.appointmentId === aTomorrowRes.data.id);

        if (reminder) console.log('✅ Reminder notification found!');
        else console.error('❌ Reminder NOT found');

        console.log('\n--- Sprint 6 Test Completed ---');

    } catch (error: any) {
        console.error('Unexpected error:', error.response?.data || error.message);
        process.exit(1);
    }
}

runTest();

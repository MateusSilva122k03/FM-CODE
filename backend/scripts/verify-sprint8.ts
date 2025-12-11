import axios from 'axios';
import { prismaClient } from '../src/lib/prisma';

const API_URL = 'http://localhost:3000';

async function runTest() {
    try {
        console.log('--- Starting Sprint 8 Verification Test (Finance) ---');

        // 1. Authenticate (Admin User)
        console.log('\n1. Authenticating...');
        const email = `admin-finance-${Date.now()}@example.com`;
        const password = 'password123';
        const tenantId = 'tenant-finance';

        // Ensure Tenant
        await prismaClient.tenant.upsert({
            where: { id: tenantId },
            update: {},
            create: { id: tenantId, name: 'Finance Corp' }
        });

        await axios.post(`${API_URL}/auth/register`, {
            email, password, name: 'Finance Admin', tenantId
        });
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Authenticated');

        // 2. Setup Data (Service & Professional with Commission)
        console.log('\n2. Setup Resources (Service & Professional)...');
        const sRes = await axios.post(`${API_URL}/api/services`, { name: 'Expensive Service', price: 200, duration: 60 }, { headers });
        const serviceId = sRes.data.id;

        // Create Professional directly via Prisma to set commissionRate (since API might not expose it yet)
        const professional = await prismaClient.professional.create({
            data: {
                name: 'Top Earner',
                tenantId,
                commissionRate: 15.0, // 15% Commission
            }
        });
        const professionalId = professional.id;
        console.log(`✅ Professional Created with 15% Commission`);

        // 3. Create & Complete Appointments (Revenue Generation)
        console.log('\n3. Generating Revenue...');

        // Appt 1: Completed ($200)
        const date1 = new Date();
        const appt1 = await prismaClient.appointment.create({
            data: {
                date: date1,
                serviceId,
                professionalId,
                tenantId,
                userId: 'client-1', // Mock
                status: 'COMPLETED'
            }
        });

        // Appt 2: Completed ($200)
        const date2 = new Date();
        const appt2 = await prismaClient.appointment.create({
            data: {
                date: date2,
                serviceId,
                professionalId,
                tenantId,
                userId: 'client-2',
                status: 'COMPLETED'
            }
        });

        // Appt 3: Scheduled (Should NOT count)
        await prismaClient.appointment.create({
            data: {
                date: new Date(),
                serviceId,
                professionalId,
                tenantId,
                userId: 'client-3',
                status: 'SCHEDULED'
            }
        });

        console.log('✅ Created 2 COMPLETED and 1 SCHEDULED appointments');

        // 4. Test Financial Summary
        console.log('\n4. Testing Financial SummaryEndpoint...');
        const summaryRes = await axios.get(`${API_URL}/api/finance/summary`, { headers });
        const summary = summaryRes.data;

        console.log('Summary:', summary);

        // Expect: 2 * 200 = 400 Revenue, 2 Appointments
        if (Number(summary.totalRevenue) === 400.00 && summary.totalAppointments === 2) {
            console.log('✅ Summary KPIs correct');
        } else {
            console.error(`❌ Summary mismatch: Expected 400/2, got ${summary.totalRevenue}/${summary.totalAppointments}`);
        }

        // 5. Test Detailed Report (Commission Calculation)
        console.log('\n5. Testing Detailed Report...');
        const reportRes = await axios.get(`${API_URL}/api/finance/report`, { headers });
        const report = reportRes.data;

        // Find the entry for appt1
        const entry = report.find((r: any) => r.service === 'Expensive Service');

        if (entry) {
            console.log('Report Entry Sample:', entry);
            // $200 * 15% = $30 Commission
            if (entry.commissionAmount === '30.00') {
                console.log('✅ Commission calculated correctly ($30.00)');
            } else {
                console.error(`❌ Commission mismatch: Expected 30.00, got ${entry.commissionAmount}`);
            }
        } else {
            console.error('❌ Report empty or missing entry');
        }

        console.log('\n--- Sprint 8 Test Completed ---');

    } catch (error: any) {
        console.error('Unexpected error:', error.response?.data || error.message);
        process.exit(1);
    }
}

runTest();

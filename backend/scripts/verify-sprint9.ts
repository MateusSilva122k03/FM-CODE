import axios from 'axios';
import { prismaClient } from '../src/lib/prisma';

const API_URL = 'http://localhost:3000';

async function runTest() {
    try {
        console.log('--- Starting Sprint 9 Verification Test (Payments & PIX) ---');

        // 1. Authenticate (Admin User)
        console.log('\n1. Authenticating...');
        const email = `admin-pay-${Date.now()}@example.com`;
        const password = 'password123';
        const tenantId = 'tenant-payments';

        // Ensure Tenant
        await prismaClient.tenant.upsert({
            where: { id: tenantId },
            update: {},
            create: { id: tenantId, name: 'Payments Corp' }
        });

        await axios.post(`${API_URL}/auth/register`, {
            email, password, name: 'Payments Admin', tenantId
        });
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Authenticated');

        // 2. Configure PIX
        console.log('\n2. Configuring PIX Key...');
        await axios.put(`${API_URL}/api/config`, { pixKey: 'test@pix.com.br' }, { headers });
        console.log('✅ PIX Key Updated');

        // 3. Test Public Endpoint
        console.log('\n3. Testing Public PIX Endpoint...');
        const publicRes = await axios.get(`${API_URL}/api/config/payment?tenantId=${tenantId}`);
        if (publicRes.data.pixKey === 'test@pix.com.br') {
            console.log('✅ Public Endpoint returned correct PIX Key');
        } else {
            console.error('❌ Public Endpoint failed:', publicRes.data);
            process.exit(1);
        }

        // 4. Create Appointment (Pending)
        console.log('\n4. Creating Appointment...');
        const sRes = await axios.post(`${API_URL}/api/services`, { name: 'Pix Service', price: 100, duration: 30 }, { headers });
        const serviceId = sRes.data.id;

        const apptRes = await axios.post(`${API_URL}/api/appointments`, {
            startTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
            serviceId,
            userId: 'client-pix'
        }, { headers });
        const apptId = apptRes.data.id;
        console.log('✅ Appointment Created:', apptId);

        // 5. Approve Payment
        console.log('\n5. Approving Payment...');
        const approveRes = await axios.post(`${API_URL}/api/appointments/${apptId}/approve-payment`, {}, { headers });

        if (approveRes.data.paymentStatus === 'PAID') {
            console.log('✅ Payment Approved (Status: PAID)');
        } else {
            console.error('❌ Approval failed:', approveRes.data);
        }

        // 6. Verify Notification (Optional/Mock)
        // In a real e2e we would check the database for the notification
        const notif = await prismaClient.notification.findFirst({
            where: {
                userId: 'client-pix', // matches the userId we sent or connected
                type: 'PAYMENT_CONFIRMATION'
            }
        });

        if (notif) {
            console.log('✅ Notification Created:', notif.message);
        } else {
            console.warn('⚠️ No notification found (Async job might be slow or userId mismatch)');
        }

        // 7. Test Rejection
        console.log('\n7. Testing Rejection Flow...');
        // Create another appt
        const appt2Res = await axios.post(`${API_URL}/api/appointments`, {
            startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
            serviceId,
            userId: 'client-reject'
        }, { headers });
        const appt2Id = appt2Res.data.id;

        const rejectRes = await axios.post(`${API_URL}/api/appointments/${appt2Id}/reject-payment`, {}, { headers });
        if (rejectRes.data.paymentStatus === 'REJECTED' && rejectRes.data.status === 'CANCELLED') {
            console.log('✅ Payment Rejected and Appointment Cancelled');
        } else {
            console.error('❌ Rejection failed:', rejectRes.data);
        }

        console.log('\n--- Sprint 9 Test Completed ---');

    } catch (error: any) {
        console.error('Unexpected error:', error.response?.data || error.message);
        process.exit(1);
    }
}

runTest();

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { prismaClient } from '../src/lib/prisma';

const API_URL = 'http://localhost:3000';
const TEST_FILE_PATH = path.join(__dirname, 'test-proof.png');

// Create a dummy file for upload test
if (!fs.existsSync(TEST_FILE_PATH)) {
    fs.writeFileSync(TEST_FILE_PATH, 'Dummy image content', 'utf-8');
}

async function runTest() {
    try {
        console.log('--- Starting Sprint 5 Verification Test ---');

        // 1. Authenticate
        console.log('\n1. Authenticating...');
        const email = `test-sprint5-${Date.now()}@example.com`;
        const password = 'password123';
        const { prismaClient } = require('../src/lib/prisma');
        const tenantId = 'tenant-sprint5';

        // Ensure Tenant Exists
        await prismaClient.tenant.upsert({
            where: { id: tenantId },
            update: {},
            create: { id: tenantId, name: 'Sprint 5 Tenant' }
        });

        await axios.post(`${API_URL}/auth/register`, {
            email, password, name: 'Sprint 5 User', tenantId
        });
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Authenticated');

        // 2. Setup (Service, Professional, Schedule, Appointment)
        console.log('\n2. Setting up Appointment...');
        const sRes = await axios.post(`${API_URL}/api/services`, { name: 'Manicure', price: 30, duration: 60 }, { headers });
        const pRes = await axios.post(`${API_URL}/api/professionals`, { name: 'Alice' }, { headers });
        const serviceId = sRes.data.id;
        const professionalId = pRes.data.id;

        // Schedule
        const dayOfWeek = new Date().getUTCDay();
        await prismaClient.professionalSchedule.create({
            data: { professionalId, dayOfWeek, startTime: '00:00', endTime: '23:59', tenantId }
        });

        // Appointment
        const now = new Date();
        now.setUTCHours(12, 0, 0, 0); // safe slot
        const startTime = now.toISOString();
        const aRes = await axios.post(`${API_URL}/api/appointments`, { serviceId, professionalId, startTime }, { headers });
        const appointmentId = aRes.data.id;
        console.log('✅ Appointment Created:', appointmentId);

        // 3. Test CMS - Tenant Config
        console.log('\n3. Testing CMS (Tenant Config)...');
        const configRes = await axios.get(`${API_URL}/api/config`, { headers });
        console.log('Initial Config:', configRes.data);

        const updateConfigRes = await axios.put(`${API_URL}/api/config`, {
            publicName: 'My Awesome Salon',
            themeColor: '#ff00ff'
        }, { headers });

        if (updateConfigRes.data.publicName === 'My Awesome Salon') {
            console.log('✅ Tenant Config Updated');
        } else {
            console.error('❌ Tenant Config Update Failed');
        }

        // 4. Test Payment Proof Upload
        console.log('\n4. Testing Payment Proof Upload...');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(TEST_FILE_PATH));

        const uploadRes = await axios.post(
            `${API_URL}/api/appointments/${appointmentId}/proof/upload`,
            formData,
            { headers: { ...headers, ...formData.getHeaders() } }
        );

        console.log('Upload Result:', uploadRes.data);
        if (uploadRes.data.url) {
            console.log('✅ Proof Uploaded');
        } else {
            console.error('❌ Upload Failed (No URL)');
        }

        // 5. Verify Appointment Status
        console.log('\n5. Verifying Appointment Status Update...');
        const checkAppt = await axios.get(`${API_URL}/api/appointments/${appointmentId}`, { headers });
        if (checkAppt.data.paymentStatus === 'PENDING_APPROVAL') {
            console.log('✅ Status updated to PENDING_APPROVAL');
        } else {
            console.error(`❌ Status Mismatch: ${checkAppt.data.paymentStatus}`);
        }

        console.log('\n--- Sprint 5 Test Completed ---');

    } catch (error: any) {
        console.error('Unexpected error:', error.response?.data || error.message);
        process.exit(1);
    } finally {
        if (fs.existsSync(TEST_FILE_PATH)) fs.unlinkSync(TEST_FILE_PATH);
    }
}

runTest();

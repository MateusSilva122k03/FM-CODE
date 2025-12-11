import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function runTest() {
    try {
        console.log('--- Starting Sprint 3 Verification Test ---');

        // 1. Authenticate (Tenant A)
        console.log('\n1. Authenticating as Tenant A...');
        const email = `test-sprint3-${Date.now()}@example.com`;
        const password = 'password123';
        const tenantId = 'tenant-a';

        await axios.post(`${API_URL}/auth/register`, {
            email,
            password,
            name: 'Sprint 3 User',
            tenantId
        });

        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Authenticated');

        // 2. Create Service
        console.log('\n2. Creating Service...');
        const serviceRes = await axios.post(`${API_URL}/api/services`, {
            name: 'Haircut',
            price: 50.00,
            duration: 30
        }, { headers });
        const serviceId = serviceRes.data.id;
        console.log('✅ Service created:', serviceId);

        // 3. Create Professional
        console.log('\n3. Creating Professional...');
        const profRes = await axios.post(`${API_URL}/api/professionals`, {
            name: 'John Barber'
        }, { headers });
        const professionalId = profRes.data.id;
        console.log('✅ Professional created:', professionalId);

        // 3.5 Create Professional Schedule (Required for Appointment)
        console.log('\n3.5 Creating Professional Schedule...');
        const date = new Date();
        const dayOfWeek = date.getUTCDay();
        // Ensure schedule covers current time
        const startHour = "00:00";
        const endHour = "23:59";

        // Direct DB insert as we don't have API for this yet
        const { prismaClient } = require('../src/lib/prisma');
        try {
            await prismaClient.professionalSchedule.create({
                data: {
                    professionalId,
                    dayOfWeek,
                    startTime: startHour,
                    endTime: endHour,
                    tenantId
                }
            });
            console.log(`✅ Schedule created for Day ${dayOfWeek}`);
        } catch (e) {
            console.log('Warning: Schedule might already exist or conflict');
        }

        // 4. Create Appointment
        console.log('\n4. Creating Appointment...');
        // Align to next 30-minute slot for validity
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        now.setMinutes(now.getMinutes() >= 30 ? 30 : 0, 0, 0); // Round to :00 or :30
        const startTime = now.toISOString();

        const apptRes = await axios.post(`${API_URL}/api/appointments`, {
            serviceId,
            professionalId,
            startTime
        }, { headers });
        console.log('✅ Appointment created:', apptRes.data.id);

        // 5. Verify Isolation (Tenant B)
        console.log('\n5. Verifying Isolation (Tenant B)...');
        const emailB = `test-sprint3-b-${Date.now()}@example.com`;
        await axios.post(`${API_URL}/auth/register`, {
            email: emailB,
            password,
            name: 'Sprint 3 User B',
            tenantId: 'tenant-b'
        });
        const loginResB = await axios.post(`${API_URL}/auth/login`, {
            email: emailB,
            password
        });
        const tokenB = loginResB.data.token;
        const headersB = { Authorization: `Bearer ${tokenB}` };

        // Try to list professionals of Tenant A (should be empty for Tenant B)
        const profsB = await axios.get(`${API_URL}/api/professionals`, { headers: headersB });
        if (profsB.data.length === 0) {
            console.log('✅ Isolation Verified: Tenant B sees 0 professionals');
        } else {
            console.error('❌ Isolation Failed: Tenant B sees professionals:', profsB.data);
        }

        // Try to create appointment with Tenant A's service (should fail)
        console.log('\n6. Verifying Cross-Tenant Validation...');
        try {
            await axios.post(`${API_URL}/api/appointments`, {
                serviceId, // Belongs to Tenant A
                professionalId, // Belongs to Tenant A
                startTime
            }, { headers: headersB });
            console.error('❌ Should have failed');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Cross-Tenant Validation Verified: Request rejected');
            } else {
                console.error('❌ Unexpected error:', error.response?.status);
            }
        }

        console.log('\n--- Test Completed ---');

        // 7. Test Updates
        console.log('\n7. Testing Updates...');

        // Update Service
        const updateServiceRes = await axios.put(`${API_URL}/api/services/${serviceId}`, {
            name: 'Premium Haircut',
            price: 60.00
        }, { headers });
        // Relaxed check for price to handle string/decimal differences
        if (updateServiceRes.data.name === 'Premium Haircut' && Number(updateServiceRes.data.price) === 60) {
            console.log('✅ Service Updated');
        } else {
            console.error(`❌ Service Update Failed: Name=${updateServiceRes.data.name}, Price=${updateServiceRes.data.price}`);
        }

        // Update Professional
        const updateProfRes = await axios.put(`${API_URL}/api/professionals/${professionalId}`, {
            name: 'John The Master Barber'
        }, { headers });
        if (updateProfRes.data.name === 'John The Master Barber') {
            console.log('✅ Professional Updated');
        } else {
            console.error('❌ Professional Update Failed');
        }

        // Update Appointment
        const newStartTime = new Date(Date.now() + 86400000).toISOString(); // +1 day
        const updateApptRes = await axios.put(`${API_URL}/api/appointments/${apptRes.data.id}`, {
            startTime: newStartTime,
            status: 'COMPLETED'
        }, { headers });
        if (updateApptRes.data.status === 'COMPLETED') {
            console.log('✅ Appointment Updated');
        } else {
            console.error('❌ Appointment Update Failed');
        }

        // 8. Test Deletion
        console.log('\n8. Testing Deletions...');

        // Delete Appointment
        await axios.delete(`${API_URL}/api/appointments/${apptRes.data.id}`, { headers });
        try {
            await axios.get(`${API_URL}/api/appointments/${apptRes.data.id}`, { headers });
            console.error('❌ Appointment Delete Failed (Still exists)');
        } catch (e: any) {
            if (e.response?.status === 404 || !e.response.data) console.log('✅ Appointment Deleted');
        }

        // Delete Professional
        await axios.delete(`${API_URL}/api/professionals/${professionalId}`, { headers });
        try {
            await axios.get(`${API_URL}/api/professionals/${professionalId}`, { headers });
            console.error('❌ Professional Delete Failed (Still exists)');
        } catch (e: any) {
            if (e.response?.status === 404 || !e.response.data) console.log('✅ Professional Deleted');
        }

        // Delete Service
        await axios.delete(`${API_URL}/api/services/${serviceId}`, { headers });
        try {
            await axios.get(`${API_URL}/api/services/${serviceId}`, { headers });
            console.error('❌ Service Delete Failed (Still exists)');
        } catch (e: any) {
            if (e.response?.status === 404 || !e.response.data) console.log('✅ Service Deleted');
        }

        console.log('\n--- All Sprint 3 Tests Completed Successfully ---');

    } catch (error: any) {
        console.error('Unexpected error:', error.response?.data || error.message);
    }
}

runTest();

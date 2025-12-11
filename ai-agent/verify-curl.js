
const axios = require('axios');
require('dotenv').config();

async function testCurl() {
    const key = process.env.GEMINI_API_KEY;
    const model = 'gemini-2.0-flash'; // Matches user curl
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    console.log(`Testing CURL equivalent for ${model}...`);

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Explain how AI works in a few words" }] }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("✅ SUCCESS!");
        console.log("Response:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("❌ FAILED");
        console.error("Status:", error.response ? error.response.status : 'Unknown');
        console.error("Data:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

testCurl();

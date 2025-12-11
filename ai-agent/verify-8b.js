
const axios = require('axios');
require('dotenv').config();

async function test8b() {
    const key = process.env.GEMINI_API_KEY;
    const model = 'gemini-1.5-flash-8b';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    console.log(`Testing ${model}...`);

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hi" }] }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("✅ SUCCESS!");
        console.log(response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error("❌ FAILED");
        console.error("Status:", error.response ? error.response.status : 'Unknown');
        console.error("Data:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

test8b();

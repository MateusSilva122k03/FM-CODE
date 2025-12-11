
const axios = require('axios');
require('dotenv').config();

async function debugCall() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        console.log("Hitting API directly...");
        const res = await axios.get(url);
        console.log("✅ Models found:", res.data.models.map(m => m.name));
    } catch (err) {
        console.error("❌ API Error:", err.response ? err.response.data : err.message);
    }
}

debugCall();

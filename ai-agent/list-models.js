
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Note: listModels is not easily exposed on the helper class in all versions, 
    // but usually we can try a direct call or just try known stable models.
    // Actually, to keep it simple and robust, let's try to just instantiate and run 'gemini-pro' (classic) and 'gemini-1.5-flash-8b' etc via brute force ping.

    const candidates = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash-002',
        'gemini-1.5-pro',
        'gemini-pro'
    ];

    console.log("Testing models...");

    for (const name of candidates) {
        try {
            process.stdout.write(`Testing ${name}... `);
            const model = genAI.getGenerativeModel({ model: name });
            const result = await model.generateContent("Hello");
            console.log("✅ SUCCESS");
            console.log(`\n\n!!! USE THIS MODEL NAME: ${name} !!!\n\n`);
            break; // Stop on first success
        } catch (error) {
            console.log("❌ Failed (" + error.message.split('[')[0] + ")");
        }
    }
}

listModels();

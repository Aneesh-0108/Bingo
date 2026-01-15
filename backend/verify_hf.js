require('dotenv').config();
const fs = require('fs');

const MODEL_URI = "https://router.huggingface.co/v1/chat/completions";

async function testHF() {
    fs.writeFileSync('hf_debug_clean.txt', "Testing Hugging Face API (Router)...\n");
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
        fs.appendFileSync('hf_debug_clean.txt', "❌ No API Key found in .env\n");
        return;
    }
    fs.appendFileSync('hf_debug_clean.txt', "Key found: " + apiKey.substring(0, 5) + "...\n");

    try {
        const response = await fetch(MODEL_URI, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [
                    { role: "user", content: "Hello, are you working?" }
                ],
                max_tokens: 50
            })
        });

        const status = response.status;
        const text = await response.text();

        fs.appendFileSync('hf_debug_clean.txt', `Status: ${status}\n`);
        fs.appendFileSync('hf_debug_clean.txt', `Raw Response: ${text}\n`);

    } catch (error) {
        fs.appendFileSync('hf_debug_clean.txt', "❌ Network/Fetch Error: " + error.message + "\n");
    }
}

testHF();

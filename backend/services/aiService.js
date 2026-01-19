/**
 * ============================================
 * AI SERVICE MODULE (HUGGING FACE ROUTER VERSION)
 * ============================================
 * 
 * Purpose:   Call Hugging Face Router API (OpenAI Compatible)
 * Model:     meta-llama/Meta-Llama-3-8B-Instruct
 */

require('dotenv').config();

// ============================================
// CONFIGURATION
// ============================================

const MODEL_URI = "https://router.huggingface.co/v1/chat/completions";
const MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct";

const SYSTEM_PROMPT = `You are Bingo, a helpful and friendly chatbot assistant. 
STRICT RULES:
1. Be concise - keep responses under 2-3 sentences.
2. If you don't know something, say "I don't know".
3. Be friendly and professional.
4. Do not mention that you are an AI model.`;

// ============================================
// MAIN FUNCTION
// ============================================

async function callAI(userMessage, context = {}) {

    console.log(`  [AI Service] Calling Hugging Face Router (${MODEL_ID})...`);
    const startTime = Date.now();

    // STEP 1: Validate API key
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_HF_TOKEN')) {
        console.error('  [AI Service] ❌ HUGGINGFACE_API_KEY not configured');
        return createErrorResponse('API key not configured', startTime);
    }

    try {
        // STEP 2: Build Messages (OpenAI Format)
        const messages = [
            { role: "system", content: SYSTEM_PROMPT }
        ];

        if (context.intent && context.intent !== 'unknown') {
            messages[0].content += `\nContext: User is asking about "${context.intent}".`;
        }

        messages.push({ role: "user", content: userMessage });

        // STEP 3: Call API
        const response = await fetch(MODEL_URI, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: messages,
                max_tokens: 250,
                temperature: 0.7
            })
        });

        // STEP 4: Handle Errors
        if (!response.ok) {
            const errorText = await response.text();
            console.error('  [AI Service] ❌ API Error:', response.status, errorText);

            // Handle "Model loading" state (503)
            if (response.status === 503 || errorText.includes('loading')) {
                console.warn('  [AI Service] ⏳ Model is loading');
                return createErrorResponse('Model is warming up, please try again shortly.', startTime);
            }
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // STEP 5: Extract Response
        let reply = '';
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            reply = data.choices[0].message.content;
        } else {
            console.error('  [AI Service] ❌ Unexpected response format:', data);
            throw new Error('Invalid response format');
        }

        reply = reply.trim();
        const responseTime = Date.now() - startTime;

        console.log('  [AI Service] ✅ Success!');
        console.log('  [AI Service] Response:', reply.substring(0, 60) + '...');

        // STEP 6: Return structured response
        return {
            success: true,
            reply: reply,
            source: 'ai',
            metadata: {
                model: MODEL_ID,
                provider: 'huggingface',
                responseTime: responseTime,
                timestamp: new Date().toISOString()
            },
            error: null
        };

    } catch (error) {
        console.error('  [AI Service] ❌ Error:', error.message);
        return createErrorResponse(error.message, startTime);
    }
}

function createErrorResponse(errorMessage, startTime) {
    return {
        success: false,
        reply: "I'm having trouble connecting to my AI brain right now. Please try again.",
        source: 'error_fallback',
        metadata: {
            provider: 'huggingface',
            finishReason: 'ERROR',
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
        },
        error: errorMessage
    };
}

module.exports = callAI;
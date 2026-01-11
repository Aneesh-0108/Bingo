/**
 * ============================================
 * AI SERVICE MODULE
 * ============================================
 * 
 * Purpose:   Call external AI (Google Gemini) and return responses
 * 
 * Responsibilities:
 * - Call Gemini API with user message
 * - Apply safety constraints via system prompt
 * - Handle API errors gracefully
 * - Return structured response with metadata
 * 
 * Does NOT:
 * - Decide when to use AI (intentRouter does this)
 * - Format final response (responseGenerator does this)
 * - Process intents (intentDetector does this)
 * 
 * HYBRID SYSTEM PRINCIPLE:
 * This is called ONLY when rules aren't enough
 * - Unknown intents
 * - Low confidence escalation intents
 * - NEVER for safe intents (greeting, identity, etc.)
 */

// Load environment variables
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ============================================
// CONFIGURATION
// ============================================

/**
 * System prompt:  Defines AI behavior and constraints
 * 
 * This is CRITICAL for responsible AI: 
 * - Sets boundaries
 * - Prevents hallucinations
 * - Ensures helpful but safe responses
 */
const SYSTEM_PROMPT = `You are Bingo, a helpful and friendly chatbot assistant. 

STRICT RULES:
1. Be concise - keep responses under 2-3 sentences
2. If you don't know something, say "I don't know" - never guess or make up facts
3. Don't provide medical, legal, or financial advice
4. Be friendly and professional
5. Stay on topic - if asked about unrelated things, politely decline
6. Don't mention that you're an AI or language model - just be helpful

Your goal:  Provide accurate, helpful information in a conversational way.`;

/**
 * Model configuration
 */
const MODEL_CONFIG = {
    model: "gemini-pro",        // Gemini Pro model
    temperature: 0.7,            // Balanced creativity (0 = deterministic, 1 = creative)
    maxOutputTokens: 150,        // Keep responses concise
    topP: 0.9,                   // Nucleus sampling
    topK: 40                     // Top-k sampling
};

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Call AI (Google Gemini) with user message
 * 
 * @param {string} userMessage - The user's original message
 * @param {object} context - Optional context (intent, confidence, etc.)
 * @returns {Promise<object>} - AI response with metadata
 * 
 * Response structure:
 * {
 *   success: true/false,
 *   reply: "AI generated text",
 *   source: "ai" or "error_fallback",
 *   metadata: {
 *     model: "gemini-pro",
 *     tokensUsed: 45,
 *     finishReason: "STOP",
 *     responseTime: 1234  // milliseconds
 *   },
 *   error: null or error message
 * }
 */
async function callAI(userMessage, context = {}) {

    console.log('  [AI Service] Calling Gemini API.. .');

    const startTime = Date.now();

    // STEP 1: Validate API key exists
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('  [AI Service] ❌ GEMINI_API_KEY not found in environment');
        return createErrorResponse('API key not configured', startTime);
    }

    // STEP 2: Validate input
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
        console.error('  [AI Service] ❌ Invalid user message');
        return createErrorResponse('Invalid user message', startTime);
    }

    try {

        // STEP 3: Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: MODEL_CONFIG.model
        });

        // STEP 4: Build prompt with context
        const prompt = buildPrompt(userMessage, context);

        console.log('  [AI Service] Sending prompt to Gemini.. .');
        console.log('  [AI Service] Message:', userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''));

        // STEP 5: Generate content
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: MODEL_CONFIG.temperature,
                maxOutputTokens: MODEL_CONFIG.maxOutputTokens,
                topP: MODEL_CONFIG.topP,
                topK: MODEL_CONFIG.topK,
            },
        });

        const response = await result.response;
        const text = response.text();

        // STEP 6: Validate response
        if (!text || text.trim() === '') {
            console.error('  [AI Service] ❌ Empty response from Gemini');
            return createErrorResponse('Empty response from AI', startTime);
        }

        // STEP 7: Extract metadata
        const responseTime = Date.now() - startTime;

        // Note: Gemini API doesn't always provide token usage in the same format as OpenAI
        const tokensUsed = response.usageMetadata?.totalTokenCount || null;
        const finishReason = response.candidates?.[0]?.finishReason || 'UNKNOWN';

        console.log('  [AI Service] ✅ Success!');
        console.log('  [AI Service] Response:', text.substring(0, 60) + (text.length > 60 ? '...' : ''));
        console.log('  [AI Service] Response time:', responseTime + 'ms');
        if (tokensUsed) {
            console.log('  [AI Service] Tokens used:', tokensUsed);
        }

        // STEP 8: Return structured response
        return {
            success: true,
            reply: text.trim(),
            source: 'ai',
            metadata: {
                model: MODEL_CONFIG.model,
                tokensUsed: tokensUsed,
                finishReason: finishReason,
                responseTime: responseTime,
                timestamp: new Date().toISOString()
            },
            error: null
        };

    } catch (error) {

        // STEP 9: Handle errors gracefully
        console.error('  [AI Service] ❌ Error calling Gemini: ');
        console.error('  [AI Service] Error message:', error.message);

        // Log specific error types for debugging
        if (error.message.includes('API_KEY_INVALID')) {
            console.error('  [AI Service] Issue:  Invalid API key');
        } else if (error.message.includes('RATE_LIMIT')) {
            console.error('  [AI Service] Issue: Rate limit exceeded');
        } else if (error.message.includes('SAFETY')) {
            console.error('  [AI Service] Issue: Safety filter triggered');
        }

        return createErrorResponse(error.message, startTime);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build prompt with system instructions and optional context
 * 
 * @param {string} userMessage - User's message
 * @param {object} context - Optional context
 * @returns {string} - Complete prompt
 */
function buildPrompt(userMessage, context) {

    // Start with system prompt
    let prompt = SYSTEM_PROMPT + '\n\n';

    // Add context if available
    if (context.intent && context.intent !== 'unknown') {
        prompt += `Context: The user seems to be asking about "${context.intent}".\n\n`;
    }

    if (context.confidence !== undefined && context.confidence < 0.5) {
        prompt += `Note: I'm not very confident about understanding this query, so please be helpful.\n\n`;
    }

    // Add user message
    prompt += `User: ${userMessage}\n\nBingo: `;

    return prompt;
}

/**
 * Create error response with fallback message
 * 
 * @param {string} errorMessage - Error description
 * @param {number} startTime - Request start time
 * @returns {object} - Error response
 */
function createErrorResponse(errorMessage, startTime) {

    const responseTime = Date.now() - startTime;

    return {
        success: false,
        reply: "I'm having trouble connecting to my AI assistant right now. Could you try rephrasing your question, or ask something else? ",
        source: 'error_fallback',
        metadata: {
            model: null,
            tokensUsed: null,
            finishReason: 'ERROR',
            responseTime: responseTime,
            timestamp: new Date().toISOString()
        },
        error: errorMessage
    };
}

/**
 * Validate and sanitize AI response
 * 
 * @param {string} text - AI generated text
 * @returns {string} - Sanitized text
 */
function validateResponse(text) {

    // Remove excessive whitespace
    let sanitized = text.trim().replace(/\s+/g, ' ');

    // Truncate if too long (safety check)
    if (sanitized.length > 500) {
        sanitized = sanitized.substring(0, 497) + '...';
        console.log('  [AI Service] ⚠️  Response truncated (too long)');
    }

    // Check for empty response
    if (sanitized.length === 0) {
        return "I don't have a good answer for that.";
    }

    return sanitized;
}

// ============================================
// EXPORT
// ============================================
module.exports = callAI;

// Also export for testing
module.exports.buildPrompt = buildPrompt;
module.exports.validateResponse = validateResponse;
module.exports.MODEL_CONFIG = MODEL_CONFIG;
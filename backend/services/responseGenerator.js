/**
 * ============================================
 * RESPONSE GENERATOR MODULE (PHASE 6 - WITH AI)
 * ============================================
 * 
 * Purpose: Generate the final response with complete metadata
 * 
 * PHASE 6 ENHANCEMENT:
 * - Now calls AI service when strategy is "ai_fallback"
 * - Handles AI responses alongside knowledge base responses
 * - All error handling and fallbacks remain robust
 * 
 * Strategy Handling:
 * - "knowledge_base" → Use knowledge. json (unchanged from Phase 5)
 * - "ai_fallback" → Call aiService.js (NEW!)
 * 
 * Responsibilities:
 * - Look up responses from knowledge base
 * - Call AI service when needed
 * - Handle errors gracefully
 * - Package everything with metadata
 * - Build explainability messages
 */

// Import AI service (NEW!)
const callAI = require('./aiService');

/**
 * Main response generation function
 * 
 * @param {object} routingResult - Output from intentRouter. js
 * @param {object} knowledgeBase - The knowledge. json data
 * @param {string} originalMessage - User's original message (for AI context)
 * @returns {Promise<object>} - Complete response (now async because of AI)
 * 
 * Note: This function is now ASYNC because AI calls are asynchronous
 */
async function generateResponse(routingResult, knowledgeBase, originalMessage = '') {

    // STEP 1: Extract data from routing result
    const {
        strategy,
        intent,
        confidence,
        confidenceLevel,
        shouldUseAI,
        matchedPatterns,
        allScores,
        detectionExplanation,
        routingExplanation,
        isSafeIntent
    } = routingResult;

    // STEP 2: Initialize response variables
    let reply;
    let responseSource;
    let aiMetadata = null;  // NEW: Store AI metadata if used

    // STEP 3: Generate response based on strategy

    if (strategy === 'knowledge_base') {
        // ====================================
        // STRATEGY 1: USE KNOWLEDGE BASE
        // ====================================
        // This logic is UNCHANGED from Phase 5

        console.log('  [Generation] Using knowledge base for:', intent);

        const intentData = findIntentInKnowledgeBase(intent, knowledgeBase);

        if (intentData && intentData.responses && intentData.responses.length > 0) {
            // Intent found and has responses
            reply = selectRandomResponse(intentData.responses);
            responseSource = 'knowledge_base';

            console.log('  [Generation] Selected response from', intentData.responses.length, 'options');

        } else {
            // Intent found but no responses defined (safety fallback)
            console.warn('  [Generation] ⚠️ Intent found but no responses defined:', intent);
            reply = "I understand what you're asking, but I don't have a response prepared for that yet. ";
            responseSource = 'error_fallback';
        }

    } else if (strategy === 'ai_fallback') {
        // ====================================
        // STRATEGY 2: USE AI (NEW!)
        // ====================================

        console.log('  [Generation] Using AI fallback');

        try {
            // Call AI service with user's message and context
            const aiResult = await callAI(originalMessage, {
                intent: intent,
                confidence: confidence,
                confidenceLevel: confidenceLevel
            });

            if (aiResult.success) {
                // AI call successful
                reply = aiResult.reply;
                responseSource = 'ai';
                aiMetadata = aiResult.metadata;

                console.log('  [Generation] AI response received');
                console.log('  [Generation] Response length:', reply.length, 'characters');

            } else {
                // AI call failed - use error fallback from aiService
                reply = aiResult.reply;  // Contains friendly error message
                responseSource = 'ai_error_fallback';
                aiMetadata = aiResult.metadata;

                console.warn('  [Generation] ⚠️ AI call failed, using error fallback');
                console.warn('  [Generation] Error:', aiResult.error);
            }

        } catch (error) {
            // Unexpected error calling AI service
            console.error('  [Generation] ❌ Unexpected error calling AI:', error.message);

            // Ultra-safe hardcoded fallback
            reply = "I'm having trouble processing that right now. Could you try asking in a different way?";
            responseSource = 'error_fallback';
        }

    } else {
        // ====================================
        // STRATEGY 3: UNKNOWN STRATEGY (Safety Check)
        // ====================================

        console.error('  [Generation] ❌ Unknown strategy:', strategy);
        reply = "I encountered an error processing your message. Please try again.";
        responseSource = 'error';
    }

    // STEP 4: Build comprehensive explainability message
    const explainability = buildExplainabilityMessage({
        intent,
        confidence,
        confidenceLevel,
        matchedPatterns,
        detectionExplanation,
        routingExplanation,
        responseSource,
        isSafeIntent
    });

    // STEP 5: Package complete response
    const response = {
        // Core response
        reply: reply,

        // Intent information
        intent: intent,
        confidence: confidence,
        confidenceLevel: confidenceLevel,

        // Explainability
        explainability: explainability,
        matchedPatterns: matchedPatterns || [],

        // Metadata
        metadata: {
            strategy: strategy,
            responseSource: responseSource,
            shouldUseAI: shouldUseAI,
            isSafeIntent: isSafeIntent,
            allScores: allScores,
            timestamp: new Date().toISOString(),

            // NEW: AI metadata (only present if AI was used)
            ...(aiMetadata && { ai: aiMetadata })
        }
    };

    // STEP 6: Log the final response
    console.log('  [Generation] Reply:', reply.substring(0, 50) + (reply.length > 50 ? '...' : ''));

    // STEP 7: Return complete response
    return response;
}

/**
 * Find intent data in knowledge base
 * 
 * @param {string} intentName - Name of intent to find
 * @param {object} knowledgeBase - The knowledge.json data
 * @returns {object|null} - Intent object or null if not found
 */
function findIntentInKnowledgeBase(intentName, knowledgeBase) {

    if (!intentName || !knowledgeBase || !knowledgeBase.intents) {
        return null;
    }

    for (const intent of knowledgeBase.intents) {
        if (intent.intent === intentName) {
            return intent;
        }
    }

    return null;
}

/**
 * Select a random response from array
 * 
 * @param {array} responses - Array of possible responses
 * @returns {string} - One randomly selected response
 */
function selectRandomResponse(responses) {

    if (!Array.isArray(responses) || responses.length === 0) {
        console.error('selectRandomResponse: Invalid responses array');
        return "I'm not sure how to respond. ";
    }

    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
}

/**
 * Build comprehensive explainability message
 * 
 * @param {object} data - All the data needed for explanation
 * @returns {string} - Complete explainability message
 */
function buildExplainabilityMessage(data) {

    const {
        intent,
        confidence,
        confidenceLevel,
        matchedPatterns,
        responseSource,
        isSafeIntent
    } = data;

    let message = '';

    // PART 1: Detection
    if (intent && intent !== 'unknown') {
        message += `Detected intent '${intent}'`;

        if (matchedPatterns && matchedPatterns.length > 0) {
            message += ` (matched:  ${matchedPatterns.join(', ')})`;
        }
        message += '. ';
    } else {
        message += 'No specific intent detected. ';
    }

    // PART 2: Confidence
    const confidencePercent = Math.round(confidence * 100);
    message += `Confidence: ${confidencePercent}% (${confidenceLevel})`;

    // PART 3: Safe intent explanation (if applicable)
    if (isSafeIntent && confidenceLevel === 'low') {
        message += ' - safe intent, answered with rules regardless of low confidence';
    }
    message += '. ';

    // PART 4: Response source
    if (responseSource === 'knowledge_base') {
        message += 'Using rule-based response from knowledge base. ';
    } else if (responseSource === 'ai') {
        message += 'Using AI-generated response (intent unknown or low confidence).';
    } else if (responseSource === 'ai_error_fallback') {
        message += 'AI service unavailable - using fallback response.';
    } else if (responseSource === 'error_fallback') {
        message += 'Using fallback response due to error.';
    } else {
        message += `Response source: ${responseSource}. `;
    }

    return message;
}

// ============================================
// EXPORT
// ============================================
module.exports = generateResponse;

// Export helpers for testing (optional)
module.exports.findIntentInKnowledgeBase = findIntentInKnowledgeBase;
module.exports.selectRandomResponse = selectRandomResponse;
module.exports.buildExplainabilityMessage = buildExplainabilityMessage;
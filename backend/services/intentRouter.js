/**
 * ============================================
 * INTENT ROUTER MODULE (PHASE 6 - WITH AI)
 * ============================================
 * 
 * Purpose:  Decide WHAT TO DO based on detected intent and confidence
 * 
 * PHASE 6 ENHANCEMENT:
 * - Now routes to AI service when appropriate
 * - Strategy changed from "fallback" to "ai_fallback"
 * - All other logic remains the same (safe intents, confidence checks)
 * 
 * ROUTING STRATEGY:
 * 
 *   Unknown Intent:
 *     → AI fallback (we don't know what user wants)
 * 
 *   Safe Intent (greeting, identity, help, etc.):
 *     → Knowledge base (ALWAYS, even with low confidence)
 * 
 *   Escalation Intent (future:  technical queries, etc.):
 *     → High confidence:  Knowledge base
 *     → Low confidence: AI fallback
 * 
 * CRITICAL RULE:
 * Safe intents NEVER go to AI, regardless of confidence
 */

/**
 * Configuration:   Safe Intents
 * 
 * These intents are safe to answer regardless of confidence
 * They will NEVER be sent to AI
 */
const SAFE_INTENTS = [
    'greeting',
    'bot_identity',
    'bot_purpose',
    'farewell',
    'help',
    'capabilities'
];

/**
 * Configuration:  Confidence thresholds
 * 
 * Used ONLY for escalation intents
 * Safe intents ignore these thresholds
 */
const CONFIDENCE_THRESHOLDS = {
    HIGH: 0.7,      // 70%+ = high confidence
    MEDIUM: 0.4,    // 40-69% = medium confidence
    LOW: 0.2        // Below 40% = low confidence
};

/**
 * Main routing function
 * 
 * @param {object} detectionResult - Output from intentDetector. js
 * @returns {object} - Routing decision
 */
function routeIntent(detectionResult) {

    const { intent, confidence, matchedPatterns, allScores, explanation } = detectionResult;

    // STEP 1: Determine confidence level (for logging/metadata)
    const confidenceLevel = determineConfidenceLevel(confidence);

    // STEP 2: Initialize response variables
    let strategy;
    let shouldUseAI;
    let routingExplanation;

    // ============================================
    // ROUTING LOGIC
    // ============================================

    // RULE 1: Unknown intent → AI fallback
    if (!intent || intent === 'unknown') {
        strategy = 'ai_fallback';  // ← CHANGED from 'fallback'
        shouldUseAI = true;
        routingExplanation = 'No specific intent detected - using AI assistance';

        console.log('  [Routing] Unknown intent → AI Fallback');
    }

    // RULE 2: Safe intent → always knowledge base
    else if (isSafeIntent(intent)) {
        strategy = 'knowledge_base';
        shouldUseAI = false;

        // Build explanation based on confidence
        if (confidenceLevel === 'high') {
            routingExplanation = `Safe intent '${intent}' detected with high confidence (${(confidence * 100).toFixed(0)}%) - using knowledge base`;
        } else if (confidenceLevel === 'medium') {
            routingExplanation = `Safe intent '${intent}' detected with medium confidence (${(confidence * 100).toFixed(0)}%) - using knowledge base`;
        } else {
            // LOW confidence but still a safe intent
            routingExplanation = `Safe intent '${intent}' detected with low confidence (${(confidence * 100).toFixed(0)}%), but answering anyway (safe intent, no AI needed)`;
        }

        console.log(`  [Routing] Safe intent '${intent}' (confidence: ${(confidence * 100).toFixed(0)}%) → Knowledge base`);
    }

    // RULE 3: Escalation intent → check confidence
    else {
        // This is an intent that might need AI assistance

        if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
            // Confidence is acceptable - use knowledge base
            strategy = 'knowledge_base';
            shouldUseAI = false;
            routingExplanation = `Intent '${intent}' with sufficient confidence (${(confidence * 100).toFixed(0)}%) - using knowledge base`;

            console.log(`  [Routing] Escalation intent '${intent}' with acceptable confidence → Knowledge base`);

        } else {
            // Confidence too low for escalation intent - use AI
            strategy = 'ai_fallback';  // ← CHANGED from 'fallback'
            shouldUseAI = true;
            routingExplanation = `Intent '${intent}' with low confidence (${(confidence * 100).toFixed(0)}%) - using AI assistance`;

            console.log(`  [Routing] Escalation intent '${intent}' with low confidence → AI Fallback`);
        }
    }

    // STEP 3: Return routing decision
    return {
        strategy: strategy,                      // "knowledge_base" or "ai_fallback"
        intent: intent,
        confidence: confidence,
        confidenceLevel: confidenceLevel,
        isSafeIntent: isSafeIntent(intent),
        shouldUseAI: shouldUseAI,
        matchedPatterns: matchedPatterns,
        allScores: allScores,
        detectionExplanation: explanation,
        routingExplanation: routingExplanation
    };
}

/**
 * Check if an intent is classified as "safe"
 * 
 * @param {string} intent - Intent name
 * @returns {boolean} - Is this a safe intent?
 */
function isSafeIntent(intent) {
    return SAFE_INTENTS.includes(intent);
}

/**
 * Determine confidence level from numeric score
 * 
 * @param {number} confidence - Confidence score (0.0 - 1.0)
 * @returns {string} - "high", "medium", or "low"
 */
function determineConfidenceLevel(confidence) {
    if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
        return 'high';
    } else if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
        return 'medium';
    } else {
        return 'low';
    }
}

/**
 * Add a new safe intent (helper function)
 * Useful if you want to dynamically add safe intents
 * 
 * @param {string} intent - Intent name to add
 */
function addSafeIntent(intent) {
    if (!SAFE_INTENTS.includes(intent)) {
        SAFE_INTENTS.push(intent);
        console.log(`Added '${intent}' to safe intents list`);
    }
}

/**
 * Check if AI escalation is recommended
 * 
 * @param {object} routingResult - The routing decision
 * @returns {boolean} - Should we use AI?
 */
function shouldEscalateToAI(routingResult) {
    return routingResult.shouldUseAI;
}

// ============================================
// EXPORT
// ============================================
module.exports = routeIntent;
module.exports.isSafeIntent = isSafeIntent;
module.exports.determineConfidenceLevel = determineConfidenceLevel;
module.exports.addSafeIntent = addSafeIntent;
module.exports.shouldEscalateToAI = shouldEscalateToAI;
module.exports.SAFE_INTENTS = SAFE_INTENTS;
module.exports.CONFIDENCE_THRESHOLDS = CONFIDENCE_THRESHOLDS;
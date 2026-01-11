/**
 * ============================================
 * INTENT DETECTOR MODULE
 * ============================================
 * 
 * Purpose: Score ALL intents and identify the best match
 * 
 * This is the "brain" of the chatbot - it determines WHAT the user wants
 * 
 * Algorithm:  Pattern Ratio Scoring (Approach 2)
 * - For each intent, count how many patterns match
 * - Confidence = (matched patterns / total patterns)
 * - Return intent with highest confidence
 * 
 * Why this approach:
 * - Simple to understand and explain
 * - Predictable scoring (not random)
 * - Easy to debug (can see exactly which patterns matched)
 * 
 * Example:
 *   Message: "hello"
 *   Intent: greeting (patterns: ["hello", "hi", "hey", "good morning"])
 *   Matched: 1 out of 4 patterns
 *   Confidence: 0.25 (25%)
 * 
 * Future improvements:
 * - Weight longer patterns higher (Phase 6)
 * - Consider word order (Phase 6)
 * - Use machine learning (Phase 7)
 */

/**
 * Main function:  Detect intent from processed message
 * 
 * @param {string} processedMessage - Cleaned message from preprocess. js
 * @param {object} knowledgeBase - The knowledge. json data
 * @returns {object} - Detection result with intent, confidence, and metadata
 * 
 * Example output:
 * {
 *   intent: "greeting",
 *   confidence:  0.25,
 *   matchedPatterns: ["hello"],
 *   allScores: { greeting: 0.25, bot_identity: 0.0, ... },
 *   explanation: "Matched patterns: hello"
 * }
 */
function detectIntent(processedMessage, knowledgeBase) {

    // STEP 1: Initialize storage for all scores
    // We'll score EVERY intent, not just find the first match
    const allScores = {};           // Store confidence for each intent
    const allMatches = {};          // Store which patterns matched for each intent

    // STEP 2: Loop through EVERY intent in the knowledge base
    // This is the key difference from Phase 4 (which stopped at first match)
    for (const intent of knowledgeBase.intents) {

        // Get the intent name (e.g., "greeting", "bot_identity")
        const intentName = intent.intent;

        // Score this specific intent
        const result = scoreIntent(processedMessage, intent);

        // Store the results
        allScores[intentName] = result.confidence;
        allMatches[intentName] = result.matchedPatterns;

        // Logging for debugging (you can see the scoring process)
        console.log(`    - ${intentName}: ${result.confidence.toFixed(2)} (matched: ${result.matchedPatterns.length})`);
    }

    // STEP 3: Find which intent has the HIGHEST score
    const bestIntent = findBestIntent(allScores);
    const bestConfidence = allScores[bestIntent] || 0.0;
    const bestMatches = allMatches[bestIntent] || [];

    // STEP 4: Build explanation for explainability
    let explanation;
    if (bestConfidence > 0) {
        // We found a match - explain which patterns matched
        explanation = `Matched patterns: ${bestMatches.join(', ')}`;
    } else {
        // No matches found
        explanation = 'No patterns matched';
    }

    // STEP 5: Return complete detection result
    return {
        intent: bestIntent || 'unknown',           // What we detected
        confidence: bestConfidence,                // How sure we are (0.0 - 1.0)
        matchedPatterns: bestMatches,              // Which patterns matched
        allScores: allScores,                      // All intent scores (for debugging)
        explanation: explanation                   // Human-readable explanation
    };
}

/**
 * Score a single intent using Pattern Ratio approach
 * 
 * Algorithm:
 * 1. Check each pattern to see if it appears in the message
 * 2. Count how many patterns matched
 * 3. Confidence = matched count / total patterns
 * 
 * @param {string} message - The processed message
 * @param {object} intent - Single intent object from knowledge base
 * @returns {object} - Score result
 * 
 * Example:
 *   message: "hello there"
 *   intent. patterns: ["hello", "hi", "hey", "good morning"]
 *   
 *   Check "hello" → FOUND ✓
 *   Check "hi" → NOT FOUND
 *   Check "hey" → NOT FOUND
 *   Check "good morning" → NOT FOUND
 *   
 *   Result: 1 match out of 4 patterns = 0.25 confidence
 */
function scoreIntent(message, intent) {

    // STEP 1: Initialize counters
    let matchedCount = 0;                    // How many patterns matched
    const totalPatterns = intent.patterns.length;  // Total patterns for this intent
    const matchedPatterns = [];              // Store which patterns matched

    // STEP 2: Check EACH pattern for this intent
    for (const pattern of intent.patterns) {

        // Does the message contain this pattern?
        // . includes() checks if pattern is a substring of message
        if (message.includes(pattern)) {

            // Pattern found!  Increment counter
            matchedCount++;

            // Store which pattern matched (for explainability)
            matchedPatterns.push(pattern);
        }
    }

    // STEP 3: Calculate confidence using Pattern Ratio formula
    // Confidence = (patterns matched / total patterns)
    let confidence = 0.0;

    if (totalPatterns > 0) {
        confidence = matchedCount / totalPatterns;
    } else {
        // Safety check:  if no patterns defined, confidence is 0
        confidence = 0.0;
    }

    // STEP 4: Return scoring result
    return {
        confidence: confidence,           // 0.0 to 1.0
        matchedPatterns: matchedPatterns  // Array of matched patterns
    };
}

/**
 * Find the intent with the highest confidence score
 * 
 * @param {object} scores - Object with intent names as keys, confidence as values
 * @returns {string} - Name of the best intent (or null if all scores are 0)
 * 
 * Example:
 *   scores = {
 *     greeting: 0.25,
 *     bot_identity: 0.50,
 *     bot_purpose: 0.0,
 *     farewell: 0.0
 *   }
 *   
 *   Returns:  "bot_identity" (highest score)
 */
function findBestIntent(scores) {

    // STEP 1: Initialize tracking variables
    let highestScore = 0.0;        // Track the highest score found
    let bestIntent = null;         // Track which intent has highest score

    // STEP 2: Loop through all scored intents
    for (const intentName in scores) {

        // Get the confidence score for this intent
        const score = scores[intentName];

        // Is this score higher than the current highest?
        if (score > highestScore) {
            // New highest score found! 
            highestScore = score;
            bestIntent = intentName;
        }
    }

    // STEP 3: Return the best intent
    // If all scores were 0, bestIntent will be null
    return bestIntent;
}

// ============================================
// EXPORT
// ============================================
// Make the main function available to other files
module.exports = detectIntent;
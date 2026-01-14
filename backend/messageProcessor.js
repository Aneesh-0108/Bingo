// ============================================================================
// MESSAGE PROCESSOR - Logic Adapter Wrapper
// ============================================================================

/**
 * This module wraps the 4-stage intent pipeline into a single function
 * for consistency with the backend-core pattern.
 * 
 * Purpose: 
 * - Provides a simple interface:  processMessage(message, knowledgeBase)
 * - Internally delegates to the 4-stage pipeline
 * - Handles errors and returns safe fallbacks
 */

const preprocess = require('./utils/preprocess');
const detectIntent = require('./services/intentDetector');
const routeIntent = require('./services/intentRouter');
const generateResponse = require('./services/responseGenerator');

/**
 * Process a message through the complete intent pipeline
 * 
 * @param {string} message - User's message
 * @param {Object} knowledgeBase - Loaded knowledge base
 * @returns {Promise<{reply: string, escalated: boolean, metadata: Object}>}
 */
async function processMessage(message, knowledgeBase) {
  try {
    // Stage 1: Preprocessing
    const preprocessed = preprocess(message);
    
    // Stage 2: Intent Detection
    const detection = detectIntent(preprocessed. processed, knowledgeBase);
    
    // Stage 3: Intent Routing
    const routing = routeIntent(detection);
    
    // Stage 4: Response Generation
    const response = await generateResponse(routing, knowledgeBase, message);
    
    return response;
    
  } catch (error) {
    // Error handling - return safe fallback
    console.error('[MessageProcessor] Error:', error.message);
    
    return {
      reply: 'I encountered an issue processing your request. A human agent will assist you shortly.',
      escalated: true,
      metadata: {
        error: error.message,
        responseSource: 'error_fallback'
      }
    };
  }
}

module.exports = {
  processMessage
};
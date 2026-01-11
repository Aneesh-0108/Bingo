/**
 * ============================================
 * BINGO CHATBOT - BACKEND SERVER
 * PHASE 5: Intent Classification & Explainability
 * ============================================
 * 
 * Architecture: 
 * User Input → Preprocess → Detect Intent → Route Intent → Generate Response → Return
 * 
 * Files:
 * - utils/preprocess.js         → Clean and normalize input
 * - services/intentDetector.js  → Score all intents, find best match
 * - services/intentRouter.js    → Decide strategy based on intent type
 * - services/responseGenerator.js → Create final response with metadata
 * 
 * Key Features:
 * - 4-stage pipeline with clear separation of concerns
 * - Safe intent classification (always answer greetings, identity, etc.)
 * - Confidence scoring for all intents
 * - Complete explainability at every step
 * - Future-ready for AI integration
 */
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER;


// ============================================
// DEPENDENCIES
// ============================================
const express = require('express');
const cors = require('cors');
const fs = require('fs');

// Import our custom modules (Phase 5 architecture)
const preprocess = require('./utils/preprocess');
const detectIntent = require('./services/intentDetector');
const routeIntent = require('./services/intentRouter');
const generateResponse = require('./services/responseGenerator');

// ============================================
// LOAD KNOWLEDGE BASE
// ============================================
let knowledgeBase;

try {
    // Load and parse knowledge. json
    const rawData = fs.readFileSync('./knowledge.json', 'utf-8');
    knowledgeBase = JSON.parse(rawData);

    console.log('✓ Knowledge base loaded:', knowledgeBase.intents.length, 'intents');
    console.log('  Intents:', knowledgeBase.intents.map(i => i.intent).join(', '));

} catch (error) {
    console.error('❌ Error loading knowledge. json:', error.message);
    process.exit(1);  // Exit if knowledge base can't be loaded
}

// ============================================
// EXPRESS SETUP
// ============================================
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());  // Enable CORS for frontend
app.use(express.json());  // Parse JSON request bodies

// ============================================
// MAIN CHAT ENDPOINT
// ============================================
app.post('/chat', async (req, res) => {

    console.log('\n========================================');
    console.log('NEW REQUEST');
    console.log('========================================');

    // ==========================================
    // STAGE 0: VALIDATION
    // ==========================================
    const userMessage = req.body.message;

    if (!userMessage || userMessage.trim() === '') {
        console.log('❌ Validation failed:  Empty message');
        return res.status(400).json({
            error: 'Message is required',
            timestamp: new Date().toISOString()
        });
    }

    console.log('User:', userMessage);

    try {

        // ==========================================
        // STAGE 1: PREPROCESSING
        // ==========================================
        console.log('\n[STAGE 1: PREPROCESSING]');

        const preprocessed = preprocess(userMessage);

        console.log('  Original:', preprocessed.original);
        console.log('  Processed:', preprocessed.processed);

        // ==========================================
        // STAGE 2: INTENT DETECTION
        // ==========================================
        console.log('\n[STAGE 2: INTENT DETECTION]');

        const detection = detectIntent(preprocessed.processed, knowledgeBase);

        console.log('  Detected Intent:', detection.intent);
        console.log('  Confidence:', (detection.confidence * 100).toFixed(0) + '%');
        console.log('  Matched Patterns:', detection.matchedPatterns.join(', ') || 'none');

        // Show all scores for debugging
        console.log('  All Scores: ');
        for (const [intent, score] of Object.entries(detection.allScores)) {
            console.log(`    - ${intent}: ${(score * 100).toFixed(0)}%`);
        }

        // ==========================================
        // STAGE 3: INTENT ROUTING
        // ==========================================
        console.log('\n[STAGE 3: INTENT ROUTING]');

        const routing = routeIntent(detection);

        console.log('  Confidence Level:', routing.confidenceLevel);
        console.log('  Is Safe Intent:', routing.isSafeIntent);
        console.log('  Strategy:', routing.strategy);
        console.log('  Should Use AI:', routing.shouldUseAI);

        // ==========================================
        // STAGE 4: RESPONSE GENERATION
        // ==========================================
        console.log('\n[STAGE 4: RESPONSE GENERATION]');

        // STAGE 4: Response Generation (now async)
        const response = await generateResponse(routing, knowledgeBase, userMessage);

        console.log('  Reply:', response.reply.substring(0, 60) + (response.reply.length > 60 ? '...' : ''));
        console.log('  Response Source:', response.metadata.responseSource);

        // ==========================================
        // STAGE 5: RETURN RESPONSE
        // ==========================================
        console.log('\n[RESPONSE SENT]');
        console.log('  Status:  200 OK');
        console.log('========================================\n');

        // Send complete response to frontend
        res.status(200).json(response);

    } catch (error) {
        // ==========================================
        // ERROR HANDLING
        // ==========================================
        console.error('\n❌ ERROR in processing: ');
        console.error('  Message:', error.message);
        console.error('  Stack:', error.stack);
        console.log('========================================\n');

        // Send error response
        res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred while processing your message',
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================
// HEALTH CHECK ENDPOINT (Optional but useful)
// ============================================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'Bingo Chatbot Backend',
        phase: 5,
        intents: knowledgeBase.intents.length,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// ROOT ENDPOINT
// ============================================
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Bingo Chatbot API',
        version: 'Phase 5 - Intent Classification & Explainability',
        endpoints: {
            chat: 'POST /chat',
            health: 'GET /health'
        }
    });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('🚀 BINGO CHATBOT BACKEND');
    console.log('========================================');
    console.log('Phase:  5 - Intent Classification & Explainability');
    console.log('Port:', PORT);
    console.log('URL:  http://localhost:' + PORT);
    console.log('\nEndpoints:');
    console.log('  POST /chat      - Main chatbot endpoint');
    console.log('  GET  /health    - Health check');
    console.log('  GET  /          - API info');
    console.log('\nKnowledge Base:');
    console.log('  Intents:', knowledgeBase.intents.length);
    console.log('  Safe Intents:', routeIntent.SAFE_INTENTS.join(', '));
    console.log('\nStatus: ✓ Ready to receive messages');
    console.log('========================================\n');
})
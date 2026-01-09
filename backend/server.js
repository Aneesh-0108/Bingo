// Import required modules
const express = require('express');
const cors = require('cors');
const fs = require('fs');

// Create Express application
const app = express();

// MIDDLEWARE: Enable CORS (allows frontend on different port to communicate)
// Frontend runs on port 3000, backend on port 5000
// Without this, browser blocks the request (security feature)
app.use(cors());

// MIDDLEWARE: Parse incoming JSON requests
// Converts JSON string from request body into JavaScript object
// Makes it available as req.body
app.use(express.json());

const knowledgeBase = JSON.parse(
    fs.readFileSync('./knowledge.json', 'utf-8')
);
console.log('✓ Knowledge base loaded:', knowledgeBase.intents.length, 'intents');

// STAGE 1: INPUT PROCESSING

function processInput(rawInput) {
    let processed = rawInput.toLowerCase();
    processed = processed.trim().replace(/\s+/g, ' ');
    console.log('  [Stage 1] Input processed:', rawInput, '→', processed);
    return processed;
}

// STAGE 2: INTENT DETECTION

function detectIntent(message, knowledge) {
    for (const intent of knowledge.intents) {
        for (const pattern of intent.patterns) {
            if (message.includes(pattern)) {
                console.log('  [Stage 2] Intent detected:', intent.intent, '(pattern:', pattern + ')');
                return intent;
            }
        }
    }
    console.log('  [Stage 2] Intent detected: unknown');
    return null;
}

// STAGE 3: KNOWLEDGE LOOKUP

function lookupKnowledge(intent, knowledge) {
    if (intent && intent.responses) {
        console.log('  [Stage 3] Found', intent.responses.length, 'responses for', intent.intent);
        return intent.responses;
    }
    console.log('  [Stage 3] Using fallback responses');
    return knowledge.fallback.responses;

}

// STAGE 4: RESPONSE GENERATION

function generateResponse(responses, intent) {
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
        reply: selectedResponse,
        intent: intent ? intent.intent : 'unknown',
        confidence: intent ? 'high' : 'low',
        explainability: intent
            ? `Matched intent "${intent.intent}" using rule-based pattern matching.`
            : 'No patterns matched. Using fallback response.'
    };
}


// ========================================
// ROUTE: POST /chat
// This is where frontend sends user messages
// ========================================
app.post('/chat', (req, res) => {
    console.log('\n--- New Message ---');

    const userMessage = req.body.message;

    // Validation
    if (!userMessage) {
        return res.status(400).json({ error: 'Message is required' });
    }

    console.log('User:', userMessage);

    // THE 4-STAGE PIPELINE
    const processedMessage = processInput(userMessage);           // Stage 1
    const detectedIntent = detectIntent(processedMessage, knowledgeBase);  // Stage 2
    const possibleResponses = lookupKnowledge(detectedIntent, knowledgeBase); // Stage 3
    const finalResponse = generateResponse(possibleResponses, detectedIntent); // Stage 4

    console.log('Bot:', finalResponse.reply);
    console.log('Explanation:', finalResponse.explainability);
    console.log('--- End ---\n');

    // Send response
    res.json(finalResponse);
});

// ========================================
// START SERVER
// ========================================
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`\n Chatbot Backend Running on http://localhost:${PORT}`);
    console.log(` Loaded ${knowledgeBase.intents.length} intents`);
    console.log(` Ready to receive messages at POST /chat\n`);
});
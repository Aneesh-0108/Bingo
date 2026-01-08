// Import required modules
const express = require('express');
const cors = require('cors');

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

// ========================================
// ROUTE: POST /chat
// This is where frontend sends user messages
// ========================================
app.post('/chat', (req, res) => {
    // STEP 1: Receive the request
    // req.body contains: { message: "user's message" }
    console.log('Received message from frontend:', req.body);

    // STEP 2: Extract user's message from request body
    const userMessage = req.body.message;

    // STEP 3: Validate that message exists
    if (!userMessage) {
        // If no message, send error response
        return res.status(400).json({
            error: 'Message is required'
        });
    }

    // STEP 4: Generate bot response (SIMPLE LOGIC FOR NOW)
    // In the future, this is where you'd call an AI API
    // For now, just echo back what user said
    const botReply = `You said: "${userMessage}".  This is a response from the backend! `;

    // STEP 5: Send JSON response back to frontend
    // Frontend expects:  { reply: "bot's message" }
    res.json({ reply: botReply });

    // Log for debugging
    console.log('Sent reply to frontend:', botReply);
});

// ========================================
// START SERVER
// ========================================
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
    console.log(`Waiting for POST requests on http://localhost:${PORT}/chat`);
});
/**
 * ============================================
 * PREPROCESSING MODULE
 * ============================================
 * 
 * Purpose: Clean and normalize user input for consistent processing
 * 
 * Why this exists:
 * - "HELLO", "hello", and "  HeLLo  " should all be treated the same
 * - Prevents pattern matching issues caused by formatting differences
 * - Centralizes input cleaning logic (easy to enhance later)
 * 
 * Future enhancements could include:
 * - Spell checking
 * - Removing stop words ("the", "a", "is")
 * - Handling emojis
 * - Language detection
 */

/**
 * Main preprocessing function
 * 
 * Takes raw user input and returns cleaned version
 * 
 * @param {string} rawMessage - The original message from the user
 * @returns {object} - Contains both original and processed versions
 * 
 * Example:
 *   Input:   "  HELLO There!   "
 *   Output:  {
 *     original: "  HELLO There!  ",
 *     processed: "hello there!"
 *   }
 */
function preprocess(rawMessage) {

    // STEP 0: Validation
    // Make sure we received a string, not undefined/null/number
    if (typeof rawMessage !== 'string') {
        console.warn('⚠️ preprocess received non-string input:', typeof rawMessage);
        rawMessage = String(rawMessage); // Convert to string
    }

    // STEP 1: Store the original message
    // Why?  For logging, debugging, and displaying to user
    // We never want to lose the original input
    const original = rawMessage;

    // STEP 2: Convert to lowercase
    // Why? "HELLO", "Hello", and "hello" should all match pattern "hello"
    // Pattern matching is case-insensitive this way
    let processed = rawMessage.toLowerCase();

    // STEP 3: Trim whitespace from beginning and end
    // Why? "  hello  " should be treated same as "hello"
    // . trim() removes spaces, tabs, newlines from start/end
    processed = processed.trim();

    // STEP 4: Replace multiple spaces with single space
    // Why? "hello    there" should become "hello there"
    // Regex explanation: \s+ means "one or more whitespace characters"
    // We replace with single space " "
    processed = processed.replace(/\s+/g, ' ');

    // STEP 5: Return both versions
    // original - for display and logging
    // processed - for pattern matching
    return {
        original: original,
        processed: processed
    };
}

// ============================================
// EXPORT
// ============================================
// Make this function available to other files
// Other files can now:  const preprocess = require('./utils/preprocess');
module.exports = preprocess;
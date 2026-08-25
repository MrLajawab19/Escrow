/**
 * geminiClient.js
 * Shared, lazily-initialized GoogleGenAI client for the AI provider layer.
 *
 * This is a NEW file created for the provider abstraction layer (Phase 1).
 * It does NOT replace the inline `ai` instance in disputeAI.js — that file
 * continues to manage its own client untouched.
 *
 * When the future cutover phase arrives, disputeAI.js can import from here
 * instead of initializing its own instance, centralizing config in one place.
 *
 * API key: process.env.GEMINI_API_KEY (same variable as disputeAI.js)
 */
const { GoogleGenAI } = require('@google/genai');

let _client = null;

/**
 * Returns the shared GoogleGenAI client instance (singleton).
 * Initializes on first call.
 * Falls back to 'dummy-key' to match the behavior of disputeAI.js
 * so tests don't crash on missing env var.
 */
function getGeminiClient() {
  if (!_client) {
    _client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || 'dummy-key',
    });
  }
  return _client;
}

module.exports = { getGeminiClient };

/**
 * xAI Grok via OpenAI-compatible API (https://api.x.ai/v1).
 */
const OpenAI = require('openai');

const BASE_URL = 'https://api.x.ai/v1';

function resolveModel(override) {
  return override || process.env.GROK_MODEL || 'grok-3-mini';
}

function getGrokClient() {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw new Error('GROK_API_KEY not set');
  return new OpenAI({ apiKey, baseURL: BASE_URL });
}

/**
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ max_tokens?: number, temperature?: number, model?: string }} [options]
 */
async function grokChatCompletion(messages, options = {}) {
  const client = getGrokClient();
  const { max_tokens = 2048, temperature = 0.3, model } = options;
  const completion = await client.chat.completions.create({
    model: resolveModel(model),
    messages,
    max_tokens,
    temperature,
  });
  const text = completion.choices[0]?.message?.content;
  if (text == null || String(text).trim() === '') {
    throw new Error('Empty response from Grok');
  }
  return String(text).trim();
}

module.exports = { grokChatCompletion, getGrokClient, BASE_URL };

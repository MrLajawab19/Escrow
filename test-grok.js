require('dotenv').config();
const { grokChatCompletion } = require('./backend/services/grokClient');

async function test() {
  const key = process.env.GROK_API_KEY;
  console.log('GROK_API_KEY:', key ? key.slice(0, 12) + '...' : 'NOT SET');

  try {
    const out = await grokChatCompletion(
      [{ role: 'user', content: 'Reply with exactly: WORKS' }],
      { max_tokens: 32, temperature: 0 }
    );
    console.log('Grok ✅:', out);
  } catch (e) {
    console.error('Grok ❌:', e.message);
  }
}

test();

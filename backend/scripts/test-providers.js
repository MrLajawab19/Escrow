/**
 * test-providers.js
 * Standalone smoke-test for the AI provider abstraction layer (Phase 1 + 2 + 3).
 *
 * Runs OUTSIDE of any Express route or controller.
 * Usage:
 *   node backend/scripts/test-providers.js
 *
 * Requires .env to have GEMINI_API_KEY and/or ANTHROPIC_API_KEY set.
 * If a key is missing the provider will return success: false with the error.
 */
'use strict';

// Load .env from the project root (two dirs up from backend/scripts/)
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const GeminiProvider = require('../services/ai/providers/GeminiProvider');
const ClaudeProvider = require('../services/ai/providers/ClaudeProvider');
const modelRouter   = require('../services/ai/ModelRouter');

const TEST_PROMPT = {
  systemPrompt: 'You are a concise test assistant.',
  userPrompt: 'Reply with the single word: OK',
  maxTokens: 16,
};

async function runTest(name, provider) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[test-providers] Testing: ${name}`);
  console.log(`${'─'.repeat(60)}`);

  const result = await provider.generate(TEST_PROMPT);

  console.log(`[test-providers] ${name} result:`);
  console.log(JSON.stringify(result, null, 2));

  return result;
}

(async () => {
  console.log('[test-providers] Starting AI provider smoke tests (Phase 1 + 2 + 3)...\n');

  // ── Phase 1: Direct provider tests ────────────────────────────────────────
  const gemini = new GeminiProvider();                        // gemini-3.5-flash (default)
  const lite   = new GeminiProvider('gemini-3.5-flash-lite'); // gemini-3.5-flash-lite
  const claude = new ClaudeProvider();

  // Run Flash and Lite sequentially (not concurrently) to avoid hitting RPM
  // on the very first test and skewing the fallback loop results.
  const geminiResult = await Promise.allSettled([runTest('GeminiProvider (gemini-3.5-flash)', gemini)]);
  const liteResult   = await Promise.allSettled([runTest('GeminiProvider (gemini-3.5-flash-lite)', lite)]);
  const claudeResult = await Promise.allSettled([runTest('ClaudeProvider', claude)]);

  const geminiOk = geminiResult[0].status === 'fulfilled' && geminiResult[0].value.success;
  const liteOk   = liteResult[0].status   === 'fulfilled' && liteResult[0].value.success;
  const claudeOk = claudeResult[0].status === 'fulfilled' && claudeResult[0].value.success;

  // ── Phase 2a: ModelRouter normal mode ─────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  console.log('[test-providers] Testing: ModelRouter — normal mode (fallback chain)');
  console.log(`${'─'.repeat(60)}`);

  let routerNormalResult;
  try {
    routerNormalResult = await modelRouter.call(TEST_PROMPT);
    console.log('[test-providers] ModelRouter normal mode result:');
    const { raw: _raw, ...printable } = routerNormalResult;
    console.log(JSON.stringify(printable, null, 2));
  } catch (err) {
    console.error('[test-providers] ModelRouter normal mode THREW:', err.message);
    routerNormalResult = null;
  }

  // ── Phase 2b: ModelRouter agreement mode ──────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  console.log('[test-providers] Testing: ModelRouter — requireAgreement: true');
  console.log(`${'─'.repeat(60)}`);

  let routerAgreementResult;
  try {
    routerAgreementResult = await modelRouter.call(TEST_PROMPT, { requireAgreement: true });
    console.log('[test-providers] ModelRouter agreement mode result:');
    const printableAgreement = {
      agreementMode: routerAgreementResult.agreementMode,
      primary:   { ...routerAgreementResult.primary,   raw: '[omitted]' },
      secondary: { ...routerAgreementResult.secondary, raw: '[omitted]' },
    };
    console.log(JSON.stringify(printableAgreement, null, 2));
  } catch (err) {
    console.error('[test-providers] ModelRouter agreement mode THREW:', err.message);
    routerAgreementResult = null;
  }

  // ── Phase 3: Fallback stress loop ──────────────────────────────────────────
  // 6 rapid calls with no delay — intentionally exhausts Flash's 5 RPM free-tier limit.
  // Calls 1-5 should resolve via gemini-3.5-flash; call 6 (and any beyond) should
  // fall through to gemini-3.5-flash-lite, NOT to claude.
  console.log(`\n${'─'.repeat(60)}`);
  console.log('[test-providers] Phase 3: Fallback stress loop (6 rapid calls — expect Flash→Lite fallback)');
  console.log(`${'─'.repeat(60)}`);

  const loopResults = [];
  for (let i = 1; i <= 6; i++) {
    try {
      const r = await modelRouter.call(TEST_PROMPT);
      const { raw: _r, ...slim } = r;
      console.log(`[test-providers] Loop call ${i}: providerUsed=${slim.providerUsed} success=${slim.success}`);
      loopResults.push({ call: i, providerUsed: slim.providerUsed, success: slim.success });
    } catch (err) {
      console.error(`[test-providers] Loop call ${i} THREW:`, err.message);
      loopResults.push({ call: i, providerUsed: 'THREW', success: false });
    }
  }

  // ── Final chain-health summary ─────────────────────────────────────────────
  const activeProviders   = [
    geminiOk && 'gemini-3.5-flash',
    liteOk   && 'gemini-3.5-flash-lite',
    claudeOk && 'claude',
  ].filter(Boolean);
  const inactiveProviders = [
    !geminiOk && 'gemini-3.5-flash',
    !liteOk   && 'gemini-3.5-flash-lite',
    !claudeOk && 'claude',
  ].filter(Boolean);
  const hasRedundancy = activeProviders.length >= 2;

  console.log(`\n${'═'.repeat(60)}`);
  console.log('[test-providers] Phase 1 — Direct provider health:');
  console.log(`  gemini-3.5-flash      → success=${geminiOk}`);
  console.log(`  gemini-3.5-flash-lite → success=${liteOk}`);
  console.log(`  claude                → success=${claudeOk}`);
  console.log(`\n[test-providers] Phase 2 — ModelRouter:`);
  console.log(
    `  Normal mode    → providerUsed=${
      routerNormalResult ? routerNormalResult.providerUsed : 'N/A (threw)'
    }`
  );
  console.log(
    `  Agreement mode → primary=${
      routerAgreementResult ? routerAgreementResult.primary.providerUsed : 'N/A'
    }, secondary=${
      routerAgreementResult ? routerAgreementResult.secondary.providerUsed : 'N/A'
    }`
  );
  console.log(`\n[test-providers] Phase 3 — Stress loop (6 calls, providerUsed per call):`);
  for (const r of loopResults) {
    console.log(`  Call ${r.call}: ${r.providerUsed} (success=${r.success})`);
  }
  console.log(`${'═'.repeat(60)}`);
  console.log(
    `[Test Summary] Active: ${
      activeProviders.length ? activeProviders.join(', ') : 'NONE'
    }. Inactive: ${
      inactiveProviders.length ? inactiveProviders.join(', ') : 'none'
    }. Chain has redundancy: ${
      hasRedundancy ? 'YES (✅)' : 'NO — check keys'
    }`
  );
  console.log(`${'═'.repeat(60)}\n`);
})();

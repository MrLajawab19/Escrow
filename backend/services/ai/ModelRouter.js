/**
 * ModelRouter.js
 * Provider-agnostic AI call router with fallback chain and optional agreement mode.
 *
 * Chain order: [GeminiProvider (primary), ClaudeProvider (fallback)]
 *
 * Today only Gemini is active. Claude will automatically become active the moment
 * ANTHROPIC_API_KEY is added to .env — no code changes required.
 *
 * Retry policy:
 *   - Transient errors  → retry the same provider once before falling back.
 *   - Auth/config errors → skip retry immediately (auth won't self-heal on retry).
 *
 * Exported as a singleton: require('./ModelRouter') gives the same instance everywhere.
 */
'use strict';

const GeminiProvider = require('./providers/GeminiProvider');
const ClaudeProvider  = require('./providers/ClaudeProvider');

// Error substrings that indicate a permanent auth/config failure.
// Retrying these wastes latency budget and can never succeed.
const NO_RETRY_SUBSTRINGS = ['authentication', 'api key', 'credit', 'billing'];

/**
 * Returns true if the error message signals a non-retryable auth/config problem.
 * @param {string|null} errorMessage
 */
function isAuthError(errorMessage) {
  if (!errorMessage) return false;
  const lower = errorMessage.toLowerCase();
  return NO_RETRY_SUBSTRINGS.some((kw) => lower.includes(kw));
}

/**
 * Derives a short, readable provider name for logging and the providerUsed field.
 * For GeminiProvider instances, uses provider.model directly (e.g. 'gemini-3.5-flash',
 * 'gemini-3.5-flash-lite') so Flash and Lite are clearly distinguished in output.
 * For other providers, falls back to lowercased class name minus 'provider'.
 * @param {import('./providers/BaseProvider')} provider
 */
function providerName(provider) {
  if (provider.model) return provider.model;
  return provider.constructor.name.toLowerCase().replace('provider', '');
}

class ModelRouter {
  constructor() {
    // Three-tier fallback chain:
    //   1. gemini-3.5-flash      — primary (5 RPM / lower daily quota)
    //   2. gemini-3.5-flash-lite — real fallback today (15 RPM / 500 RPD free tier;
    //                              same GEMINI_API_KEY, separate rate-limit bucket)
    //   3. ClaudeProvider        — third-tier; always fails auth until ANTHROPIC_API_KEY
    //                              is funded — kept last so Lite fires first on Flash failures
    this.chain = [
      new GeminiProvider(),                          // gemini-3.5-flash (default)
      new GeminiProvider('gemini-3.5-flash-lite'),   // gemini-3.5-flash-lite
      new ClaudeProvider(),
    ];
  }

  /**
   * Calls one provider with retry-once for transient errors.
   * Auth errors are never retried.
   *
   * @param {import('./providers/BaseProvider')} provider
   * @param {object} input  — same shape as BaseProvider.generate() input
   * @returns {Promise<object>} normalized provider result
   */
  async _tryProvider(provider, input) {
    const name = providerName(provider);
    let result = await provider.generate(input);

    if (!result.success) {
      if (isAuthError(result.error)) {
        // Permanent failure — no retry, log at debug level to keep noise low
        console.log(
          `[ModelRouter] ${name} skipped retry — auth/config error: ${result.error}`
        );
      } else {
        // Transient failure — retry exactly once
        console.log(
          `[ModelRouter] ${name} transient failure (${result.error}), retrying once...`
        );
        result = await provider.generate(input);
        if (!result.success) {
          console.log(
            `[ModelRouter] ${name} retry also failed: ${result.error}`
          );
        }
      }
    }

    return result;
  }

  /**
   * Routes an AI call through the provider chain.
   *
   * Normal mode (requireAgreement: false):
   *   Tries providers in chain order; returns first success tagged with providerUsed.
   *   Throws if every provider fails.
   *
   * Agreement mode (requireAgreement: true):
   *   Calls the first two providers concurrently via Promise.all.
   *   Returns { primary, secondary, agreementMode: true } without interpreting
   *   agreement — caller decides what to do with both results.
   *   Warns if fewer than 2 providers are currently functional.
   *
   * @param {object} input  — { systemPrompt, userPrompt, jsonSchema?, maxTokens? }
   * @param {{ requireAgreement?: boolean }} options
   * @returns {Promise<object>}
   */
  async call(input, options = {}) {
    const requireAgreement = options.requireAgreement === true;

    if (requireAgreement) {
      // ── Agreement mode: two concurrent calls ──────────────────────────────
      const pair = this.chain.slice(0, 2);
      const [primaryResult, secondaryResult] = await Promise.all(
        pair.map((p) => this._tryProvider(p, input))
      );

      const successCount = [primaryResult, secondaryResult].filter(
        (r) => r.success
      ).length;

      if (successCount < 2) {
        console.warn(
          '[ModelRouter] requireAgreement mode requested but only one provider is ' +
            'currently functional — agreement check is not meaningful until a second ' +
            'provider is configured'
        );
      }

      return {
        primary:   { ...primaryResult,   providerUsed: providerName(pair[0]) },
        secondary: { ...secondaryResult, providerUsed: providerName(pair[1]) },
        agreementMode: true,
      };
    }

    // ── Normal fallback mode: iterate chain in order ───────────────────────
    const errors = [];

    for (const provider of this.chain) {
      const result = await this._tryProvider(provider, input);

      if (result.success) {
        console.log(
          `[ModelRouter] call() resolved via ${providerName(provider)} ` +
            `(latency=${result.latencyMs}ms)`
        );
        return { ...result, providerUsed: providerName(provider) };
      }

      errors.push(`${providerName(provider)}: ${result.error}`);
    }

    // Every provider in the chain failed
    throw new Error(
      `[ModelRouter] All providers in chain failed.\n${errors.join('\n')}`
    );
  }
}

// Export as singleton — same router instance is reused across all require() calls
module.exports = new ModelRouter();

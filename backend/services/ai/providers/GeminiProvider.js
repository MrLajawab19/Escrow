/**
 * GeminiProvider.js
 * AI provider implementation wrapping Google Gemini.
 * Supports any Gemini model via the constructor — defaults to gemini-3.5-flash.
 * Use: new GeminiProvider()                       → gemini-3.5-flash (default)
 *      new GeminiProvider('gemini-3.5-flash-lite') → gemini-3.5-flash-lite
 *
 * Uses the shared geminiClient singleton — does NOT reinitialize the SDK
 * or duplicate API key config. The same GEMINI_API_KEY env var is used.
 *
 * Return shape (per BaseProvider contract):
 * {
 *   text:       string | null,
 *   raw:        object | null,
 *   tokensUsed: number | null,
 *   latencyMs:  number,
 *   success:    boolean,
 *   error:      string | null
 * }
 */
const BaseProvider = require('./BaseProvider');
const { getGeminiClient } = require('./geminiClient');

const DEFAULT_MODEL = 'gemini-3.5-flash';

class GeminiProvider extends BaseProvider {
  /**
   * @param {string} [model='gemini-3.5-flash'] — Gemini model identifier.
   *   Defaults to gemini-3.5-flash so existing `new GeminiProvider()` calls
   *   require zero changes.
   */
  constructor(model = DEFAULT_MODEL) {
    super();
    this.model = model;
  }

  /**
   * @param {{ systemPrompt: string, userPrompt: string, jsonSchema?: object, maxTokens?: number }} input
   * @returns {Promise<{ text: string|null, raw: any|null, tokensUsed: number|null, latencyMs: number, success: boolean, error: string|null }>}
   */
  async generate({ systemPrompt, userPrompt, jsonSchema, maxTokens }) {
    const startMs = Date.now();

    // Compose the prompt the same way disputeAI.js does — a single string
    // with system context prepended so the existing model behaviour is preserved.
    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\n${userPrompt}`
      : userPrompt;

    try {
      const ai = getGeminiClient();

      const raw = await ai.models.generateContent({
        model: this.model,
        contents: fullPrompt,
      });

      const latencyMs = Date.now() - startMs;

      // result.text is the accessor on the Gemini SDK response object
      const text = raw.text ?? null;

      // tokensUsed: the @google/genai SDK exposes usageMetadata on the response
      const tokensUsed =
        raw.usageMetadata?.totalTokenCount ??
        raw.usageMetadata?.promptTokenCount ??
        null;

      console.log(
        `[GeminiProvider] generate() OK — model=${this.model} latency=${latencyMs}ms tokens=${tokensUsed}`
      );

      return { text, raw, tokensUsed, latencyMs, success: true, error: null };
    } catch (err) {
      const latencyMs = Date.now() - startMs;
      console.error(`[GeminiProvider] generate() FAILED (${this.model}) — ${err.message}`);
      return {
        text: null,
        raw: null,
        tokensUsed: null,
        latencyMs,
        success: false,
        error: err.message,
      };
    }
  }
}

module.exports = GeminiProvider;

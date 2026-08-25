/**
 * ClaudeProvider.js
 * AI provider implementation wrapping Anthropic Claude (claude-sonnet-4-6).
 *
 * Requires environment variable: ANTHROPIC_API_KEY
 * See .env.example for the placeholder entry.
 *
 * Uses @anthropic-ai/sdk — installed as a project dependency.
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
const Anthropic = require('@anthropic-ai/sdk');

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_TOKENS = 1024;

class ClaudeProvider extends BaseProvider {
  constructor() {
    super();
    // Client is initialized once per ClaudeProvider instance.
    // The API key is read at construction time so a missing key surfaces early.
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error(
        '[ClaudeProvider] WARNING: ANTHROPIC_API_KEY is not set. ' +
          'All generate() calls will fail. Set it in your .env file.'
      );
    }
    this._client = new Anthropic.default({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * @param {{ systemPrompt: string, userPrompt: string, jsonSchema?: object, maxTokens?: number }} input
   * @returns {Promise<{ text: string|null, raw: any|null, tokensUsed: number|null, latencyMs: number, success: boolean, error: string|null }>}
   */
  async generate({ systemPrompt, userPrompt, jsonSchema, maxTokens }) {
    const startMs = Date.now();
    const resolvedMaxTokens = maxTokens ?? DEFAULT_MAX_TOKENS;

    try {
      const requestBody = {
        model: CLAUDE_MODEL,
        max_tokens: resolvedMaxTokens,
        messages: [{ role: 'user', content: userPrompt }],
      };

      // system is a top-level field in the Anthropic messages API (not a message role)
      if (systemPrompt) {
        requestBody.system = systemPrompt;
      }

      const raw = await this._client.messages.create(requestBody);

      const latencyMs = Date.now() - startMs;

      // Extract text from the first content block
      const textBlock = raw.content?.find((b) => b.type === 'text');
      const text = textBlock?.text ?? null;

      // Anthropic SDK exposes usage.input_tokens + usage.output_tokens
      const tokensUsed =
        raw.usage != null
          ? (raw.usage.input_tokens ?? 0) + (raw.usage.output_tokens ?? 0)
          : null;

      console.log(
        `[ClaudeProvider] generate() OK — model=${CLAUDE_MODEL} latency=${latencyMs}ms tokens=${tokensUsed}`
      );

      return { text, raw, tokensUsed, latencyMs, success: true, error: null };
    } catch (err) {
      const latencyMs = Date.now() - startMs;
      console.error(`[ClaudeProvider] generate() FAILED — ${err.message}`);
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

module.exports = ClaudeProvider;

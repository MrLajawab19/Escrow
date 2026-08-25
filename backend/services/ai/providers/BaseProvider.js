/**
 * BaseProvider.js
 * Abstract base class for all AI provider implementations.
 *
 * Every provider MUST override the generate() method.
 *
 * Required return shape from generate():
 * {
 *   text:       string | null  — the raw text response from the model
 *   raw:        any    | null  — the full unmodified response object from the SDK
 *   tokensUsed: number | null  — total tokens consumed (prompt + completion), if available
 *   latencyMs:  number         — wall-clock milliseconds from request start to response
 *   success:    boolean        — true if the call completed without error
 *   error:      string | null  — error message if success === false, otherwise null
 * }
 */
class BaseProvider {
  /**
   * @param {{ systemPrompt: string, userPrompt: string, jsonSchema?: object, maxTokens?: number }} input
   * @returns {Promise<{ text: string|null, raw: any|null, tokensUsed: number|null, latencyMs: number, success: boolean, error: string|null }>}
   */
  async generate({ systemPrompt, userPrompt, jsonSchema, maxTokens }) {
    throw new Error(
      `[BaseProvider] generate() must be implemented by subclass "${this.constructor.name}".`
    );
  }
}

module.exports = BaseProvider;

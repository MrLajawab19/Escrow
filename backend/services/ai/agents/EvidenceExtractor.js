/**
 * EvidenceExtractor.js
 * Stage 1 of the multi-agent arbitration pipeline.
 *
 * Responsibility: parse raw evidence into structured, factual points.
 * This agent does NOT assign fault or recommend outcomes — that is strictly
 * VerdictSynthesizer's job.
 *
 * Capabilities:
 *   - Reads image evidence (PNG/JPG/GIF chat screenshots) from the local
 *     filesystem (d:\ScrowX\Escrow\uploads\...) and sends them as inline base64
 *     image parts to Gemini's vision model.
 *   - Passes rebuttal text and non-image file references as plain text context.
 *   - Uses ModelRouter.call() (text-only, full fallback chain) when no images
 *     are present. Uses GeminiProvider.generateWithImages() directly when images
 *     are present (vision capability — no fallback chain available for vision yet).
 *
 * Return shape (never throws — always returns a safe fallback on any failure):
 * {
 *   facts: [
 *     { fact: string, source: string, confidence: number }
 *   ],
 *   unresolvedGaps:  string[],
 *   flagsForReview:  string[],
 *   extractionError: boolean,   // true if parse failed or API failed
 *   visionUsed:      boolean,   // true if at least one image was sent to the model
 *   providerUsed:    string,
 * }
 *
 * Known limitation: if the Gemini vision call fails (quota, rate limit), there
 * is currently NO fallback for the vision step. Text evidence is still extracted
 * in a graceful fallback call. This is documented here and in GeminiProvider.js.
 */
'use strict';

const path        = require('path');
const fs          = require('fs');
const modelRouter = require('../ModelRouter');
const GeminiProvider = require('../providers/GeminiProvider');

// Singleton vision provider — Flash is better at vision than Lite.
// Using gemini-3.5-flash; if rate-limited, the error is caught and a
// text-only fallback is attempted automatically (see extractEvidence).
const visionProvider = new GeminiProvider('gemini-3.5-flash');

// Root directory where uploaded evidence files live on disk.
// Mirrors the uploadDir in server.js: path.join(__dirname, 'uploads')
const UPLOADS_ROOT = path.join(__dirname, '..', '..', '..', '..', 'uploads');

// Image mime types we can send to Gemini vision
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

const MIME_MAP = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
};

/**
 * Identical to the private safeParse in VerdictSynthesizer.js.
 * Not exported from that module, so duplicated here (7 lines, not worth a util file).
 */
function safeParse(text) {
  try {
    const cleaned = (text || '')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    return { ok: true, value: JSON.parse(cleaned) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Safe fallback returned whenever extraction fails completely.
 * Caller receives a well-typed object, never an exception.
 */
const EXTRACTION_FAILURE = Object.freeze({
  facts:           [],
  unresolvedGaps:  ['Evidence extraction failed — raw evidence should be reviewed manually.'],
  flagsForReview:  [],
  extractionError: true,
  visionUsed:      false,
  providerUsed:    null,
});

/**
 * Attempts to read an evidence URL from local disk and encode it as base64.
 *
 * Evidence URLs are stored as relative paths like `/uploads/evidence-xxx.png`.
 * We resolve these against UPLOADS_ROOT (d:\ScrowX\Escrow\uploads).
 *
 * @param {string} url  — e.g. '/uploads/evidence-1724592000000-837264918.png'
 * @returns {{ data: string, mimeType: string, url: string } | null}
 */
function loadImageFromDisk(url) {
  try {
    // Strip the leading '/uploads/' prefix to get just the filename/subpath
    const relativePath = url.replace(/^\/uploads\//, '');
    const absolutePath = path.join(UPLOADS_ROOT, relativePath);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`[EvidenceExtractor] Image file not found on disk: ${absolutePath}`);
      return null;
    }

    const buffer   = fs.readFileSync(absolutePath);
    const ext      = path.extname(absolutePath).toLowerCase();
    const mimeType = MIME_MAP[ext] ?? 'image/jpeg';
    const data     = buffer.toString('base64');

    console.log(`[EvidenceExtractor] Loaded image ${url} (${buffer.length} bytes)`);
    return { data, mimeType, url };
  } catch (err) {
    console.warn(`[EvidenceExtractor] Failed to load image ${url}: ${err.message}`);
    return null;
  }
}

/**
 * Determines whether a URL points to an image file.
 * @param {string} url
 * @returns {boolean}
 */
function isImageUrl(url) {
  const ext = path.extname((url || '').split('?')[0]).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * Builds the system prompt for the extraction call.
 */
function buildSystemPrompt() {
  return `You are an evidence analyst for an escrow arbitration platform.
Your ONLY job is to extract factual, verifiable points from the evidence provided.
You MUST NOT assign fault, suggest blame, or recommend any outcome — that is handled
by a separate system after your output is received.

If chat screenshots are provided as images, transcribe the actual conversation content:
WHO said WHAT, including dates and times if visible. Do not just describe that "a chat 
screenshot was provided" — extract the actual messages.

Output ONLY valid JSON matching this schema exactly:
{
  "facts": [
    {
      "fact": "<short, concrete factual statement — e.g. 'Seller wrote on Aug 5: delivery will be 2 days late'>",
      "source": "<one of: buyer_evidence_image | seller_evidence_image | buyer_evidence_text | seller_evidence_text | buyer_rebuttal | seller_rebuttal | dispute_reason>",
      "confidence": <float 0.0 to 1.0 — lower if image is blurry, cropped, or text is ambiguous>,
      "mediaUrl": "<If this fact was derived from a specific uploaded file (like an image), put the exact file URL here. Omit or set to null if not derived from a specific file.>"
    }
  ],
  "unresolvedGaps": ["<what is still unclear from the evidence, e.g. 'No evidence of actual delivery date'>"],
  "flagsForReview": ["<anything unusual — e.g. 'Screenshot appears cropped at the top, context may be missing'>"]
}

Rules:
- facts array must not be empty even if evidence is sparse — always extract at least 
  what CAN be established (e.g. 'Buyer stated non-delivery in dispute reason').
- If evidence is completely absent for one party, state that as a gap.
- Do not infer intent or motivation — only factual statements.
- Do not include reasoning, preamble, or any text outside the JSON object.`;
}

/**
 * Builds the user prompt describing text-based evidence.
 *
 * @param {object} params
 * @param {object|null} params.buyerEvidence   — { rebuttal, evidenceUrls, isLate }
 * @param {object|null} params.sellerEvidence  — { rebuttal, evidenceUrls, isLate }
 * @param {string[]}    params.imageUrlsLoaded — which image URLs were successfully loaded (for context)
 * @param {string[]}    params.imageUrlsFailed — which image URLs failed to load
 * @param {string}      params.disputeReason
 * @param {string}      params.disputeDescription
 */
function buildUserPrompt({
  buyerEvidence,
  sellerEvidence,
  imageUrlsLoaded,
  imageUrlsFailed,
  disputeReason,
  disputeDescription,
}) {
  const lines = [];

  lines.push('--- DISPUTE CONTEXT ---');
  lines.push(`Reason: ${disputeReason || 'Not provided'}`);
  lines.push(`Description: ${disputeDescription || 'Not provided'}`);
  lines.push('');

  // Buyer evidence
  lines.push('--- BUYER EVIDENCE ---');
  if (!buyerEvidence) {
    lines.push('[No buyer evidence submitted]');
  } else {
    lines.push(`Submitted: ${buyerEvidence.isLate ? 'LATE' : 'ON TIME'}`);
    lines.push(`Rebuttal text: ${buyerEvidence.rebuttal || '[None provided]'}`);

    const buyerImages = (buyerEvidence.evidenceUrls || []).filter(isImageUrl);
    const buyerNonImages = (buyerEvidence.evidenceUrls || []).filter(u => !isImageUrl(u));

    if (buyerImages.length > 0) {
      const loaded = buyerImages.filter(u => imageUrlsLoaded.includes(u));
      const failed = buyerImages.filter(u => imageUrlsFailed.includes(u));
      if (loaded.length > 0) lines.push(`Image files (provided inline above): ${loaded.join(', ')}`);
      if (failed.length > 0) lines.push(`Image files (FAILED to load — could not be included): ${failed.join(', ')}`);
    }
    if (buyerNonImages.length > 0) {
      lines.push(`Non-image files (filenames only — content not available for extraction): ${buyerNonImages.join(', ')}`);
    }
    if ((buyerEvidence.evidenceUrls || []).length === 0) {
      lines.push('File uploads: None');
    }
  }
  lines.push('');

  // Seller evidence
  lines.push('--- SELLER EVIDENCE ---');
  if (!sellerEvidence) {
    lines.push('[No seller evidence submitted]');
  } else {
    lines.push(`Submitted: ${sellerEvidence.isLate ? 'LATE' : 'ON TIME'}`);
    lines.push(`Rebuttal text: ${sellerEvidence.rebuttal || '[None provided]'}`);

    const sellerImages = (sellerEvidence.evidenceUrls || []).filter(isImageUrl);
    const sellerNonImages = (sellerEvidence.evidenceUrls || []).filter(u => !isImageUrl(u));

    if (sellerImages.length > 0) {
      const loaded = sellerImages.filter(u => imageUrlsLoaded.includes(u));
      const failed = sellerImages.filter(u => imageUrlsFailed.includes(u));
      if (loaded.length > 0) lines.push(`Image files (provided inline above): ${loaded.join(', ')}`);
      if (failed.length > 0) lines.push(`Image files (FAILED to load — could not be included): ${failed.join(', ')}`);
    }
    if (sellerNonImages.length > 0) {
      lines.push(`Non-image files (filenames only — content not available for extraction): ${sellerNonImages.join(', ')}`);
    }
    if ((sellerEvidence.evidenceUrls || []).length === 0) {
      lines.push('File uploads: None');
    }
  }

  return lines.join('\n');
}

/**
 * Extracts structured factual points from raw evidence.
 *
 * @param {{
 *   buyerEvidence?:  { rebuttal?: string, evidenceUrls?: string[], isLate?: boolean } | null,
 *   sellerEvidence?: { rebuttal?: string, evidenceUrls?: string[], isLate?: boolean } | null,
 *   disputeReason?:        string,
 *   disputeDescription?:   string,
 * }} input
 *
 * @returns {Promise<{
 *   facts:           Array<{ fact: string, source: string, confidence: number }>,
 *   unresolvedGaps:  string[],
 *   flagsForReview:  string[],
 *   extractionError: boolean,
 *   visionUsed:      boolean,
 *   providerUsed:    string | null,
 * }>}
 */
async function extractEvidence({
  buyerEvidence  = null,
  sellerEvidence = null,
  disputeReason       = '',
  disputeDescription  = '',
} = {}) {
  // ── Collect all image URLs from both parties' evidence ────────────────────
  const allBuyerImages  = (buyerEvidence?.evidenceUrls  || []).filter(isImageUrl);
  const allSellerImages = (sellerEvidence?.evidenceUrls || []).filter(isImageUrl);
  const allImageUrls    = [...allBuyerImages, ...allSellerImages];

  // ── Load images from disk ─────────────────────────────────────────────────
  const loadedImages    = [];  // [{ data, mimeType, url }]
  const imageUrlsLoaded = [];
  const imageUrlsFailed = [];

  for (const url of allImageUrls) {
    const result = loadImageFromDisk(url);
    if (result) {
      loadedImages.push(result);
      imageUrlsLoaded.push(url);
    } else {
      imageUrlsFailed.push(url);
    }
  }

  const visionUsed = loadedImages.length > 0;

  const systemPrompt = buildSystemPrompt();
  const userPrompt   = buildUserPrompt({
    buyerEvidence,
    sellerEvidence,
    imageUrlsLoaded,
    imageUrlsFailed,
    disputeReason,
    disputeDescription,
  });

  // ── Call the appropriate path based on whether images were loaded ─────────
  let apiResult;

  if (visionUsed) {
    // Vision path: GeminiProvider.generateWithImages() — no ModelRouter fallback
    console.log(
      `[EvidenceExtractor] Vision path — ${loadedImages.length} image(s) loaded, ` +
      `${imageUrlsFailed.length} failed`
    );
    apiResult = await visionProvider.generateWithImages({
      systemPrompt,
      userPrompt,
      images: loadedImages.map(({ data, mimeType }) => ({ data, mimeType })),
    });

    // If vision call failed, try a text-only fallback via ModelRouter
    // (image content won't be analyzed, but text evidence is still extracted)
    if (!apiResult.success) {
      console.warn(
        '[EvidenceExtractor] Vision call failed — falling back to text-only extraction. ' +
        'Image content will NOT be analyzed in this fallback.'
      );
      apiResult = await modelRouter.call({ systemPrompt, userPrompt });
      if (apiResult.success) {
        apiResult._visionFallback = true;
      }
    }
  } else {
    // Text-only path: full ModelRouter fallback chain (Flash → Lite → Claude)
    console.log('[EvidenceExtractor] Text-only path — no images to process');
    apiResult = await modelRouter.call({ systemPrompt, userPrompt });
  }

  // ── Parse response ────────────────────────────────────────────────────────
  const providerUsed = apiResult.providerUsed ?? visionProvider.model;

  if (!apiResult.success) {
    console.error(`[EvidenceExtractor] API call failed: ${apiResult.error}`);
    return { ...EXTRACTION_FAILURE, providerUsed, visionUsed };
  }

  const parsed = safeParse(apiResult.text);

  if (!parsed.ok) {
    console.error(`[EvidenceExtractor] JSON parse failed: ${parsed.error}`);
    console.error(`[EvidenceExtractor] Raw text was: ${apiResult.text?.slice(0, 300)}`);
    return { ...EXTRACTION_FAILURE, providerUsed, visionUsed };
  }

  const result = parsed.value;

  // Validate required fields — patch up if model returned partial structure
  if (!Array.isArray(result.facts)) result.facts = [];
  if (!Array.isArray(result.unresolvedGaps)) result.unresolvedGaps = [];
  if (!Array.isArray(result.flagsForReview)) result.flagsForReview = [];

  // Note if we fell back from vision to text-only
  if (apiResult._visionFallback) {
    result.flagsForReview.push(
      'Vision extraction failed — image content was not analyzed. ' +
      'Text evidence only. Images should be reviewed manually.'
    );
  }

  console.log(
    `[EvidenceExtractor] Extraction OK — ${result.facts.length} facts, ` +
    `${result.unresolvedGaps.length} gaps, ${result.flagsForReview.length} flags, ` +
    `visionUsed=${visionUsed}, provider=${providerUsed}`
  );

  return {
    facts:           result.facts,
    unresolvedGaps:  result.unresolvedGaps,
    flagsForReview:  result.flagsForReview,
    extractionError: false,
    visionUsed,
    providerUsed,
  };
}

module.exports = { extractEvidence };

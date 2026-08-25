/**
 * VerdictSynthesizer.js
 * Specialized AI agent for dispute verdict synthesis.
 *
 * Input shape mirrors exactly what generateAIReport reads from Prisma:
 *   - dispute fields: raisedBy, reason, description
 *   - deed fields:    currency, amount (in subunits — paise/cents), description, title
 *   - evidence:       buyer and seller EVIDENCE_SUBMITTED event payloads
 *   - challenges:     optional AI_REPORT and CHALLENGE event payloads for re-analysis
 *   - isReAnalysis:   boolean — true when at least one AI_REPORT event already exists
 *
 * Output shape matches the existing DB write shape in generateAIReport exactly:
 *   { faultSide, recommendation, confidenceScore, reasoning }
 *   - faultSide:       "BUYER" | "SELLER" | "NEUTRAL"
 *   - recommendation:  "REFUND_BUYER" | "RELEASE_TO_SELLER" | "MANUAL_REVIEW_REQUIRED"
 *   - confidenceScore: integer 0–100  (NOT 0–1 — confirmed against disputeAI.js line 96/108/174)
 *   - reasoning:       string, max ~2 sentences
 *
 * High-stakes threshold: sourced from disputeConfig (same module kycGate.js uses),
 * currency-aware, applied to subunit amount — identical formula to disputeAI.js line 167–169.
 *
 * This agent is ISOLATED — it does not write to the DB or modify any dispute record.
 * Callers are responsible for persisting its return value.
 */
'use strict';

const disputeConfig = require('../../../config/disputeConfig');
const modelRouter   = require('../ModelRouter');

// ── Safe JSON parse ────────────────────────────────────────────────────────────

/**
 * Strips markdown code fences (```json ... ```) that models sometimes wrap
 * JSON in, then parses. Mirrors the cleanup in disputeAI.js line 135.
 * Returns { ok: true, value } or { ok: false, error }.
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

/** Returned when the model output cannot be parsed. Matches the fallback shape. */
const PARSE_FAILURE = {
  faultSide: 'NEUTRAL',
  recommendation: 'MANUAL_REVIEW_REQUIRED',
  confidenceScore: 0,
  reasoning: 'Unable to parse model output',
  parseError: true,
};

// ── High-stakes threshold (mirrors disputeAI.js lines 166–169) ────────────────

/**
 * Returns true when the deed amount (in subunits) meets or exceeds the
 * currency-aware auto-escalation threshold defined in disputeConfig.
 * Uses the same formula as disputeAI.js Stage C3.
 *
 * @param {string} currency   - e.g. 'INR' or 'USD' (case-insensitive)
 * @param {number} amount     - deed.amount in subunits (paise / cents)
 */
function isHighStakes(currency, amount) {
  const curr = (currency || 'INR').toUpperCase();
  const thresholdMajor =
    curr === 'USD'
      ? disputeConfig.HIGH_VALUE_THRESHOLD_USD
      : disputeConfig.HIGH_VALUE_THRESHOLD_INR;
  const thresholdSubUnit = thresholdMajor * 100;
  return (amount || 0) >= thresholdSubUnit;
}

// ── Prompt builders ────────────────────────────────────────────────────────────

function buildSystemPrompt() {
  return (
    'You are an expert arbitration assistant for ScrowX, a secure escrow platform. ' +
    'You will be given structured dispute data and must output ONLY valid JSON — ' +
    'no markdown, no explanation, no preamble — matching this exact shape:\n' +
    '{\n' +
    '  "faultSide": "BUYER" | "SELLER" | "NEUTRAL",\n' +
    '  "recommendation": "REFUND_BUYER" | "RELEASE_TO_SELLER" | "MANUAL_REVIEW_REQUIRED",\n' +
    '  "confidenceScore": <integer 0 to 100>,\n' +
    '  "reasoning": "<1–2 sentence explanation>"\n' +
    '}\n\n' +
    'Rules:\n' +
    '- confidenceScore must be an integer between 0 and 100 (not a decimal).\n' +
    '- If evidence is missing for a party, weigh their silence negatively.\n' +
    '- Late submissions (isLate: true) should reduce that party\'s credibility.\n' +
    '- Output ONLY the JSON object. Do not wrap it in code fences or add any other text.'
  );
}

/**
 * Builds the user prompt from the dispute input data.
 * Mirrors the same information sections as the prompt in disputeAI.js lines 66–98,
 * but passes data as structured JSON instead of template-literal prose so the
 * model receives unambiguous typed values.
 *
 * @param {object} inputData  — see synthesizeVerdict() JSDoc for shape
 */
function buildUserPrompt(inputData) {
  const {
    isReAnalysis,
    deed,
    dispute,
    buyerEvidence,
    sellerEvidence,
    originalAiReport,
    buyerChallenge,
    sellerChallenge,
  } = inputData;

  const payload = {
    passType: isReAnalysis ? 'CHALLENGE_RE_ANALYSIS' : 'FIRST_PASS_ANALYSIS',
    order: {
      currency:    deed.currency,
      amountSubUnits: deed.amount,
      description: deed.description || deed.title || 'None provided',
    },
    disputeCreation: {
      raisedBy:    dispute.raisedBy,
      reason:      dispute.reason,
      description: dispute.description,
    },
    evidenceSubmissions: {
      buyer: buyerEvidence
        ? {
            submittedOnTime: !buyerEvidence.isLate,
            rebuttal:        buyerEvidence.rebuttal || '',
            filesUploaded:   buyerEvidence.evidenceUrls || [],
          }
        : { submittedOnTime: false, rebuttal: null, filesUploaded: [] },
      seller: sellerEvidence
        ? {
            submittedOnTime: !sellerEvidence.isLate,
            rebuttal:        sellerEvidence.rebuttal || '',
            filesUploaded:   sellerEvidence.evidenceUrls || [],
          }
        : { submittedOnTime: false, rebuttal: null, filesUploaded: [] },
    },
  };

  // Append challenge context only for re-analysis passes
  if (isReAnalysis && originalAiReport) {
    payload.challengeContext = {
      originalVerdict: {
        faultSide: originalAiReport.faultSide,
        reasoning: originalAiReport.reasoning,
      },
      buyerChallenge:  buyerChallenge  ? buyerChallenge.rebuttal  : null,
      sellerChallenge: sellerChallenge ? sellerChallenge.rebuttal : null,
    };
  }

  return JSON.stringify(payload, null, 2);
}

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * Synthesizes a dispute verdict using the AI provider chain.
 *
 * @param {object} inputData
 * @param {boolean}  inputData.isReAnalysis          - true if AI_REPORT events already exist
 * @param {object}   inputData.deed
 * @param {string}     inputData.deed.currency       - 'INR' | 'USD' etc.
 * @param {number}     inputData.deed.amount         - amount in subunits (paise/cents)
 * @param {string}    [inputData.deed.description]   - order description
 * @param {string}    [inputData.deed.title]         - order title (fallback)
 * @param {object}   inputData.dispute
 * @param {string}     inputData.dispute.raisedBy    - 'buyer' | 'seller'
 * @param {string}     inputData.dispute.reason      - short reason string
 * @param {string}     inputData.dispute.description - full description
 * @param {object|null} inputData.buyerEvidence      - payload of EVIDENCE_SUBMITTED (buyer)
 * @param {string}        [inputData.buyerEvidence.rebuttal]
 * @param {string[]}      [inputData.buyerEvidence.evidenceUrls]
 * @param {boolean}       [inputData.buyerEvidence.isLate]
 * @param {object|null} inputData.sellerEvidence     - payload of EVIDENCE_SUBMITTED (seller)
 * @param {object|null} inputData.originalAiReport   - payload of AI_REPORT[0] (re-analysis only)
 * @param {object|null} inputData.buyerChallenge     - payload of CHALLENGE (buyer)
 * @param {object|null} inputData.sellerChallenge    - payload of CHALLENGE (seller)
 *
 * @returns {Promise<object>} verdict matching { faultSide, recommendation, confidenceScore, reasoning }
 *   May include extra fields: parseError, disagreement, providerUsed
 */
async function synthesizeVerdict(inputData) {
  const { deed } = inputData;
  const highStakes = isHighStakes(deed.currency, deed.amount);

  const routerInput = {
    systemPrompt: buildSystemPrompt(),
    userPrompt:   buildUserPrompt(inputData),
    maxTokens:    512,
  };

  console.log(
    `[VerdictSynthesizer] synthesizeVerdict() — highStakes=${highStakes} ` +
      `currency=${deed.currency} amount=${deed.amount}`
  );

  // ── High-stakes: agreement mode ─────────────────────────────────────────────
  if (highStakes) {
    const routerResult = await modelRouter.call(routerInput, { requireAgreement: true });

    const primaryParse   = safeParse(routerResult.primary.text);
    const secondaryParse = safeParse(routerResult.secondary.text);

    const primaryOk   = routerResult.primary.success   && primaryParse.ok;
    const secondaryOk = routerResult.secondary.success && secondaryParse.ok;

    // ── Secondary unavailable (Claude has no credits yet) ────────────────────
    if (!secondaryOk) {
      console.warn(
        '[VerdictSynthesizer] Agreement check skipped — secondary provider ' +
          'unavailable, returning primary result only'
      );

      if (!primaryOk) {
        console.error('[VerdictSynthesizer] Primary also failed in high-stakes mode — returning parse failure');
        return { ...PARSE_FAILURE, providerUsed: routerResult.primary.providerUsed };
      }

      return {
        ...primaryParse.value,
        providerUsed: routerResult.primary.providerUsed,
        disagreement: null, // null = comparison was NOT performed (not false = no disagreement)
      };
    }

    // ── Primary unavailable (e.g. Flash rate-limited, Lite is secondary) ────
    // Mirror of the !secondaryOk branch — degrade to secondary-only result.
    if (!primaryOk) {
      console.warn(
        '[VerdictSynthesizer] Agreement check skipped — primary provider ' +
          'unavailable, returning secondary result only'
      );
      return {
        ...secondaryParse.value,
        providerUsed: routerResult.secondary.providerUsed,
        disagreement: null, // null = comparison NOT performed, not a real agreement
      };
    }

    // ── Both providers responded: compare recommendations ───────────────────
    const primaryVerdict   = primaryParse.value;
    const secondaryVerdict = secondaryParse.value;

    const agreed = primaryVerdict.recommendation === secondaryVerdict.recommendation;

    if (!agreed) {
      console.warn(
        `[VerdictSynthesizer] Provider disagreement detected — ` +
          `primary=${primaryVerdict.recommendation} secondary=${secondaryVerdict.recommendation}. ` +
          `Flagging for human escalation.`
      );
      return {
        faultSide:       'NEUTRAL',
        recommendation:  'MANUAL_REVIEW_REQUIRED',
        confidenceScore: 0,
        reasoning:       `Providers disagreed: primary recommended ${primaryVerdict.recommendation}, secondary recommended ${secondaryVerdict.recommendation}. Human review required.`,
        disagreement:    true,
        primaryVerdict,
        secondaryVerdict,
        providerUsed:    `${routerResult.primary.providerUsed}+${routerResult.secondary.providerUsed}`,
      };
    }

    console.log(
      `[VerdictSynthesizer] Providers agreed on: ${primaryVerdict.recommendation}`
    );
    return {
      ...primaryVerdict,
      providerUsed: `${routerResult.primary.providerUsed}+${routerResult.secondary.providerUsed}`,
      disagreement: false,
    };
  }

  // ── Normal mode: first successful provider wins ──────────────────────────────
  const routerResult = await modelRouter.call(routerInput);

  const parsed = safeParse(routerResult.text);
  if (!parsed.ok) {
    console.error(
      `[VerdictSynthesizer] JSON parse failed for provider=${routerResult.providerUsed}: ${parsed.error}`
    );
    return { ...PARSE_FAILURE, providerUsed: routerResult.providerUsed };
  }

  console.log(
    `[VerdictSynthesizer] Verdict resolved — ` +
      `recommendation=${parsed.value.recommendation} ` +
      `confidence=${parsed.value.confidenceScore} ` +
      `provider=${routerResult.providerUsed}`
  );

  return { ...parsed.value, providerUsed: routerResult.providerUsed };
}

module.exports = { synthesizeVerdict };

/**
 * shadowCompare.js
 * Shadow-mode comparison layer — runs AFTER generateAIReport has written to the DB.
 *
 * Flow:
 *  1. Poll for the freshly-written AI_REPORT event from generateAIReport (up to 5 attempts).
 *  2. Re-fetch the same dispute input data generateAIReport uses (same Prisma query).
 *  3. Run VerdictSynthesizer with that input.
 *  4. Log a structured comparison line — never write to DB, never modify dispute state.
 *
 * This module NEVER throws — all errors are caught and logged, so callers can
 * fire-and-forget with .catch(err => console.error(...)) safely.
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { synthesizeVerdict } = require('./agents/VerdictSynthesizer');
const disputeConfig        = require('../../config/disputeConfig');

// How long "fresh" means — prevents accidentally reading a stale AI_REPORT
// from a previous run on the same dispute.
const FRESH_WINDOW_MS   = 30 * 1000; // 30 seconds
const MAX_POLL_ATTEMPTS = 5;
const POLL_DELAY_MS     = 1000;      // 1 second between attempts

/** Returns a promise that resolves after `ms` milliseconds. */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mirrors the isHighStakes logic in VerdictSynthesizer.js so the log field is
 * computed with the same formula rather than duplicated — but since we don't want
 * to re-import VerdictSynthesizer internals, we copy the two-liner here.
 * Both reference the same disputeConfig constants, so they stay in sync.
 */
function isHighStakes(currency, amount) {
  const curr = (currency || 'INR').toUpperCase();
  const thresholdMajor =
    curr === 'USD'
      ? disputeConfig.HIGH_VALUE_THRESHOLD_USD
      : disputeConfig.HIGH_VALUE_THRESHOLD_INR;
  return (amount || 0) >= thresholdMajor * 100;
}

/**
 * Builds the VerdictSynthesizer inputData shape from the Prisma dispute record.
 * Mirrors the field-mapping used in test-verdict-synthesizer.js exactly —
 * same field names, same null-for-missing-evidence pattern.
 *
 * @param {object} dispute  — result of prisma.deedDispute.findUnique with events+deed include
 * @returns {object}        — inputData shape expected by synthesizeVerdict()
 */
function buildSynthesizerInput(dispute) {
  const events     = dispute.events || [];
  const aiReports  = events.filter((e) => e.type === 'AI_REPORT');
  const isReAnalysis = aiReports.length > 0;

  // Evidence events — one per side at most (same .find() logic as disputeAI.js)
  const buyerEv  = events.find((e) => e.type === 'EVIDENCE_SUBMITTED' && e.actorRole === 'buyer');
  const sellerEv = events.find((e) => e.type === 'EVIDENCE_SUBMITTED' && e.actorRole === 'seller');

  // Challenge events — for re-analysis context
  const buyerCh  = events.find((e) => e.type === 'CHALLENGE' && e.actorRole === 'buyer');
  const sellerCh = events.find((e) => e.type === 'CHALLENGE' && e.actorRole === 'seller');

  return {
    isReAnalysis,
    deed: {
      currency:    dispute.deed.currency,
      amount:      dispute.deed.amount,
      description: dispute.deed.description,
      title:       dispute.deed.title,
    },
    dispute: {
      raisedBy:    dispute.raisedBy,
      reason:      dispute.reason,
      description: dispute.description,
    },
    buyerEvidence:  buyerEv  ? buyerEv.payload  : null,
    sellerEvidence: sellerEv ? sellerEv.payload  : null,
    originalAiReport: isReAnalysis ? aiReports[0].payload : null,
    buyerChallenge:   buyerCh  ? buyerCh.payload  : null,
    sellerChallenge:  sellerCh ? sellerCh.payload  : null,
  };
}

/**
 * Runs a shadow comparison for one dispute.
 * Safe to call fire-and-forget — never throws.
 *
 * @param {string} deedDisputeId
 */
async function runShadowComparison(deedDisputeId) {
  try {
    // ── Step 1: Poll for a fresh AI_REPORT event written by generateAIReport ──
    const cutoff = new Date(Date.now() - FRESH_WINDOW_MS);
    let geminiRecord = null;

    for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
      const record = await prisma.disputeEvent.findFirst({
        where: {
          deedDisputeId,
          type: 'AI_REPORT',
          createdAt: { gte: cutoff },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (record) {
        geminiRecord = record;
        console.log(
          `[ShadowCompare] Fresh AI_REPORT found on attempt ${attempt} for dispute ${deedDisputeId}`
        );
        break;
      }

      if (attempt < MAX_POLL_ATTEMPTS) {
        console.log(
          `[ShadowCompare] Attempt ${attempt}/${MAX_POLL_ATTEMPTS} — no fresh record yet, waiting ${POLL_DELAY_MS}ms...`
        );
        await sleep(POLL_DELAY_MS);
      }
    }

    // ── Step 2: Bail if nothing found after all attempts ──────────────────────
    if (!geminiRecord) {
      console.warn(
        '[ShadowCompare] No fresh Gemini record found for dispute',
        deedDisputeId,
        '— skipping comparison'
      );
      return;
    }

    // ── Step 3: Re-fetch dispute data using the EXACT same Prisma query ───────
    // This is the same findUnique call generateAIReport uses (disputeAI.js lines 14-17).
    const dispute = await prisma.deedDispute.findUnique({
      where: { id: deedDisputeId },
      include: { events: { orderBy: { createdAt: 'asc' } }, deed: true },
    });

    if (!dispute || !dispute.deed) {
      console.warn(
        '[ShadowCompare] Dispute or deed not found for',
        deedDisputeId,
        '— skipping comparison'
      );
      return;
    }

    const inputData = buildSynthesizerInput(dispute);

    // ── Step 4: Run VerdictSynthesizer ────────────────────────────────────────
    const newResult = await synthesizeVerdict(inputData);

    // ── Step 5: Log structured comparison ─────────────────────────────────────
    const geminiPayload = geminiRecord.payload;
    const highStakes    = isHighStakes(dispute.deed.currency, dispute.deed.amount);

    console.log(
      '[ShadowCompare]',
      JSON.stringify({
        deedDisputeId,
        geminiRecommendation: geminiPayload.recommendation,
        geminiConfidence:     geminiPayload.confidenceScore,
        geminiFaultSide:      geminiPayload.faultSide,
        newRecommendation:    newResult.recommendation,
        newConfidence:        newResult.confidenceScore,
        newFaultSide:         newResult.faultSide,
        match:                geminiPayload.recommendation === newResult.recommendation,
        highStakes,
        disagreement:         newResult.disagreement ?? null,
      })
    );
  } catch (err) {
    console.error('[ShadowCompare] failed:', err.message);
  }
}

module.exports = { runShadowComparison };

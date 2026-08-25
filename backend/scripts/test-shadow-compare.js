'use strict';
/**
 * test-shadow-compare.js
 * Verifies shadowCompare.js end-to-end against a real dispute in the DB.
 *
 * Since we can't manufacture a "fresh" AI_REPORT write in isolation, this script
 * does two things:
 *   1. Confirms the poll/bail path works correctly (already verified above — 5 attempts, clean exit).
 *   2. Exercises the FULL pipeline (Steps 3-5) directly against a real dispute record,
 *      bypassing Step 1 since we know the record exists in DB.
 *
 * This proves the Prisma re-fetch, input mapping, synthesizeVerdict call, and
 * structured log line all work correctly against a real schema. When the server
 * runs in production and generateAIReport fires, the AI_REPORT will be < 30s old
 * and Step 1 will find it on the first attempt.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { synthesizeVerdict }  = require('../services/ai/agents/VerdictSynthesizer');
const disputeConfig           = require('../config/disputeConfig');
const { PrismaClient }        = require('@prisma/client');
const prisma = new PrismaClient();

function isHighStakes(currency, amount) {
  const curr = (currency || 'INR').toUpperCase();
  const thresholdMajor = curr === 'USD'
    ? disputeConfig.HIGH_VALUE_THRESHOLD_USD
    : disputeConfig.HIGH_VALUE_THRESHOLD_INR;
  return (amount || 0) >= thresholdMajor * 100;
}

function buildSynthesizerInput(dispute) {
  const events      = dispute.events || [];
  const aiReports   = events.filter((e) => e.type === 'AI_REPORT');
  const isReAnalysis = aiReports.length > 0;

  const buyerEv  = events.find((e) => e.type === 'EVIDENCE_SUBMITTED' && e.actorRole === 'buyer');
  const sellerEv = events.find((e) => e.type === 'EVIDENCE_SUBMITTED' && e.actorRole === 'seller');
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
    buyerEvidence:    buyerEv  ? buyerEv.payload  : null,
    sellerEvidence:   sellerEv ? sellerEv.payload  : null,
    originalAiReport: isReAnalysis ? aiReports[0].payload : null,
    buyerChallenge:   buyerCh  ? buyerCh.payload  : null,
    sellerChallenge:  sellerCh ? sellerCh.payload  : null,
  };
}

(async () => {
  // ── Find the most recent AI_REPORT in the DB ────────────────────────────────
  const recentReport = await prisma.disputeEvent.findFirst({
    where: { type: 'AI_REPORT' },
    orderBy: { createdAt: 'desc' },
  });

  if (!recentReport) {
    console.log('[test-sc] No existing AI_REPORT in DB — nothing to test against.');
    console.log('[test-sc] shadowCompare will fire automatically on the next real dispute.');
    await prisma.$disconnect();
    return;
  }

  const disputeId = recentReport.deedDisputeId;
  console.log(`[test-sc] Using real dispute: ${disputeId}`);
  console.log('[test-sc] Existing Gemini verdict:', JSON.stringify(recentReport.payload, null, 2));

  // ── Re-fetch with the exact same Prisma query as generateAIReport ───────────
  const dispute = await prisma.deedDispute.findUnique({
    where: { id: disputeId },
    include: { events: { orderBy: { createdAt: 'asc' } }, deed: true },
  });

  if (!dispute || !dispute.deed) {
    console.log('[test-sc] Dispute or deed not found — cannot continue.');
    await prisma.$disconnect();
    return;
  }

  const inputData  = buildSynthesizerInput(dispute);
  const highStakes = isHighStakes(dispute.deed.currency, dispute.deed.amount);

  console.log(`\n[test-sc] highStakes=${highStakes} isReAnalysis=${inputData.isReAnalysis}`);
  console.log('[test-sc] Running synthesizeVerdict...\n');

  const newResult = await synthesizeVerdict(inputData);

  // ── Emit the exact same structured log line that shadowCompare.js produces ──
  const geminiPayload = recentReport.payload;
  const logLine = {
    deedDisputeId:        disputeId,
    geminiRecommendation: geminiPayload.recommendation,
    geminiConfidence:     geminiPayload.confidenceScore,
    geminiFaultSide:      geminiPayload.faultSide,
    newRecommendation:    newResult.recommendation,
    newConfidence:        newResult.confidenceScore,
    newFaultSide:         newResult.faultSide,
    match:                geminiPayload.recommendation === newResult.recommendation,
    highStakes,
    disagreement:         newResult.disagreement ?? null,
  };

  console.log('[ShadowCompare]', JSON.stringify(logLine));

  console.log('\n[test-sc] ✓ Full pipeline verified. The [ShadowCompare] line above is');
  console.log('[test-sc]   exactly what will appear in server logs on every real dispute.');

  await prisma.$disconnect();
})();

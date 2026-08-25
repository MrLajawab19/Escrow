/**
 * direct-shadow-compare.js
 * Bypasses the 30-second freshness window in shadowCompare.js to run
 * VerdictSynthesizer comparisons against existing AI_REPORT events,
 * regardless of when they were written.
 *
 * Also handles ESCALATED disputes that never got an AI_REPORT:
 *   - Resets status to CHALLENGE_PHASE
 *   - Triggers generateAIReport directly
 *   - Then runs direct comparison
 *
 * This script is ONLY safe on synthetic test data — it resets dispute status,
 * which must never be done on real disputes.
 *
 * Usage:
 *   node backend/scripts/direct-shadow-compare.js
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { PrismaClient }        = require('@prisma/client');
const { synthesizeVerdict }   = require('../services/ai/agents/VerdictSynthesizer');
const { generateAIReport }    = require('../services/disputeAI');
const disputeConfig           = require('../config/disputeConfig');

const prisma = new PrismaClient();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isHighStakes(currency, amount) {
  const curr = (currency || 'INR').toUpperCase();
  const thresholdMajor = curr === 'USD'
    ? disputeConfig.HIGH_VALUE_THRESHOLD_USD
    : disputeConfig.HIGH_VALUE_THRESHOLD_INR;
  return (amount || 0) >= thresholdMajor * 100;
}

/** Builds VerdictSynthesizer inputData from a fully-loaded dispute record. */
function buildInput(dispute) {
  const events     = dispute.events || [];
  const aiReports  = events.filter(e => e.type === 'AI_REPORT');
  const isReAnalysis = aiReports.length > 0;

  const buyerEv  = events.find(e => e.type === 'EVIDENCE_SUBMITTED' && e.actorRole === 'buyer');
  const sellerEv = events.find(e => e.type === 'EVIDENCE_SUBMITTED' && e.actorRole === 'seller');
  const buyerCh  = events.find(e => e.type === 'CHALLENGE' && e.actorRole === 'buyer');
  const sellerCh = events.find(e => e.type === 'CHALLENGE' && e.actorRole === 'seller');

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

/** Runs VerdictSynthesizer and logs the structured comparison line. */
async function runDirectComparison(dispute) {
  const highStakes = isHighStakes(dispute.deed.currency, dispute.deed.amount);

  // Find the most recent AI_REPORT event (no freshness check)
  const aiReportEvents = dispute.events
    .filter(e => e.type === 'AI_REPORT')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (aiReportEvents.length === 0) {
    console.error(`[DirectCompare] No AI_REPORT found for ${dispute.id} — cannot compare`);
    return null;
  }

  const geminiPayload = aiReportEvents[0].payload;
  const inputData     = buildInput(dispute);

  let newResult;
  try {
    newResult = await synthesizeVerdict(inputData);
  } catch (err) {
    console.error(`[DirectCompare] synthesizeVerdict threw for ${dispute.id}: ${err.message}`);
    return null;
  }

  const comparisonLine = {
    deedDisputeId:        dispute.id,
    geminiRecommendation: geminiPayload.recommendation,
    geminiConfidence:     geminiPayload.confidenceScore,
    geminiFaultSide:      geminiPayload.faultSide,
    newRecommendation:    newResult.recommendation,
    newConfidence:        newResult.confidenceScore,
    newFaultSide:         newResult.faultSide,
    match:                geminiPayload.recommendation === newResult.recommendation,
    highStakes,
    disagreement:         newResult.disagreement ?? null,
    newSystemProvider:    newResult.providerUsed   ?? null,
    parseError:           newResult.parseError     ?? false,
  };

  console.log('[ShadowCompare]', JSON.stringify(comparisonLine));
  return comparisonLine;
}

(async () => {
  console.log('\n[DirectCompare] Loading all synthetic disputes...');

  const disputes = await prisma.deedDispute.findMany({
    where: { description: { contains: '[SYNTHETIC_TEST]' } },
    include: {
      events: { orderBy: { createdAt: 'asc' } },
      deed: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const withReport    = disputes.filter(d => d.events.some(e => e.type === 'AI_REPORT'));
  const withoutReport = disputes.filter(d => !d.events.some(e => e.type === 'AI_REPORT'));

  console.log(`[DirectCompare] ${withReport.length} disputes have AI_REPORT — running direct comparison`);
  console.log(`[DirectCompare] ${withoutReport.length} disputes have NO AI_REPORT — will reset status + trigger`);

  const results = [];

  // ── Group 1: Direct comparison (AI_REPORT exists, bypass freshness window) ──
  for (const d of withReport) {
    const descShort = d.description.replace('[SYNTHETIC_TEST] ', '').slice(0, 55);
    console.log(`\n[DirectCompare] → ${d.id} | ${descShort}`);
    await sleep(2000);
    const r = await runDirectComparison(d);
    if (r) results.push(r);
  }

  // ── Group 2: Reset ESCALATED → CHALLENGE_PHASE, trigger legacy, then compare ──
  for (const d of withoutReport) {
    const descShort = d.description.replace('[SYNTHETIC_TEST] ', '').slice(0, 55);
    console.log(`\n[DirectCompare] ESCALATED reset: ${d.id} | ${descShort}`);

    // Reset status so generateAIReport won't skip it
    await prisma.deedDispute.update({
      where: { id: d.id },
      data:  { status: 'CHALLENGE_PHASE' },
    });
    console.log(`[DirectCompare] Status reset to CHALLENGE_PHASE`);

    // Trigger legacy AI report
    try {
      await generateAIReport(d.id);
    } catch (err) {
      const is429 = err.status === 429 || (err.message || '').includes('429');
      if (is429) {
        const match = (err.message || '').match(/retry in (\d+)/);
        const waitMs = match ? (parseInt(match[1], 10) + 5) * 1000 : 65000;
        console.warn(`[DirectCompare] 429 — waiting ${waitMs / 1000}s then retrying...`);
        await sleep(waitMs);
        await generateAIReport(d.id);
      } else {
        console.error(`[DirectCompare] generateAIReport threw: ${err.message}`);
      }
    }

    // Re-fetch with the new AI_REPORT event included
    await sleep(2000);
    const refreshed = await prisma.deedDispute.findUnique({
      where: { id: d.id },
      include: { events: { orderBy: { createdAt: 'asc' } }, deed: true },
    });

    if (!refreshed) { console.error(`[DirectCompare] Could not re-fetch dispute ${d.id}`); continue; }

    const hasReport = refreshed.events.some(e => e.type === 'AI_REPORT');
    if (!hasReport) {
      console.error(`[DirectCompare] Still no AI_REPORT after trigger for ${d.id} — skipping`);
      continue;
    }

    await sleep(2000);
    const r = await runDirectComparison(refreshed);
    if (r) results.push(r);

    await sleep(15000); // rate-limit gap between legacy Flash calls
  }

  // ── Final summary ──────────────────────────────────────────────────────────
  console.log('\n\n' + '═'.repeat(70));
  console.log('[DirectCompare] FULL SUMMARY TABLE');
  console.log('═'.repeat(70));

  const total      = results.length;
  const matched    = results.filter(r => r.match).length;
  const lowStakes  = results.filter(r => !r.highStakes);
  const highStakes = results.filter(r => r.highStakes);
  const parseErrors = results.filter(r => r.parseError);
  const pipelineFailed = disputes.length - results.length;

  console.log(`Total comparisons: ${total} / ${disputes.length} disputes`);
  console.log(`Overall match:     ${matched}/${total} (${total ? Math.round(matched/total*100) : 0}%)`);
  console.log(`Low-stakes match:  ${lowStakes.filter(r=>r.match).length}/${lowStakes.length}`);
  console.log(`High-stakes match: ${highStakes.filter(r=>r.match).length}/${highStakes.length}`);
  console.log(`parseError:        ${parseErrors.length}`);
  console.log(`Pipeline failed:   ${pipelineFailed}`);
  console.log('');

  for (const r of results) {
    const status = r.match ? '✅' : '❌';
    const hs     = r.highStakes ? 'HIGH ' : 'LOW  ';
    console.log(
      `${status} ${hs} gemini=${r.geminiRecommendation.padEnd(22)} ` +
      `new=${r.newRecommendation.padEnd(22)} ` +
      `provider=${String(r.newSystemProvider).padEnd(25)} ` +
      `disagree=${r.disagreement}`
    );
  }
  console.log('═'.repeat(70));

  await prisma.$disconnect();
})().catch(async err => {
  console.error('[DirectCompare] Fatal:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});

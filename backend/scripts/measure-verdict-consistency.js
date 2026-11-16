'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const { runFullArbitrationPipeline } = require('../services/ai/runFullArbitrationPipeline');
const { synthesizeVerdictFromContext } = require('../services/ai/agents/VerdictSynthesizer');
const { buildDisputeContext } = require('../services/ai/agents/DisputeContextBuilder');

const prisma = new PrismaClient();

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runVerdictConsistencyTest(runs = 10) {
  console.log(`=== VERDICT CONSISTENCY BENCHMARK (${runs} ITERATIONS) ===\n`);

  // Try to load a real dispute from the database with its deed and events
  let dispute = await prisma.deedDispute.findFirst({
    where: { deed: { isNot: null } },
    include: { deed: true, events: true },
    orderBy: { createdAt: 'desc' }
  });

  let fixedContext;
  let testTitle;

  if (dispute) {
    testTitle = `Dispute ID: ${dispute.id} (Deed: ${dispute.deed.title || dispute.deed.id})`;
    const [buyer, seller] = await Promise.all([
      prisma.buyer.findUnique({ where: { id: dispute.buyerId } }),
      prisma.seller.findUnique({ where: { id: dispute.sellerId } })
    ]);

    // Build context once so the exact same input context is evaluated 10 times
    fixedContext = buildDisputeContext({
      evidenceResult: {
        facts: [
          `Dispute reason: ${dispute.reason}`,
          `Dispute description: ${dispute.description}`,
          `Evidence submissions count: ${dispute.events.length}`
        ],
        unresolvedGaps: [],
        flagsForReview: []
      },
      ruleResult: {
        deadlineViolation: { violated: false, details: 'Within schedule' },
        milestoneCompliance: null,
        revisionLimitCheck: { exceeded: false, limit: 3, count: 1 },
        automatedFlags: []
      },
      riskResult: {
        overallRiskScore: 30,
        riskLevel: 'low',
        contributingFactors: [{ factor: 'Standard contract', points: 30 }]
      },
      dispute,
      deed: dispute.deed
    });
  } else {
    testTitle = 'Synthetic Canonical Dispute: Logo deliverable format violation';
    fixedContext = {
      disputeId: 'fixed-bench-dispute-001',
      currency: 'INR',
      amount: 500000,
      disputeReason: 'QUALITY_ISSUE',
      disputeDescription: 'Seller delivered raster JPEG instead of agreed vector SVG files.',
      contractTerms: { deadline: '2026-07-01', revisionLimit: 3, revisionCount: 1 },
      ruleFlags: ['SUBMISSION_ON_TIME'],
      facts: [
        'Contract explicitly required vector SVG and AI files.',
        'Seller submitted single low-resolution 800x600 raster JPEG.',
        'Buyer requested revision for vector source file; seller refused.'
      ],
      riskScore: 25,
      overallDataQuality: 'high'
    };
  }

  console.log(`Target: ${testTitle}`);
  console.log(`Evaluating ${runs} iterations on identical input context...\n`);

  console.log(
    'Run'.padEnd(6) +
    'Recommendation'.padEnd(28) +
    'Fault Side'.padEnd(16) +
    'Confidence'.padStart(12) +
    'Provider'.padStart(25) +
    'Latency (ms)'.padStart(14)
  );
  console.log('-'.repeat(101));

  const results = [];
  const recCounts = {};
  const faultCounts = {};
  const confidenceScores = [];

  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    let verdict;
    try {
      verdict = await synthesizeVerdictFromContext(fixedContext, { highStakes: false });
    } catch (err) {
      console.error(`Run #${i + 1} failed: ${err.message}`);
      verdict = {
        recommendation: 'ERROR',
        faultSide: 'ERROR',
        confidenceScore: 0,
        providerUsed: 'FAILED'
      };
    }
    const duration = performance.now() - start;

    results.push(verdict);
    confidenceScores.push(verdict.confidenceScore);

    recCounts[verdict.recommendation] = (recCounts[verdict.recommendation] || 0) + 1;
    faultCounts[verdict.faultSide] = (faultCounts[verdict.faultSide] || 0) + 1;

    console.log(
      `#${i + 1}`.padEnd(6) +
      verdict.recommendation.padEnd(28) +
      verdict.faultSide.padEnd(16) +
      `${verdict.confidenceScore}%`.padStart(12) +
      (verdict.providerUsed || 'unknown').padStart(25) +
      duration.toFixed(2).padStart(14)
    );

    // Be polite to API quota
    if (i < runs - 1) {
      await sleep(1500);
    }
  }

  // Calculate modal recommendation and agreement rate
  let modeRec = null;
  let maxCount = 0;
  for (const [rec, count] of Object.entries(recCounts)) {
    if (count > maxCount) {
      maxCount = count;
      modeRec = rec;
    }
  }
  const agreementRate = (maxCount / runs) * 100;

  const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;

  console.log('\n=== CONSISTENCY TEST RESULTS ===');
  console.log(`Total Runs:                   ${runs}`);
  console.log(`Recommendation Distribution:  ${JSON.stringify(recCounts)}`);
  console.log(`Fault Side Distribution:      ${JSON.stringify(faultCounts)}`);
  console.log(`Modal Recommendation:         ${modeRec} (${maxCount} / ${runs})`);
  console.log(`Modal Agreement Rate:         ${agreementRate.toFixed(1)}%`);
  console.log(`Average Confidence Score:     ${avgConfidence.toFixed(1)}%`);

  await prisma.$disconnect();
}

runVerdictConsistencyTest(10).catch(err => {
  console.error('Verdict consistency test error:', err);
  process.exit(1);
});

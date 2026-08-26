/**
 * test-dispute-context-builder.js
 * First true composition test: runs EvidenceExtractor (async, hits LLM),
 * RuleChecker (sync), and RiskScorer (sync) against a shared synthetic scenario,
 * then feeds them all into DisputeContextBuilder (sync).
 */
'use strict';

require('dotenv').config();
const path = require('path');
const { extractEvidence }      = require('../services/ai/agents/EvidenceExtractor');
const { checkRules }           = require('../services/ai/agents/RuleChecker');
const { scoreRisk }            = require('../services/ai/agents/RiskScorer');
const { buildDisputeContext, contextToPromptText } = require('../services/ai/agents/DisputeContextBuilder');

// ── Synthetic Scenario Data ───────────────────────────────────────────────────

const NOW = new Date();

const syntheticBuyer = {
  id: 'buyer-99',
  createdAt: new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days old
  kycComplete: true
};

const syntheticSeller = {
  id: 'seller-99',
  createdAt: new Date(NOW.getTime() - 120 * 24 * 60 * 60 * 1000), // 120 days old
  kycComplete: true,
  rating: 4.8,
  totalDeeds: 15,
  completedDeeds: 14
};

const syntheticDeed = {
  id: 'deed-99',
  buyerId: syntheticBuyer.id,
  sellerId: syntheticSeller.id,
  amount: 2500000, // ₹25,000 (high stakes)
  currency: 'INR',
  description: 'Website redesign (frontend + backend)',
  createdAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  updatedAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000),  // 2 days ago
  deadline: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000),   // missed deadline by 1 day at dispute time
  isMilestone: false
};

const syntheticDispute = {
  id: 'dispute-99',
  deedId: syntheticDeed.id,
  buyerId: syntheticBuyer.id,
  sellerId: syntheticSeller.id,
  raisedBy: 'buyer',
  reason: 'Seller delivered broken code and stopped responding',
  description: 'The code fails to compile. I tried reaching out on WhatsApp but got blocked. See screenshots.',
  createdAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000), // Raised 2 days ago
};

const syntheticPriorHistory = {
  buyerDisputeCount: 0, buyerDeedCount: 4,
  sellerDisputeCount: 0, sellerDeedCount: 15
};

const syntheticEvidenceEvents = [
  {
    type: 'EVIDENCE_SUBMITTED',
    actorRole: 'buyer',
    timestamp: syntheticDispute.createdAt,
    details: 'Buyer uploaded WhatsApp screenshots.',
    // We mock the file upload payload that extractEvidence expects:
    // It looks for a JSON string inside 'details' or we can just pass the raw files to extractEvidence directly.
  },
  {
    type: 'EVIDENCE_SUBMITTED',
    actorRole: 'seller',
    timestamp: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000),
    details: 'Seller response: It works on my machine. Buyer refused to configure the env file.'
  }
];

// Provide fake "files" array that evidence extractor will use to read a test image.
// We'll point it to the image we generated earlier in phase 6: test_chat_screenshot_1787684914303.jpg
// But we should copy it to the uploads folder first to simulate a real upload.
const testImagePath = path.join(__dirname, '..', '..', '..', 'uploads', 'test-chat-screenshot.jpg');

// The EvidenceExtractor takes (dispute, evidenceResponses, files)
// For our test, we'll format evidenceResponses as it appears in the real DB (map of userId to evidence text/urls)
const syntheticEvidenceResponses = {
  [syntheticBuyer.id]: {
    isLate: false,
    evidenceUrls: ['/uploads/test-chat-screenshot.jpg'],
    rebuttal: 'They blocked me.'
  },
  [syntheticSeller.id]: {
    isLate: true,
    evidenceUrls: [],
    rebuttal: 'It works on my machine.'
  }
};

const syntheticFiles = [
  { path: testImagePath, mimetype: 'image/jpeg' } // Only if it exists on disk, otherwise EvidenceExtractor skips vision
];

// ── Test Runner ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
  }
}

async function runTests() {
  console.log(`\n${'═'.repeat(68)}`);
  console.log('  END-TO-END COMPOSITION TEST: DISPUTE CONTEXT BUILDER');
  console.log('═'.repeat(68));

  // Ensure test image exists for vision (if it doesn't, EvidenceExtractor gracefully degrades to text)
  const fs = require('fs');
  if (!fs.existsSync(testImagePath)) {
    console.log(`  ⚠️ Test image not found at ${testImagePath}. Vision will be skipped.`);
    // Create an empty dummy file so it doesn't crash on read, or EvidenceExtractor will just log the error.
    if (!fs.existsSync(path.dirname(testImagePath))) fs.mkdirSync(path.dirname(testImagePath), { recursive: true });
    fs.writeFileSync(testImagePath, 'fake image data');
  }

  try {
    // ── STAGE 1: Evidence Extractor (Async/LLM) ─────────────────────────
    console.log('\n[Running EvidenceExtractor...]');
    const evidenceResult = await extractEvidence({
      buyerEvidence: syntheticEvidenceResponses[syntheticBuyer.id],
      sellerEvidence: syntheticEvidenceResponses[syntheticSeller.id],
      disputeReason: syntheticDispute.reason,
      disputeDescription: syntheticDispute.description,
    });
    console.log('  Done. Vision Used:', evidenceResult.visionUsed);

    // ── STAGE 2: Rule Checker (Sync) ────────────────────────────────────
    console.log('\n[Running RuleChecker...]');
    const ruleResult = checkRules({
      deed: syntheticDeed,
      dispute: syntheticDispute,
      evidenceEvents: syntheticEvidenceEvents,
      referenceDate: NOW
    });
    console.log('  Done. AutoFlags count:', ruleResult.automatedFlags.length);

    // ── STAGE 3: Risk Scorer (Sync) ─────────────────────────────────────
    console.log('\n[Running RiskScorer...]');
    const riskResult = scoreRisk({
      buyer: syntheticBuyer,
      seller: syntheticSeller,
      deed: syntheticDeed,
      dispute: syntheticDispute,
      ruleCheckerOutput: ruleResult,
      priorDisputeHistory: syntheticPriorHistory,
      _now: NOW
    });
    console.log('  Done. Risk Level:', riskResult.riskLevel);

    // ════════════════════════════════════════════════════════════════════════
    // CASE 1: Happy Path
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n[TEST CASE 1: Happy Path Context Build]');
    const ctxHappy = buildDisputeContext({
      evidenceResult,
      ruleResult,
      riskResult,
      dispute: syntheticDispute,
      deed: syntheticDeed
    });

    assert(ctxHappy.overallDataQuality === 'high' || ctxHappy.overallDataQuality === 'partial', 'overallDataQuality is computed');
    assert(ctxHappy.deedSummary.isHighStakes === true, 'High stakes inferred correctly');
    assert(ctxHappy.ruleViolations.deadlineViolation.violated === true, 'Rule checker output bridged correctly');
    assert(ctxHappy.evidenceFlags.length > 0, 'Evidence flags combined (from RuleChecker at minimum)');
    assert(ctxHappy.riskAssessment.level === riskResult.riskLevel, 'Risk level bridged correctly');

    console.log('\n>>> HAPPY PATH PROMPT TEXT PREVIEW >>>');
    console.log('─'.repeat(68));
    console.log(contextToPromptText(ctxHappy));
    console.log('─'.repeat(68) + '\n');

    // ════════════════════════════════════════════════════════════════════════
    // CASE 2: Degraded Case (Parse Error)
    // ════════════════════════════════════════════════════════════════════════
    console.log('[TEST CASE 2: Degraded Case (Evidence Error)]');
    const degradedEvidence = {
      facts: [], unresolvedGaps: [], flagsForReview: [], extractionError: true
    };
    const ctxDegraded = buildDisputeContext({
      evidenceResult: degradedEvidence,
      ruleResult,
      riskResult,
      dispute: syntheticDispute,
      deed: syntheticDeed
    });
    assert(ctxDegraded.overallDataQuality === 'low', 'Data quality drops to "low" on extraction error');

    // ════════════════════════════════════════════════════════════════════════
    // CASE 3: Missing Agent (RiskScorer skipped)
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n[TEST CASE 3: Missing Agent Output (RiskScorer null)]');
    const ctxMissing = buildDisputeContext({
      evidenceResult,
      ruleResult,
      riskResult: null, // simulates a crash or skip
      dispute: syntheticDispute,
      deed: syntheticDeed
    });
    assert(ctxMissing.riskAssessment.level === 'unknown', 'Missing risk agent gracefully outputs "unknown" level');
    assert(ctxMissing.overallDataQuality !== 'high', 'Data quality degraded due to missing agent');

  } catch (err) {
    console.error('FATAL ERROR DURING TEST RUN:', err);
    failed++;
  }

  console.log(`\n${'═'.repeat(68)}`);
  console.log('  TEST SUMMARY');
  console.log('═'.repeat(68));
  console.log(`  Passed: ${passed}   Failed: ${failed}`);
  console.log(`\n  Overall: ${failed === 0 ? '✅ ALL PASS' : `❌ ${failed} FAILURE(S)`}`);
  console.log('═'.repeat(68) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

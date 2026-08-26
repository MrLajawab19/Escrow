/**
 * test-verdict-from-context.js
 * Proves the fully-composed pipeline works end-to-end in isolation,
 * comparing the new context-based verdict against the old raw-fields verdict.
 */
'use strict';

require('dotenv').config();
const path = require('path');
const { extractEvidence }      = require('../services/ai/agents/EvidenceExtractor');
const { checkRules }           = require('../services/ai/agents/RuleChecker');
const { scoreRisk }            = require('../services/ai/agents/RiskScorer');
const { buildDisputeContext }  = require('../services/ai/agents/DisputeContextBuilder');
const { synthesizeVerdict, synthesizeVerdictFromContext } = require('../services/ai/agents/VerdictSynthesizer');

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

// We will use a low-stakes deed so we don't trigger agreement mode (saves Claude quota / skips failure).
const syntheticDeed = {
  id: 'deed-99',
  buyerId: syntheticBuyer.id,
  sellerId: syntheticSeller.id,
  amount: 500000, // ₹5,000 (low stakes)
  currency: 'INR',
  description: 'Logo and branding package design',
  createdAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000),
  deadline: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000), // Missed by 1 day
  isMilestone: false
};

const syntheticDispute = {
  id: 'dispute-99',
  deedId: syntheticDeed.id,
  buyerId: syntheticBuyer.id,
  sellerId: syntheticSeller.id,
  raisedBy: 'buyer',
  reason: 'Seller delivered wrong files and ignored me',
  description: 'The logo looks nothing like the sketch we agreed on. I tried to reach them but got no response. See chat screenshots.',
  createdAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000),
};

const syntheticPriorHistory = {
  buyerDisputeCount: 0, buyerDeedCount: 4,
  sellerDisputeCount: 2, sellerDeedCount: 15 // elevated risk for seller
};

const syntheticEvidenceEvents = [
  {
    type: 'EVIDENCE_SUBMITTED',
    actorRole: 'buyer',
    timestamp: syntheticDispute.createdAt,
    details: 'Buyer uploaded WhatsApp screenshots.',
  },
  {
    type: 'EVIDENCE_SUBMITTED',
    actorRole: 'seller',
    timestamp: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000),
    details: 'Seller response: I delivered exactly what was asked.'
  }
];

const testImagePath = path.join(__dirname, '..', '..', '..', 'uploads', 'test-chat-screenshot.jpg');

const syntheticEvidenceResponses = {
  [syntheticBuyer.id]: {
    isLate: false,
    evidenceUrls: ['/uploads/test-chat-screenshot.jpg'],
    rebuttal: 'They ignored me.'
  },
  [syntheticSeller.id]: {
    isLate: true,
    evidenceUrls: [],
    rebuttal: 'I delivered exactly what was asked.'
  }
};

// ── Test Cases ────────────────────────────────────────────────────────────────

// Case 1: Original test case (the one that generated "inconsistencies")
const case1 = {
  name: "Case 1: Late delivery, missing evidence, missed deadline",
  buyer: syntheticBuyer,
  seller: syntheticSeller,
  deed: syntheticDeed,
  dispute: syntheticDispute,
  priorHistory: syntheticPriorHistory,
  evidenceEvents: syntheticEvidenceEvents,
  evidenceResponses: syntheticEvidenceResponses
};

// Case 2: Genuinely clean, unambiguous scenario
// Seller delivered early, buyer confirmed delivery in chat but filed a dispute anyway for "change of mind".
// Seller provided clean screenshots of delivery and buyer's confirmation. Buyer provided no rebuttal.
const deed2 = { ...syntheticDeed, deadline: new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000) }; // deadline in future
const dispute2 = { ...syntheticDispute, reason: 'I changed my mind', description: 'I want a refund, I don\'t need the logo anymore.' };
const case2 = {
  name: "Case 2: Unambiguous buyer fault (change of mind, no violations)",
  buyer: syntheticBuyer,
  seller: { ...syntheticSeller, totalDeeds: 100, completedDeeds: 100 }, // flawless seller
  deed: deed2,
  dispute: dispute2,
  priorHistory: { buyerDisputeCount: 1, buyerDeedCount: 1, sellerDisputeCount: 0, sellerDeedCount: 100 },
  evidenceEvents: [
    { type: 'EVIDENCE_SUBMITTED', actorRole: 'seller', timestamp: NOW, details: 'Seller uploaded delivery confirmation.' }
  ],
  evidenceResponses: {
    [syntheticBuyer.id]: null, // no response
    [syntheticSeller.id]: { isLate: false, evidenceUrls: ['/uploads/test-chat-screenshot.jpg'], rebuttal: 'I delivered it early. They said it was perfect.' }
  }
};

// Case 3: Zero violations, low risk, no flags (but a genuine dispute over quality)
// Both parties have good history. No deadlines missed. No late evidence.
const deed3 = { ...syntheticDeed, amount: 200000, deadline: new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000) };
const dispute3 = { ...syntheticDispute, reason: 'Quality does not meet standard', description: 'The colors are wrong and the resolution is too low for print.' };
const case3 = {
  name: "Case 3: Genuine quality dispute (Zero violations, low risk)",
  buyer: { ...syntheticBuyer, createdAt: new Date(NOW.getTime() - 400 * 24 * 60 * 60 * 1000) },
  seller: { ...syntheticSeller, createdAt: new Date(NOW.getTime() - 400 * 24 * 60 * 60 * 1000), totalDeeds: 50, completedDeeds: 49 },
  deed: deed3,
  dispute: dispute3,
  priorHistory: { buyerDisputeCount: 0, buyerDeedCount: 10, sellerDisputeCount: 0, sellerDeedCount: 50 },
  evidenceEvents: [
    { type: 'EVIDENCE_SUBMITTED', actorRole: 'buyer', timestamp: NOW, details: 'Buyer uploaded low-res files.' },
    { type: 'EVIDENCE_SUBMITTED', actorRole: 'seller', timestamp: NOW, details: 'Seller uploaded source files.' }
  ],
  evidenceResponses: {
    [syntheticBuyer.id]: { isLate: false, evidenceUrls: [], rebuttal: 'Files are unusable for print.' },
    [syntheticSeller.id]: { isLate: false, evidenceUrls: [], rebuttal: 'I sent vector files as requested.' }
  }
};

const TEST_CASES = [case1, case2, case3];

// ── Test Runner ───────────────────────────────────────────────────────────────
const { contextToPromptText } = require('../services/ai/agents/DisputeContextBuilder');

async function runComparison() {
  console.log(`\n${'═'.repeat(68)}`);
  console.log('  END-TO-END COMPARISON: OLD vs NEW ARBITRATION PIPELINE');
  console.log('═'.repeat(68));

  try {
    for (const tc of TEST_CASES) {
      console.log(`\n\n=== RUNNING: ${tc.name} ===\n`);

      // 1. Build Context
      const evidenceResult = await extractEvidence({
        buyerEvidence: tc.evidenceResponses[tc.buyer.id],
        sellerEvidence: tc.evidenceResponses[tc.seller.id],
        disputeReason: tc.dispute.reason,
        disputeDescription: tc.dispute.description,
      });

      const ruleResult = checkRules({
        deed: tc.deed,
        dispute: tc.dispute,
        evidenceEvents: tc.evidenceEvents,
        referenceDate: NOW
      });

      const riskResult = scoreRisk({
        buyer: tc.buyer,
        seller: tc.seller,
        deed: tc.deed,
        dispute: tc.dispute,
        ruleCheckerOutput: ruleResult,
        priorDisputeHistory: tc.priorHistory,
        _now: NOW
      });

      const disputeContext = buildDisputeContext({
        evidenceResult,
        ruleResult,
        riskResult,
        dispute: tc.dispute,
        deed: tc.deed
      });

      console.log(`[GENERATED CONTEXT FOR THIS CASE]\n`);
      console.log(contextToPromptText(disputeContext));
      console.log(`\n-------------------------------------------------\n`);

      // 2. Synthesize using NEW pipeline
      const newVerdict = await synthesizeVerdictFromContext(disputeContext, { highStakes: false });

      // 3. Synthesize using OLD pipeline
      const oldInputData = {
        isReAnalysis: false,
        deed: tc.deed,
        dispute: tc.dispute,
        buyerEvidence: tc.evidenceResponses[tc.buyer.id],
        sellerEvidence: tc.evidenceResponses[tc.seller.id],
      };
      const oldVerdict = await synthesizeVerdict(oldInputData);

      // 4. Print Comparison
      console.log(`\n[OLD VERDICT] (Raw DB Fields)`);
      console.log('Recommendation:  ', oldVerdict.recommendation);
      console.log('Fault Side:      ', oldVerdict.faultSide);
      console.log('Confidence Score:', oldVerdict.confidenceScore);
      console.log('Reasoning:       ', oldVerdict.reasoning);

      console.log(`\n[NEW VERDICT] (Multi-Agent Composed Context)`);
      console.log('Recommendation:  ', newVerdict.recommendation);
      console.log('Fault Side:      ', newVerdict.faultSide);
      console.log('Confidence Score:', newVerdict.confidenceScore);
      console.log('Reasoning:       ', newVerdict.reasoning);
    }

  } catch (err) {
    console.error('FATAL ERROR DURING TEST RUN:', err);
    process.exit(1);
  }
}

runComparison();

/**
 * seed-synthetic-disputes.js
 * Generates synthetic dispute data for Phase 4 shadow-mode validation.
 *
 * Creates test Buyer/Seller accounts, Deeds, DeedDisputes, and DisputeEvents
 * that cover all required test categories, then fires generateAIReport +
 * runShadowComparison for each — exactly as the real controller would.
 *
 * All synthetic records are tagged with "[SYNTHETIC_TEST]" in description fields
 * for easy identification and cleanup via cleanup-synthetic-disputes.js.
 *
 * Usage:
 *   node backend/scripts/seed-synthetic-disputes.js
 *
 * DO NOT run in production against a live database with real users.
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const bcrypt       = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma       = new PrismaClient();

const { generateAIReport }   = require('../services/disputeAI');
const { runShadowComparison } = require('../services/ai/shadowCompare');
const disputeConfig           = require('../config/disputeConfig');

// ── Constants ──────────────────────────────────────────────────────────────────

const TAG              = '[SYNTHETIC_TEST]';
const SYNTHETIC_PW     = 'SyntheticTest!2024';  // Never used to log in — hashed at rest
const DELAY_BETWEEN_MS = 15000;                  // 15s — respects Gemini free-tier 5 req/min limit

// Threshold: HIGH_VALUE_THRESHOLD_INR * 100 = 1,000,000 paise = ₹10,000
const HIGH_STAKES_AMOUNT  = disputeConfig.HIGH_VALUE_THRESHOLD_INR * 100 + 100000; // ₹11,000
const LOW_STAKES_AMOUNT   = Math.floor(disputeConfig.HIGH_VALUE_THRESHOLD_INR * 100 * 0.05); // ₹500

// ── Helpers ────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Creates a Buyer + wallet using the same logic as authController.buyerSignup.
 * Skips creation if email already exists (idempotent).
 */
async function getOrCreateBuyer(email, firstName) {
  const existing = await prisma.buyer.findUnique({ where: { email } });
  if (existing) return existing;

  const hashed = await bcrypt.hash(SYNTHETIC_PW, 10);
  const buyer  = await prisma.buyer.create({
    data: { email, password: hashed, firstName, lastName: 'SyntheticUser' },
  });
  await prisma.wallet.create({
    data: { userId: buyer.id, userRole: 'buyer', currency: 'INR' },
  });
  console.log(`[Seed] Created synthetic buyer: ${email} (${buyer.id})`);
  return buyer;
}

/**
 * Creates a Seller + wallet using the same logic as authController.sellerSignup.
 * Skips creation if email already exists (idempotent).
 */
async function getOrCreateSeller(email, firstName) {
  const existing = await prisma.seller.findUnique({ where: { email } });
  if (existing) return existing;

  const hashed = await bcrypt.hash(SYNTHETIC_PW, 10);
  const seller = await prisma.seller.create({
    data: {
      email,
      password:     hashed,
      firstName,
      lastName:     'SyntheticUser',
      businessName: `${TAG} ${firstName}'s Test Business`,
    },
  });
  await prisma.wallet.create({
    data: { userId: seller.id, userRole: 'seller', currency: 'INR' },
  });
  console.log(`[Seed] Created synthetic seller: ${email} (${seller.id})`);
  return seller;
}

/**
 * Creates a Deed in DISPUTED state.
 * @param {string} buyerId
 * @param {string} sellerId
 * @param {number} amount   — in paise/subunits
 * @param {string} label    — human-readable label for the deed
 */
async function createDeed(buyerId, sellerId, amount, label) {
  return prisma.deed.create({
    data: {
      title:              `${TAG} ${label}`,
      description:        `${TAG} Synthetic test deed for shadow-mode validation. Category: ${label}`,
      acceptanceCriteria: `${TAG} Deliver as described in the synthetic scenario.`,
      buyerId,
      sellerId,
      amount,
      currency:           'INR',
      status:             'DISPUTED',
      transactionType:    'SERVICE',
    },
  });
}

/**
 * Creates a DeedDispute record.
 * Note: DeedDispute.sellerId is non-optional (unlike Deed.sellerId).
 */
async function createDispute(deedId, buyerId, sellerId, raisedBy, reason, description) {
  return prisma.deedDispute.create({
    data: {
      deedId,
      buyerId,
      sellerId,
      raisedBy,
      reason,
      description: `${TAG} ${description}`,
      status:      'OPEN',
      priority:    'MEDIUM',
    },
  });
}

/** Creates a single DisputeEvent. */
async function createEvent(deedDisputeId, type, actorRole, payload) {
  return prisma.disputeEvent.create({
    data: { deedDisputeId, type, actorRole, payload },
  });
}

/**
 * Fires generateAIReport then, after a 2s grace period, runShadowComparison.
 * Mirrors the setImmediate pattern from disputeController.js.
 */
async function triggerAndCompare(disputeId, category) {
  console.log(`[Seed] → Triggering generateAIReport for ${disputeId} (${category})...`);

  // Retry once on Gemini 429 rate-limit — wait the SDK's suggested retryDelay + buffer
  try {
    await generateAIReport(disputeId);
  } catch (err) {
    const is429 = err.status === 429 || (err.message && err.message.includes('429'));
    if (is429) {
      // Parse the retryDelay from the error message (e.g. "retry in 37s"), default 60s
      const match = (err.message || '').match(/retry in (\d+)/);
      const waitMs = match ? (parseInt(match[1], 10) + 5) * 1000 : 65000;
      console.warn(`[Seed] Gemini 429 rate-limit hit — waiting ${waitMs / 1000}s before retry...`);
      await sleep(waitMs);
      await generateAIReport(disputeId);
    } else {
      throw err;
    }
  }

  // 2-second grace: let the DB write settle before shadow poll starts
  await sleep(2000);

  console.log(`[Seed] → Running runShadowComparison for ${disputeId} (${category})...`);
  await runShadowComparison(disputeId);
}

// ── Scenario definitions ───────────────────────────────────────────────────────
// Each scenario returns the dispute ID after full setup + trigger.

/**
 * CATEGORY A: LOW-STAKES, CLEAR-CUT SELLER FAULT
 * Seller submitted no evidence. Buyer has clear delivery-failure evidence.
 */
async function seedScenarioA(buyer, seller, index) {
  const category = 'A_LOW_STAKES_SELLER_FAULT';
  const deed     = await createDeed(buyer.id, seller.id, LOW_STAKES_AMOUNT,
    `Logo Design #${index} — Non-Delivery`);
  const dispute  = await createDispute(deed.id, buyer.id, seller.id, 'buyer',
    'FAKE_DELIVERY',
    `Seller claimed delivery but provided no files. Buyer has screenshots showing empty delivery folder. Scenario ${index}.`
  );

  // Buyer evidence — clear, on time
  await createEvent(dispute.id, 'EVIDENCE_SUBMITTED', 'buyer', {
    rebuttal:     `I paid ₹${LOW_STAKES_AMOUNT / 100} for a logo. The seller marked delivery but the shared folder is empty. I have screenshots of the empty folder and the delivery notification.`,
    evidenceUrls: ['/uploads/synthetic/empty-folder-screenshot.png', '/uploads/synthetic/delivery-notification.png'],
    isLate:       false,
  });

  // Seller: NO evidence (silence weighs negatively per prompt)

  await prisma.deedDispute.update({
    where: { id: dispute.id },
    data: { status: 'CHALLENGE_PHASE' },
  });

  console.log(`[Seed] Created dispute ${dispute.id} — category: ${category} #${index}`);
  await triggerAndCompare(dispute.id, category);
  return dispute.id;
}

/**
 * CATEGORY B: LOW-STAKES, CLEAR-CUT BUYER FAULT
 * Seller has strong delivery evidence. Buyer's complaint is vague.
 */
async function seedScenarioB(buyer, seller, index) {
  const category = 'B_LOW_STAKES_BUYER_FAULT';
  const deed     = await createDeed(buyer.id, seller.id, LOW_STAKES_AMOUNT,
    `Content Writing #${index} — Baseless Dispute`);
  const dispute  = await createDispute(deed.id, buyer.id, seller.id, 'buyer',
    'QUALITY_ISSUE',
    `Buyer claims quality issues but has no specific objections. Seller delivered 2 days early with confirmation. Scenario ${index}.`
  );

  // Buyer evidence — vague, late
  await createEvent(dispute.id, 'EVIDENCE_SUBMITTED', 'buyer', {
    rebuttal:     `I just don't feel the work is good enough. It doesn't match my vision.`,
    evidenceUrls: [],
    isLate:       true,
  });

  // Seller evidence — strong, on time
  await createEvent(dispute.id, 'EVIDENCE_SUBMITTED', 'seller', {
    rebuttal:     `I delivered 5 articles totalling 4,500 words meeting all specified requirements — keyword density, tone, structure. Delivery was 2 days before deadline. Attached are the Google Drive link timestamps and the original brief with my compliance checklist.`,
    evidenceUrls: ['/uploads/synthetic/gdrive-timestamp.png', '/uploads/synthetic/compliance-checklist.pdf'],
    isLate:       false,
  });

  await prisma.deedDispute.update({
    where: { id: dispute.id },
    data: { status: 'CHALLENGE_PHASE' },
  });

  console.log(`[Seed] Created dispute ${dispute.id} — category: ${category} #${index}`);
  await triggerAndCompare(dispute.id, category);
  return dispute.id;
}

/**
 * CATEGORY C: LOW-STAKES, AMBIGUOUS (with challenge / re-analysis)
 * Both parties submitted evidence. Deadline was borderline.
 * Includes an AI_REPORT stub (original verdict) + CHALLENGE event → isReAnalysis: true.
 */
async function seedScenarioC(buyer, seller, index) {
  const category = 'C_LOW_STAKES_AMBIGUOUS_REANALYSIS';
  const deed     = await createDeed(buyer.id, seller.id, LOW_STAKES_AMOUNT,
    `App UI Design #${index} — Borderline Deadline`);
  const dispute  = await createDispute(deed.id, buyer.id, seller.id, 'buyer',
    'DEADLINE_MISSED',
    `Seller delivered 3 hours after deadline. Buyer argues this voided the contract. Seller argues client-side revision requests caused the delay. Scenario ${index}.`
  );

  // Buyer evidence
  await createEvent(dispute.id, 'EVIDENCE_SUBMITTED', 'buyer', {
    rebuttal:     `The deadline was 5pm IST. The Figma link was shared at 8:07pm. The contract explicitly states late delivery forfeits payment. I have the deed PDF and Figma activity log.`,
    evidenceUrls: ['/uploads/synthetic/deed-contract.pdf', '/uploads/synthetic/figma-activity.png'],
    isLate:       false,
  });

  // Seller evidence
  await createEvent(dispute.id, 'EVIDENCE_SUBMITTED', 'seller', {
    rebuttal:     `The buyer requested a full color palette change at 2pm (3 hours before deadline) over chat. This revision request caused the delay. The chat log is attached. The work itself is complete and meets all spec requirements.`,
    evidenceUrls: ['/uploads/synthetic/chat-revision-request.png', '/uploads/synthetic/figma-final.png'],
    isLate:       false,
  });

  // Inject a prior AI_REPORT (simulates a first-pass that already ran)
  const originalVerdict = {
    faultSide:       'SELLER',
    recommendation:  'REFUND_BUYER',
    confidenceScore: 65,
    reasoning:       'Seller missed the deadline. While a revision was requested, it was within normal adjustment scope and should not have caused a 3-hour overrun.',
  };
  await createEvent(dispute.id, 'AI_REPORT', 'ai', originalVerdict);

  // Seller challenges the verdict
  await createEvent(dispute.id, 'CHALLENGE', 'seller', {
    rebuttal: `A full color palette change is NOT a minor adjustment — it required redesigning all 12 screens. The buyer approved the original palette in writing two weeks ago and reversed their decision at the last minute. This is entirely the buyer's fault.`,
  });

  await prisma.deedDispute.update({
    where: { id: dispute.id },
    data:  { status: 'CHALLENGE_PHASE', aiAnalysis: originalVerdict },
  });

  console.log(`[Seed] Created dispute ${dispute.id} — category: ${category} #${index}`);
  await triggerAndCompare(dispute.id, category);
  return dispute.id;
}

/**
 * CATEGORY D: HIGH-STAKES, CLEAR-CUT
 * Same as A (seller fault, no evidence) but with high-stakes amount.
 */
async function seedScenarioD(buyer, seller, index) {
  const category = 'D_HIGH_STAKES_CLEAR_CUT';
  const deed     = await createDeed(buyer.id, seller.id, HIGH_STAKES_AMOUNT,
    `Custom CRM Development #${index} — Non-Delivery`);
  const dispute  = await createDispute(deed.id, buyer.id, seller.id, 'buyer',
    'INCOMPLETE_WORK',
    `₹${HIGH_STAKES_AMOUNT / 100} CRM development contract. Seller delivered nothing after 3 months. Buyer has payment receipts. Seller has gone silent. Scenario ${index}.`
  );

  // Buyer — strong evidence
  await createEvent(dispute.id, 'EVIDENCE_SUBMITTED', 'buyer', {
    rebuttal:     `I transferred ₹${HIGH_STAKES_AMOUNT / 100} via the escrow platform on contract start date. The seller has not delivered a single module in 90 days. Attached are the payment confirmation, the original project brief, and screenshots of the seller's last seen timestamp on chat 85 days ago.`,
    evidenceUrls: ['/uploads/synthetic/payment-receipt.pdf', '/uploads/synthetic/chat-screenshot.png'],
    isLate:       false,
  });

  // Seller: NO evidence

  await prisma.deedDispute.update({
    where: { id: dispute.id },
    data: { status: 'CHALLENGE_PHASE' },
  });

  console.log(`[Seed] Created dispute ${dispute.id} — category: ${category} #${index}`);
  await triggerAndCompare(dispute.id, category);
  return dispute.id;
}

/**
 * CATEGORY E: HIGH-STAKES, AMBIGUOUS (with challenge / re-analysis)
 * Tests requireAgreement: true branch under genuinely ambiguous conditions.
 */
async function seedScenarioE(buyer, seller, index) {
  const category = 'E_HIGH_STAKES_AMBIGUOUS_REANALYSIS';
  const deed     = await createDeed(buyer.id, seller.id, HIGH_STAKES_AMOUNT,
    `Enterprise Software Audit #${index} — Scope Dispute`);
  const dispute  = await createDispute(deed.id, buyer.id, seller.id, 'seller',
    'QUALITY_ISSUE',
    `High-value software audit contract. Seller claims full delivery. Buyer says 2 of 5 modules were never audited. Both sides have documentation. Scenario ${index}.`
  );

  // Buyer evidence
  await createEvent(dispute.id, 'EVIDENCE_SUBMITTED', 'buyer', {
    rebuttal:     `The original scope (attached) explicitly lists 5 modules: Auth, Payments, Reporting, Notifications, and Admin. The delivered audit report (also attached) only covers Auth, Payments, and Reporting. Modules 4 and 5 are completely absent. We are withholding ₹${HIGH_STAKES_AMOUNT / 100} until all 5 modules are audited.`,
    evidenceUrls: ['/uploads/synthetic/original-scope.pdf', '/uploads/synthetic/delivered-report.pdf'],
    isLate:       false,
  });

  // Seller evidence
  await createEvent(dispute.id, 'EVIDENCE_SUBMITTED', 'seller', {
    rebuttal:     `The scope was amended verbally after kickoff — the client explicitly deprioritized Notifications and Admin modules in week 2. I have a summary email from the client's own project manager (attached) acknowledging this scope reduction. The price was not adjusted because we performed additional depth on the 3 remaining modules.`,
    evidenceUrls: ['/uploads/synthetic/pm-email.pdf', '/uploads/synthetic/detailed-audit.pdf'],
    isLate:       false,
  });

  // First AI verdict — low confidence (genuinely ambiguous)
  const originalVerdict = {
    faultSide:       'NEUTRAL',
    recommendation:  'MANUAL_REVIEW_REQUIRED',
    confidenceScore: 52,
    reasoning:       'Contradictory documentation from both sides. Verbal scope change claim is plausible but unverified. Confidence below threshold for auto-resolution.',
  };
  await createEvent(dispute.id, 'AI_REPORT', 'ai', originalVerdict);

  // Both parties challenge
  await createEvent(dispute.id, 'CHALLENGE', 'buyer', {
    rebuttal: `The PM email only says we "discussed" deprioritizing — it does not confirm a formal scope change. No amendment to the original contract was ever signed. The original written contract governs.`,
  });
  await createEvent(dispute.id, 'CHALLENGE', 'seller', {
    rebuttal: `The email says "as agreed, we will proceed without Notifications and Admin for now." The phrase "as agreed" constitutes client-side written acknowledgment of the scope change. This is industry-standard practice for agile contracts.`,
  });

  await prisma.deedDispute.update({
    where: { id: dispute.id },
    data:  { status: 'CHALLENGE_PHASE', aiAnalysis: originalVerdict },
  });

  console.log(`[Seed] Created dispute ${dispute.id} — category: ${category} #${index}`);
  await triggerAndCompare(dispute.id, category);
  return dispute.id;
}

/**
 * CATEGORY F1: EDGE CASE — Both sides submitted zero evidence
 */
async function seedEdgeCaseEmpty(buyer, seller) {
  const category = 'F1_EDGE_EMPTY_EVIDENCE';
  const deed     = await createDeed(buyer.id, seller.id, LOW_STAKES_AMOUNT,
    'Edge Case — No Evidence From Either Party');
  const dispute  = await createDispute(deed.id, buyer.id, seller.id, 'buyer',
    'OTHER',
    `Both parties failed to submit evidence within the window. Testing system behaviour with no evidence payload.`
  );

  // No evidence events — testing silence-on-both-sides handling

  await prisma.deedDispute.update({
    where: { id: dispute.id },
    data: { status: 'CHALLENGE_PHASE' },
  });

  console.log(`[Seed] Created dispute ${dispute.id} — category: ${category}`);
  await triggerAndCompare(dispute.id, category);
  return dispute.id;
}

/**
 * CATEGORY F2: EDGE CASE — Same actor submitted multiple conflicting rebuttals
 * DisputeEvent allows multiple events per actor role — testing Gemini/synthesizer
 * behaviour when the first buyer evidence contradicts the second.
 */
async function seedEdgeCaseConflicting(buyer, seller) {
  const category = 'F2_EDGE_CONFLICTING_BUYER_EVIDENCE';
  const deed     = await createDeed(buyer.id, seller.id, LOW_STAKES_AMOUNT,
    'Edge Case — Buyer Contradicted Themselves');
  const dispute  = await createDispute(deed.id, buyer.id, seller.id, 'buyer',
    'QUALITY_ISSUE',
    `Buyer first claimed non-delivery, then submitted a second rebuttal claiming delivery was received but quality was poor. Tests handling of contradictory same-actor events.`
  );

  // Buyer's FIRST submission: claims non-delivery
  await createEvent(dispute.id, 'EVIDENCE_SUBMITTED', 'buyer', {
    rebuttal:     `The seller never delivered anything. The project folder is empty.`,
    evidenceUrls: ['/uploads/synthetic/empty-folder.png'],
    isLate:       false,
  });

  // Seller's response
  await createEvent(dispute.id, 'EVIDENCE_SUBMITTED', 'seller', {
    rebuttal:     `Delivery was confirmed via the platform on Day 14. The buyer approved the work in chat before raising this dispute. Attached are the delivery confirmation and the buyer's own approval message.`,
    evidenceUrls: ['/uploads/synthetic/delivery-confirm.png', '/uploads/synthetic/buyer-approval-chat.png'],
    isLate:       false,
  });

  // Buyer's SECOND submission (contradicts the first)
  // Note: disputeAI.js uses .find() (first match) so only first buyer event is used
  // by generateAIReport, but VerdictSynthesizer also uses .find() — testing parity
  await createEvent(dispute.id, 'EVIDENCE_SUBMITTED', 'buyer', {
    rebuttal:     `I retract my previous statement. The delivery was received but the quality is far below the agreed standard. Fonts are wrong and colors don't match the brand guide.`,
    evidenceUrls: ['/uploads/synthetic/quality-comparison.png'],
    isLate:       true,
  });

  await prisma.deedDispute.update({
    where: { id: dispute.id },
    data: { status: 'CHALLENGE_PHASE' },
  });

  console.log(`[Seed] Created dispute ${dispute.id} — category: ${category}`);
  await triggerAndCompare(dispute.id, category);
  return dispute.id;
}

/**
 * CATEGORY F3: EDGE CASE — Extremely sparse input (1-word reason, 1-sentence description)
 */
async function seedEdgeCaseSparse(buyer, seller) {
  const category = 'F3_EDGE_SPARSE_INPUT';
  const deed     = await createDeed(buyer.id, seller.id, LOW_STAKES_AMOUNT,
    'Edge Case — Sparse Input');
  const dispute  = await createDispute(deed.id, buyer.id, seller.id, 'buyer',
    'OTHER',
    `Bad.`
  );

  await createEvent(dispute.id, 'EVIDENCE_SUBMITTED', 'buyer', {
    rebuttal:     'No.',
    evidenceUrls: [],
    isLate:       false,
  });

  await prisma.deedDispute.update({
    where: { id: dispute.id },
    data: { status: 'CHALLENGE_PHASE' },
  });

  console.log(`[Seed] Created dispute ${dispute.id} — category: ${category}`);
  await triggerAndCompare(dispute.id, category);
  return dispute.id;
}

// ── Main ───────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n[Seed] ══════════════════════════════════════════════════════');
  console.log('[Seed] Starting synthetic dispute seed for shadow-mode validation');
  console.log(`[Seed] HIGH_VALUE_THRESHOLD: ₹${disputeConfig.HIGH_VALUE_THRESHOLD_INR} (${disputeConfig.HIGH_VALUE_THRESHOLD_INR * 100} paise)`);
  console.log(`[Seed] LOW_STAKES amount:  ${LOW_STAKES_AMOUNT} paise (₹${LOW_STAKES_AMOUNT / 100})`);
  console.log(`[Seed] HIGH_STAKES amount: ${HIGH_STAKES_AMOUNT} paise (₹${HIGH_STAKES_AMOUNT / 100})`);
  console.log('[Seed] ══════════════════════════════════════════════════════\n');

  // ── Create synthetic users (idempotent) ──────────────────────────────────────
  console.log('[Seed] Setting up synthetic test accounts...');

  const buyer1  = await getOrCreateBuyer('synthetic.buyer1@scrowx.test', 'SYNTHETIC_TEST_BUYER_1');
  const buyer2  = await getOrCreateBuyer('synthetic.buyer2@scrowx.test', 'SYNTHETIC_TEST_BUYER_2');
  const seller1 = await getOrCreateSeller('synthetic.seller1@scrowx.test', 'SYNTHETIC_TEST_SELLER_1');
  const seller2 = await getOrCreateSeller('synthetic.seller2@scrowx.test', 'SYNTHETIC_TEST_SELLER_2');

  console.log('[Seed] Accounts ready.\n');

  const results = [];

  // ── CATEGORY A: Low-stakes, seller fault (3 disputes) ───────────────────────
  console.log('[Seed] ── Category A: Low-stakes, clear-cut seller fault ──────');
  for (let i = 1; i <= 3; i++) {
    await sleep(DELAY_BETWEEN_MS);
    const id = await seedScenarioA(buyer1, seller1, i);
    results.push({ id, category: 'A_LOW_STAKES_SELLER_FAULT' });
  }

  // ── CATEGORY B: Low-stakes, buyer fault (3 disputes) ────────────────────────
  console.log('\n[Seed] ── Category B: Low-stakes, clear-cut buyer fault ───────');
  for (let i = 1; i <= 3; i++) {
    await sleep(DELAY_BETWEEN_MS);
    const id = await seedScenarioB(buyer2, seller2, i);
    results.push({ id, category: 'B_LOW_STAKES_BUYER_FAULT' });
  }

  // ── CATEGORY C: Low-stakes, ambiguous + re-analysis (4 disputes) ────────────
  console.log('\n[Seed] ── Category C: Low-stakes, ambiguous with challenge ───');
  for (let i = 1; i <= 4; i++) {
    await sleep(DELAY_BETWEEN_MS);
    const id = await seedScenarioC(buyer1, seller2, i);
    results.push({ id, category: 'C_LOW_STAKES_AMBIGUOUS_REANALYSIS' });
  }

  // ── CATEGORY D: High-stakes, clear-cut (3 disputes) ─────────────────────────
  console.log('\n[Seed] ── Category D: High-stakes, clear-cut ─────────────────');
  for (let i = 1; i <= 3; i++) {
    await sleep(DELAY_BETWEEN_MS);
    const id = await seedScenarioD(buyer2, seller1, i);
    results.push({ id, category: 'D_HIGH_STAKES_CLEAR_CUT' });
  }

  // ── CATEGORY E: High-stakes, ambiguous + re-analysis (3 disputes) ───────────
  console.log('\n[Seed] ── Category E: High-stakes, ambiguous with challenge ──');
  for (let i = 1; i <= 3; i++) {
    await sleep(DELAY_BETWEEN_MS);
    const id = await seedScenarioE(buyer1, seller1, i);
    results.push({ id, category: 'E_HIGH_STAKES_AMBIGUOUS_REANALYSIS' });
  }

  // ── CATEGORY F: Edge cases (3 disputes) ─────────────────────────────────────
  console.log('\n[Seed] ── Category F: Edge cases ─────────────────────────────');
  await sleep(DELAY_BETWEEN_MS);
  results.push({ id: await seedEdgeCaseEmpty(buyer2, seller2),       category: 'F1_EDGE_EMPTY_EVIDENCE' });
  await sleep(DELAY_BETWEEN_MS);
  results.push({ id: await seedEdgeCaseConflicting(buyer1, seller2), category: 'F2_EDGE_CONFLICTING_BUYER_EVIDENCE' });
  await sleep(DELAY_BETWEEN_MS);
  results.push({ id: await seedEdgeCaseSparse(buyer2, seller1),      category: 'F3_EDGE_SPARSE_INPUT' });

  // ── Final summary ────────────────────────────────────────────────────────────
  console.log('\n[Seed] ══════════════════════════════════════════════════════');
  console.log(`[Seed] Complete. ${results.length} synthetic disputes created and triggered.`);
  console.log('[Seed] Dispute IDs by category:');
  for (const r of results) {
    console.log(`  ${r.category}: ${r.id}`);
  }
  console.log('[Seed] ══════════════════════════════════════════════════════');
  console.log('[Seed] Run cleanup-synthetic-disputes.js to remove all test data.');
  console.log('[Seed] Check server logs for [ShadowCompare] lines.\n');

  await prisma.$disconnect();
})().catch(async (err) => {
  console.error('[Seed] Fatal error:', err);
  await prisma.$disconnect();
  process.exit(1);
});

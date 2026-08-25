/**
 * test-verdict-synthesizer.js
 * Standalone smoke-test for the VerdictSynthesizer agent (Phase 3).
 *
 * Runs OUTSIDE of any Express route or controller.
 * Usage:
 *   node backend/scripts/test-verdict-synthesizer.js
 *
 * Sample disputes use real field shapes from the Prisma schema:
 *   - deed.amount is in subunits (paise/cents), matching how disputeAI.js reads it
 *   - HIGH_VALUE_THRESHOLD_INR = 10000 major units => 1,000,000 paise subunits
 *   - A "low-stakes" amount is < 1,000,000 paise (< ₹10,000)
 *   - A "high-stakes" amount is >= 1,000,000 paise (>= ₹10,000)
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { synthesizeVerdict } = require('../services/ai/agents/VerdictSynthesizer');

// ── Sample disputes ─────────────────────────────────────────────────────────────

/**
 * CASE 1: Low-stakes dispute (₹500 = 50,000 paise < 1,000,000 paise threshold).
 * Buyer raised dispute, both parties submitted evidence on time.
 * Expected: normal (single-provider) mode, Gemini resolves, no agreement warning.
 */
const CASE_1_LOW_STAKES = {
  isReAnalysis: false,
  deed: {
    currency:    'INR',
    amount:      50000, // 50,000 paise = ₹500 — well below ₹10,000 threshold
    description: 'Logo design for a tech startup — 3 variants in PNG + SVG',
    title:       'Logo Design Project',
  },
  dispute: {
    raisedBy:    'buyer',
    reason:      'Deliverables not matching specification',
    description: 'The seller delivered only 1 PNG variant, missing SVG files and the other 2 variants agreed upon in the scope.',
  },
  buyerEvidence: {
    rebuttal:     'Attached are screenshots of the original scope box showing 3 variants + SVG requirement. Only 1 file was delivered.',
    evidenceUrls: ['/uploads/scope-screenshot.png', '/uploads/delivery-screenshot.png'],
    isLate:       false,
  },
  sellerEvidence: {
    rebuttal:     'I delivered what was discussed verbally. The scope box description was ambiguous and the buyer approved the first variant.',
    evidenceUrls: ['/uploads/chat-log.png'],
    isLate:       false,
  },
  originalAiReport: null,
  buyerChallenge:   null,
  sellerChallenge:  null,
};

/**
 * CASE 2: High-stakes dispute (₹15,000 = 1,500,000 paise >= 1,000,000 paise threshold).
 * Seller raised dispute. Buyer submitted no evidence (silent).
 * Expected: agreement mode triggered (requireAgreement: true),
 *   secondary (Claude) will fail => console.warn about agreement check skipped,
 *   result returned from primary (Gemini) with disagreement: null.
 */
const CASE_2_HIGH_STAKES = {
  isReAnalysis: false,
  deed: {
    currency:    'INR',
    amount:      1500000, // 1,500,000 paise = ₹15,000 — above ₹10,000 threshold
    description: 'Custom CRM development — 4 modules, mobile-responsive',
    title:       'CRM Development Contract',
  },
  dispute: {
    raisedBy:    'seller',
    reason:      'Buyer refusing to approve completed work',
    description: 'All 4 modules were delivered and tested. Buyer has been non-responsive for 10 days and is refusing to release escrow without cause.',
  },
  buyerEvidence:  null, // Buyer did not submit evidence — silence weighs negatively
  sellerEvidence: {
    rebuttal:     'Attached are deployment URLs, test reports, and screen recordings of all 4 modules in working condition.',
    evidenceUrls: ['/uploads/deployment-proof.pdf', '/uploads/test-report.pdf', '/uploads/demo-video.mp4'],
    isLate:       false,
  },
  originalAiReport: null,
  buyerChallenge:   null,
  sellerChallenge:  null,
};

/**
 * CASE 3: Low-stakes re-analysis (₹2,000 = 200,000 paise — first AI report already exists,
 * buyer challenged the original verdict).
 * Expected: normal mode, isReAnalysis: true, challengeContext included in prompt.
 */
const CASE_3_REANALYSIS = {
  isReAnalysis: true,
  deed: {
    currency:    'INR',
    amount:      200000, // 200,000 paise = ₹2,000 — low stakes
    description: 'Social media content pack — 10 Instagram posts',
    title:       'Content Creation',
  },
  dispute: {
    raisedBy:    'buyer',
    reason:      'Content does not meet brand guidelines',
    description: 'The delivered posts use incorrect brand colors and fonts specified in the brief.',
  },
  buyerEvidence: {
    rebuttal:     'Brand guidelines PDF was shared before project start. Attached are the brief and the delivered posts showing color mismatch.',
    evidenceUrls: ['/uploads/brand-guidelines.pdf', '/uploads/delivered-posts.zip'],
    isLate:       false,
  },
  sellerEvidence: {
    rebuttal:     'I followed the brief as closely as possible. Minor color differences are due to screen calibration, not negligence.',
    evidenceUrls: ['/uploads/working-files.zip'],
    isLate:       true, // submitted late
  },
  originalAiReport: {
    faultSide: 'SELLER',
    reasoning: 'The seller demonstrably deviated from the provided brand guidelines on color and typography.',
  },
  buyerChallenge: null, // buyer did not challenge (accepted original verdict was in their favor)
  sellerChallenge: {
    rebuttal: 'I challenge the verdict. The color difference is within acceptable tolerance for screen vs. print. Requesting objective color measurement.',
  },
};

// ── Test runner ────────────────────────────────────────────────────────────────

async function runCase(label, inputData) {
  console.log(`\n${'═'.repeat(65)}`);
  console.log(`[test-vs] Case: ${label}`);
  console.log(
    `[test-vs] highStakes check: currency=${inputData.deed.currency} ` +
      `amount=${inputData.deed.amount} paise ` +
      `(${inputData.deed.amount / 100} major units)`
  );
  console.log(`${'═'.repeat(65)}`);

  try {
    const verdict = await synthesizeVerdict(inputData);

    // Log cleanly — primary/secondaryVerdict can be large, keep it readable
    console.log(`\n[test-vs] Result for "${label}":`);
    console.log(JSON.stringify(verdict, null, 2));

    return { ok: true, verdict };
  } catch (err) {
    console.error(`[test-vs] THREW for "${label}":`, err.message);
    return { ok: false, error: err.message };
  }
}

(async () => {
  console.log('[test-vs] Starting VerdictSynthesizer smoke tests (Phase 3)...');

  const case1 = await runCase('CASE 1 — Low-stakes, first pass, both evidence', CASE_1_LOW_STAKES);
  const case2 = await runCase('CASE 2 — HIGH-stakes, first pass, buyer silent', CASE_2_HIGH_STAKES);
  const case3 = await runCase('CASE 3 — Low-stakes, re-analysis, seller challenged late', CASE_3_REANALYSIS);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(65)}`);
  console.log('[test-vs] Final Summary:');

  for (const [label, result] of [
    ['Case 1 (low-stakes first pass)',    case1],
    ['Case 2 (high-stakes, buyer silent)', case2],
    ['Case 3 (re-analysis)',              case3],
  ]) {
    if (!result.ok) {
      console.log(`  ${label} → THREW: ${result.error}`);
      continue;
    }
    const v = result.verdict;
    console.log(
      `  ${label} → recommendation=${v.recommendation} ` +
        `confidence=${v.confidenceScore} ` +
        `provider=${v.providerUsed} ` +
        `disagreement=${v.disagreement ?? 'N/A'} ` +
        `parseError=${v.parseError ?? false}`
    );
  }
  console.log(`${'═'.repeat(65)}\n`);
})();

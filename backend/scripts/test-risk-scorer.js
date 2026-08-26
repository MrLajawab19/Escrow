/**
 * test-risk-scorer.js
 * Exhaustive deterministic tests for RiskScorer.js.
 * Zero AI calls, zero quota, runs in milliseconds.
 *
 * Required cases:
 *   1. Low-risk: established accounts, KYC complete, no violations, normal timing
 *   2. High-risk: brand-new accounts, KYC incomplete, high-value deed,
 *      multiple RuleChecker flags, dispute raised within minutes
 *   3. Missing priorDisputeHistory → null repeatOffenderRisk + dataLimitations entry
 *   4. All inputs null/missing → no throw, fully-flagged insufficient-data result
 *   5. Boundary test: score exactly at low/medium and medium/high thresholds
 *
 * Extended:
 *   6. Account age sub-scores (all bands)
 *   7. KYC risk — high-value vs low-value deed with incomplete KYC
 *   8. disputeSpeedRisk — all timing bands
 *   9. ruleViolationRisk — proportional to flag count
 *  10. repeatOffenderRisk — rate thresholds and insufficient-deed-count guard
 *  11. highValueRisk — all amount tiers
 *  12. riskLevel bucketing — boundary at 34, 35, 64, 65
 */
'use strict';

const {
  scoreRisk,
  accountAgeRisk,
  kycRisk,
  disputeSpeedRisk,
  ruleViolationRisk,
  repeatOffenderRisk,
  highValueRisk,
  toRiskLevel,
  RISK_THRESHOLDS,
  CAPS,
} = require('../services/ai/agents/RiskScorer');

// ── Test harness ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label, extra = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${extra ? ` — ${extra}` : ''}`);
    failed++;
  }
}

function header(label) {
  console.log(`\n${'─'.repeat(68)}`);
  console.log(`  ${label}`);
  console.log('─'.repeat(68));
}

// ── Stable "now" for timing tests ────────────────────────────────────────────

const NOW = new Date('2026-08-26T12:00:00.000Z');

// ── Data builders ─────────────────────────────────────────────────────────────

function makeBuyer(overrides = {}) {
  return {
    id:          'buyer-1',
    kycComplete: true,
    createdAt:   new Date(NOW.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days old
    ...overrides,
  };
}
function makeSeller(overrides = {}) {
  return {
    id:             'seller-1',
    kycComplete:    true,
    rating:         4.5,
    totalDeeds:     20,
    completedDeeds: 19,
    createdAt:      new Date(NOW.getTime() - 180 * 24 * 60 * 60 * 1000), // 180 days old
    ...overrides,
  };
}
function makeDeed(overrides = {}) {
  return {
    id:        'deed-1',
    amount:    50000,          // ₹500 (well below KYC threshold)
    currency:  'INR',
    createdAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    updatedAt: new Date(NOW.getTime() - 2  * 24 * 60 * 60 * 1000), // 2 days ago
    ...overrides,
  };
}
function makeDispute(overrides = {}) {
  return {
    id:        'dispute-1',
    createdAt: NOW,
    ...overrides,
  };
}
function makeRuleOutput(overrides = {}) {
  return {
    automatedFlags:      [],
    evidenceFlags:       [],
    deadlineViolation:   { violated: false, daysLate: 0 },
    milestoneCompliance: null,
    revisionLimitCheck:  null,
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// CASE 1: Low-risk — established accounts, KYC complete, no violations
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 1: Low-risk scenario — expect riskLevel: low');

const c1 = scoreRisk({
  buyer:             makeBuyer(),
  seller:            makeSeller(),
  deed:              makeDeed({ amount: 50000 }),
  dispute:           makeDispute(),
  ruleCheckerOutput: makeRuleOutput(),
  priorDisputeHistory: {
    buyerDisputeCount: 0, buyerDeedCount:  8,
    sellerDisputeCount: 1, sellerDeedCount: 20,
  },
  _now: NOW,
});
console.log(`  overallRiskScore: ${c1.overallRiskScore}  riskLevel: ${c1.riskLevel}`);
console.log(`  contributingFactors: ${JSON.stringify(c1.contributingFactors)}`);
assert(c1.riskLevel === 'low',         `riskLevel=low (got ${c1.riskLevel})`);
assert(c1.overallRiskScore <= 34,      `score ≤34 (got ${c1.overallRiskScore})`);
assert(c1.overallRiskScore >= 0,       `score ≥0`);
assert(!Array.isArray(c1.contributingFactors) || c1.contributingFactors.every(f => f.points > 0),
  'All contributingFactors have positive points');

// ═════════════════════════════════════════════════════════════════════════════
// CASE 2: High-risk — new accounts, KYC incomplete, many flags, fast dispute
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 2: High-risk scenario — expect riskLevel: high');

const c2 = scoreRisk({
  buyer:  makeBuyer({
    kycComplete: false,
    createdAt:   new Date(NOW.getTime() - 2 * 60 * 60 * 1000), // 2 hours old
  }),
  seller: makeSeller({
    kycComplete: false,
    createdAt:   new Date(NOW.getTime() - 3 * 60 * 60 * 1000), // 3 hours old
    rating:      1.2,
  }),
  deed: makeDeed({
    amount:    2000000,   // ₹20,000 — above KYC threshold
    currency:  'INR',
    createdAt: new Date(NOW.getTime() - 8 * 60 * 1000), // 8 minutes ago
    updatedAt: new Date(NOW.getTime() - 7 * 60 * 1000), // 7 minutes ago
  }),
  dispute: makeDispute({ createdAt: NOW }),
  ruleCheckerOutput: makeRuleOutput({
    automatedFlags: [
      'Deed deadline violated by 3 day(s).',
      'Both parties challenged the AI verdict.',
      'Dispute was raised within 1 hour of the last deed update.',
    ],
    evidenceFlags:  [
      'Seller submitted no evidence within the dispute window.',
      'Buyer submitted evidence late (after the 24h window).',
    ],
    deadlineViolation: { violated: true, daysLate: 3 },
  }),
  priorDisputeHistory: {
    buyerDisputeCount: 4, buyerDeedCount:  5,
    sellerDisputeCount: 6, sellerDeedCount: 8,
  },
  _now: NOW,
});
console.log(`  overallRiskScore: ${c2.overallRiskScore}  riskLevel: ${c2.riskLevel}`);
console.log(`  contributingFactors (${c2.contributingFactors.length}):`);
c2.contributingFactors.forEach(f => console.log(`    [${f.factor}] +${f.points}: ${f.explanation}`));
assert(c2.riskLevel === 'high',        `riskLevel=high (got ${c2.riskLevel})`);
assert(c2.overallRiskScore >= 65,      `score ≥65 (got ${c2.overallRiskScore})`);
assert(c2.overallRiskScore <= 100,     `score ≤100 (cap enforced)`);
assert(c2.contributingFactors.length >= 4, `≥4 contributing factors (got ${c2.contributingFactors.length})`);

// ═════════════════════════════════════════════════════════════════════════════
// CASE 3: Missing priorDisputeHistory → null repeatOffenderRisk
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 3: priorDisputeHistory=null → repeatOffenderRisk null + dataLimitations');

const c3 = scoreRisk({
  buyer:              makeBuyer(),
  seller:             makeSeller(),
  deed:               makeDeed(),
  dispute:            makeDispute(),
  ruleCheckerOutput:  makeRuleOutput(),
  priorDisputeHistory: null,  // explicitly null
  _now: NOW,
});
console.log(`  dataLimitations: ${JSON.stringify(c3.dataLimitations)}`);
const c3HasRepeatLimit = c3.dataLimitations.some(l => l.toLowerCase().includes('repeatoffenderrisk') || l.toLowerCase().includes('repeat'));
assert(c3HasRepeatLimit,               'dataLimitations contains repeatOffenderRisk note');
assert(!c3.contributingFactors.some(f => f.factor === 'repeatOffenderRisk'), 'repeatOffenderRisk NOT in contributingFactors');

// Direct sub-function check
const repNull = repeatOffenderRisk(null, makeSeller());
assert(repNull.points === null,        'repeatOffenderRisk(null) returns points=null');
assert(!repNull.dataAvailable,         'repeatOffenderRisk(null) dataAvailable=false');

// ═════════════════════════════════════════════════════════════════════════════
// CASE 4: All inputs null — must not throw, returns structured result
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 4: All inputs null/missing — no throw, structured result');

let c4, c4Threw = false;
try {
  c4 = scoreRisk({});   // all defaults = null
} catch (err) {
  c4Threw = true;
  console.error('  THREW:', err.message);
}
assert(!c4Threw,                               'scoreRisk({}) did not throw');
assert(typeof c4?.overallRiskScore === 'number', 'overallRiskScore is a number');
assert(c4?.riskLevel === 'indeterminate',       `riskLevel=indeterminate when all inputs null (got ${c4?.riskLevel})`);
assert(Array.isArray(c4?.dataLimitations),     'dataLimitations is array');
assert(c4?.dataLimitations.length >= 4,        `dataLimitations has ≥4 entries when all null (got ${c4?.dataLimitations.length})`);
console.log(`  score: ${c4?.overallRiskScore}, level: ${c4?.riskLevel}`);
console.log(`  dataLimitations (${c4?.dataLimitations.length}):`);
c4?.dataLimitations.forEach(l => console.log(`    - ${l}`));

// ═════════════════════════════════════════════════════════════════════════════
// CASE 5: Boundary tests — riskLevel bucketing at thresholds 34/35, 64/65
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 5: Boundary — riskLevel bucketing at thresholds');

// Directly test toRiskLevel at boundary values
assert(toRiskLevel(0)   === 'low',    'score 0 → low');
assert(toRiskLevel(34)  === 'low',    'score 34 → low (boundary max)');
assert(toRiskLevel(35)  === 'medium', 'score 35 → medium (boundary min)');
assert(toRiskLevel(64)  === 'medium', 'score 64 → medium (boundary max)');
assert(toRiskLevel(65)  === 'high',   'score 65 → high (boundary min)');
assert(toRiskLevel(100) === 'high',   'score 100 → high');

// Off-by-one checks
assert(toRiskLevel(RISK_THRESHOLDS.LOW_MAX)     === 'low',    `score ${RISK_THRESHOLDS.LOW_MAX} → low`);
assert(toRiskLevel(RISK_THRESHOLDS.LOW_MAX + 1) === 'medium', `score ${RISK_THRESHOLDS.LOW_MAX + 1} → medium`);
assert(toRiskLevel(RISK_THRESHOLDS.MEDIUM_MAX)     === 'medium', `score ${RISK_THRESHOLDS.MEDIUM_MAX} → medium`);
assert(toRiskLevel(RISK_THRESHOLDS.MEDIUM_MAX + 1) === 'high',   `score ${RISK_THRESHOLDS.MEDIUM_MAX + 1} → high`);

// indeterminate boundary — skippedCount param
assert(toRiskLevel(0,   3) === 'low',           'skipped=3 (below threshold) → low, not indeterminate');
assert(toRiskLevel(0,   4) === 'indeterminate', 'skipped=4 (at threshold) → indeterminate');
assert(toRiskLevel(0,   6) === 'indeterminate', 'skipped=6 (all missing) → indeterminate');
assert(toRiskLevel(80,  4) === 'indeterminate', 'high score but skipped≥4 → indeterminate takes priority');
assert(toRiskLevel(50,  3) === 'medium',        'skipped=3 with medium score → medium (not indeterminate)');

// ═════════════════════════════════════════════════════════════════════════════
// CASE 6: accountAgeRisk — all age bands
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 6: accountAgeRisk — all age bands');

const ageBuyer  = (daysAgo) => ({ createdAt: new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000) });
const oldSeller = { createdAt: new Date(NOW.getTime() - 200 * 24 * 60 * 60 * 1000) };

const a_fresh = accountAgeRisk(ageBuyer(0.1), oldSeller, NOW); // <1 day
const a_3d    = accountAgeRisk(ageBuyer(3),   oldSeller, NOW); // 1-6 days
const a_15d   = accountAgeRisk(ageBuyer(15),  oldSeller, NOW); // 7-29 days
const a_60d   = accountAgeRisk(ageBuyer(60),  oldSeller, NOW); // 30+ days
const a_null  = accountAgeRisk(null, null, NOW);               // no data

console.log(`  <1d: ${a_fresh.points}  3d: ${a_3d.points}  15d: ${a_15d.points}  60d: ${a_60d.points}  null: ${a_null.points}`);
assert(a_fresh.points === 18,        `<1d → 18pts (got ${a_fresh.points})`);
assert(a_3d.points    === 12,        `3d → 12pts (got ${a_3d.points})`);
assert(a_15d.points   === 6,         `15d → 6pts (got ${a_15d.points})`);
assert(a_60d.points   === 0,         `60d → 0pts (established)`);
assert(!a_null.dataAvailable,        `null buyer/seller → dataAvailable=false`);
assert(a_fresh.points <= CAPS.accountAgeRisk, `cap respected (≤${CAPS.accountAgeRisk})`);

// ═════════════════════════════════════════════════════════════════════════════
// CASE 7: kycRisk — high-value vs low-value deed
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 7: kycRisk — high-value vs low-value deed with incomplete KYC');

const highValueDeed = makeDeed({ amount: 2000000 }); // ₹20,000 — above threshold
const lowValueDeed  = makeDeed({ amount: 50000  }); // ₹500 — below threshold

const kyc_hv_inc  = kycRisk({ kycComplete: false }, { kycComplete: true },  highValueDeed);
const kyc_lv_inc  = kycRisk({ kycComplete: false }, { kycComplete: true },  lowValueDeed);
const kyc_both_ok = kycRisk({ kycComplete: true  }, { kycComplete: true  }, highValueDeed);
const kyc_both_inc= kycRisk({ kycComplete: false }, { kycComplete: false }, highValueDeed);

console.log(`  HV+buyer_incomplete: ${kyc_hv_inc.points}  LV+buyer_incomplete: ${kyc_lv_inc.points}`);
console.log(`  Both KYC ok: ${kyc_both_ok.points}  Both incomplete HV: ${kyc_both_inc.points}`);
assert(kyc_hv_inc.points  > kyc_lv_inc.points, `High-value KYC risk > low-value KYC risk`);
assert(kyc_both_ok.points === 0,               `Both KYC complete → 0pts`);
assert(kyc_both_inc.points > kyc_hv_inc.points, `Both incomplete > one incomplete`);
assert(kyc_both_inc.points <= CAPS.kycRisk,    `kycRisk cap respected (≤${CAPS.kycRisk})`);

// ═════════════════════════════════════════════════════════════════════════════
// CASE 8: disputeSpeedRisk — all timing bands
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 8: disputeSpeedRisk — all timing bands');

function speedDeed(minutesAgo) {
  return makeDeed({
    createdAt: new Date(NOW.getTime() - (minutesAgo + 5) * 60 * 1000),
    updatedAt: new Date(NOW.getTime() - minutesAgo * 60 * 1000),
  });
}
function speedDispute() { return makeDispute({ createdAt: NOW }); }

const spd_5min   = disputeSpeedRisk(speedDeed(5),     speedDispute()); // <15min from creation
const spd_30min  = disputeSpeedRisk(speedDeed(30),    speedDispute()); // <1h from updatedAt
const spd_3h     = disputeSpeedRisk(speedDeed(180),   speedDispute()); // <6h
const spd_12h    = disputeSpeedRisk(speedDeed(720),   speedDispute()); // <24h
const spd_2days  = disputeSpeedRisk(speedDeed(2880),  speedDispute()); // >=24h
const spd_null   = disputeSpeedRisk(null, null);

console.log(`  5min: ${spd_5min.points}  30min: ${spd_30min.points}  3h: ${spd_3h.points}  12h: ${spd_12h.points}  2d: ${spd_2days.points}`);
assert(spd_5min.points   >= 15, `<15min from creation → ≥15pts (got ${spd_5min.points})`);
assert(spd_30min.points  >= 8,  `<1h → ≥8pts (got ${spd_30min.points})`);
assert(spd_3h.points     >= 3,  `<6h → ≥3pts (got ${spd_3h.points})`);
assert(spd_12h.points    >= 3,  `<24h → ≥3pts (got ${spd_12h.points})`);
assert(spd_2days.points  === 0, `≥24h → 0pts (got ${spd_2days.points})`);
assert(!spd_null.dataAvailable, `null inputs → dataAvailable=false`);

// ═════════════════════════════════════════════════════════════════════════════
// CASE 9: ruleViolationRisk — proportional to flag count
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 9: ruleViolationRisk — proportional to flags');

const rv_0flags = ruleViolationRisk(makeRuleOutput());
const rv_3auto  = ruleViolationRisk(makeRuleOutput({ automatedFlags: ['f1','f2','f3'] }));
const rv_mixed  = ruleViolationRisk(makeRuleOutput({
  automatedFlags:    ['f1','f2'],
  evidenceFlags:     ['e1','e2'],
  deadlineViolation: { violated: true, daysLate: 2 },
}));
const rv_null   = ruleViolationRisk(null);

console.log(`  0flags: ${rv_0flags.points}  3auto: ${rv_3auto.points}  mixed: ${rv_mixed.points}`);
assert(rv_0flags.points === 0,          `0 flags → 0pts`);
assert(rv_3auto.points  === 12,         `3 autoFlags → 12pts (got ${rv_3auto.points})`);
assert(rv_mixed.points  > rv_3auto.points, `mixed flags+deadline+evidence > 3 auto flags alone`);
assert(rv_mixed.points  <= CAPS.ruleViolationRisk, `cap respected (≤${CAPS.ruleViolationRisk})`);
assert(!rv_null.dataAvailable,          `null → dataAvailable=false`);

// ═════════════════════════════════════════════════════════════════════════════
// CASE 10: repeatOffenderRisk — rate thresholds and insufficient-deed guard
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 10: repeatOffenderRisk — rate thresholds');

const rep_clean   = repeatOffenderRisk({ buyerDisputeCount: 0, buyerDeedCount: 10, sellerDisputeCount: 1, sellerDeedCount: 20 }, makeSeller());
const rep_elev    = repeatOffenderRisk({ buyerDisputeCount: 3, buyerDeedCount: 10, sellerDisputeCount: 0, sellerDeedCount: 10 }, makeSeller()); // buyer 30% > 25%
const rep_high    = repeatOffenderRisk({ buyerDisputeCount: 6, buyerDeedCount: 10, sellerDisputeCount: 0, sellerDeedCount: 10 }, makeSeller()); // buyer 60% > 50%
const rep_few     = repeatOffenderRisk({ buyerDisputeCount: 2, buyerDeedCount: 2,  sellerDisputeCount: 0, sellerDeedCount: 2  }, makeSeller()); // <3 deeds — should not compute rate
const rep_lowrate = repeatOffenderRisk({ buyerDisputeCount: 0, buyerDeedCount: 0,  sellerDisputeCount: 0, sellerDeedCount: 0  }, makeSeller({ rating: 1.5 })); // low seller rating

console.log(`  clean: ${rep_clean.points}  elevated: ${rep_elev.points}  high: ${rep_high.points}  few-deeds: ${rep_few.points}  low-rating: ${rep_lowrate.points}`);
assert(rep_clean.points === 0,           `Clean history → 0pts`);
assert(rep_elev.points  >= 8,            `Elevated rate (30%) → ≥8pts (got ${rep_elev.points})`);
assert(rep_high.points  > rep_elev.points, `High rate > elevated rate`);
assert(rep_high.points  <= CAPS.repeatOffenderRisk, `cap respected (≤${CAPS.repeatOffenderRisk})`);
assert(typeof rep_few.points === 'number', `Few deeds: still returns numeric points (got ${rep_few.points})`);
assert(rep_lowrate.points > 0,           `Low seller rating contributes points (got ${rep_lowrate.points})`);

// ═════════════════════════════════════════════════════════════════════════════
// CASE 11: highValueRisk — all amount tiers
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 11: highValueRisk — amount tiers (₹10k threshold × 100 paise = 1,000,000 paise)');

// KYC_THRESHOLD_PAISE = 10000 * 100 = 1,000,000
const hv_below   = highValueRisk(makeDeed({ amount: 500000   })); // ₹5,000 — below
const hv_above1x = highValueRisk(makeDeed({ amount: 1100000  })); // ₹11,000 — 1×
const hv_5x      = highValueRisk(makeDeed({ amount: 5000000  })); // ₹50,000 — 5×
const hv_10x     = highValueRisk(makeDeed({ amount: 10100000 })); // ₹1,01,000 — 10×
const hv_null    = highValueRisk(null);

console.log(`  below: ${hv_below.points}  1×: ${hv_above1x.points}  5×: ${hv_5x.points}  10×: ${hv_10x.points}  null: ${hv_null.points}`);
assert(hv_below.points   === 0,  `Below threshold → 0pts`);
assert(hv_above1x.points === 5,  `1× threshold → 5pts (got ${hv_above1x.points})`);
assert(hv_5x.points      === 10, `5× threshold → 10pts (got ${hv_5x.points})`);
assert(hv_10x.points     === 15, `10× threshold → 15pts (got ${hv_10x.points})`);
assert(hv_10x.points     <= CAPS.highValueRisk, `cap respected`);
assert(hv_null.points    === 0,  `null deed → 0pts (no throw)`);

// ═════════════════════════════════════════════════════════════════════════════
// CASE 12: riskLevel bucketing — exact boundary values
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 12: riskLevel exact boundary values');

[
  [0, 'low'], [34, 'low'], [35, 'medium'], [64, 'medium'],
  [65, 'high'], [100, 'high'],
].forEach(([score, expected]) => {
  const got = toRiskLevel(score);
  assert(got === expected, `toRiskLevel(${score}) = "${expected}" (got "${got}")`);
});

// ═════════════════════════════════════════════════════════════════════════════
// CASE 13: Partial data (2 sub-scores missing) → genuine 'low', NOT indeterminate
//
// Threshold is 4 missing. This case deliberately omits priorDisputeHistory
// (1 missing) and passes no ruleCheckerOutput (1 missing) = 2 total skipped.
// The remaining 4 sub-scores (accountAge, kyc, disputeSpeed, highValue) all
// compute cleanly and return low values for an established, KYC-complete,
// low-value, normally-timed dispute. Should resolve to riskLevel='low'.
// ═════════════════════════════════════════════════════════════════════════════
header('CASE 13: Partial data (2 of 6 missing) → genuine low, not indeterminate');

const c13 = scoreRisk({
  buyer:               makeBuyer(),     // 90 days old, KYC complete
  seller:              makeSeller(),    // 180 days old, KYC complete, rating=4.5
  deed:                makeDeed({ amount: 50000 }), // ₹500 — low value
  dispute:             makeDispute(),   // normal timing (2 days after deed update)
  ruleCheckerOutput:   null,            // SKIPPED (1 of 6)
  priorDisputeHistory: null,            // SKIPPED (2 of 6) — below threshold of 4
  _now: NOW,
});
console.log(`  overallRiskScore: ${c13.overallRiskScore}  riskLevel: ${c13.riskLevel}`);
console.log(`  dataLimitations (${c13.dataLimitations.length}):`);
c13.dataLimitations.forEach(l => console.log(`    - ${l}`));

assert(c13.riskLevel === 'low',           `riskLevel=low with 2 skipped (got ${c13.riskLevel})`);
assert(c13.riskLevel !== 'indeterminate', 'NOT indeterminate with only 2 of 6 skipped');
assert(c13.overallRiskScore <= 34,        `score ≤34 (got ${c13.overallRiskScore})`);
assert(c13.dataLimitations.length === 2,  `exactly 2 dataLimitations entries (got ${c13.dataLimitations.length})`);
assert(
  c13.dataLimitations.some(l => l.includes('ruleViolationRisk')),
  'dataLimitations notes ruleViolationRisk as skipped'
);
assert(
  c13.dataLimitations.some(l => l.toLowerCase().includes('repeat')),
  'dataLimitations notes repeatOffenderRisk as skipped'
);

// ─────────────────────────────────────────────────────────────────────────────
// Final summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(68)}`);
console.log('  RISK SCORER TEST SUMMARY');
console.log('═'.repeat(68));
console.log(`  Total assertions: ${passed + failed}`);
console.log(`  Passed: ${passed}   Failed: ${failed}`);
console.log(`\n  Overall: ${failed === 0 ? '✅ ALL PASS' : `❌ ${failed} FAILURE(S)`}`);
console.log('═'.repeat(68) + '\n');

if (failed > 0) process.exit(1);

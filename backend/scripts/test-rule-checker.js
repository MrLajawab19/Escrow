/**
 * test-rule-checker.js
 * Exhaustive deterministic unit tests for RuleChecker.js.
 * Zero AI calls, zero quota usage — runs immediately.
 *
 * 6 required cases + extended edge cases:
 *   1. Clean on-time delivery — no violations
 *   2. Deadline violated by N days — daysLate correct
 *   3. Milestone non-compliance — overdue milestone detection
 *   4. No evidence submitted by either party — flagged
 *   5. Missing/null deadline — no throw, flagged as indeterminate
 *   6. Evidence submitted exactly ON the deadline — boundary: NOT late (>= is NOT a violation)
 *
 * Extended:
 *   7. Revision limit exceeded
 *   8. Both parties challenged — contention flag
 *   9. Evidence submitted multiple times by same party
 *  10. Deed is milestone-based but milestones array is empty
 *  11. Non-milestone deed with milestones passed — milestoneCompliance is null
 *  12. checkRules() with deed=null, dispute=null — must not throw
 *
 * Usage:
 *   node backend/scripts/test-rule-checker.js
 */
'use strict';

const {
  checkRules,
  checkDeadline,
  checkMilestones,
  checkRevisions,
  detectEvidenceFlags,
} = require('../services/ai/agents/RuleChecker');

// ── Test harness ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label, details = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${details ? ` — ${details}` : ''}`);
    failed++;
  }
}

function header(label) {
  console.log(`\n${'─'.repeat(65)}`);
  console.log(`  ${label}`);
  console.log('─'.repeat(65));
}

// ── Shared test data builders ─────────────────────────────────────────────────

const NOW  = new Date('2026-08-26T00:00:00.000Z');  // stable "now" for all tests

function makeDeed(overrides = {}) {
  return {
    id:             'deed-1',
    title:          'Test Deed',
    deadline:       null,
    isMilestone:    false,
    milestones:     [],
    revisionLimit:  3,
    revisionCount:  0,
    amount:         50000,
    currency:       'INR',
    updatedAt:      new Date('2026-08-20T10:00:00.000Z'),
    ...overrides,
  };
}

function makeDispute(overrides = {}) {
  return {
    id:          'dispute-1',
    reason:      'QUALITY_ISSUE',
    description: 'Test dispute',
    createdAt:   new Date('2026-08-25T12:00:00.000Z'),
    ...overrides,
  };
}

function makeEvidenceEvent(role, isLate = false, createdAt = new Date('2026-08-25T14:00:00.000Z')) {
  return {
    id:            `ev-${role}-${Date.now()}`,
    type:          'EVIDENCE_SUBMITTED',
    actorRole:     role,
    createdAt,
    payload:       { rebuttal: 'Test rebuttal', evidenceUrls: [], isLate },
  };
}

function makeChallengeEvent(role) {
  return {
    id:        `ch-${role}`,
    type:      'CHALLENGE',
    actorRole: role,
    createdAt: new Date('2026-08-26T08:00:00.000Z'),
    payload:   { rebuttal: 'I challenge this verdict' },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CASE 1: Clean on-time delivery — no violations
// ─────────────────────────────────────────────────────────────────────────────
header('CASE 1: Clean on-time delivery — no violations');

const c1Deed    = makeDeed({ deadline: new Date('2026-08-28T00:00:00.000Z') });
const c1Dispute = makeDispute({ createdAt: new Date('2026-08-26T00:00:00.000Z') });
const c1Events  = [
  makeEvidenceEvent('buyer',  false),
  makeEvidenceEvent('seller', false),
];
const c1 = checkRules({ deed: c1Deed, dispute: c1Dispute, evidenceEvents: c1Events, referenceDate: NOW });
console.log('  deadlineViolation:', c1.deadlineViolation.details);
assert(!c1.deadlineViolation.violated,         'Deadline NOT violated');
assert(c1.deadlineViolation.daysLate === 0,    'daysLate is 0');
assert(c1.milestoneCompliance === null,         'milestoneCompliance is null (not a milestone deed)');
assert(c1.evidenceFlags.length === 0,           'No evidence flags');
assert(!c1.automatedFlags.some(f => f.includes('violated')), 'No deadline flag in automatedFlags');

// ─────────────────────────────────────────────────────────────────────────────
// CASE 2: Deadline violated by N days — daysLate calculated correctly
// ─────────────────────────────────────────────────────────────────────────────
header('CASE 2: Deadline violated — daysLate computed correctly');

// Deadline: Aug 20. Dispute (reference): Aug 25. Should be 5 days late.
const c2Deed    = makeDeed({ deadline: new Date('2026-08-20T00:00:00.000Z') });
const c2Dispute = makeDispute({ createdAt: new Date('2026-08-25T00:00:00.000Z') });
const c2Events  = [makeEvidenceEvent('buyer', false), makeEvidenceEvent('seller', false)];
const c2 = checkRules({ deed: c2Deed, dispute: c2Dispute, evidenceEvents: c2Events });
console.log('  deadlineViolation:', c2.deadlineViolation.details);
assert(c2.deadlineViolation.violated,           'Deadline IS violated');
assert(c2.deadlineViolation.daysLate === 5,     `daysLate = 5 (got ${c2.deadlineViolation.daysLate})`);
assert(c2.automatedFlags.some(f => f.includes('violated by 5')), 'automatedFlags contains daysLate');

// Direct helper test with referenceDate override
const dl = checkDeadline(
  makeDeed({ deadline: new Date('2026-08-20T00:00:00.000Z') }),
  makeDispute({ createdAt: new Date('2026-08-22T12:00:00.000Z') }),
);
assert(dl.violated,              'Helper: violated=true for 2.5d late');
assert(dl.daysLate === 2.5,      `Helper: daysLate=2.5 (got ${dl.daysLate})`);

// ─────────────────────────────────────────────────────────────────────────────
// CASE 3: Milestone non-compliance — overdue milestone detection
// ─────────────────────────────────────────────────────────────────────────────
header('CASE 3: Milestone non-compliance — overdue milestones');

const c3Deed = makeDeed({
  isMilestone:    true,
  revisionLimit:  3,
  revisionCount:  0,
});
const c3Milestones = [
  {
    id:              'm1',
    milestoneNumber: 1,
    title:           'Design mockups',
    deadline:        new Date('2026-08-10T00:00:00.000Z'),  // passed
    status:          'SUBMITTED',
    submittedAt:     new Date('2026-08-14T00:00:00.000Z'),  // 4 days late
    approvedAt:      null,
  },
  {
    id:              'm2',
    milestoneNumber: 2,
    title:           'Frontend development',
    deadline:        new Date('2026-08-18T00:00:00.000Z'),  // passed
    status:          'PENDING',       // not submitted, now > deadline
    submittedAt:     null,
    approvedAt:      null,
  },
  {
    id:              'm3',
    milestoneNumber: 3,
    title:           'Final handover',
    deadline:        new Date('2026-09-01T00:00:00.000Z'),  // future — compliant
    status:          'PENDING',
    submittedAt:     null,
    approvedAt:      null,
  },
];
const c3Result = checkMilestones(c3Deed, c3Milestones, NOW);
console.log('  milestoneCompliance:', c3Result?.details);
assert(c3Result !== null,              'milestoneCompliance is not null for milestone deed');
assert(!c3Result.compliant,            'compliant=false (2 milestones overdue)');
assert(c3Result.overdueCount === 2,    `overdueCount=2 (got ${c3Result.overdueCount})`);

// Confirm m1 (submitted 4d late) and m2 (not submitted, deadline passed) both caught
const fullC3 = checkRules({
  deed:           c3Deed,
  dispute:        makeDispute(),
  evidenceEvents: [makeEvidenceEvent('buyer'), makeEvidenceEvent('seller')],
  milestones:     c3Milestones,
  referenceDate:  NOW,
});
assert(fullC3.milestoneCompliance?.overdueCount === 2, 'checkRules propagates overdueCount=2');
assert(fullC3.automatedFlags.some(f => f.includes('milestone')), 'automatedFlags mentions milestones');

// ─────────────────────────────────────────────────────────────────────────────
// CASE 4: No evidence submitted by either party
// ─────────────────────────────────────────────────────────────────────────────
header('CASE 4: No evidence submitted by either party');

const c4 = checkRules({
  deed:           makeDeed({ deadline: new Date('2026-08-20T00:00:00.000Z') }),
  dispute:        makeDispute({ createdAt: new Date('2026-08-25T00:00:00.000Z') }),
  evidenceEvents: [],  // empty — no evidence at all
});
console.log('  evidenceFlags:', c4.evidenceFlags);
assert(c4.evidenceFlags.some(f => f.includes('Buyer submitted no evidence')),  'Buyer no-evidence flag');
assert(c4.evidenceFlags.some(f => f.includes('Seller submitted no evidence')), 'Seller no-evidence flag');
assert(c4.evidenceFlags.length >= 2, 'At least 2 evidence flags');

// ─────────────────────────────────────────────────────────────────────────────
// CASE 5: Missing/null deadline — must NOT throw, must flag as indeterminate
// ─────────────────────────────────────────────────────────────────────────────
header('CASE 5: Null deadline — no throw, indeterminate flagged');

let threw = false;
let c5;
try {
  c5 = checkRules({
    deed:           makeDeed({ deadline: null }),
    dispute:        makeDispute(),
    evidenceEvents: [makeEvidenceEvent('buyer'), makeEvidenceEvent('seller')],
  });
} catch (err) {
  threw = true;
  console.error('  THREW:', err.message);
}
assert(!threw,                                         'checkRules did NOT throw with null deadline');
assert(c5?.deadlineViolation.violated === false,       'violated=false (not unknown)');
assert(c5?.deadlineViolation.daysLate === null,        'daysLate=null for missing deadline');
assert(c5?.deadlineViolation.indeterminate === true,   'indeterminate=true set');
assert(c5?.automatedFlags.some(f => f.includes('Deadline compliance could not') || f.includes('No deadline') || f.includes('cannot')), 'automatedFlags notes missing deadline');
console.log('  deadlineViolation:', c5?.deadlineViolation.details);

// Also test helper directly with null deed and null dispute
let threw2 = false;
try { checkDeadline(null, null); } catch(e) { threw2 = true; }
assert(!threw2, 'checkDeadline(null, null) does not throw');

// ─────────────────────────────────────────────────────────────────────────────
// CASE 6: Evidence submitted EXACTLY ON the deadline — boundary: NOT late
// ─────────────────────────────────────────────────────────────────────────────
header('CASE 6: Evidence submitted exactly on deadline — boundary condition');

// The check is `ref <= deadline → compliant` (i.e., diff <= 0 is NOT a violation).
// We use referenceDate = deadline exactly.
const boundaryDeadline = new Date('2026-08-25T12:00:00.000Z');
const c6Deed    = makeDeed({ deadline: boundaryDeadline });
const c6Dispute = makeDispute({ createdAt: boundaryDeadline }); // dispute raised exactly at deadline
const c6 = checkDeadline(c6Deed, c6Dispute);
console.log('  deadlineViolation:', c6.details);
assert(!c6.violated,          'Boundary: NOT violated when submitted exactly at deadline');
assert(c6.daysLate === 0,     `Boundary: daysLate=0 (got ${c6.daysLate})`);

// 1 millisecond past deadline — IS a violation
const c6bDeed    = makeDeed({ deadline: new Date('2026-08-25T12:00:00.000Z') });
const c6bDispute = makeDispute({ createdAt: new Date('2026-08-25T12:00:00.001Z') }); // 1ms late
const c6b = checkDeadline(c6bDeed, c6bDispute);
assert(c6b.violated, 'Boundary+1ms: IS violated when 1ms past deadline');

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED CASE 7: Revision limit exceeded
// ─────────────────────────────────────────────────────────────────────────────
header('CASE 7: Revision limit exceeded');

const c7Deed = makeDeed({ revisionLimit: 3, revisionCount: 4 });
const c7Rev  = checkRevisions(c7Deed);
console.log('  revisionLimitCheck:', c7Rev?.details);
assert(c7Rev !== null,         'revisionLimitCheck is not null');
assert(c7Rev.exceeded,         'exceeded=true');
assert(c7Rev.count === 4,      `count=4 (got ${c7Rev.count})`);
assert(c7Rev.limit === 3,      `limit=3 (got ${c7Rev.limit})`);

// Within limit
const c7within = checkRevisions(makeDeed({ revisionLimit: 3, revisionCount: 2 }));
assert(c7within !== null && !c7within.exceeded, 'Within limit: exceeded=false');

// Zero limit (unlimited) — returns null
const c7unlimited = checkRevisions(makeDeed({ revisionLimit: 0 }));
assert(c7unlimited === null, 'revisionLimit=0 → checkRevisions returns null (unlimited)');

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED CASE 8: Both parties challenged — contention flag
// ─────────────────────────────────────────────────────────────────────────────
header('CASE 8: Both parties challenged — high contention flag');

const c8Events = [
  makeEvidenceEvent('buyer'),
  makeEvidenceEvent('seller'),
  makeChallengeEvent('buyer'),
  makeChallengeEvent('seller'),
];
const c8 = checkRules({ deed: makeDeed(), dispute: makeDispute(), evidenceEvents: c8Events });
console.log('  automatedFlags:', c8.automatedFlags);
assert(c8.automatedFlags.some(f => f.includes('Both parties challenged')), 'Both-parties-challenged flag');
assert(c8.automatedFlags.some(f => f.includes('re-analysis')), 'Challenge count flag (re-analysis)');

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED CASE 9: Multiple evidence submissions from same party
// ─────────────────────────────────────────────────────────────────────────────
header('CASE 9: Multiple evidence submissions from same party');

const c9Events = [
  makeEvidenceEvent('buyer', false, new Date('2026-08-25T13:00:00.000Z')),
  makeEvidenceEvent('buyer', false, new Date('2026-08-25T14:00:00.000Z')), // second submission
  makeEvidenceEvent('seller', false),
];
const c9Flags = detectEvidenceFlags(c9Events, makeDispute());
console.log('  evidenceFlags:', c9Flags);
assert(c9Flags.some(f => f.includes('Buyer submitted evidence 2 times')), 'Multi-submission flag for buyer');
assert(!c9Flags.some(f => f.includes('Seller submitted evidence')), 'No multi-submission flag for seller (1 submission)');

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED CASE 10: Milestone deed with empty milestones array
// ─────────────────────────────────────────────────────────────────────────────
header('CASE 10: Milestone deed but milestones array is empty');

const c10Deed   = makeDeed({ isMilestone: true });
const c10Result = checkMilestones(c10Deed, [], NOW);
console.log('  milestoneCompliance:', c10Result?.details);
assert(c10Result !== null,      'milestoneCompliance is not null (deed IS milestone-based)');
assert(!c10Result.compliant,    'compliant=false (no milestones found but deed is milestone-based)');

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED CASE 11: Non-milestone deed → milestoneCompliance is null
// ─────────────────────────────────────────────────────────────────────────────
header('CASE 11: Non-milestone deed → milestoneCompliance: null');

const c11 = checkMilestones(makeDeed({ isMilestone: false }), []);
assert(c11 === null, 'Non-milestone deed returns null milestoneCompliance');

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED CASE 12: checkRules with deed=null, dispute=null — must not throw
// ─────────────────────────────────────────────────────────────────────────────
header('CASE 12: checkRules(deed=null, dispute=null) — must not throw');

let c12Result;
let c12Threw = false;
try {
  c12Result = checkRules({ deed: null, dispute: null, evidenceEvents: [] });
} catch (err) {
  c12Threw = true;
  console.error('  THREW:', err.message);
}
assert(!c12Threw,                    'checkRules(null, null) did not throw');
assert(c12Result !== undefined,      'checkRules returned a result object');
assert('deadlineViolation' in (c12Result || {}), 'result has deadlineViolation key');

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(65)}`);
console.log('  RULE CHECKER TEST SUMMARY');
console.log('═'.repeat(65));
console.log(`  Total assertions: ${passed + failed}`);
console.log(`  Passed: ${passed}   Failed: ${failed}`);
console.log(`\n  Overall: ${failed === 0 ? '✅ ALL PASS' : `❌ ${failed} FAILURE(S)`}`);
console.log('═'.repeat(65) + '\n');

if (failed > 0) process.exit(1);

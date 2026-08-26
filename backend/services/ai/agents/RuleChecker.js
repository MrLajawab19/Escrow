/**
 * RuleChecker.js
 * Stage 2 of the multi-agent arbitration pipeline.
 * Diagram: "2) Rule Checker"
 *
 * Pure deterministic module — NO AI/LLM calls, NO async/await (unless callers
 * choose to pass async-fetched data in). All logic is pure functions:
 * deterministic input → deterministic output, zero API flakiness.
 *
 * Schema facts confirmed before writing (do not re-derive):
 *   - Deed.deadline         DateTime?   — top-level deed delivery deadline (nullable)
 *   - Deed.isMilestone      Boolean     — whether the deed uses milestone mode
 *   - Deed.revisionLimit    Int (default 3)
 *   - Deed.revisionCount    Int (default 0)
 *   - Milestone.deadline    DateTime?   — per-milestone deadline (nullable)
 *   - Milestone.status      String      — "PENDING" | "SUBMITTED" | "APPROVED" | "PAID"
 *   - Milestone.submittedAt DateTime?
 *   - Milestone.approvedAt  DateTime?
 *   - isLate in EVIDENCE_SUBMITTED payload: server-computed at submission time as
 *       (now - dispute.createdAt) > EVIDENCE_WINDOW_HOURS (24h)
 *     This is NOT the same as deed.deadline lateness — it measures evidence
 *     submission timing within the dispute window, not delivery deadline compliance.
 *   - disputeConfig.EVIDENCE_WINDOW_HOURS      = 24
 *   - disputeConfig.EVIDENCE_LATE_WINDOW_HOURS = 48
 *   - disputeConfig.CHALLENGE_WINDOW_HOURS     = 48
 *
 * Return shape (checkRules):
 * {
 *   deadlineViolation:   { violated: boolean, daysLate: number|null, details: string },
 *   milestoneCompliance: { compliant: boolean, overdueCount: number, details: string } | null,
 *   revisionLimitCheck:  { exceeded: boolean, limit: number, count: number, details: string } | null,
 *   evidenceFlags:       string[],
 *   automatedFlags:      string[],
 * }
 */
'use strict';

const disputeConfig = require('../../../config/disputeConfig');

// ── Constants ─────────────────────────────────────────────────────────────────

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY  = MS_PER_HOUR * 24;

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Safely converts a value to a Date, returning null if invalid.
 * Handles Date objects, ISO strings, and null/undefined gracefully.
 * @param {Date|string|null|undefined} val
 * @returns {Date|null}
 */
function toDate(val) {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Computes the difference in fractional days between two dates (a - b).
 * Positive means a is later than b.
 * @param {Date} a
 * @param {Date} b
 * @returns {number}
 */
function daysDiff(a, b) {
  return (a.getTime() - b.getTime()) / MS_PER_DAY;
}

// ── checkDeadline ─────────────────────────────────────────────────────────────

/**
 * Checks whether the deed's delivery deadline was violated.
 *
 * Strategy: uses dispute.createdAt as the proxy for "when delivery was assessed"
 * (i.e., the dispute was raised because something was wrong at this point in time).
 * When a more precise delivery event timestamp is available, pass it as
 * referenceDate to override.
 *
 * Replicates and extends disputeEngine.js extractProofData() lines 88-93,
 * adding daysLate quantification which did not exist there.
 *
 * @param {object} deed             — Deed record (must have .deadline)
 * @param {object} dispute          — DeedDispute record (must have .createdAt)
 * @param {Date}   [referenceDate]  — optional override for "delivery date"
 * @returns {{ violated: boolean, daysLate: number|null, details: string }}
 */
function checkDeadline(deed, dispute, referenceDate) {
  const deadline = toDate(deed?.deadline);

  if (!deadline) {
    return {
      violated:  false,
      daysLate:  null,
      details:   'No delivery deadline set on this deed — cannot determine deadline compliance.',
      indeterminate: true,
    };
  }

  // Use the provided referenceDate, or fall back to dispute.createdAt.
  // dispute.createdAt is the moment the dispute was raised — a conservative
  // proxy for "the delivery was assessed at this point and found wanting."
  const ref = referenceDate ? toDate(referenceDate) : toDate(dispute?.createdAt);

  if (!ref) {
    return {
      violated:  false,
      daysLate:  null,
      details:   'Cannot determine deadline compliance — reference date is unavailable.',
      indeterminate: true,
    };
  }

  const diff = daysDiff(ref, deadline); // positive = late

  if (diff <= 0) {
    // On time (ref <= deadline). Note: diff == 0 means exactly on the deadline —
    // this is NOT a violation (boundary: ref <= deadline → compliant).
    return {
      violated: false,
      daysLate: 0,
      details:  `Deadline was ${deadline.toISOString()}. Dispute raised ${ref.toISOString()}. Delivered on time (${Math.abs(diff).toFixed(2)} days before deadline).`,
    };
  }

  // Deadline was violated
  const daysLate = parseFloat(diff.toFixed(2));
  return {
    violated: true,
    daysLate,
    details:  `Deadline was ${deadline.toISOString()}. Dispute raised ${ref.toISOString()}. ${daysLate} day(s) late.`,
  };
}

// ── checkMilestones ───────────────────────────────────────────────────────────

/**
 * Checks milestone compliance. Returns null if deed is not in milestone mode
 * or if milestones array is absent/empty.
 *
 * Checks per milestone:
 *   - Whether a per-milestone deadline was missed (milestone.deadline set,
 *     milestone.submittedAt > deadline OR submittedAt is null and deadline passed)
 *   - Whether any milestone is in PENDING state past its deadline
 *
 * @param {object}    deed            — Deed record (must have .isMilestone, .milestones)
 * @param {Milestone[]} [milestones]  — Pre-fetched milestone records. If not passed,
 *                                      falls back to deed.milestones if populated.
 * @param {Date}      [referenceDate] — "now" override for deterministic unit testing
 * @returns {{ compliant: boolean, overdueCount: number, details: string } | null}
 */
function checkMilestones(deed, milestones, referenceDate) {
  if (!deed?.isMilestone) return null;

  const ms = milestones ?? deed?.milestones ?? [];
  if (!ms || ms.length === 0) {
    return {
      compliant:    false,
      overdueCount: 0,
      details:      'Deed is marked as milestone-based but no milestone records were found.',
    };
  }

  const now   = referenceDate ? toDate(referenceDate) : new Date();
  const issues = [];
  let overdueCount = 0;

  for (const m of ms) {
    const mDeadline    = toDate(m.deadline);
    const mSubmittedAt = toDate(m.submittedAt);
    const mStatus      = (m.status || 'PENDING').toUpperCase();
    const label        = `Milestone #${m.milestoneNumber ?? '?'} ("${m.title ?? 'untitled'}")`;

    if (!mDeadline) {
      // No deadline set for this milestone — skip deadline check, not a violation
      continue;
    }

    if (mStatus === 'APPROVED' || mStatus === 'PAID') {
      // Already approved/paid — check if it was submitted late
      if (mSubmittedAt && mSubmittedAt > mDeadline) {
        const late = parseFloat(daysDiff(mSubmittedAt, mDeadline).toFixed(2));
        issues.push(`${label}: submitted ${late} day(s) late (submitted ${mSubmittedAt.toISOString()}, deadline ${mDeadline.toISOString()}).`);
        overdueCount++;
      }
    } else if (mStatus === 'SUBMITTED') {
      // Submitted — check if submission was late
      if (mSubmittedAt && mSubmittedAt > mDeadline) {
        const late = parseFloat(daysDiff(mSubmittedAt, mDeadline).toFixed(2));
        issues.push(`${label}: submitted ${late} day(s) late (submitted ${mSubmittedAt.toISOString()}, deadline ${mDeadline.toISOString()}).`);
        overdueCount++;
      }
    } else {
      // PENDING (or unknown) — check if deadline has passed without submission
      if (now > mDeadline) {
        const overdue = parseFloat(daysDiff(now, mDeadline).toFixed(2));
        issues.push(`${label}: not yet submitted and deadline passed ${overdue} day(s) ago (deadline ${mDeadline.toISOString()}).`);
        overdueCount++;
      }
    }
  }

  const compliant = overdueCount === 0;
  return {
    compliant,
    overdueCount,
    details: compliant
      ? `All ${ms.length} milestone(s) are within deadline.`
      : `${overdueCount} of ${ms.length} milestone(s) have deadline issues: ${issues.join(' | ')}`,
  };
}

// ── checkRevisions ────────────────────────────────────────────────────────────

/**
 * Checks whether the revision limit has been exceeded.
 * Returns null if the deed has no revisionLimit set (0 treated as "unlimited").
 *
 * @param {object} deed — Deed record (must have .revisionLimit, .revisionCount)
 * @returns {{ exceeded: boolean, limit: number, count: number, details: string } | null}
 */
function checkRevisions(deed) {
  const limit = deed?.revisionLimit ?? null;
  const count = deed?.revisionCount ?? 0;

  // 0 or null limit means no revision cap — skip check
  if (limit === null || limit === 0) return null;

  const exceeded = count > limit;
  return {
    exceeded,
    limit,
    count,
    details: exceeded
      ? `Revision limit exceeded: ${count} revisions used against a limit of ${limit}.`
      : `Revisions within limit: ${count} of ${limit} used.`,
  };
}

// ── detectEvidenceFlags ───────────────────────────────────────────────────────

/**
 * Checks evidence submission patterns and returns an array of flag strings.
 * Input: the pre-fetched array of DisputeEvent records for this dispute.
 *
 * Checks:
 *   1. No evidence submitted by buyer
 *   2. No evidence submitted by seller
 *   3. Evidence submitted late by buyer (isLate=true in payload)
 *   4. Evidence submitted late by seller
 *   5. Multiple evidence submissions from same party (possible manipulation)
 *   6. Evidence submitted after the late window (EVIDENCE_LATE_WINDOW_HOURS)
 *      based on dispute.createdAt
 *
 * @param {DisputeEvent[]} events     — All events for this dispute
 * @param {object}         dispute    — DeedDispute record (must have .createdAt)
 * @returns {string[]}
 */
function detectEvidenceFlags(events, dispute) {
  const flags = [];
  if (!events || events.length === 0) {
    // No events at all — flag it but still run per-party checks (will both fire as absent)
    flags.push('No dispute events found — cannot assess evidence submission.');
  }

  const evidenceEvents = (events || []).filter(e => e.type === 'EVIDENCE_SUBMITTED');

  const buyerEv  = evidenceEvents.filter(e => e.actorRole === 'buyer');
  const sellerEv = evidenceEvents.filter(e => e.actorRole === 'seller');

  if (buyerEv.length === 0) {
    flags.push('Buyer submitted no evidence within the dispute window.');
  }
  if (sellerEv.length === 0) {
    flags.push('Seller submitted no evidence within the dispute window.');
  }

  // Late submissions (as server-computed at submission time)
  const buyerLate  = buyerEv.filter(e => e.payload?.isLate === true);
  const sellerLate = sellerEv.filter(e => e.payload?.isLate === true);
  if (buyerLate.length > 0) {
    flags.push(`Buyer submitted evidence late (after the ${disputeConfig.EVIDENCE_WINDOW_HOURS}h window).`);
  }
  if (sellerLate.length > 0) {
    flags.push(`Seller submitted evidence late (after the ${disputeConfig.EVIDENCE_WINDOW_HOURS}h window).`);
  }

  // Multiple submissions from same party — only 1 per party is expected
  if (buyerEv.length > 1) {
    flags.push(`Buyer submitted evidence ${buyerEv.length} times (expected once) — possible duplicate or re-submission.`);
  }
  if (sellerEv.length > 1) {
    flags.push(`Seller submitted evidence ${sellerEv.length} times (expected once) — possible duplicate or re-submission.`);
  }

  // Cross-check: any evidence submitted after the hard late window
  // (EVIDENCE_LATE_WINDOW_HOURS = 48h) using event.createdAt vs dispute.createdAt
  const disputeCreated = toDate(dispute?.createdAt);
  if (disputeCreated) {
    const hardCutoffMs = disputeCreated.getTime() + disputeConfig.EVIDENCE_LATE_WINDOW_HOURS * MS_PER_HOUR;
    for (const ev of evidenceEvents) {
      const evCreated = toDate(ev.createdAt);
      if (evCreated && evCreated.getTime() > hardCutoffMs) {
        flags.push(
          `${ev.actorRole.charAt(0).toUpperCase() + ev.actorRole.slice(1)} submitted evidence ` +
          `${parseFloat(daysDiff(evCreated, new Date(hardCutoffMs)).toFixed(2))} day(s) after ` +
          `the ${disputeConfig.EVIDENCE_LATE_WINDOW_HOURS}h hard window closed.`
        );
      }
    }
  }

  return flags;
}

// ── detectAutomatedFlags ──────────────────────────────────────────────────────

/**
 * Generates broader automated flags based on deed, dispute, and all events.
 * These supplement evidenceFlags with higher-level observations.
 *
 * @param {object}         deed
 * @param {object}         dispute
 * @param {DisputeEvent[]} events
 * @param {object}         deadlineResult   — output of checkDeadline()
 * @param {object|null}    milestoneResult  — output of checkMilestones()
 * @param {object|null}    revisionResult   — output of checkRevisions()
 * @returns {string[]}
 */
function detectAutomatedFlags(deed, dispute, events, deadlineResult, milestoneResult, revisionResult) {
  const flags = [];

  // Deadline violation
  if (deadlineResult.violated) {
    flags.push(`Deed deadline violated by ${deadlineResult.daysLate} day(s).`);
  }
  if (deadlineResult.indeterminate) {
    flags.push('Deadline compliance could not be determined — no deadline set on deed.');
  }

  // Milestone overdue
  if (milestoneResult && !milestoneResult.compliant) {
    flags.push(`${milestoneResult.overdueCount} milestone(s) missed deadline.`);
  }

  // Revision limit exceeded
  if (revisionResult?.exceeded) {
    flags.push(`Revision limit exceeded (${revisionResult.count}/${revisionResult.limit}).`);
  }

  // Dispute raised very quickly after deed activity — quick-raise heuristic
  // Replicates disputeEngine.js line 152-156 (< 1 hour)
  const disputeCreated = toDate(dispute?.createdAt);
  const deedUpdated    = toDate(deed?.updatedAt);
  if (disputeCreated && deedUpdated) {
    const raiseTimeDiffHours = daysDiff(disputeCreated, deedUpdated) * 24;
    if (raiseTimeDiffHours >= 0 && raiseTimeDiffHours < 1) {
      flags.push('Dispute was raised within 1 hour of the last deed update — possible premature dispute.');
    }
  }

  // Dispute reason is DEADLINE_MISSED but no deadline is set on the deed
  if (dispute?.reason === 'DEADLINE_MISSED' && !deed?.deadline) {
    flags.push('Dispute reason is DEADLINE_MISSED but deed has no deadline field set — inconsistency.');
  }

  // Challenge events present (re-analysis scenario)
  const challenges = (events || []).filter(e => e.type === 'CHALLENGE');
  if (challenges.length > 0) {
    flags.push(`${challenges.length} challenge(s) submitted — this is a re-analysis dispute.`);
  }

  // Both parties challenged — high contention signal
  const buyerChallenged  = challenges.some(e => e.actorRole === 'buyer');
  const sellerChallenged = challenges.some(e => e.actorRole === 'seller');
  if (buyerChallenged && sellerChallenged) {
    flags.push('Both parties challenged the AI verdict — high contention, manual review recommended.');
  }

  return flags;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Runs all rule checks against a dispute.
 * This function is synchronous and never throws on null/missing data.
 *
 * @param {{
 *   deed:             object,                  — Deed record from Prisma
 *   dispute:          object,                  — DeedDispute record from Prisma
 *   evidenceEvents:   DisputeEvent[],          — All DisputeEvents for this dispute
 *   milestones?:      Milestone[],             — Optional: pre-fetched milestones
 *   referenceDate?:   Date,                    — Optional: "now" override for testing
 * }} input
 *
 * @returns {{
 *   deadlineViolation:   { violated: boolean, daysLate: number|null, details: string, indeterminate?: boolean },
 *   milestoneCompliance: { compliant: boolean, overdueCount: number, details: string } | null,
 *   revisionLimitCheck:  { exceeded: boolean, limit: number, count: number, details: string } | null,
 *   evidenceFlags:       string[],
 *   automatedFlags:      string[],
 * }}
 */
function checkRules({ deed, dispute, evidenceEvents, milestones, referenceDate } = {}) {
  // Guard: every sub-check handles null/undefined inputs internally,
  // but log a warning if core inputs are entirely absent.
  if (!deed || !dispute) {
    console.warn('[RuleChecker] checkRules called with missing deed or dispute — results will be limited.');
  }

  const deadlineResult  = checkDeadline(deed, dispute, referenceDate);
  const milestoneResult = checkMilestones(deed, milestones, referenceDate);
  const revisionResult  = checkRevisions(deed);
  const evidenceFlags   = detectEvidenceFlags(evidenceEvents, dispute);
  const automatedFlags  = detectAutomatedFlags(
    deed, dispute, evidenceEvents,
    deadlineResult, milestoneResult, revisionResult
  );

  return {
    deadlineViolation:   deadlineResult,
    milestoneCompliance: milestoneResult,
    revisionLimitCheck:  revisionResult,
    evidenceFlags,
    automatedFlags,
  };
}

// Named exports for unit-testability of individual checks
module.exports = {
  checkRules,
  // Individual helpers exported for direct unit testing
  checkDeadline,
  checkMilestones,
  checkRevisions,
  detectEvidenceFlags,
  detectAutomatedFlags,
};

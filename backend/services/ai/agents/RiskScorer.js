/**
 * RiskScorer.js
 * Stage 3 of the multi-agent arbitration pipeline.
 * Diagram: "3) Risk Scorer"
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  IMPORTANT: HEURISTIC, RULE-BASED RISK SCORER — NOT AN ML FRAUD MODEL  ║
 * ║                                                                          ║
 * ║  This module exists because ScrowX does not yet have enough real         ║
 * ║  transaction/dispute history to train or meaningfully pattern-match      ║
 * ║  against. Each heuristic here is a reasonable starting signal, not a     ║
 * ║  validated fraud predictor.                                              ║
 * ║                                                                          ║
 * ║  What this IS:                                                           ║
 * ║    A transparent, auditable set of named rules that contribute bounded   ║
 * ║    point values to an overall 0-100 risk score. Every rule is a named    ║
 * ║    exported function so it can be independently unit-tested and tuned.   ║
 * ║                                                                          ║
 * ║  What this is NOT:                                                       ║
 * ║    - A trained classifier (no training data exists yet)                  ║
 * ║    - A pattern-matching system over historical disputes                  ║
 * ║    - A substitute for human review on high-risk cases                   ║
 * ║                                                                          ║
 * ║  When to upgrade:                                                        ║
 * ║    Revisit and replace/augment with real ML-based scoring once           ║
 * ║    sufficient real user dispute history exists (100+ resolved disputes   ║
 * ║    with known ground-truth outcomes is a reasonable minimum bar).        ║
 * ║    See dataLimitations in the return value for what's currently missing. ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Schema facts confirmed before writing (do not re-derive):
 *   - Buyer.createdAt, Seller.createdAt                — account age
 *   - Buyer.kycComplete, Seller.kycComplete            — KYC status
 *   - Seller.totalDeeds Int, Seller.completedDeeds Int — transaction history
 *   - Seller.rating Float                              — reputation signal
 *   - Deed.amount Int (subunits), Deed.createdAt       — value + age
 *   - kycGate.js threshold: HIGH_VALUE_THRESHOLD_INR * 100 (= ₹10,000 * 100 paise)
 *   - No Buyer.totalDeeds — must be pre-fetched by caller
 *   - No DeedDispute @relation back to Buyer/Seller models — prior dispute
 *     counts must be pre-fetched by caller and passed as priorDisputeHistory
 *
 * Input: scoreRisk({ buyer, seller, deed, dispute, ruleCheckerOutput, priorDisputeHistory })
 *   All data pre-fetched by caller — this module is pure sync, no Prisma calls.
 *
 * Output:
 * {
 *   overallRiskScore:    <0-100 integer>,
 *   riskLevel:           "low" | "medium" | "high",
 *   contributingFactors: [ { factor, points, explanation } ],
 *   dataLimitations:     string[]
 * }
 *
 * Risk level thresholds:
 *   0-34:  low
 *   35-64: medium
 *   65+:   high
 */
'use strict';

const { HIGH_VALUE_THRESHOLD_INR } = require('../../../config/disputeConfig');

// ── Constants ─────────────────────────────────────────────────────────────────

const KYC_THRESHOLD_PAISE = HIGH_VALUE_THRESHOLD_INR * 100;
const MS_PER_DAY          = 1000 * 60 * 60 * 24;
const MS_PER_HOUR         = 1000 * 60 * 60;
const MS_PER_MINUTE       = 1000 * 60;

/**
 * Risk level thresholds — export so tests can import and assert against them.
 *
 * INDETERMINATE_MIN_SKIPPED: if this many (or more) of the 6 sub-scores were
 * skipped due to missing data, the numeric score is based on ≤2 real signals
 * and must not be treated as a confident 'low'. Threshold = 4 (of 6), meaning:
 *   ≤3 skipped → ≥3 real signals (≥50% coverage) → numeric score reported as-is
 *   ≥4 skipped → ≤2 real signals (≤33% coverage) → 'indeterminate'
 */
const RISK_THRESHOLDS = Object.freeze({
  LOW_MAX:                 34,
  MEDIUM_MAX:              64,
  INDETERMINATE_MIN_SKIPPED: 4,   // 4+ of 6 sub-scores missing → indeterminate
});

/** Max point caps per heuristic — prevents any single signal from dominating */
const CAPS = Object.freeze({
  accountAgeRisk:     20,
  kycRisk:            20,
  disputeSpeedRisk:   20,
  ruleViolationRisk:  25,
  repeatOffenderRisk: 20,
  highValueRisk:      15,
});

// ── Utilities ─────────────────────────────────────────────────────────────────

function toDate(val) {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function clamp(n, min, max) {
  return Math.min(Math.max(Math.round(n), min), max);
}

// ── Individual heuristic functions ────────────────────────────────────────────

/**
 * accountAgeRisk
 * Newer accounts have less established trust history.
 * Uses whichever of buyer/seller is newer — the weaker link is the signal.
 *
 * Scoring:
 *   < 1 day:   18 pts  (brand new — highest risk)
 *   1–6 days:  12 pts
 *   7–29 days:  6 pts
 *   30+ days:   0 pts  (established)
 *
 * Cap: 20 pts
 *
 * @param {{ createdAt: Date|string }} buyer
 * @param {{ createdAt: Date|string }} seller
 * @param {Date} [now]
 * @returns {{ points: number, explanation: string, dataAvailable: boolean }}
 */
function accountAgeRisk(buyer, seller, now = new Date()) {
  const buyerCreated  = toDate(buyer?.createdAt);
  const sellerCreated = toDate(seller?.createdAt);

  if (!buyerCreated && !sellerCreated) {
    return {
      points:        0,
      explanation:   'Account age unavailable for both parties — cannot assess.',
      dataAvailable: false,
    };
  }

  const ages = [];
  if (buyerCreated)  ages.push({ role: 'buyer',  ageDays: (now - buyerCreated)  / MS_PER_DAY });
  if (sellerCreated) ages.push({ role: 'seller', ageDays: (now - sellerCreated) / MS_PER_DAY });

  // Worst-case (newest) account drives the score
  const youngest = ages.sort((a, b) => a.ageDays - b.ageDays)[0];
  const ageDays  = youngest.ageDays;

  let points;
  let detail;
  if (ageDays < 1) {
    points = 18;
    detail = `${youngest.role} account is <1 day old (${(ageDays * 24).toFixed(1)}h).`;
  } else if (ageDays < 7) {
    points = 12;
    detail = `${youngest.role} account is ${ageDays.toFixed(1)} days old (<7 days).`;
  } else if (ageDays < 30) {
    points = 6;
    detail = `${youngest.role} account is ${ageDays.toFixed(1)} days old (<30 days).`;
  } else {
    points = 0;
    detail = `Both accounts established (youngest: ${ageDays.toFixed(0)} days old).`;
  }

  return {
    points:        clamp(points, 0, CAPS.accountAgeRisk),
    explanation:   detail,
    dataAvailable: true,
  };
}

/**
 * kycRisk
 * Incomplete KYC on a deed that meets or exceeds the KYC threshold is a
 * compliance gap and a risk signal. Mirrors kycGate.js's threshold logic exactly.
 *
 * Scoring:
 *   High-value deed AND buyer KYC incomplete:  15 pts
 *   High-value deed AND seller KYC incomplete: 15 pts
 *   KYC incomplete on low-value deed:           5 pts (soft signal)
 *   Both KYC complete:                          0 pts
 *
 * Cap: 20 pts
 *
 * @param {{ kycComplete: boolean }} buyer
 * @param {{ kycComplete: boolean }} seller
 * @param {{ amount: number }}       deed
 * @returns {{ points: number, explanation: string, dataAvailable: boolean }}
 */
function kycRisk(buyer, seller, deed) {
  const amount       = deed?.amount ?? null;
  const isHighValue  = amount !== null && amount > KYC_THRESHOLD_PAISE;
  const buyerKyc     = buyer?.kycComplete;
  const sellerKyc    = seller?.kycComplete;

  if (buyerKyc === undefined && sellerKyc === undefined) {
    return {
      points:        0,
      explanation:   'KYC status unavailable for both parties.',
      dataAvailable: false,
    };
  }

  const missing = [];
  if (buyerKyc  === false) missing.push('buyer');
  if (sellerKyc === false) missing.push('seller');

  if (missing.length === 0) {
    return {
      points:        0,
      explanation:   'KYC complete for both parties.',
      dataAvailable: true,
    };
  }

  const basePoints = isHighValue ? 15 : 5;
  const points     = clamp(basePoints * missing.length, 0, CAPS.kycRisk);
  const threshold  = `₹${HIGH_VALUE_THRESHOLD_INR.toLocaleString('en-IN')}`;

  return {
    points,
    explanation:   `KYC incomplete for: ${missing.join(', ')}. ` +
                   (isHighValue
                     ? `Deed value (${amount} paise) exceeds ${threshold} threshold — KYC was required.`
                     : `Deed value is below ${threshold} threshold but KYC is still incomplete.`),
    dataAvailable: true,
  };
}

/**
 * disputeSpeedRisk
 * Unusually fast disputes (raised very soon after deed creation or last deed
 * activity) can signal either genuine immediate problems or potential abuse.
 * We flag for review — we don't use this as a sole verdict signal.
 *
 * Reference point: deed.updatedAt (last deed activity, used by disputeEngine.js
 * for the same < 1h heuristic). Also checks vs deed.createdAt for even faster
 * disputes (raised before any real work could happen).
 *
 * Scoring:
 *   < 15 min from deed.createdAt:  20 pts  (faster than any real work timeline)
 *   < 1 hour from deed.updatedAt:  15 pts  (replicates disputeEngine.js signal)
 *   < 6 hours from deed.updatedAt:  8 pts
 *   < 24 hours:                     3 pts
 *   >= 24 hours:                    0 pts
 *
 * Cap: 20 pts
 *
 * @param {{ createdAt: Date|string, updatedAt: Date|string }} deed
 * @param {{ createdAt: Date|string }}                          dispute
 * @returns {{ points: number, explanation: string, dataAvailable: boolean }}
 */
function disputeSpeedRisk(deed, dispute) {
  const deedCreated    = toDate(deed?.createdAt);
  const deedUpdated    = toDate(deed?.updatedAt);
  const disputeCreated = toDate(dispute?.createdAt);

  if (!disputeCreated || (!deedCreated && !deedUpdated)) {
    return {
      points:        0,
      explanation:   'Timing data unavailable — cannot assess dispute speed.',
      dataAvailable: false,
    };
  }

  // Check 1: time from deed CREATION to dispute (very early dispute)
  if (deedCreated) {
    const msFromCreation = disputeCreated - deedCreated;
    if (msFromCreation >= 0 && msFromCreation < 15 * MS_PER_MINUTE) {
      return {
        points:        clamp(20, 0, CAPS.disputeSpeedRisk),
        explanation:   `Dispute raised only ${(msFromCreation / MS_PER_MINUTE).toFixed(1)} min after deed creation — faster than any real work timeline.`,
        dataAvailable: true,
      };
    }
  }

  // Check 2: time from deed's LAST ACTIVITY to dispute
  const ref    = deedUpdated || deedCreated;
  const msDiff = disputeCreated - ref;

  if (msDiff < 0) {
    // Dispute predates deed activity — data anomaly
    return {
      points:        5,
      explanation:   'Dispute creation timestamp predates deed last-activity timestamp — data anomaly.',
      dataAvailable: true,
    };
  }

  let points;
  let detail;
  if (msDiff < MS_PER_HOUR) {
    points = 15;
    detail = `Dispute raised ${(msDiff / MS_PER_MINUTE).toFixed(1)} min after last deed activity (<1h).`;
  } else if (msDiff < 6 * MS_PER_HOUR) {
    points = 8;
    detail = `Dispute raised ${(msDiff / MS_PER_HOUR).toFixed(1)}h after last deed activity (<6h).`;
  } else if (msDiff < 24 * MS_PER_HOUR) {
    points = 3;
    detail = `Dispute raised ${(msDiff / MS_PER_HOUR).toFixed(1)}h after last deed activity (<24h).`;
  } else {
    points = 0;
    detail = `Dispute raised ${(msDiff / MS_PER_DAY).toFixed(1)} days after last deed activity (normal range).`;
  }

  return {
    points:        clamp(points, 0, CAPS.disputeSpeedRisk),
    explanation:   detail,
    dataAvailable: true,
  };
}

/**
 * ruleViolationRisk
 * Derives a risk contribution directly from RuleChecker's output.
 * More flags from RuleChecker = higher risk here. Avoids duplicating logic.
 *
 * Scoring:
 *   Per automatedFlag:    4 pts each
 *   Per evidenceFlag:     2 pts each
 *   Deadline violated:   +5 pts bonus
 *   Milestone overdue:   +3 pts per overdue milestone (max 6 pts bonus)
 *   Revision exceeded:   +3 pts bonus
 *
 * Cap: 25 pts
 *
 * @param {object|null} ruleCheckerOutput — direct output of RuleChecker.checkRules()
 * @returns {{ points: number, explanation: string, dataAvailable: boolean }}
 */
function ruleViolationRisk(ruleCheckerOutput) {
  if (!ruleCheckerOutput) {
    return {
      points:        0,
      explanation:   'RuleChecker output not provided — rule violation risk not scored.',
      dataAvailable: false,
    };
  }

  let points = 0;
  const details = [];

  const autoFlags = ruleCheckerOutput.automatedFlags ?? [];
  const evFlags   = ruleCheckerOutput.evidenceFlags  ?? [];

  if (autoFlags.length > 0) {
    const contribution = autoFlags.length * 4;
    points += contribution;
    details.push(`${autoFlags.length} RuleChecker automated flag(s): +${contribution}pts`);
  }
  if (evFlags.length > 0) {
    const contribution = evFlags.length * 2;
    points += contribution;
    details.push(`${evFlags.length} RuleChecker evidence flag(s): +${contribution}pts`);
  }

  const deadline = ruleCheckerOutput.deadlineViolation;
  if (deadline?.violated) {
    points += 5;
    details.push(`Deadline violated by ${deadline.daysLate}d: +5pts`);
  }

  const milestones = ruleCheckerOutput.milestoneCompliance;
  if (milestones && !milestones.compliant && milestones.overdueCount > 0) {
    const bonus = clamp(milestones.overdueCount * 3, 0, 6);
    points += bonus;
    details.push(`${milestones.overdueCount} overdue milestone(s): +${bonus}pts`);
  }

  const revisions = ruleCheckerOutput.revisionLimitCheck;
  if (revisions?.exceeded) {
    points += 3;
    details.push(`Revision limit exceeded: +3pts`);
  }

  return {
    points:        clamp(points, 0, CAPS.ruleViolationRisk),
    explanation:   details.length > 0 ? details.join('; ') : 'No rule violations detected.',
    dataAvailable: true,
  };
}

/**
 * repeatOffenderRisk
 * Checks whether buyer or seller has a history of many disputes relative to
 * their transaction count. Only computed if real historical data is passed in.
 * Returns null (not 0) if data is absent — caller's dataLimitations array is
 * updated accordingly.
 *
 * Scoring:
 *   buyer  dispute rate > 50% of their deeds: 15 pts
 *   buyer  dispute rate > 25%:                 8 pts
 *   seller dispute rate > 50% of their deeds: 15 pts
 *   seller dispute rate > 25%:                 8 pts
 *   seller.rating < 2.0 (on a 5-star scale):  +5 pts bonus
 *
 * Cap: 20 pts
 * Minimum deeds to compute rate: 3 (rates from 1-2 deeds are too noisy).
 *
 * @param {{
 *   buyerDisputeCount?:  number,
 *   buyerDeedCount?:     number,
 *   sellerDisputeCount?: number,
 *   sellerDeedCount?:    number,
 * } | null} priorDisputeHistory
 * @param {{ rating?: number }} seller  — for rating signal
 * @returns {{ points: number | null, explanation: string, dataAvailable: boolean }}
 */
function repeatOffenderRisk(priorDisputeHistory, seller) {
  const MIN_DEEDS_FOR_RATE = 3;

  if (!priorDisputeHistory) {
    return {
      points:        null,
      explanation:   'No prior dispute history provided — repeatOffenderRisk cannot be calculated.',
      dataAvailable: false,
    };
  }

  const {
    buyerDisputeCount,
    buyerDeedCount,
    sellerDisputeCount,
    sellerDeedCount,
  } = priorDisputeHistory;

  // Need at least one side's data to score
  const hasBuyerData  = typeof buyerDisputeCount === 'number' && typeof buyerDeedCount  === 'number';
  const hasSellerData = typeof sellerDisputeCount === 'number' && typeof sellerDeedCount === 'number';

  if (!hasBuyerData && !hasSellerData) {
    return {
      points:        null,
      explanation:   'Prior dispute counts provided but incomplete — repeatOffenderRisk cannot be calculated.',
      dataAvailable: false,
    };
  }

  let points = 0;
  const details = [];

  if (hasBuyerData && buyerDeedCount >= MIN_DEEDS_FOR_RATE) {
    const rate = buyerDisputeCount / buyerDeedCount;
    if (rate > 0.5) {
      points += 15;
      details.push(`Buyer dispute rate: ${(rate * 100).toFixed(0)}% (${buyerDisputeCount}/${buyerDeedCount} deeds) — high`);
    } else if (rate > 0.25) {
      points += 8;
      details.push(`Buyer dispute rate: ${(rate * 100).toFixed(0)}% (${buyerDisputeCount}/${buyerDeedCount} deeds) — elevated`);
    }
  } else if (hasBuyerData && buyerDeedCount < MIN_DEEDS_FOR_RATE) {
    details.push(`Buyer has only ${buyerDeedCount} deed(s) — insufficient history for rate calculation.`);
  }

  if (hasSellerData && sellerDeedCount >= MIN_DEEDS_FOR_RATE) {
    const rate = sellerDisputeCount / sellerDeedCount;
    if (rate > 0.5) {
      points += 15;
      details.push(`Seller dispute rate: ${(rate * 100).toFixed(0)}% (${sellerDisputeCount}/${sellerDeedCount} deeds) — high`);
    } else if (rate > 0.25) {
      points += 8;
      details.push(`Seller dispute rate: ${(rate * 100).toFixed(0)}% (${sellerDisputeCount}/${sellerDeedCount} deeds) — elevated`);
    }
  } else if (hasSellerData && sellerDeedCount < MIN_DEEDS_FOR_RATE) {
    details.push(`Seller has only ${sellerDeedCount} deed(s) — insufficient history for rate calculation.`);
  }

  // Seller rating as a supplemental signal
  const sellerRating = seller?.rating;
  if (typeof sellerRating === 'number' && sellerRating > 0 && sellerRating < 2.0) {
    points += 5;
    details.push(`Seller rating ${sellerRating.toFixed(1)}/5 — very low`);
  }

  if (details.length === 0) {
    details.push('No repeat offender signals detected from available history.');
  }

  return {
    points:        clamp(points, 0, CAPS.repeatOffenderRisk),
    explanation:   details.join('; '),
    dataAvailable: true,
  };
}

/**
 * highValueRisk
 * Large transaction amounts have higher absolute loss if arbitration goes wrong.
 * Not a fraud signal on its own, but amplifies the importance of other flags.
 *
 * Scoring:
 *   >= 10× threshold (≥₹1,00,000): 15 pts
 *   >= 5×  threshold (≥₹50,000):   10 pts
 *   >= 1×  threshold (≥₹10,000):    5 pts
 *   < threshold:                     0 pts
 *
 * Cap: 15 pts
 *
 * @param {{ amount: number, currency?: string }} deed
 * @returns {{ points: number, explanation: string, dataAvailable: boolean }}
 */
function highValueRisk(deed) {
  const amount = deed?.amount;
  if (amount === undefined || amount === null) {
    return {
      points:        0,
      explanation:   'Deed amount unavailable.',
      dataAvailable: false,
    };
  }

  const currency   = (deed.currency || 'INR').toUpperCase();
  // For simplicity and because the codebase uses INR paise as canonical subunits,
  // we compare against KYC_THRESHOLD_PAISE directly. USD amounts stored in cents
  // would use a different threshold — caller should normalise before passing.
  let points;
  let detail;
  if (amount >= KYC_THRESHOLD_PAISE * 10) {
    points = 15;
    detail = `High-value deed: ${currency} ${(amount / 100).toLocaleString('en-IN')} (≥10× KYC threshold).`;
  } else if (amount >= KYC_THRESHOLD_PAISE * 5) {
    points = 10;
    detail = `High-value deed: ${currency} ${(amount / 100).toLocaleString('en-IN')} (≥5× KYC threshold).`;
  } else if (amount > KYC_THRESHOLD_PAISE) {
    points = 5;
    detail = `Deed value ${currency} ${(amount / 100).toLocaleString('en-IN')} exceeds KYC threshold.`;
  } else {
    points = 0;
    detail = `Deed value ${currency} ${(amount / 100).toLocaleString('en-IN')} is below KYC threshold.`;
  }

  return {
    points:        clamp(points, 0, CAPS.highValueRisk),
    explanation:   detail,
    dataAvailable: true,
  };
}

// ── riskLevel bucketing ──────────────────────────────────────────────────────────

/**
 * Converts an overall 0-100 score to a risk level string.
 *
 * Returns 'indeterminate' when skippedCount >= RISK_THRESHOLDS.INDETERMINATE_MIN_SKIPPED
 * (i.e., 4 or more of the 6 sub-scores were skipped due to missing data).
 * In that case the numeric score is based on ≤2 real signals and must NOT be
 * treated as a confident 'low' by downstream consumers.
 *
 * @param {number} score
 * @param {number} [skippedCount=0]  — number of sub-scores skipped due to missing data
 * @returns {"low"|"medium"|"high"|"indeterminate"}
 */
function toRiskLevel(score, skippedCount = 0) {
  if (skippedCount >= RISK_THRESHOLDS.INDETERMINATE_MIN_SKIPPED) return 'indeterminate';
  if (score <= RISK_THRESHOLDS.LOW_MAX)    return 'low';
  if (score <= RISK_THRESHOLDS.MEDIUM_MAX) return 'medium';
  return 'high';
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Scores the behavioral risk of a dispute scenario using heuristic rules.
 * Pure synchronous function — never throws on null/missing data.
 *
 * @param {{
 *   buyer?:                object,   — Buyer record: { createdAt, kycComplete, ... }
 *   seller?:               object,   — Seller record: { createdAt, kycComplete, rating, totalDeeds, completedDeeds }
 *   deed?:                 object,   — Deed record: { amount, currency, createdAt, updatedAt }
 *   dispute?:              object,   — DeedDispute record: { createdAt }
 *   ruleCheckerOutput?:    object,   — Direct output of RuleChecker.checkRules()
 *   priorDisputeHistory?:  object,   — Pre-fetched: { buyerDisputeCount, buyerDeedCount, sellerDisputeCount, sellerDeedCount }
 *   _now?:                 Date,     — "now" override for deterministic testing
 * }} input
 *
 * @returns {{
 *   overallRiskScore:    number,
 *   riskLevel:           "low"|"medium"|"high"|"indeterminate",
 *   contributingFactors: Array<{ factor: string, points: number, explanation: string }>,
 *   dataLimitations:     string[],
 * }}
 */
function scoreRisk({
  buyer               = null,
  seller              = null,
  deed                = null,
  dispute             = null,
  ruleCheckerOutput   = null,
  priorDisputeHistory = null,
  _now                = new Date(),
} = {}) {
  const contributingFactors = [];
  const dataLimitations     = [];

  // ── Run each heuristic ────────────────────────────────────────────────────

  const checks = [
    { name: 'accountAgeRisk',    result: accountAgeRisk(buyer, seller, _now) },
    { name: 'kycRisk',           result: kycRisk(buyer, seller, deed) },
    { name: 'disputeSpeedRisk',  result: disputeSpeedRisk(deed, dispute) },
    { name: 'ruleViolationRisk', result: ruleViolationRisk(ruleCheckerOutput) },
    { name: 'highValueRisk',     result: highValueRisk(deed) },
  ];

  // repeatOffenderRisk is treated separately because its points can be null
  const repeatResult = repeatOffenderRisk(priorDisputeHistory, seller);

  for (const { name, result } of checks) {
    if (!result.dataAvailable) {
      dataLimitations.push(`${name} not fully scored: ${result.explanation}`);
    }
    if (result.points > 0) {
      contributingFactors.push({
        factor:      name,
        points:      result.points,
        explanation: result.explanation,
      });
    }
  }

  // repeatOffenderRisk: null points means data was absent
  if (repeatResult.points === null) {
    dataLimitations.push(`repeatOffenderRisk not calculated — ${repeatResult.explanation}`);
  } else if (repeatResult.points > 0) {
    contributingFactors.push({
      factor:      'repeatOffenderRisk',
      points:      repeatResult.points,
      explanation: repeatResult.explanation,
    });
  }

  // ── Aggregate ─────────────────────────────────────────────────────────────

  const rawScore = checks.reduce((sum, { result }) => sum + (result.points || 0), 0)
    + (repeatResult.points ?? 0);

  const overallRiskScore = clamp(rawScore, 0, 100);

  // Count skipped sub-scores: one per unavailable check + repeatOffenderRisk if null.
  // Total possible sub-scores = 6 (5 checks + repeatOffenderRisk).
  const skippedCount = checks.filter(({ result }) => !result.dataAvailable).length
    + (repeatResult.points === null ? 1 : 0);

  const riskLevel = toRiskLevel(overallRiskScore, skippedCount);

  if (dataLimitations.length === 0) {
    dataLimitations.push('All risk signals were computed from available data.');
  }

  return {
    overallRiskScore,
    riskLevel,
    contributingFactors,
    dataLimitations,
  };
}

// Named exports for independent unit testing
module.exports = {
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
};

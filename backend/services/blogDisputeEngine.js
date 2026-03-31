/**
 * Blog Writing Dispute Rule Engine
 * Runs automatically on dispute creation for Content Writing / Blog Writing orders.
 * Produces: riskScore, faultSide, flags[], autoRecommendation, requiresEvidence[]
 */

const fs = require('fs').promises;
const path = require('path');

// ─── Word Count Utilities ──────────────────────────────────────────────────────

/**
 * Count words in a plain text string.
 */
function countWordsInText(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Attempt to read a delivery file and count its words.
 * Supports: .txt files (direct), others return 0.
 */
async function countWordsInFile(filePath) {
  try {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath.replace(/^\//, ''));

    const ext = path.extname(fullPath).toLowerCase();

    if (ext === '.txt') {
      const content = await fs.readFile(fullPath, 'utf-8');
      return countWordsInText(content);
    }

    // For non-txt files return 0 — word count unknown
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Detect the word count from all delivery files of an order.
 * Returns the highest word count found across files (best effort).
 */
async function detectDeliveredWordCount(deliveryFiles) {
  if (!deliveryFiles || deliveryFiles.length === 0) return 0;

  let maxWords = 0;
  for (const filePath of deliveryFiles) {
    const count = await countWordsInFile(filePath);
    if (count > maxWords) maxWords = count;
  }
  return maxWords;
}

// ─── Rule Definitions ─────────────────────────────────────────────────────────

const RULES = [
  // ── DEADLINE RULES ──────────────────────────────────────────────────────────
  {
    id: 'DEADLINE_VIOLATED',
    label: 'Deadline Violated',
    description: 'Seller submitted delivery after the agreed deadline.',
    check(order) {
      const deadline = order.scopeBox?.deadline;
      if (!deadline) return false;
      const submittedLog = (order.orderLogs || []).find(l =>
        l.event === 'STATUS_CHANGED_TO_SUBMITTED'
      );
      if (!submittedLog) return false;
      return new Date(submittedLog.timestamp) > new Date(deadline);
    },
    fault: 'seller',
    severity: 'HIGH',
    riskPoints: 28
  },
  {
    id: 'DISPUTE_TOO_FAST',
    label: 'Instant Dispute (Possible Bad Faith)',
    description: 'Dispute was raised within 1 hour of delivery.',
    check(order, dispute) {
      const submittedLog = (order.orderLogs || []).find(l =>
        l.event === 'STATUS_CHANGED_TO_SUBMITTED'
      );
      if (!submittedLog) return false;
      const submittedAt = new Date(submittedLog.timestamp);
      const disputeAt = new Date(dispute.createdAt || Date.now());
      const diffHours = (disputeAt - submittedAt) / (1000 * 60 * 60);
      return diffHours < 1;
    },
    fault: 'buyer',
    severity: 'MEDIUM',
    riskPoints: 20
  },
  {
    id: 'DISPUTE_TOO_LATE',
    label: 'Late Dispute (>7 days after delivery)',
    description: 'Dispute was raised more than 7 days after delivery was submitted.',
    check(order, dispute) {
      const submittedLog = (order.orderLogs || []).find(l =>
        l.event === 'STATUS_CHANGED_TO_SUBMITTED'
      );
      if (!submittedLog) return false;
      const submittedAt = new Date(submittedLog.timestamp);
      const disputeAt = new Date(dispute.createdAt || Date.now());
      const diffDays = (disputeAt - submittedAt) / (1000 * 60 * 60 * 24);
      return diffDays > 7;
    },
    fault: 'buyer',
    severity: 'MEDIUM',
    riskPoints: 15
  },

  // ── DELIVERY RULES ──────────────────────────────────────────────────────────
  {
    id: 'NO_DELIVERY_FILES',
    label: 'No Delivery Files',
    description: 'Order was marked as submitted but no files were delivered.',
    check(order) {
      return !order.deliveryFiles || order.deliveryFiles.length === 0;
    },
    fault: 'seller',
    severity: 'CRITICAL',
    riskPoints: 45
  },

  // ── WORD COUNT RULES ─────────────────────────────────────────────────────────
  {
    id: 'WORD_COUNT_CRITICAL',
    label: 'Word Count Severely Short (<60% of minimum)',
    description: 'Seller delivered critically fewer words than agreed minimum.',
    check(order, dispute, analyzedWordCount) {
      const minWords = extractMinWordCount(order);
      return minWords > 0 && analyzedWordCount > 0 && analyzedWordCount < minWords * 0.6;
    },
    fault: 'seller',
    severity: 'CRITICAL',
    riskPoints: 40
  },
  {
    id: 'WORD_COUNT_SHORT',
    label: 'Word Count Short (<80% of minimum)',
    description: 'Seller delivered fewer words than the agreed minimum.',
    check(order, dispute, analyzedWordCount) {
      const minWords = extractMinWordCount(order);
      return (
        minWords > 0 &&
        analyzedWordCount > 0 &&
        analyzedWordCount >= minWords * 0.6 &&
        analyzedWordCount < minWords * 0.8
      );
    },
    fault: 'seller',
    severity: 'HIGH',
    riskPoints: 28
  },
  {
    id: 'WORD_COUNT_SLIGHTLY_SHORT',
    label: 'Word Count Slightly Below Minimum (80-100%)',
    description: 'Delivery is slightly below the agreed minimum word count.',
    check(order, dispute, analyzedWordCount) {
      const minWords = extractMinWordCount(order);
      return (
        minWords > 0 &&
        analyzedWordCount > 0 &&
        analyzedWordCount >= minWords * 0.8 &&
        analyzedWordCount < minWords
      );
    },
    fault: 'neutral',
    severity: 'LOW',
    riskPoints: 10
  },

  // ── CONTENT QUALITY / SCOPE RULES ──────────────────────────────────────────
  {
    id: 'TOPIC_MISMATCH_CLAIMED',
    label: 'Topic Mismatch Claimed by Buyer',
    description: 'Buyer explicitly mentioned wrong topic or subject matter in dispute.',
    check(order, dispute) {
      const desc = (dispute.description || '').toLowerCase();
      return (
        desc.includes('wrong topic') ||
        desc.includes('different topic') ||
        desc.includes('not what i asked') ||
        desc.includes('wrong subject') ||
        desc.includes('irrelevant content') ||
        desc.includes('off topic')
      );
    },
    fault: 'seller',
    severity: 'HIGH',
    riskPoints: 25
  },
  {
    id: 'PLAGIARISM_CLAIMED',
    label: 'Plagiarism Claimed by Buyer',
    description: 'Buyer reported content is plagiarized or copied.',
    check(order, dispute) {
      const desc = (dispute.description || '').toLowerCase();
      return (
        desc.includes('plagiar') ||
        desc.includes('copied') ||
        desc.includes('not original') ||
        desc.includes('copied from') ||
        desc.includes('stolen')
      );
    },
    fault: 'seller',
    severity: 'CRITICAL',
    riskPoints: 35
  },
  {
    id: 'QUALITY_ISSUE_CLAIMED',
    label: 'Quality Below Standard',
    description: 'Buyer reports the writing quality is below acceptable standards.',
    check(order, dispute) {
      return dispute.reason === 'QUALITY_ISSUE' || dispute.reason === 'Quality Issue';
    },
    fault: 'neutral',
    severity: 'MEDIUM',
    riskPoints: 15
  },

  // ── FINANCIAL RISK ──────────────────────────────────────────────────────────
  {
    id: 'HIGH_VALUE_ORDER',
    label: 'High-Value Order (>$200)',
    description: 'Order value exceeds $200 — requires careful human review.',
    check(order) {
      return parseFloat(order.scopeBox?.price || 0) > 200;
    },
    fault: 'neutral',
    severity: 'HIGH',
    riskPoints: 15
  },
  {
    id: 'VERY_HIGH_VALUE_ORDER',
    label: 'Very High-Value Order (>$500)',
    description: 'Order value exceeds $500 — mandatory human escalation.',
    check(order) {
      return parseFloat(order.scopeBox?.price || 0) > 500;
    },
    fault: 'neutral',
    severity: 'CRITICAL',
    riskPoints: 20
  }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractMinWordCount(order) {
  const spec = order.scopeBox?.contentWritingSpecific || {};
  const raw =
    spec.wordCount ||
    spec.minWordCount ||
    order.scopeBox?.wordCount ||
    order.scopeBox?.minWordCount ||
    0;
  return parseInt(raw) || 0;
}

// ─── Main Engine ───────────────────────────────────────────────────────────────

/**
 * Run the rule engine for a blog writing dispute.
 *
 * @param {Object} order        - Sequelize Order instance (plain JS object)
 * @param {Object} dispute      - Sequelize Dispute instance (plain JS object)
 * @param {number} analyzedWordCount - Word count extracted from delivery files
 * @returns {Object}            - Rule engine result
 */
function runBlogDisputeEngine(order, dispute, analyzedWordCount = 0) {
  const triggeredFlags = [];
  let totalRiskPoints = 0;
  let sellerFaultPoints = 0;
  let buyerFaultPoints = 0;

  for (const rule of RULES) {
    try {
      const triggered = rule.check(order, dispute, analyzedWordCount);
      if (triggered) {
        triggeredFlags.push({
          ruleId: rule.id,
          label: rule.label,
          description: rule.description,
          fault: rule.fault,
          severity: rule.severity,
          riskPoints: rule.riskPoints
        });
        totalRiskPoints += rule.riskPoints;
        if (rule.fault === 'seller') sellerFaultPoints += rule.riskPoints;
        if (rule.fault === 'buyer') buyerFaultPoints += rule.riskPoints;
      }
    } catch {
      // Skip individual rule failures silently
    }
  }

  const riskScore = Math.min(totalRiskPoints, 100);

  // Determine predominant fault side
  let faultSide = 'neutral';
  if (sellerFaultPoints >= buyerFaultPoints + 10) faultSide = 'seller';
  else if (buyerFaultPoints >= sellerFaultPoints + 10) faultSide = 'buyer';

  // Determine auto-recommendation
  let autoRecommendation = 'ESCALATE';
  let confidence = 0.35;

  const hasCritical = triggeredFlags.some(f => f.severity === 'CRITICAL');

  if (hasCritical && faultSide === 'seller') {
    autoRecommendation = 'REFUND_BUYER';
    confidence = 0.82;
  } else if (hasCritical && faultSide === 'buyer') {
    autoRecommendation = 'RELEASE_TO_SELLER';
    confidence = 0.75;
  } else if (riskScore >= 50 && faultSide === 'seller') {
    autoRecommendation = 'REFUND_BUYER';
    confidence = Math.min(0.90, 0.50 + riskScore / 200);
  } else if (riskScore >= 30 && faultSide === 'buyer') {
    autoRecommendation = 'RELEASE_TO_SELLER';
    confidence = Math.min(0.80, 0.40 + riskScore / 250);
  } else if (triggeredFlags.length === 0) {
    autoRecommendation = 'ESCALATE';
    confidence = 0.30;
  }

  // Who must provide counter-evidence
  const requiresEvidence = [...new Set([
    ...(faultSide === 'seller' || triggeredFlags.some(f => f.fault === 'seller') ? ['seller'] : []),
    ...(faultSide === 'buyer' || triggeredFlags.some(f => f.fault === 'buyer') ? ['buyer'] : [])
  ])];
  if (requiresEvidence.length === 0) requiresEvidence.push('seller', 'buyer');

  const minWords = extractMinWordCount(order);

  return {
    riskScore,
    faultSide,
    flags: triggeredFlags,
    autoRecommendation,
    confidence,
    requiresEvidence,
    sellerFaultPoints,
    buyerFaultPoints,
    flagCount: triggeredFlags.length,
    hasCritical,
    minWordCount: minWords,
    analyzedWordCount,
    wordCountDelta: minWords > 0 && analyzedWordCount > 0 ? analyzedWordCount - minWords : null
  };
}

module.exports = {
  runBlogDisputeEngine,
  detectDeliveredWordCount,
  countWordsInText,
  extractMinWordCount
};

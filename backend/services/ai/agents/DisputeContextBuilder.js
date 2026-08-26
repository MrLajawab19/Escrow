/**
 * DisputeContextBuilder.js
 * Stage 4 of the multi-agent arbitration pipeline.
 *
 * NOTE ON NAMING: This corresponds to the "Category Reasoner" box in the
 * original architecture diagram. However, because ScrowX dropped dispute 
 * categories/niches in favor of a generalized deed form, there is no 
 * category-specific reasoning to do. 
 *
 * This module is a pure, DETERMINISTIC COMBINER. It takes the outputs of:
 *   1) EvidenceExtractor
 *   2) RuleChecker
 *   3) RiskScorer
 * ...and normalizes them (along with raw deed/dispute fields) into the 
 * single structured context object that VerdictSynthesizer will consume.
 *
 * No AI/LLM calls happen here.
 */
'use strict';

const { HIGH_VALUE_THRESHOLD_INR, HIGH_VALUE_THRESHOLD_USD } = require('../../../config/disputeConfig');

// ── Helpers ───────────────────────────────────────────────────────────────────

function isHighStakes(currency, amount) {
  const curr = (currency || 'INR').toUpperCase();
  const thresholdMajor = curr === 'USD' ? HIGH_VALUE_THRESHOLD_USD : HIGH_VALUE_THRESHOLD_INR;
  const thresholdSubUnit = thresholdMajor * 100;
  return (amount || 0) >= thresholdSubUnit;
}

/**
 * Determines the overall trust/quality of the assembled context.
 * VerdictSynthesizer uses this to decide how cautiously to weigh the data.
 */
function assessDataQuality(evidenceResult, riskResult) {
  let issues = 0;

  if (!evidenceResult || evidenceResult.extractionError) {
    issues += 2; // Critical failure
  } else if (evidenceResult.unresolvedGaps && evidenceResult.unresolvedGaps.length > 0) {
    issues += 1;
  }

  if (!riskResult || riskResult.riskLevel === 'indeterminate') {
    issues += 1;
  }

  if (issues === 0) return 'high';
  if (issues === 1) return 'partial';
  return 'low';
}

// ── Main Combiner ─────────────────────────────────────────────────────────────

/**
 * Assembles the three agents' outputs and the raw DB records into a unified 
 * context object for the VerdictSynthesizer.
 *
 * Gracefully handles null/missing agent outputs (e.g. if a stage failed or was skipped).
 *
 * @param {{
 *   evidenceResult?: object,
 *   ruleResult?:     object,
 *   riskResult?:     object,
 *   dispute?:        object,
 *   deed?:           object,
 *   isReAnalysis?:   boolean
 * }} input
 *
 * @returns {object} The unified context object.
 */
function buildDisputeContext({
  evidenceResult = null,
  ruleResult     = null,
  riskResult     = null,
  dispute        = null,
  deed           = null,
  isReAnalysis   = false,
} = {}) {
  
  const quality = assessDataQuality(evidenceResult, riskResult);

  // If we weren't explicitly told it's a re-analysis, try to infer from rule checker
  const inferredReAnalysis = isReAnalysis || 
    (ruleResult?.automatedFlags || []).some(f => f.includes('re-analysis'));

  return {
    disputeSummary: {
      reason:       dispute?.reason || 'Unknown reason',
      description:  dispute?.description || 'No description provided',
      raisedBy:     dispute?.raisedBy || 'UNKNOWN',
      isReAnalysis: inferredReAnalysis,
    },
    deedSummary: {
      amount:       deed?.amount || 0,
      currency:     deed?.currency || 'INR',
      description:  deed?.description || deed?.title || 'No description provided',
      isHighStakes: isHighStakes(deed?.currency, deed?.amount),
    },
    extractedFacts: evidenceResult?.facts || [],
    evidenceGaps:   evidenceResult?.unresolvedGaps || [],
    // EvidenceExtractor flags + RuleChecker evidence flags
    evidenceFlags:  [
      ...(evidenceResult?.flagsForReview || []),
      ...(ruleResult?.evidenceFlags || [])
    ],
    ruleViolations: {
      deadlineViolation:   ruleResult?.deadlineViolation || null,
      milestoneCompliance: ruleResult?.milestoneCompliance || null,
      automatedFlags:      ruleResult?.automatedFlags || [],
      revisionLimitCheck:  ruleResult?.revisionLimitCheck || null,
    },
    riskAssessment: {
      level:       riskResult?.riskLevel || 'unknown',
      score:       riskResult?.overallRiskScore || 0,
      factors:     riskResult?.contributingFactors || [],
      limitations: riskResult?.dataLimitations || [],
    },
    overallDataQuality: quality,
  };
}

// ── Prompt Text Generator ─────────────────────────────────────────────────────

/**
 * Converts the structured context object into readable prompt text.
 * This is what VerdictSynthesizer will eventually pass to the LLM as the "context"
 * string, providing unambiguous, pre-structured facts instead of raw DB dumps.
 *
 * @param {object} context — The output of buildDisputeContext()
 * @returns {string} Formatted markdown text
 */
function contextToPromptText(context) {
  if (!context) return 'No context provided.';

  let text = `=== DISPUTE CONTEXT ===\n`;
  text += `Data Quality: ${context.overallDataQuality.toUpperCase()}\n\n`;

  text += `[DISPUTE SUMMARY]\n`;
  text += `Raised By: ${context.disputeSummary.raisedBy}\n`;
  text += `Reason: ${context.disputeSummary.reason}\n`;
  text += `Description: ${context.disputeSummary.description}\n`;
  text += `Is Re-analysis: ${context.disputeSummary.isReAnalysis ? 'YES (Challenges submitted)' : 'NO (First pass)'}\n\n`;

  text += `[DEED SUMMARY]\n`;
  text += `Value: ${context.deedSummary.currency} ${(context.deedSummary.amount / 100).toFixed(2)}\n`;
  text += `High Stakes: ${context.deedSummary.isHighStakes ? 'YES' : 'NO'}\n`;
  text += `Description: ${context.deedSummary.description}\n\n`;

  text += `[EXTRACTED FACTS]\n`;
  if (context.extractedFacts.length > 0) {
    context.extractedFacts.forEach((f, i) => {
      text += ` ${i + 1}. ${f.fact} (Source: ${f.source}, Confidence: ${f.confidence})\n`;
    });
  } else {
    text += ` (No facts extracted)\n`;
  }
  text += '\n';

  if (context.evidenceGaps.length > 0) {
    text += `[EVIDENCE GAPS / MISSING CONTEXT]\n`;
    context.evidenceGaps.forEach(g => text += ` - ${g}\n`);
    text += '\n';
  }

  if (context.evidenceFlags.length > 0) {
    text += `[EVIDENCE FLAGS / ANOMALIES]\n`;
    context.evidenceFlags.forEach(f => text += ` - ${f}\n`);
    text += '\n';
  }

  text += `[RULE COMPLIANCE]\n`;
  if (context.ruleViolations.deadlineViolation?.violated) {
    text += ` - Deadline Violated: ${context.ruleViolations.deadlineViolation.daysLate} day(s) late.\n`;
  } else if (context.ruleViolations.deadlineViolation) {
    text += ` - Deadline Compliant.\n`;
  }
  if (context.ruleViolations.milestoneCompliance?.compliant === false) {
    text += ` - Milestones: ${context.ruleViolations.milestoneCompliance.overdueCount} overdue.\n`;
  }
  if (context.ruleViolations.revisionLimitCheck?.exceeded) {
    text += ` - Revision Limit: Exceeded.\n`;
  }
  context.ruleViolations.automatedFlags.forEach(f => text += ` - Flag: ${f}\n`);
  text += '\n';

  text += `[BEHAVIORAL RISK ASSESSMENT]\n`;
  text += ` Risk Level: ${context.riskAssessment.level.toUpperCase()} (Score: ${context.riskAssessment.score}/100)\n`;
  if (context.riskAssessment.factors.length > 0) {
    text += ` Contributing Factors:\n`;
    context.riskAssessment.factors.forEach(f => {
      text += `   - ${f.factor} (+${f.points} pts): ${f.explanation}\n`;
    });
  }
  if (context.riskAssessment.limitations.length > 0) {
    text += ` Data Limitations:\n`;
    context.riskAssessment.limitations.forEach(l => {
      text += `   - ${l}\n`;
    });
  }

  return text.trim();
}

module.exports = {
  buildDisputeContext,
  contextToPromptText,
};

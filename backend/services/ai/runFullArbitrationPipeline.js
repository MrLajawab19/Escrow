'use strict';

const { extractEvidence }      = require('./agents/EvidenceExtractor');
const { checkRules }           = require('./agents/RuleChecker');
const { scoreRisk }            = require('./agents/RiskScorer');
const { buildDisputeContext }  = require('./agents/DisputeContextBuilder');
const { synthesizeVerdictFromContext } = require('./agents/VerdictSynthesizer');

/**
 * Orchestrates the full multi-agent arbitration pipeline.
 * Runs EvidenceExtractor, RuleChecker, RiskScorer, DisputeContextBuilder,
 * and finally VerdictSynthesizer.
 * 
 * @param {object} input
 * @param {object} input.dispute
 * @param {object} input.deed
 * @param {array}  input.evidenceEvents
 * @param {object} input.buyer
 * @param {object} input.seller
 * @param {object} input.priorDisputeHistory
 * @param {boolean} input.highStakes
 * @returns {Promise<object>} { faultSide, recommendation, confidenceScore, reasoning, providerUsed, disputeContext }
 */
async function runFullArbitrationPipeline({ 
  dispute, 
  deed, 
  evidenceEvents, 
  buyer, 
  seller, 
  priorDisputeHistory, 
  highStakes 
}) {
  const _now = new Date();

  // 1. Evidence Extractor
  let evidenceResult = { 
    facts: [], gaps: [], flags: [], 
    extractionError: 'EvidenceExtractor was skipped or failed.' 
  };
  try {
    const buyerEv = evidenceEvents.find(e => e.type === 'EVIDENCE_SUBMITTED' && e.actorRole === 'buyer');
    const sellerEv = evidenceEvents.find(e => e.type === 'EVIDENCE_SUBMITTED' && e.actorRole === 'seller');

    evidenceResult = await extractEvidence({
      buyerEvidence: buyerEv ? buyerEv.payload : null,
      sellerEvidence: sellerEv ? sellerEv.payload : null,
      disputeReason: dispute.reason,
      disputeDescription: dispute.description
    });
  } catch (err) {
    console.error('[FullPipeline] EvidenceExtractor step failed:', err.message);
    // fallback minimal evidence result already set above
  }

  // 2. Rule Checker
  let ruleResult = { flags: [], deadlineViolated: false };
  try {
    ruleResult = checkRules({
      deed,
      dispute,
      evidenceEvents,
      referenceDate: _now
    });
  } catch (err) {
    console.error('[FullPipeline] RuleChecker step failed:', err.message);
  }

  // 3. Risk Scorer
  let riskResult = null;
  try {
    riskResult = scoreRisk({
      buyer,
      seller,
      deed,
      dispute,
      ruleCheckerOutput: ruleResult,
      priorDisputeHistory,
      _now
    });
  } catch (err) {
    console.error('[FullPipeline] RiskScorer step failed:', err.message);
  }

  // 4. Dispute Context Builder
  let disputeContext = null;
  try {
    disputeContext = buildDisputeContext({
      evidenceResult,
      ruleResult,
      riskResult,
      dispute,
      deed
    });
  } catch (err) {
    console.error('[FullPipeline] DisputeContextBuilder step failed:', err.message);
    throw err; // If context builder fails, we can't synthesize
  }

  // 5. Verdict Synthesizer
  // If this fails, let it propagate up to the caller
  const verdict = await synthesizeVerdictFromContext(disputeContext, { highStakes });

  console.log(
    `[FullPipeline] Completed for dispute ${dispute.id} — ` +
    `dataQuality=${disputeContext.overallDataQuality}, ` +
    `recommendation=${verdict.recommendation}, provider=${verdict.providerUsed}`
  );

  return {
    ...verdict,
    disputeContext
  };
}

module.exports = { runFullArbitrationPipeline };

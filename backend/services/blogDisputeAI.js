/**
 * Blog Writing Dispute AI Analysis Layer
 * Uses xAI Grok when configured; always falls back to rule-engine output so DB + UI never hang.
 */

const { grokChatCompletion } = require('./grokClient');

function normalizeRuleEngine(ruleEngineResult) {
  const r =
    ruleEngineResult && typeof ruleEngineResult === 'object' ? { ...ruleEngineResult } : {};
  const flags = Array.isArray(r.flags) ? r.flags : [];
  const riskScore = Math.min(100, Math.max(0, Number(r.riskScore) || 0));
  return {
    ...r,
    flags,
    flagCount: typeof r.flagCount === 'number' ? r.flagCount : flags.length,
    riskScore,
    autoRecommendation: r.autoRecommendation || 'ESCALATE_TO_HUMAN',
    sellerFaultPoints: Number(r.sellerFaultPoints) || 0,
    buyerFaultPoints: Number(r.buyerFaultPoints) || 0,
    analyzedWordCount: r.analyzedWordCount != null ? Number(r.analyzedWordCount) : undefined,
    minWordCount: r.minWordCount,
    confidence: r.confidence != null ? Number(r.confidence) : undefined,
  };
}

function mapEngineRecommendation(rec) {
  if (!rec || rec === 'ESCALATE') return 'ESCALATE_TO_HUMAN';
  return rec;
}

// ─── Prompt Builder ────────────────────────────────────────────────────────────

function buildDisputePrompt({ order, dispute, ruleEngineResult, chatMessages }) {
  const rf = ruleEngineResult;
  const s = order.scopeBox || {};
  const spec = s.contentWritingSpecific || s.scriptWritingSpecific || {};
  const minWords = rf.minWordCount || spec.wordCount || s.wordCount || 'Not specified';
  const deliveredWords = rf.analyzedWordCount;

  const chatSummary =
    chatMessages && chatMessages.length > 0
      ? chatMessages
          .slice(-10)
          .map(m => `[${String(m.senderRole || 'user').toUpperCase()}]: ${m.content}`)
          .join('\n')
      : 'No chat messages available.';

  const evidenceSeller =
    dispute.evidenceResponses?.seller?.text || 'No response submitted yet.';
  const evidenceBuyer =
    dispute.evidenceResponses?.buyer?.text || 'No counter-statement submitted yet.';

  const flags = rf.flags || [];
  const flagSummary =
    flags.length > 0
      ? flags.map(f => `• [${f.severity}] ${f.label}: ${f.description}`).join('\n')
      : 'No automated flags triggered.';

  const flagCount = typeof rf.flagCount === 'number' ? rf.flagCount : flags.length;

  return `You are an expert AI dispute arbitrator for ScrowX, a freelance escrow platform. Analyze this blog/content writing dispute carefully and provide a fair, evidence-based recommendation.

═══════════════════════════════════════
ORDER DETAILS
═══════════════════════════════════════
Service Type: ${s.productType || 'Content Writing / Blog Writing'}
Blog Topic: ${spec.topic || s.topic || 'Not specified'}
Minimum Word Count Agreed: ${minWords} words
Delivered Word Count (auto-detected): ${deliveredWords > 0 ? deliveredWords + ' words' : 'Could not detect (non-txt file)'}
${deliveredWords > 0 && parseInt(minWords, 10) > 0 ? `Word Count Gap: ${deliveredWords - parseInt(minWords, 10)} words (${((deliveredWords / parseInt(minWords, 10)) * 100).toFixed(1)}% of minimum)` : ''}
Tone Required: ${spec.tone || s.tone || 'Not specified'}
SEO Keywords: ${spec.seoKeywords || s.seoKeywords || 'Not specified'}
Target Audience: ${spec.targetAudience || s.targetAudience || 'Not specified'}
Agreed Price (Escrow): $${s.price || '0'}
Deadline: ${s.deadline || 'Not specified'}
Delivery Files Count: ${order.deliveryFiles?.length || 0}

═══════════════════════════════════════
DISPUTE DETAILS
═══════════════════════════════════════
Raised By: ${dispute.raisedBy}
Reason: ${dispute.reason}
Buyer's Complaint: ${dispute.description}
Requested Resolution: ${dispute.requestedResolution || 'Not specified'}

═══════════════════════════════════════
AUTOMATED RULE ENGINE FLAGS (${flagCount} flags found)
═══════════════════════════════════════
Overall Risk Score: ${rf.riskScore}/100
Rule Engine Recommendation: ${rf.autoRecommendation}
Seller Fault Points: ${rf.sellerFaultPoints}
Buyer Fault Points: ${rf.buyerFaultPoints}
Flags:
${flagSummary}

═══════════════════════════════════════
RECENT CHAT MESSAGES (last 10)
═══════════════════════════════════════
${chatSummary}

═══════════════════════════════════════
SELLER'S COUNTER-EVIDENCE
═══════════════════════════════════════
${evidenceSeller}

═══════════════════════════════════════
BUYER'S ADDITIONAL STATEMENT
═══════════════════════════════════════
${evidenceBuyer}

═══════════════════════════════════════
YOUR TASK
═══════════════════════════════════════
Provide your analysis as a JSON object ONLY. No markdown, no extra text, just pure JSON:

{
  "recommendation": "REFUND_BUYER" | "RELEASE_TO_SELLER" | "PARTIAL_REFUND" | "ESCALATE_TO_HUMAN",
  "confidence": <number 0.0-1.0>,
  "reasoning": "<2-4 sentences explaining your recommendation clearly>",
  "riskFactors": ["<factor1>", "<factor2>"],
  "fraudProbability": <number 0.0-1.0>,
  "behavioralScore": <number 0-100, higher = more trustworthy seller behavior>,
  "summary": "<one concise line for admin dashboard>",
  "sellerFaultProbability": <number 0.0-1.0>,
  "buyerFaultProbability": <number 0.0-1.0>,
  "partialRefundPercent": <number 0-100, only if recommendation is PARTIAL_REFUND, else null>,
  "keyFindings": ["<finding1>", "<finding2>", "<finding3>"]
}`;
}

// ─── Main AI Analysis Function ────────────────────────────────────────────────

/**
 * @returns {Promise<Object>} Always resolves — never throws.
 */
async function analyzeDisputeWithAI({ order, dispute, ruleEngineResult, chatMessages }) {
  const normalized = normalizeRuleEngine(ruleEngineResult);

  const runGrok = async () => {
    const prompt = buildDisputePrompt({
      order,
      dispute,
      ruleEngineResult: normalized,
      chatMessages,
    });

    const rawText = await grokChatCompletion([{ role: 'user', content: prompt }], {
      max_tokens: 2048,
      temperature: 0.2,
    });

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      recommendation: mapEngineRecommendation(
        parsed.recommendation || normalized.autoRecommendation
      ),
      confidence: clamp(parsed.confidence, 0, 1),
      reasoning: parsed.reasoning || 'AI analysis completed.',
      riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
      fraudProbability: clamp(parsed.fraudProbability, 0, 1),
      behavioralScore: clamp(parsed.behavioralScore, 0, 100),
      summary: parsed.summary || 'AI review completed.',
      sellerFaultProbability: clamp(parsed.sellerFaultProbability, 0, 1),
      buyerFaultProbability: clamp(parsed.buyerFaultProbability, 0, 1),
      partialRefundPercent: parsed.partialRefundPercent || null,
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      source: 'grok',
    };
  };

  const key = process.env.GROK_API_KEY && String(process.env.GROK_API_KEY).trim();
  if (!key) {
    return buildFallbackAnalysis(normalized, 'GROK_API_KEY not set');
  }

  try {
    return await runGrok();
  } catch (error) {
    console.error('[blogDisputeAI] Grok analysis failed:', error.message);
    try {
      return buildFallbackAnalysis(normalized, error.message);
    } catch (e2) {
      console.error('[blogDisputeAI] Fallback builder failed:', e2.message);
      return minimalAnalysis(normalized, `${error.message} | ${e2.message}`);
    }
  }
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function buildFallbackAnalysis(ruleEngineResult, errorMsg) {
  const rf = normalizeRuleEngine(ruleEngineResult);
  const flags = rf.flags;
  const sellerFault = rf.sellerFaultPoints;
  const buyerFault = rf.buyerFaultPoints;
  const total = sellerFault + buyerFault || 1;

  return {
    recommendation: mapEngineRecommendation(rf.autoRecommendation),
    confidence: rf.confidence != null ? clamp(rf.confidence, 0, 1) : 0.4,
    reasoning:
      flags.length > 0
        ? `Rule engine identified ${rf.flagCount} issue(s): ${flags.map(f => f.label).join('; ')}.`
        : 'No clear violations detected. Manual review recommended.',
    riskFactors: flags.map(f => f.ruleId).filter(Boolean),
    fraudProbability: Math.min(0.8, (Number(rf.riskScore) || 0) / 120),
    behavioralScore: Math.max(20, 100 - (Number(rf.riskScore) || 0)),
    summary: `Rule-based: ${mapEngineRecommendation(rf.autoRecommendation)} (AI unavailable)`,
    sellerFaultProbability: sellerFault / total,
    buyerFaultProbability: buyerFault / total,
    partialRefundPercent: null,
    keyFindings: flags.map(f => f.description).filter(Boolean),
    source: 'rule_engine_fallback',
    fallbackReason: errorMsg,
  };
}

function minimalAnalysis(ruleEngineResult, errMsg) {
  const rf = normalizeRuleEngine(ruleEngineResult);
  return {
    recommendation: mapEngineRecommendation(rf.autoRecommendation),
    confidence: 0.35,
    reasoning:
      'Automated AI call could not be completed. Use rule-engine flags and timeline below to decide.',
    riskFactors: [],
    fraudProbability: Math.min(0.8, (Number(rf.riskScore) || 0) / 120),
    behavioralScore: Math.max(20, 100 - (Number(rf.riskScore) || 0)),
    summary: 'Use rule engine — AI step failed',
    sellerFaultProbability: 0.5,
    buyerFaultProbability: 0.5,
    partialRefundPercent: null,
    keyFindings: (rf.flags || []).map(f => f.description).filter(Boolean),
    source: 'rule_engine_fallback',
    fallbackReason: errMsg,
  };
}

function clamp(val, min, max) {
  const n = parseFloat(val);
  if (isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

module.exports = {
  analyzeDisputeWithAI,
  buildFallbackAnalysis,
  normalizeRuleEngine,
  minimalAnalysis,
};

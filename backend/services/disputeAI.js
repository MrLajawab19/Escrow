/**
 * disputeAI.js
 * AI engine for generating universal dispute recommendations across all products.
 */
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy-key" });
const disputeConfig = require('../config/disputeConfig');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Phase 5: new multi-provider arbitration path (low-stakes only, feature-flagged)
const { runFullArbitrationPipeline } = require('./ai/runFullArbitrationPipeline');

const generateAIReport = async (deedDisputeId) => {
  try {
    const dispute = await prisma.deedDispute.findUnique({
      where: { id: deedDisputeId },
      include: { events: { orderBy: { createdAt: 'asc' } }, deed: true }
    });
    
    if (!dispute) return;
    
    // Prevent wasteful writes if already escalated
    if (dispute.status === 'ESCALATED') {
      console.log(`[AI] Dispute ${deedDisputeId} is already ESCALATED. Skipping AI report.`);
      return;
    }
    
    const events = dispute.events;
    const aiReports = events.filter(e => e.type === 'AI_REPORT');
    const isReAnalysis = aiReports.length > 0;
    
    // Extract Evidence
    const buyerEv = events.find(e => e.type === 'EVIDENCE_SUBMITTED' && e.actorRole === 'buyer');
    const sellerEv = events.find(e => e.type === 'EVIDENCE_SUBMITTED' && e.actorRole === 'seller');
    
    const buyerFiles = buyerEv && buyerEv.payload.evidenceUrls?.length ? `Files Uploaded: ${buyerEv.payload.evidenceUrls.join(', ')}` : 'Files Uploaded: None';
    const buyerEvidenceContext = buyerEv 
      ? `[Submitted ${buyerEv.payload.isLate ? 'LATE' : 'ON TIME'}] Rebuttal: ${buyerEv.payload.rebuttal}\n${buyerFiles}` 
      : `[No evidence submitted. The buyer failed to respond within the ${disputeConfig.EVIDENCE_LATE_WINDOW_HOURS}-hour window. You must weigh their silence negatively.]`;
      
    const sellerFiles = sellerEv && sellerEv.payload.evidenceUrls?.length ? `Files Uploaded: ${sellerEv.payload.evidenceUrls.join(', ')}` : 'Files Uploaded: None';
    const sellerEvidenceContext = sellerEv 
      ? `[Submitted ${sellerEv.payload.isLate ? 'LATE' : 'ON TIME'}] Rebuttal: ${sellerEv.payload.rebuttal}\n${sellerFiles}` 
      : `[No evidence submitted. The seller failed to respond within the ${disputeConfig.EVIDENCE_LATE_WINDOW_HOURS}-hour window. You must weigh their silence negatively.]`;

    // Extract Challenges
    let challengeContext = '';
    if (isReAnalysis) {
      const originalReport = aiReports[0].payload;
      const buyerCh = events.find(e => e.type === 'CHALLENGE' && e.actorRole === 'buyer');
      const sellerCh = events.find(e => e.type === 'CHALLENGE' && e.actorRole === 'seller');
      
      challengeContext = `
--- ORIGINAL AI REPORT ---
Fault Side: ${originalReport.faultSide}
Reasoning: ${originalReport.reasoning}

--- CHALLENGE SUBMISSIONS ---
BUYER CHALLENGE:
${buyerCh ? `Rebuttal: ${buyerCh.payload.rebuttal}` : '[Did not challenge]'}

SELLER CHALLENGE:
${sellerCh ? `Rebuttal: ${sellerCh.payload.rebuttal}` : '[Did not challenge]'}
`;
    }

    const prompt = `
You are the elite Escrow AI arbiter for ScrowX, dealing with a dispute.
Analyze this dispute impartially based on the provided evidence ledger.

--- PASS TYPE ---
${isReAnalysis 
  ? "This is a CHALLENGE RE-ANALYSIS. The original AI Report is provided below. One or both parties submitted rebuttals to your original verdict. You must re-evaluate your original verdict based strictly on these new rebuttals." 
  : "This is a FIRST-PASS ANALYSIS. You are evaluating the initial evidence submitted by both parties."}

--- ORDER DETAILS ---
Amount: ${dispute.deed.currency} ${dispute.deed.amount}
Description: ${dispute.deed.description || dispute.deed.title || 'None provided'}

--- DISPUTE CREATION ---
Raised By: ${dispute.raisedBy}
Reason: ${dispute.reason}
Description: ${dispute.description}

--- EVIDENCE SUBMISSIONS (${disputeConfig.EVIDENCE_LATE_WINDOW_HOURS}H WINDOW) ---
BUYER EVIDENCE:
${buyerEvidenceContext}

SELLER EVIDENCE:
${sellerEvidenceContext}
${challengeContext}

EXPECTED JSON FORMAT:
{
  "faultSide": "BUYER" | "SELLER" | "NEUTRAL",
  "recommendation": "REFUND_BUYER" | "RELEASE_TO_SELLER" | "MANUAL_REVIEW_REQUIRED",
  "confidenceScore": <number 0-100>,
  "reasoning": "<1-2 sentence explanation>"
}
    `;

    // ── Phase 5: High-stakes check (must run before both call paths) ────────────
    // Uses the IDENTICAL formula + constants as Stage C3 (lines 166-169) and
    // VerdictSynthesizer.js — same disputeConfig source, no duplication.
    const _currency      = (dispute.deed.currency || 'INR').toUpperCase();
    const _threshold     = (_currency === 'USD' ? disputeConfig.HIGH_VALUE_THRESHOLD_USD : disputeConfig.HIGH_VALUE_THRESHOLD_INR) * 100;
    const highStakes     = (dispute.deed.amount || 0) >= _threshold;

    // Fast-fail if just testing stub
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy-key') {
       console.log("[AI] Test mode stub returning mock data");
       
       const mockPayload = {
         faultSide: "BUYER",
         recommendation: "REFUND_BUYER",
         confidenceScore: 85,
         reasoning: "The seller failed to upload deliverables.",
         resolvedBy: 'legacy'
       };
       
       await prisma.disputeEvent.create({
         data: {
           deedDisputeId,
           type: 'AI_REPORT',
           actorRole: 'ai',
           payload: mockPayload
         }
       });

       await prisma.deedDispute.update({
         where: { id: deedDisputeId },
         data: { aiAnalysis: mockPayload, status: 'CHALLENGE_PHASE', lastActivity: new Date() }
       });
       console.log(`[AI] Dispute ${deedDisputeId} moved to CHALLENGE_PHASE (mock).`);
       return;
    }

    // ── Phase 5: New arbitration path (LOW-STAKES + flag ON only) ────────────────
    // HIGH-STAKES disputes ALWAYS bypass this block and use the legacy path below,
    // regardless of the flag value. This is a hard requirement, not a default.
    let faultSide, recommendation, confidenceScore, reasoning, resolvedBy, pipelineVersion;

    if (process.env.FEATURE_NEW_ARBITRATION_LOW_STAKES === 'true' && !highStakes) {
      try {
        const [buyer, seller] = await Promise.all([
          prisma.buyer.findUnique({ where: { id: dispute.buyerId } }),
          prisma.seller.findUnique({ where: { id: dispute.sellerId } })
        ]);

        const newResult = await runFullArbitrationPipeline({
          dispute,
          deed: dispute.deed,
          evidenceEvents: dispute.events || [],
          buyer,
          seller,
          priorDisputeHistory: null, // ScrowX has no history yet per Phase 8
          highStakes
        });

        if (newResult.parseError) {
          console.error('[AI] New arbitration path returned parseError, falling back to legacy Gemini call for this dispute:', deedDisputeId);
          throw new Error('parseError from new system');
        }

        ({ faultSide, recommendation, confidenceScore, reasoning } = newResult);
        resolvedBy = 'new_system';
        pipelineVersion = 'full_v1';
        console.log(`[AI] Dispute ${deedDisputeId} resolved via NEW arbitration system (low-stakes, provider=${newResult.providerUsed}, quality=${newResult.disputeContext?.overallDataQuality})`);
      } catch (err) {
        console.error('[AI] New arbitration path failed, falling back to legacy Gemini call:', err.message);
        // fall through — faultSide remains undefined, legacy block fires below
      }
    }

    // ── Legacy Gemini path — fires when: flag OFF, highStakes=true, or new path failed ──
    if (faultSide === undefined) {

      const result = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt
      });
      
      let text = result.text;
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const _parsed = JSON.parse(text);
      faultSide       = _parsed.faultSide;
      recommendation  = _parsed.recommendation;
      confidenceScore = _parsed.confidenceScore;
      reasoning       = _parsed.reasoning;
      resolvedBy      = 'legacy';
    } // end legacy block
    
    // Note (Accepted TOCTOU Gap): This is a check-then-act read.
    // If the dispute status flips to ESCALATED in the split millisecond between 
    // this check and the write below, we will write a harmless extra AI_REPORT row.
    // Because this doesn't mutate financial state or lock funds, we accept this minor gap.
    const currentDispute = await prisma.deedDispute.findUnique({ where: { id: deedDisputeId } });
    if (!currentDispute) {
      console.log(`[AI] Dispute ${deedDisputeId} no longer exists. Skipping write.`);
      return;
    }
    if (currentDispute.status === 'ESCALATED') {
      console.log(`[AI] Dispute ${deedDisputeId} became ESCALATED during generation. Skipping write.`);
      return;
    }

    const payload = { faultSide, recommendation, confidenceScore, reasoning, resolvedBy };
    if (pipelineVersion) {
      payload.pipelineVersion = pipelineVersion;
    }

    try {
      await prisma.disputeEvent.create({
        data: {
          deedDisputeId,
          type: 'AI_REPORT',
          actorRole: 'ai',
          payload
        }
      });

      await prisma.deedDispute.update({
        where: { id: deedDisputeId },
        data: { aiAnalysis: payload }
      });
      
      console.log(`[AI] Successfully generated ${isReAnalysis ? 're-analysis' : 'first-pass'} AI_REPORT for ${deedDisputeId}`);

      // --- STAGE C3: Value Threshold & Confidence Wiring ---
      
      const currency = (dispute.deed.currency || 'INR').toUpperCase();
      const thresholdMajor = currency === 'USD' ? disputeConfig.HIGH_VALUE_THRESHOLD_USD : disputeConfig.HIGH_VALUE_THRESHOLD_INR;
      const thresholdSubUnit = thresholdMajor * 100;
      const isHighValue = (dispute.deed.amount || 0) >= thresholdSubUnit;
      
      let shouldEscalate = false;
      let escalationReason = '';

      if (payload.confidenceScore < disputeConfig.AI_MIN_CONFIDENCE) {
        shouldEscalate = true;
        escalationReason = `AI confidence score (${payload.confidenceScore}) is below minimum threshold (${disputeConfig.AI_MIN_CONFIDENCE}).`;
      } else if (!isReAnalysis && isHighValue) {
        shouldEscalate = true;
        escalationReason = `Dispute value (${currency} ${(dispute.deed.amount || 0) / 100}) meets or exceeds auto-resolution threshold (${thresholdMajor}). AI report provided as advisory.`;
      }

      if (shouldEscalate) {
        await prisma.deedDispute.update({
          where: { id: deedDisputeId },
          data: { status: 'ESCALATED', lastActivity: new Date() }
        });
        
        await prisma.disputeEvent.create({
          data: {
            deedDisputeId,
            type: 'ESCALATED',
            actorRole: 'system',
            payload: { reason: escalationReason, triggeredBy: 'rules_engine' }
          }
        });
        console.log(`[AI] Dispute ${deedDisputeId} ESCALATED: ${escalationReason}`);
      } else if (!isReAnalysis) {
        // Safe to proceed to Challenge Phase
        await prisma.deedDispute.update({
          where: { id: deedDisputeId },
          data: { status: 'CHALLENGE_PHASE', lastActivity: new Date() }
        });
        console.log(`[AI] Dispute ${deedDisputeId} moved to CHALLENGE_PHASE.`);
      }
    } catch (dbError) {
      console.log(`[AI] Failed to write report — dispute record may have changed state or been removed`);
      return; // Do not fall through to the fallback block if it's a DB consistency error
    }

  } catch (error) {
    console.error("[AI] Orchestration Error:", error);
    
    // Graceful fallback to unblock the frontend
    try {
      await prisma.disputeEvent.create({
        data: {
          deedDisputeId,
          type: 'ESCALATED',
          actorRole: 'system',
          payload: { reason: "AI Analysis failed to generate (API Error). Defaulting to manual human review.", triggeredBy: "error_fallback" }
        }
      });
      await prisma.deedDispute.update({
        where: { id: deedDisputeId },
        data: { status: 'ESCALATED', lastActivity: new Date(), aiAnalysis: { faultSide: "NEUTRAL", recommendation: "ESCALATE_TO_HUMAN", confidenceScore: 0, reasoning: "AI Service unavailable. Human intervention required." } }
      });
    } catch (fallbackError) {
      console.error("[AI] Fallback Error:", fallbackError);
    }
  }
};

module.exports = {
  generateAIReport
};

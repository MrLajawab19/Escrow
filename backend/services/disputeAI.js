/**
 * disputeAI.js
 * AI engine for generating universal dispute recommendations across all products.
 */
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy-key" });
const disputeConfig = require('../config/disputeConfig');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    
    const buyerEvidenceContext = buyerEv 
      ? `[Submitted ${buyerEv.payload.isLate ? 'LATE' : 'ON TIME'}] Rebuttal: ${buyerEv.payload.rebuttal}` 
      : '[No evidence submitted. The buyer failed to respond within the 48-hour window. You must weigh their silence negatively.]';
      
    const sellerEvidenceContext = sellerEv 
      ? `[Submitted ${sellerEv.payload.isLate ? 'LATE' : 'ON TIME'}] Rebuttal: ${sellerEv.payload.rebuttal}` 
      : '[No evidence submitted. The seller failed to respond within the 48-hour window. You must weigh their silence negatively.]';

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

--- EVIDENCE SUBMISSIONS (48H WINDOW) ---
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

    // Fast-fail if just testing stub
    if (process.env.NODE_ENV === 'test' && !process.env.GEMINI_API_KEY) {
       console.log("[AI] Test mode stub returning mock data");
       return;
    }

    const result = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
    });
    
    let text = result.text;
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const payload = JSON.parse(text);
    
    // Note (Accepted TOCTOU Gap): This is a check-then-act read.
    // If the dispute status flips to ESCALATED in the split millisecond between 
    // this check and the write below, we will write a harmless extra AI_REPORT row.
    // Because this doesn't mutate financial state or lock funds, we accept this minor gap.
    const currentDispute = await prisma.deedDispute.findUnique({ where: { id: deedDisputeId } });
    if (currentDispute.status === 'ESCALATED') {
      console.log(`[AI] Dispute ${deedDisputeId} became ESCALATED during generation. Skipping write.`);
      return;
    }

    await prisma.disputeEvent.create({
      data: {
        deedDisputeId,
        type: 'AI_REPORT',
        actorRole: 'ai',
        payload
      }
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

  } catch (error) {
    console.error("[AI] Orchestration Error:", error);
  }
};

module.exports = {
  generateAIReport
};

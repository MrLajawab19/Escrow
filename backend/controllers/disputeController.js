const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateResolutionAmounts(price, buyerPct, disputeStatus = 'NONE') {
  if (buyerPct === 100) {
    return { buyerGross: price, sellerGross: 0, buyerFee: 0, sellerFee: 0, buyerNet: price, sellerNet: 0, platformFee: 0 };
  }
  let disputeRate = 0;
  if (disputeStatus === 'RESOLVED') disputeRate = 0.01;
  else if (disputeStatus === 'ESCALATED') disputeRate = 0.02;

  const sellerBaseRate = 0.025; // 2.5%

  // 1. Exact Split (Seller floored, remainder to buyer)
  const sellerGross = Math.floor(price * ((100 - buyerPct) / 100));
  const buyerGross = price - sellerGross;

  // 2. Individual floored fees
  const buyerFee = Math.floor(buyerGross * disputeRate);
  const sellerFee = Math.floor(sellerGross * (sellerBaseRate + disputeRate));

  // 3. Final Nets
  const buyerNet = buyerGross - buyerFee;
  const sellerNet = sellerGross - sellerFee;

  // 4. Platform Fee aggregates both
  const platformFee = buyerFee + sellerFee;
  return { buyerGross, sellerGross, buyerFee, sellerFee, buyerNet, sellerNet, platformFee };
}

/**
 * Fetch the most recent chat messages for an order (for AI context).
 * Uses OrderChatRoom → OrderChatMessage (Prisma models).
 */
async function getChatMessages(orderId) {
  try {
    const room = await prisma.orderChatRoom.findUnique({ where: { orderId } });
    if (!room) return [];
    return await prisma.orderChatMessage.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
  } catch {
    return [];
  }
}

// ─── Create Dispute ────────────────────────────────────────────────────────────

const createDispute = async (req, res) => {
  try {
    let { deedId, reason, description, requestedResolution, priority = 'MEDIUM' } = req.body;
    if (deedId === 'undefined' || deedId === 'null') deedId = null;

    if (!deedId || !reason || !description) {
      return res.status(400).json({ success: false, message: 'Deed ID, reason, and description are required' });
    }

    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) return res.status(404).json({ success: false, message: 'Deed not found' });

    const existingDispute = await prisma.deedDispute.findUnique({ where: { deedId } });
    if (existingDispute) {
      return res.status(400).json({ success: false, message: 'Dispute already exists for this deed' });
    }

    const raisedBy = req.user.role;
    const buyerId = deed.buyerId;
    const sellerId = deed.sellerId;

    const deliveryEvent = await prisma.auditLedger.findFirst({
      where: { deedId: deed.id, eventType: "DELIVERY_CLAIMED" },
      orderBy: { timestamp: 'desc' }
    });

    // Handle uploaded evidence files
    const evidenceFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    })) : [];
    const evidenceUrls = evidenceFiles.map(file => `/uploads/${file.filename}`);

    // ── Step 1 & 2: Extract Proof Data & Run rule engine ───────────────────────
    let ruleResult = { riskScore: 30, flagCount: 0, hasCritical: false, faultSide: 'UNKNOWN', autoRecommendation: 'MANUAL_REVIEW_REQUIRED' };
    try {
      const { extractProofData, runDisputeEngine } = require('../services/disputeEngine');
      const tempDispute = { description, reason, createdAt: new Date(), raisedBy };
      const proofData = extractProofData(deed, deliveryEvent);
      ruleResult = runDisputeEngine(deed, tempDispute, proofData);
    } catch (e) {
      console.error("Failed to run universal dispute engine:", e);
    }

    const initialTimeline = [
      {
        event: 'DISPUTE_CREATED',
        by: raisedBy,
        timestamp: new Date().toISOString(),
        description: `Dispute raised by ${raisedBy}: ${reason}`,
        notes: description,
      },
      {
        event: 'RULE_ENGINE_RAN',
        by: 'system',
        timestamp: new Date().toISOString(),
        description: `Auto-flagging complete. Risk score: ${ruleResult.riskScore}/100. Flags: ${ruleResult.flagCount}`,
        notes: `Fault side: ${ruleResult.faultSide}. Recommendation: ${ruleResult.autoRecommendation}`,
      },
    ];

    // ── Step 3: Create dispute record (Prisma) ─────────────────────────────────
    const dispute = await prisma.deedDispute.create({
      data: {
        deedId: deed.id,
        buyerId,
        sellerId,
        raisedBy,
        reason,
        description,
        evidenceUrls,
        requestedResolution: requestedResolution || null,
        priority: ruleResult.hasCritical ? 'HIGH' : priority,
        status: 'OPEN',
        ruleFlags: ruleResult,
        autoFlaggedAt: new Date(),
        evidenceResponses: {},
        timeline: initialTimeline,
        lastActivity: new Date(),
      },
    });

    // ── Step 4: Update deed status ────────────────────────────────
    await prisma.deed.update({
      where: { id: deedId },
      data: { status: 'DISPUTED' },
    });

    // ── Step 5: Trigger AI analysis asynchronously (non-blocking) ─────────────
    setImmediate(async () => {
      try {
        const { analyzeDisputeWithAI } = require('../services/disputeAI');
        const chatMessages = []; // Chat integration for deeds is handled differently
        
        const aiResult = await analyzeDisputeWithAI({
          deed,
          deliveryEvent,
          dispute: { ...dispute, evidenceResponses: {} },
          ruleEngineResult: ruleResult,
          chatMessages,
        });

        const freshDispute = await prisma.deedDispute.findUnique({ where: { id: dispute.id } });
        if (freshDispute) {
          const currentTimeline = Array.isArray(freshDispute.timeline) ? freshDispute.timeline : [];
          await prisma.deedDispute.update({
            where: { id: dispute.id },
            data: {
              aiAnalysis: aiResult,
              timeline: [
                ...currentTimeline,
                {
                  event: 'AI_ANALYSIS_COMPLETE',
                  by: 'ai',
                  timestamp: new Date().toISOString(),
                  description: `AI Analysis: ${aiResult.recommendation} (${Math.round(aiResult.confidenceScore || 0)}% confidence)`,
                  notes: aiResult.reasoning,
                },
              ],
            },
          });
        }
        console.log(`[Dispute ${dispute.id}] AI analysis complete: ${aiResult.recommendation}`);
      } catch (aiErr) {
        console.error('[Dispute AI] Background analysis failed:', aiErr.message);
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        dispute,
        ruleFlags: ruleResult,
        message: 'Dispute created. Auto-flagging complete. AI analysis running in background.',
      },
    });
  } catch (error) {
    console.error('Error creating dispute:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create dispute' });
  }
};

// ─── Submit Counter-Evidence ──────────────────────────────────────────────────

const submitEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const role = req.user.role;

    const dispute = await prisma.deedDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    if (dispute.status === 'RESOLVED') {
      return res.status(400).json({ success: false, message: 'This dispute is already resolved' });
    }

    const newUrls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const currentResponses = (dispute.evidenceResponses && typeof dispute.evidenceResponses === 'object')
      ? dispute.evidenceResponses
      : {};
    const roleResponse = currentResponses[role] || { text: '', files: [], submittedAt: null };

    const updatedResponses = {
      ...currentResponses,
      [role]: {
        text: text || roleResponse.text,
        files: [...(roleResponse.files || []), ...newUrls],
        submittedAt: new Date().toISOString(),
      },
    };

    const currentEvidence = Array.isArray(dispute.evidenceUrls) ? dispute.evidenceUrls : [];
    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];

    const updated = await prisma.deedDispute.update({
      where: { id },
      data: {
        evidenceResponses: updatedResponses,
        evidenceUrls: [...currentEvidence, ...newUrls],
        status: 'RESPONDED',
        timeline: [
          ...currentTimeline,
          {
            event: 'EVIDENCE_SUBMITTED',
            by: role,
            timestamp: new Date().toISOString(),
            description: `${role.charAt(0).toUpperCase() + role.slice(1)} submitted counter-evidence`,
            notes: text || '',
          },
        ],
        lastActivity: new Date(),
      },
    });

    // Re-run AI analysis in background with fresh evidence
    setImmediate(async () => {
      try {
        const { analyzeDisputeWithAI } = require('../services/disputeAI');
        const deed = dispute.deedId ? await prisma.deed.findUnique({ where: { id: dispute.deedId } }) : null;
        if (!deed) return;
        const freshDispute = await prisma.deedDispute.findUnique({ where: { id } });
        if (!freshDispute) return;

        const aiResult = await analyzeDisputeWithAI({
          deed,
          dispute: freshDispute,
          ruleEngineResult: freshDispute.ruleFlags || {},
          chatMessages: [],
        });

        const updatedTimeline = Array.isArray(freshDispute.timeline) ? freshDispute.timeline : [];
        await prisma.deedDispute.update({
          where: { id },
          data: {
            aiAnalysis: aiResult,
            timeline: [
              ...updatedTimeline,
              {
                event: 'AI_REANALYZED',
                by: 'ai',
                timestamp: new Date().toISOString(),
                description: `AI re-analysis after ${role} evidence: ${aiResult.recommendation}`,
                notes: aiResult.reasoning,
              },
            ],
          },
        });
        console.log(`[Dispute ${id}] AI re-analysis complete after ${role} evidence`);
      } catch (e) {
        console.error('[Dispute AI] Re-analysis failed:', e.message);
      }
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Evidence submitted successfully. AI analysis is being updated.',
    });
  } catch (error) {
    console.error('Error submitting evidence:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit evidence' });
  }
};

// ─── Smart Escalate ───────────────────────────────────────────────────────────

const smartEscalate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const role = req.user.role;

    const dispute = await prisma.deedDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    if (dispute.status === 'RESOLVED') {
      return res.status(400).json({ success: false, message: 'Dispute is already resolved' });
    }

    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];

    const updated = await prisma.deedDispute.update({
      where: { id },
      data: {
        status: 'MEDIATION',
        escalatedAt: new Date(),
        timeline: [
          ...currentTimeline,
          {
            event: 'SMART_ESCALATED',
            by: role,
            timestamp: new Date().toISOString(),
            description: `${role.charAt(0).toUpperCase() + role.slice(1)} escalated to human moderator`,
            notes: reason || 'Unsatisfied with AI recommendation',
          },
        ],
        lastActivity: new Date(),
      },
    });

    return res.json({
      success: true,
      message: 'Dispute escalated to human moderator. Admin will review and make a final decision.',
      data: updated,
    });
  } catch (error) {
    console.error('Error escalating dispute:', error);
    return res.status(500).json({ success: false, message: 'Failed to escalate dispute' });
  }
};

// ─── Get Full Dispute Detail ──────────────────────────────────────────────────

const getFullDisputeDetail = async (req, res) => {
  try {
    const { id } = req.params;

    let dispute = await prisma.deedDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const deed = await prisma.deed.findUnique({ 
      where: { id: dispute.deedId },
      include: { ledgerEntries: true }
    });
    const buyer = await prisma.buyer.findUnique({ where: { id: dispute.buyerId } }).catch(() => null);
    const seller = dispute.sellerId
      ? await prisma.seller.findUnique({ where: { id: dispute.sellerId } }).catch(() => null)
      : null;

    // Heal rows where background AI never persisted
    if (!dispute.aiAnalysis && dispute.ruleFlags && typeof dispute.ruleFlags === 'object' && deed) {
      const rf = dispute.ruleFlags;
      if ('riskScore' in rf || 'flags' in rf || 'autoRecommendation' in rf) {
        try {
          const { analyzeDisputeWithAI } = require('../services/disputeAI');
          const aiResult = await analyzeDisputeWithAI({
            deed,
            dispute,
            ruleEngineResult: rf,
            chatMessages: [],
          });
          const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
          const alreadyLogged = currentTimeline.some(
            e => e.event === 'AI_ANALYSIS_COMPLETE' || e.event === 'AI_REANALYZED'
          );
          const label = 'AI Analysis';
          dispute = await prisma.deedDispute.update({
            where: { id },
            data: {
              aiAnalysis: aiResult,
              timeline: alreadyLogged
                ? currentTimeline
                : [
                    ...currentTimeline,
                    {
                      event: 'AI_ANALYSIS_COMPLETE',
                      by: 'system',
                      timestamp: new Date().toISOString(),
                      description: `${label}: ${aiResult.recommendation} (${Math.round((aiResult.confidenceScore || 0))}%)`,
                      notes: aiResult.reasoning,
                    },
                  ],
              lastActivity: new Date(),
            },
          });
        } catch (backfillErr) {
          console.error('[getFullDisputeDetail] AI backfill failed:', backfillErr.message);
        }
      }
    }

    const scopeBox = deed?.scopeBox || {};
    const price = parseInt(deed?.amount ? deed.amount / 100 : scopeBox.price || 0, 10);
    
    const feeModelStatus = dispute.status === 'MEDIATION' ? 'ESCALATED' : 'RESOLVED';
    
    const releaseSim = calculateResolutionAmounts(price, 0, feeModelStatus);
    const refundSim = calculateResolutionAmounts(price, 100, feeModelStatus);

    const financial = {
      escrowAmount: price,
      platformFee: releaseSim.platformFee,
      netToSeller: releaseSim.sellerNet,
      netToBuyer: refundSim.buyerNet,
      currency: deed?.currency || 'INR',
      refundScenario: { buyerReceives: refundSim.buyerNet, sellerReceives: refundSim.sellerNet, platformReceives: refundSim.platformFee },
      releaseScenario: { buyerReceives: releaseSim.buyerNet, sellerReceives: releaseSim.sellerNet, platformReceives: releaseSim.platformFee },
      partialScenarios: [50, 70, 30].map(pct => {
        const sim = calculateResolutionAmounts(price, pct, feeModelStatus);
        return {
          label: `${pct}% refund to buyer`,
          buyerReceives: sim.buyerNet,
          sellerReceives: sim.sellerNet,
          platformReceives: sim.platformFee,
        };
      }),
    };

    return res.json({
      success: true,
      data: {
        dispute,
        deed: deed
          ? {
              id: deed.id,
              status: deed.status,
              scopeBox: deed.scopeBox,
              currency: deed.currency,
              createdAt: deed.createdAt,
              updatedAt: deed.updatedAt,
              ledgerEntries: deed.ledgerEntries,
            }
          : null,
        buyer: buyer
          ? { id: buyer.id, firstName: buyer.firstName, lastName: buyer.lastName, email: buyer.email }
          : null,
        seller: seller
          ? { id: seller.id, firstName: seller.firstName, lastName: seller.lastName, email: seller.email, businessName: seller.businessName }
          : null,
        financial,
        chatMessages: [],
        ruleFlags: dispute.ruleFlags,
        aiAnalysis: dispute.aiAnalysis,
        evidenceResponses: dispute.evidenceResponses,
      },
    });
  } catch (error) {
    console.error('Error fetching full dispute detail:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dispute detail' });
  }
};

// ─── Re-trigger AI Analysis ───────────────────────────────────────────────────

const triggerAIAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { analyzeDisputeWithAI } = require('../services/disputeAI');

    const dispute = await prisma.deedDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const deed = dispute.deedId ? await prisma.deed.findUnique({ where: { id: dispute.deedId } }) : null;
    if (!deed) {
      return res.status(404).json({ success: false, message: 'Deed not found' });
    }

    const aiResult = await analyzeDisputeWithAI({
      deed,
      dispute,
      ruleEngineResult: dispute.ruleFlags || {},
      chatMessages: [],
    });

    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
    const updated = await prisma.deedDispute.update({
      where: { id },
      data: {
        aiAnalysis: aiResult,
        timeline: [
          ...currentTimeline,
          {
            event: 'AI_REANALYZED',
            by: req.user?.role || 'admin',
            timestamp: new Date().toISOString(),
            description: `AI re-analysis: ${aiResult.recommendation} (${Math.round((aiResult.confidenceScore || 0))} confidence)`,
            notes: aiResult.reasoning,
          },
        ],
        lastActivity: new Date(),
      },
    });

    return res.json({ success: true, data: aiResult, message: 'AI analysis complete' });
  } catch (error) {
    console.error('Error triggering AI analysis:', error);
    return res.status(500).json({ success: false, message: 'Failed to run AI analysis' });
  }
};

// ─── Standard CRUD ────────────────────────────────────────────────────────────

const getAllDisputes = async (req, res) => {
  try {
    const disputes = await prisma.deedDispute.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: disputes });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch disputes' });
  }
};

const getDisputeById = async (req, res) => {
  try {
    const dispute = await prisma.deedDispute.findUnique({ where: { id: req.params.id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    return res.json({ success: true, data: dispute });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch dispute' });
  }
};

const getDisputesByUser = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    const where = userRole === 'buyer' ? { buyerId: userId } : { sellerId: userId };
    const disputes = await prisma.deedDispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: disputes });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user disputes' });
  }
};

const updateDisputeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const dispute = await prisma.deedDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
    const updated = await prisma.deedDispute.update({
      where: { id },
      data: {
        status,
        timeline: [
          ...currentTimeline,
          {
            event: 'STATUS_UPDATED',
            by: req.user.role,
            timestamp: new Date().toISOString(),
            description: `Status changed to ${status}`,
            notes: notes || '',
          },
        ],
        lastActivity: new Date(),
      },
    });

    return res.json({ success: true, data: updated, message: 'Dispute status updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update dispute status' });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, enhancedAnalysis, scopeCompliance, buyerPct } = req.body;

    const dispute = await prisma.deedDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    
    const deed = dispute.deedId ? await prisma.deed.findUnique({ where: { id: dispute.deedId } }) : null;
    if (!deed) {
      return res.status(404).json({ success: false, message: 'Deed not found' });
    }

    const resolutionMap = { REFUND: 'REFUND_BUYER', RELEASE: 'RELEASE_TO_SELLER' };
    const resolution = resolutionMap[action] || action;

    // --- Phase 3: Dual-sided fee split and Wallet Balance updates ---
    let finalBuyerPct = 100;
    if (buyerPct !== undefined) {
      finalBuyerPct = buyerPct;
    } else if (resolution === 'RELEASE_TO_SELLER' || resolution.includes('RELEASE')) {
      finalBuyerPct = 0;
    }

    const price = parseInt((order?.scopeBox?.price || deed?.amount || deed?.scopeBox?.price) || 0, 10);
    const feeModelStatus = dispute.status === 'MEDIATION' ? 'ESCALATED' : 'RESOLVED';
    const split = calculateResolutionAmounts(price, finalBuyerPct, feeModelStatus);

    await prisma.$transaction(async (tx) => {
      // 1. Un-lock Buyer's balance (gte guard ensures we don't underflow or double-spend)
      const buyerId = order ? order.buyerId : deed.buyerId;
      const buyerWallet = await tx.wallet.findUnique({ where: { userId: buyerId } });
      if (!buyerWallet) throw new Error("BUYER_WALLET_NOT_FOUND");

      const updateLock = await tx.wallet.updateMany({
        where: { id: buyerWallet.id, lockedBalance: { gte: price } },
        data: { lockedBalance: { decrement: price } }
      });
      if (updateLock.count === 0) throw new Error("INSUFFICIENT_LOCKED_BALANCE");

      // 2. Refund Buyer (increment)
      if (split.buyerNet > 0) {
        await tx.wallet.update({
          where: { id: buyerWallet.id },
          data: { balance: { increment: split.buyerNet } }
        });
        await tx.walletTransaction.create({
          data: {
            walletId: buyerWallet.id,
            type: "CREDIT",
            category: "DISPUTE_REFUND",
            amount: split.buyerGross,
            currency: (order?.currency || deed?.currency) || "INR",
            status: "SUCCESS",
            description: `Dispute Refund: ${order?.scopeBox?.title || deed?.scopeBox?.title || dispute.id}`,
            reference: dispute.id,
            netAmount: split.buyerNet,
            fee: split.buyerFee,
            metadata: {
              feeTier: `DISPUTE_${feeModelStatus}_BUYER`,
              feePercentage: feeModelStatus === 'ESCALATED' ? 2 : (feeModelStatus === 'RESOLVED' ? 1 : 0),
              baseAmount: split.buyerGross,
              feeDeducted: split.buyerFee
            }
          }
        });
      }

      // 3. Credit Seller (increment)
      const sellerId = order ? order.sellerId : deed.sellerId;
      if (split.sellerNet > 0 && sellerId) {
        let sellerWallet = await tx.wallet.findUnique({ where: { userId: sellerId } });
        if (!sellerWallet) {
          sellerWallet = await tx.wallet.create({
            data: { userId: sellerId, userRole: "seller", currency: (order?.currency || deed?.currency) || "INR" }
          });
        }
        await tx.wallet.update({
          where: { id: sellerWallet.id },
          data: { balance: { increment: split.sellerNet } }
        });
        await tx.walletTransaction.create({
          data: {
            walletId: sellerWallet.id,
            type: "CREDIT",
            category: "DISPUTE_RELEASE",
            amount: split.sellerGross,
            currency: (order?.currency || deed?.currency) || "INR",
            status: "SUCCESS",
            description: `Dispute Resolution: ${order?.scopeBox?.title || deed?.scopeBox?.title || dispute.id}`,
            reference: dispute.id,
            netAmount: split.sellerNet,
            fee: split.sellerFee,
            metadata: {
              feeTier: `DISPUTE_${feeModelStatus}_SELLER`,
              feePercentage: feeModelStatus === 'ESCALATED' ? 4.5 : (feeModelStatus === 'RESOLVED' ? 3.5 : 0), // 2.5% base + 1% or 2%
              baseAmount: split.sellerGross,
              feeDeducted: split.sellerFee
            }
          }
        });
      }

      // --- End of Wallet updates ---

      const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
      const updateData = {
        status: 'RESOLVED',
        resolution,
        resolvedBy: req.user.userId || req.user.id,
        resolvedAt: new Date(),
        timeline: [
          ...currentTimeline,
          {
            event: 'DISPUTE_RESOLVED',
            by: req.user.role,
            timestamp: new Date().toISOString(),
            description: `Admin resolved: ${resolution} (Buyer: ${finalBuyerPct}%)`,
            notes: notes || '',
            enhancedAnalysis: enhancedAnalysis || null,
            scopeCompliance: scopeCompliance || null,
          },
        ],
        lastActivity: new Date(),
      };

      if (enhancedAnalysis) updateData.enhancedAnalysis = enhancedAnalysis;
      if (scopeCompliance) updateData.scopeCompliance = scopeCompliance;

      await tx.deedDispute.update({ where: { id }, data: updateData });

      if (dispute.deedId) {
        await tx.deed.update({
          where: { id: dispute.deedId },
          data: { status: 'CLOSED' }, // Deed uses CLOSED instead of REFUNDED/COMPLETED
        });
      }
    });

    // Re-fetch updated dispute for response
    const updated = await prisma.deedDispute.findUnique({ where: { id } });

    return res.json({
      success: true,
      data: updated,
      message: 'Dispute resolved successfully',
      enhancedAnalysis: enhancedAnalysis || null,
      scopeCompliance: scopeCompliance || null,
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return res.status(500).json({ success: false, message: 'Failed to resolve dispute: ' + error.message });
  }
};

const addEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Evidence files are required' });
    }

    const dispute = await prisma.deedDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const evidenceUrls = req.files.map(f => `/uploads/${f.filename}`);
    const currentEvidence = Array.isArray(dispute.evidenceUrls) ? dispute.evidenceUrls : [];
    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];

    const updated = await prisma.deedDispute.update({
      where: { id },
      data: {
        evidenceUrls: [...currentEvidence, ...evidenceUrls],
        timeline: [
          ...currentTimeline,
          {
            event: 'EVIDENCE_ADDED',
            by: req.user.role,
            timestamp: new Date().toISOString(),
            description: `Evidence added: ${req.files.length} file(s)`,
            notes: description || '',
          },
        ],
        lastActivity: new Date(),
      },
    });

    return res.json({ success: true, data: updated, message: 'Evidence added successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add evidence' });
  }
};

const getDisputeStats = async (req, res) => {
  try {
    const [total, open, underReview, resolved, mediation] = await Promise.all([
      prisma.deedDispute.count(),
      prisma.deedDispute.count({ where: { status: 'OPEN' } }),
      prisma.deedDispute.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.deedDispute.count({ where: { status: 'RESOLVED' } }),
      prisma.deedDispute.count({ where: { status: 'MEDIATION' } }),
    ]);
    return res.json({ success: true, data: { total, open, underReview, resolved, mediation } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch dispute statistics' });
  }
};

module.exports = {
  createDispute,
  getAllDisputes,
  getDisputeById,
  getDisputesByUser,
  updateDisputeStatus,
  resolveDispute,
  addEvidence,
  getDisputeStats,
  submitEvidence,
  smartEscalate,
  getFullDisputeDetail,
  triggerAIAnalysis,
};

const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    const { orderId, reason, description, requestedResolution, priority = 'MEDIUM' } = req.body;

    if (!orderId || !reason || !description) {
      return res.status(400).json({ success: false, message: 'Order ID, reason, and description are required' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const existingDispute = await prisma.orderDispute.findUnique({ where: { orderId } });
    if (existingDispute) {
      return res.status(400).json({ success: false, message: 'Dispute already exists for this order' });
    }

    const raisedBy = req.user.role;
    const buyerId = order.buyerId;
    const sellerId = order.sellerId || '';

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
      const proofData = extractProofData(order);
      ruleResult = runDisputeEngine(order, tempDispute, proofData);
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
    const dispute = await prisma.orderDispute.create({
      data: {
        orderId,
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

    // ── Step 4: Update order status + disputeId ────────────────────────────────
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DISPUTED', disputeId: dispute.id },
    });

    // ── Step 5: Trigger AI analysis asynchronously (non-blocking) ─────────────
    setImmediate(async () => {
      try {
        const { analyzeDisputeWithAI } = require('../services/disputeAI');
        const chatMessages = await getChatMessages(orderId);
        const aiResult = await analyzeDisputeWithAI({
          order,
          dispute: { ...dispute, evidenceResponses: {} },
          ruleEngineResult: ruleResult,
          chatMessages,
        });

        const freshDispute = await prisma.orderDispute.findUnique({ where: { id: dispute.id } });
        if (freshDispute) {
          const currentTimeline = Array.isArray(freshDispute.timeline) ? freshDispute.timeline : [];
          await prisma.orderDispute.update({
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

    const dispute = await prisma.orderDispute.findUnique({ where: { id } });
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

    const updated = await prisma.orderDispute.update({
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
        const order = await prisma.order.findUnique({ where: { id: dispute.orderId } });
        if (!order) return;
        const chatMessages = await getChatMessages(dispute.orderId);
        const freshDispute = await prisma.orderDispute.findUnique({ where: { id } });
        if (!freshDispute) return;

        const aiResult = await analyzeDisputeWithAI({
          order,
          dispute: freshDispute,
          ruleEngineResult: freshDispute.ruleFlags || {},
          chatMessages,
        });

        const updatedTimeline = Array.isArray(freshDispute.timeline) ? freshDispute.timeline : [];
        await prisma.orderDispute.update({
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

    const dispute = await prisma.orderDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    if (dispute.status === 'RESOLVED') {
      return res.status(400).json({ success: false, message: 'Dispute is already resolved' });
    }

    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];

    const updated = await prisma.orderDispute.update({
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

    let dispute = await prisma.orderDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const order = await prisma.order.findUnique({ where: { id: dispute.orderId } });
    const buyer = await prisma.buyer.findUnique({ where: { id: dispute.buyerId } }).catch(() => null);
    const seller = dispute.sellerId
      ? await prisma.seller.findUnique({ where: { id: dispute.sellerId } }).catch(() => null)
      : null;
    let chatMessages = await getChatMessages(dispute.orderId);

    // Heal rows where background AI never persisted
    if (!dispute.aiAnalysis && dispute.ruleFlags && typeof dispute.ruleFlags === 'object' && order) {
      const rf = dispute.ruleFlags;
      if ('riskScore' in rf || 'flags' in rf || 'autoRecommendation' in rf) {
        try {
          const { analyzeDisputeWithAI } = require('../services/disputeAI');
          chatMessages = await getChatMessages(dispute.orderId);
          const aiResult = await analyzeDisputeWithAI({
            order,
            dispute,
            ruleEngineResult: rf,
            chatMessages,
          });
          const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
          const alreadyLogged = currentTimeline.some(
            e => e.event === 'AI_ANALYSIS_COMPLETE' || e.event === 'AI_REANALYZED'
          );
          const label = 'AI Analysis';
          dispute = await prisma.orderDispute.update({
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

    const scopeBox = order?.scopeBox || {};
    const price = parseFloat(scopeBox.price || 0);
    const platformFee = parseFloat((price * 0.05).toFixed(2));
    const netToSeller = parseFloat((price - platformFee).toFixed(2));

    const financial = {
      escrowAmount: price,
      platformFee,
      netToSeller,
      netToBuyer: price,
      currency: order?.currency || 'INR',
      refundScenario: { buyerReceives: price, sellerReceives: 0, platformReceives: 0 },
      releaseScenario: { buyerReceives: 0, sellerReceives: netToSeller, platformReceives: platformFee },
      partialScenarios: [50, 70, 30].map(pct => ({
        label: `${pct}% refund to buyer`,
        buyerReceives: parseFloat((price * pct / 100).toFixed(2)),
        sellerReceives: parseFloat((price * (1 - pct / 100) - platformFee).toFixed(2)),
        platformReceives: platformFee,
      })),
    };

    return res.json({
      success: true,
      data: {
        dispute,
        order: order
          ? {
              id: order.id,
              status: order.status,
              scopeBox: order.scopeBox,
              buyerName: order.buyerName,
              buyerEmail: order.buyerEmail,
              sellerContact: order.sellerContact,
              currency: order.currency,
              deliveryFiles: order.deliveryFiles,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              orderLogs: order.orderLogs,
            }
          : null,
        buyer: buyer
          ? { id: buyer.id, firstName: buyer.firstName, lastName: buyer.lastName, email: buyer.email }
          : null,
        seller: seller
          ? { id: seller.id, firstName: seller.firstName, lastName: seller.lastName, email: seller.email, businessName: seller.businessName }
          : null,
        financial,
        chatMessages: chatMessages.slice(-15),
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

    const dispute = await prisma.orderDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const order = await prisma.order.findUnique({ where: { id: dispute.orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const chatMessages = await getChatMessages(dispute.orderId);

    const aiResult = await analyzeDisputeWithAI({
      order,
      dispute,
      ruleEngineResult: dispute.ruleFlags || {},
      chatMessages,
    });

    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
    const updated = await prisma.orderDispute.update({
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
    const disputes = await prisma.orderDispute.findMany({
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
    const dispute = await prisma.orderDispute.findUnique({ where: { id: req.params.id } });
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
    const disputes = await prisma.orderDispute.findMany({
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

    const dispute = await prisma.orderDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
    const updated = await prisma.orderDispute.update({
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
    const { action, notes, enhancedAnalysis, scopeCompliance } = req.body;

    const dispute = await prisma.orderDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const resolutionMap = { REFUND: 'REFUND_BUYER', RELEASE: 'RELEASE_TO_SELLER' };
    const resolution = resolutionMap[action] || action;

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
          description: `Admin resolved: ${resolution}`,
          notes: notes || '',
          enhancedAnalysis: enhancedAnalysis || null,
          scopeCompliance: scopeCompliance || null,
        },
      ],
      lastActivity: new Date(),
    };

    if (enhancedAnalysis) updateData.enhancedAnalysis = enhancedAnalysis;
    if (scopeCompliance) updateData.scopeCompliance = scopeCompliance;

    const updated = await prisma.orderDispute.update({ where: { id }, data: updateData });

    // Update linked order status
    const orderStatus = (resolution === 'REFUND_BUYER' || resolution.includes('REFUND'))
      ? 'REFUNDED'
      : 'COMPLETED';
    await prisma.order.update({
      where: { id: dispute.orderId },
      data: { status: orderStatus },
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Dispute resolved successfully',
      enhancedAnalysis: enhancedAnalysis || null,
      scopeCompliance: scopeCompliance || null,
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return res.status(500).json({ success: false, message: 'Failed to resolve dispute' });
  }
};

const addEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Evidence files are required' });
    }

    const dispute = await prisma.orderDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const evidenceUrls = req.files.map(f => `/uploads/${f.filename}`);
    const currentEvidence = Array.isArray(dispute.evidenceUrls) ? dispute.evidenceUrls : [];
    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];

    const updated = await prisma.orderDispute.update({
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
      prisma.orderDispute.count(),
      prisma.orderDispute.count({ where: { status: 'OPEN' } }),
      prisma.orderDispute.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.orderDispute.count({ where: { status: 'RESOLVED' } }),
      prisma.orderDispute.count({ where: { status: 'MEDIATION' } }),
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

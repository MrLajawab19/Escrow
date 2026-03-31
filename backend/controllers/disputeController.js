const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const { runBlogDisputeEngine, detectDeliveredWordCount } = require('../services/blogDisputeEngine');
const { analyzeDisputeWithAI } = require('../services/blogDisputeAI');

// ── Use the shared DB instance from models/index ───────────────────────────────
const db = require('../models');
const { Dispute, Order, Buyer, Seller, sequelize } = db;

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getChatMessages(orderId) {
  try {
    const room = await prisma.orderChatRoom.findUnique({ where: { orderId } });
    if (!room) return [];
    return await prisma.chatMessage.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: 'asc' },
      take: 20
    });
  } catch {
    return [];
  }
}

// Safe timeline append — avoids sequelize.literal JSONB issues
async function appendTimeline(disputeId, entry) {
  const dispute = await Dispute.findByPk(disputeId);
  if (!dispute) return;
  const current = Array.isArray(dispute.timeline) ? dispute.timeline : [];
  await dispute.update({ timeline: [...current, entry] });
}

// ─── Create Dispute (triggers rule engine + AI) ────────────────────────────────

const createDispute = async (req, res) => {
  try {
    const { orderId, reason, description, requestedResolution, priority = 'MEDIUM' } = req.body;

    if (!orderId || !reason || !description) {
      return res.status(400).json({ success: false, message: 'Order ID, reason, and description are required' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const existingDispute = await Dispute.findOne({ where: { orderId } });
    if (existingDispute) {
      return res.status(400).json({ success: false, message: 'Dispute already exists for this order' });
    }

    const raisedBy = req.user.role;
    const buyerId = order.buyerId;
    const sellerId = order.sellerId;

    // Handle uploaded evidence files
    const evidenceFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];
    const evidenceUrls = evidenceFiles.map(file => `/uploads/${file.filename}`);

    // ── Step 1: Detect word count from delivery files ──────────────────────────
    let analyzedWordCount = 0;
    if (order.deliveryFiles && order.deliveryFiles.length > 0) {
      analyzedWordCount = await detectDeliveredWordCount(order.deliveryFiles);
    }

    // ── Step 2: Run rule engine ────────────────────────────────────────────────
    const orderPlain = order.toJSON ? order.toJSON() : order;
    const tempDispute = { description, reason, createdAt: new Date(), raisedBy };
    const ruleResult = runBlogDisputeEngine(orderPlain, tempDispute, analyzedWordCount);

    // ── Step 3: Create dispute record ─────────────────────────────────────────
    const dispute = await Dispute.create({
      orderId,
      buyerId,
      sellerId,
      raisedBy,
      reason,
      description,
      evidenceUrls,
      requestedResolution,
      priority: ruleResult.hasCritical ? 'HIGH' : priority,
      status: 'OPEN',
      ruleFlags: { ...ruleResult, analyzedWordCount },
      analyzedWordCount,
      autoFlaggedAt: new Date(),
      evidenceResponses: {},
      timeline: [
        {
          event: 'DISPUTE_CREATED',
          by: raisedBy,
          timestamp: new Date().toISOString(),
          description: `Dispute raised by ${raisedBy}: ${reason}`,
          notes: description
        },
        {
          event: 'RULE_ENGINE_RAN',
          by: 'system',
          timestamp: new Date().toISOString(),
          description: `Auto-flagging complete. Risk score: ${ruleResult.riskScore}/100. Flags: ${ruleResult.flagCount}`,
          notes: `Fault side: ${ruleResult.faultSide}. Recommendation: ${ruleResult.autoRecommendation}`
        }
      ],
      lastActivity: new Date()
    });

    // ── Step 4: Update order status + disputeId ────────────────────────────────
    await Order.update(
      { status: 'DISPUTED', disputeId: dispute.id },
      { where: { id: orderId } }
    );

    // ── Step 5: Trigger AI analysis asynchronously (non-blocking) ─────────────
    setImmediate(async () => {
      try {
        const chatMessages = await getChatMessages(orderId);
        const disputePlain = dispute.toJSON ? dispute.toJSON() : dispute;
        const aiResult = await analyzeDisputeWithAI({
          order: orderPlain,
          dispute: { ...disputePlain, evidenceResponses: {} },
          ruleEngineResult: { ...ruleResult, analyzedWordCount },
          chatMessages
        });

        // Safe update: fetch fresh record, then update
        const freshDispute = await Dispute.findByPk(dispute.id);
        if (freshDispute) {
          const currentTimeline = Array.isArray(freshDispute.timeline) ? freshDispute.timeline : [];
          await freshDispute.update({
            aiAnalysis: aiResult,
            timeline: [
              ...currentTimeline,
              {
                event: 'AI_ANALYSIS_COMPLETE',
                by: 'ai',
                timestamp: new Date().toISOString(),
                description: `Grok AI: ${aiResult.recommendation} (${Math.round(aiResult.confidence * 100)}% confidence)`,
                notes: aiResult.summary
              }
            ]
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
        dispute: dispute.toJSON(),
        ruleFlags: ruleResult,
        message: 'Dispute created. Auto-flagging complete. AI analysis running in background.'
      }
    });

  } catch (error) {
    console.error('Error creating dispute:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create dispute' });
  }
};

// ─── Submit Evidence ──────────────────────────────────────────────────────────

const submitEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const role = req.user.role;

    const dispute = await Dispute.findByPk(id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    if (dispute.status === 'RESOLVED') {
      return res.status(400).json({ success: false, message: 'This dispute is already resolved' });
    }

    // Handle uploaded files
    const newFiles = req.files ? req.files.map(f => ({
      filename: f.filename,
      originalname: f.originalname,
      path: f.path,
      size: f.size,
      mimetype: f.mimetype,
      uploadedBy: role,
      uploadedAt: new Date().toISOString()
    })) : [];
    const newUrls = newFiles.map(f => `/uploads/${f.filename}`);

    // Merge into evidenceResponses
    const currentResponses = dispute.evidenceResponses || {};
    const roleResponse = currentResponses[role] || { text: '', files: [], submittedAt: null };

    const updatedResponses = {
      ...currentResponses,
      [role]: {
        text: text || roleResponse.text,
        files: [...(roleResponse.files || []), ...newUrls],
        submittedAt: new Date().toISOString()
      }
    };

    const currentEvidence = dispute.evidenceUrls || [];
    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];

    await dispute.update({
      evidenceResponses: updatedResponses,
      evidenceUrls: [...currentEvidence, ...newUrls],
      status: 'RESPONDED',
      timeline: [...currentTimeline, {
        event: 'EVIDENCE_SUBMITTED',
        by: role,
        timestamp: new Date().toISOString(),
        description: `${role.charAt(0).toUpperCase() + role.slice(1)} submitted counter-evidence`,
        notes: text || ''
      }],
      lastActivity: new Date()
    });

    // Re-run AI analysis in background with fresh evidence
    setImmediate(async () => {
      try {
        const order = await Order.findByPk(dispute.orderId);
        if (!order) return;
        const chatMessages = await getChatMessages(dispute.orderId);
        const freshDispute = await Dispute.findByPk(id);
        if (!freshDispute) return;
        const ruleResult = freshDispute.ruleFlags || {};

        const aiResult = await analyzeDisputeWithAI({
          order: order.toJSON(),
          dispute: freshDispute.toJSON(),
          ruleEngineResult: ruleResult,
          chatMessages
        });

        const updatedTimeline = Array.isArray(freshDispute.timeline) ? freshDispute.timeline : [];
        await freshDispute.update({
          aiAnalysis: aiResult,
          timeline: [...updatedTimeline, {
            event: 'AI_REANALYZED',
            by: 'ai',
            timestamp: new Date().toISOString(),
            description: `AI re-analysis after ${role} evidence: ${aiResult.recommendation}`,
            notes: aiResult.summary
          }]
        });
        console.log(`[Dispute ${id}] AI re-analysis complete after ${role} evidence`);
      } catch (e) {
        console.error('[Dispute AI] Re-analysis failed:', e.message);
      }
    });

    return res.json({
      success: true,
      data: dispute,
      message: 'Evidence submitted successfully. AI analysis is being updated.'
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

    const dispute = await Dispute.findByPk(id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    if (dispute.status === 'RESOLVED') {
      return res.status(400).json({ success: false, message: 'Dispute is already resolved' });
    }

    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];

    await dispute.update({
      status: 'MEDIATION',
      escalatedAt: new Date(),
      timeline: [...currentTimeline, {
        event: 'SMART_ESCALATED',
        by: role,
        timestamp: new Date().toISOString(),
        description: `${role.charAt(0).toUpperCase() + role.slice(1)} escalated to human moderator`,
        notes: reason || 'Unsatisfied with AI recommendation'
      }],
      lastActivity: new Date()
    });

    return res.json({
      success: true,
      message: 'Dispute escalated to human moderator. Admin will review and make a final decision.',
      data: dispute
    });

  } catch (error) {
    console.error('Error escalating dispute:', error);
    return res.status(500).json({ success: false, message: 'Failed to escalate dispute' });
  }
};

// ─── Get Full Dispute Detail (for admin + user view) ─────────────────────────

const getFullDisputeDetail = async (req, res) => {
  try {
    const { id } = req.params;

    let dispute = await Dispute.findByPk(id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const order = await Order.findByPk(dispute.orderId);
    const buyer = Buyer ? await Buyer.findByPk(dispute.buyerId).catch(() => null) : null;
    const seller = Seller ? await Seller.findByPk(dispute.sellerId).catch(() => null) : null;
    let chatMessages = await getChatMessages(dispute.orderId);

    // Heal rows where background AI never persisted (e.g. fallback threw on missing flags)
    if (!dispute.aiAnalysis && dispute.ruleFlags && typeof dispute.ruleFlags === 'object' && order) {
      const rf = dispute.ruleFlags;
      if ('riskScore' in rf || 'flags' in rf || 'autoRecommendation' in rf) {
        try {
          chatMessages = await getChatMessages(dispute.orderId);
          const aiResult = await analyzeDisputeWithAI({
            order: order.toJSON(),
            dispute: dispute.toJSON(),
            ruleEngineResult: rf,
            chatMessages,
          });
          const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
          const alreadyLogged = currentTimeline.some(
            e => e.event === 'AI_ANALYSIS_COMPLETE' || e.event === 'AI_REANALYZED'
          );
          const label = aiResult.source === 'grok' ? 'Grok AI' : 'Rule engine';
          await dispute.update({
            aiAnalysis: aiResult,
            timeline: alreadyLogged
              ? currentTimeline
              : [
                  ...currentTimeline,
                  {
                    event: 'AI_ANALYSIS_COMPLETE',
                    by: 'system',
                    timestamp: new Date().toISOString(),
                    description: `${label}: ${aiResult.recommendation} (${Math.round((aiResult.confidence || 0) * 100)}% confidence)`,
                    notes: aiResult.summary,
                  },
                ],
            lastActivity: new Date(),
          });
          await dispute.reload();
        } catch (backfillErr) {
          console.error('[getFullDisputeDetail] AI backfill failed:', backfillErr.message);
        }
      }
    }

    // Financial analysis
    const price = parseFloat(order?.scopeBox?.price || 0);
    const platformFee = parseFloat((price * 0.05).toFixed(2));
    const netToSeller = parseFloat((price - platformFee).toFixed(2));

    const financial = {
      escrowAmount: price,
      platformFee,
      netToSeller,
      netToBuyer: price,
      currency: order?.currency || 'USD',
      refundScenario: {
        buyerReceives: price,
        sellerReceives: 0,
        platformReceives: 0
      },
      releaseScenario: {
        buyerReceives: 0,
        sellerReceives: netToSeller,
        platformReceives: platformFee
      },
      partialScenarios: [50, 70, 30].map(pct => ({
        label: `${pct}% refund to buyer`,
        buyerReceives: parseFloat((price * pct / 100).toFixed(2)),
        sellerReceives: parseFloat((price * (1 - pct / 100) - platformFee).toFixed(2)),
        platformReceives: platformFee
      }))
    };

    return res.json({
      success: true,
      data: {
        dispute: dispute.toJSON(),
        order: order ? {
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
          orderLogs: order.orderLogs
        } : null,
        buyer: buyer ? {
          id: buyer.id,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          email: buyer.email
        } : null,
        seller: seller ? {
          id: seller.id,
          firstName: seller.firstName,
          lastName: seller.lastName,
          email: seller.email,
          businessName: seller.businessName
        } : null,
        financial,
        chatMessages: chatMessages.slice(-15),
        ruleFlags: dispute.ruleFlags,
        aiAnalysis: dispute.aiAnalysis,
        evidenceResponses: dispute.evidenceResponses
      }
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

    const dispute = await Dispute.findByPk(id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const order = await Order.findByPk(dispute.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const chatMessages = await getChatMessages(dispute.orderId);
    const ruleResult = dispute.ruleFlags || {};

    const aiResult = await analyzeDisputeWithAI({
      order: order.toJSON(),
      dispute: dispute.toJSON(),
      ruleEngineResult: ruleResult,
      chatMessages
    });

    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
    await dispute.update({
      aiAnalysis: aiResult,
      timeline: [...currentTimeline, {
        event: 'AI_REANALYZED',
        by: req.user?.role || 'admin',
        timestamp: new Date().toISOString(),
        description: `AI re-analysis: ${aiResult.recommendation} (${Math.round(aiResult.confidence * 100)}% confidence)`,
        notes: aiResult.summary
      }],
      lastActivity: new Date()
    });

    return res.json({ success: true, data: aiResult, message: 'AI analysis complete' });

  } catch (error) {
    console.error('Error triggering AI analysis:', error);
    return res.status(500).json({ success: false, message: 'Failed to run AI analysis' });
  }
};

// ─── Standard CRUD controllers ─────────────────────────────────────────────────

const getAllDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data: disputes });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch disputes' });
  }
};

const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findByPk(req.params.id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    return res.json({ success: true, data: dispute });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch dispute' });
  }
};

const getDisputesByUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const where = userRole === 'buyer' ? { buyerId: userId } : { sellerId: userId };
    const disputes = await Dispute.findAll({ where, order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data: disputes });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user disputes' });
  }
};

const updateDisputeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const dispute = await Dispute.findByPk(id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
    await dispute.update({
      status,
      timeline: [...currentTimeline, {
        event: 'STATUS_UPDATED',
        by: req.user.role,
        timestamp: new Date().toISOString(),
        description: `Status changed to ${status}`,
        notes: notes || ''
      }],
      lastActivity: new Date()
    });

    return res.json({ success: true, data: dispute, message: 'Dispute status updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update dispute status' });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, enhancedAnalysis, scopeCompliance } = req.body;

    const dispute = await Dispute.findByPk(id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    // Map action to resolution
    const resolutionMap = {
      'REFUND': 'REFUND_BUYER',
      'RELEASE': 'RELEASE_TO_SELLER'
    };
    const resolution = resolutionMap[action] || action;

    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
    
    // Enhanced resolution data
    const resolutionData = {
      status: 'RESOLVED',
      resolution,
      resolvedBy: req.user.userId,
      resolvedAt: new Date(),
      timeline: [...currentTimeline, {
        event: 'DISPUTE_RESOLVED',
        by: req.user.role,
        timestamp: new Date().toISOString(),
        description: `Admin resolved: ${resolution}`,
        notes: notes || '',
        enhancedAnalysis: enhancedAnalysis || null,
        scopeCompliance: scopeCompliance || null
      }],
      lastActivity: new Date()
    };

    // Add enhanced analysis if provided
    if (enhancedAnalysis) {
      resolutionData.enhancedAnalysis = enhancedAnalysis;
    }
    
    // Add scope compliance if provided
    if (scopeCompliance) {
      resolutionData.scopeCompliance = scopeCompliance;
    }

    await dispute.update(resolutionData);

    let orderStatus = 'COMPLETED';
    if (resolution === 'REFUND_BUYER' || resolution.includes('REFUND')) {
      orderStatus = 'REFUNDED';
    } else if (resolution === 'RELEASE_TO_SELLER') {
      orderStatus = 'COMPLETED';
    }

    await Order.update({ status: orderStatus }, { where: { id: dispute.orderId } });

    return res.json({ 
      success: true, 
      data: dispute, 
      message: 'Dispute resolved successfully',
      enhancedAnalysis: enhancedAnalysis || null,
      scopeCompliance: scopeCompliance || null
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

    const dispute = await Dispute.findByPk(id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const evidenceFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedBy: req.user.role,
      uploadedAt: new Date().toISOString(),
      description: description || ''
    }));
    const evidenceUrls = evidenceFiles.map(f => `/uploads/${f.filename}`);
    const currentEvidence = dispute.evidenceUrls || [];
    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];

    await dispute.update({
      evidenceUrls: [...currentEvidence, ...evidenceUrls],
      timeline: [...currentTimeline, {
        event: 'EVIDENCE_ADDED',
        by: req.user.role,
        timestamp: new Date().toISOString(),
        description: `Evidence added: ${evidenceFiles.length} file(s)`,
        notes: description || ''
      }],
      lastActivity: new Date()
    });

    return res.json({ success: true, data: dispute, message: 'Evidence added successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add evidence' });
  }
};

const getDisputeStats = async (req, res) => {
  try {
    const total = await Dispute.count();
    const open = await Dispute.count({ where: { status: 'OPEN' } });
    const underReview = await Dispute.count({ where: { status: 'UNDER_REVIEW' } });
    const resolved = await Dispute.count({ where: { status: 'RESOLVED' } });
    const mediation = await Dispute.count({ where: { status: 'MEDIATION' } });
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
  triggerAIAnalysis
};
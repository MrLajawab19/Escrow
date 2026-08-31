const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const disputeConfig = require('../config/disputeConfig');
const { generateAIReport } = require('../services/disputeAI');
const ledgerService = require('../services/ledgerService');

function calculateResolutionAmounts(price, buyerPct, disputeStatus = 'NONE') {
  let disputeRate = 0;
  if (disputeStatus === 'RESOLVED') disputeRate = 0.01;
  else if (disputeStatus === 'ESCALATED') disputeRate = 0.02;

  const sellerBaseRate = 0.025; // 2.5%
  const disputePenalty = Math.floor(price * disputeRate);

  // 1. Exact Split (Seller floored, remainder to buyer)
  const sellerGross = Math.floor(price * ((100 - buyerPct) / 100));
  const buyerGross = price - sellerGross;

  // 2. Individual proportional fees
  let buyerFee = Math.floor(buyerGross * disputeRate);
  let sellerFee = Math.floor(sellerGross * (sellerBaseRate + disputeRate));

  // 3. Penalty for 100% loss (0% gross) - blindspot fix
  if (buyerGross === 0 && disputeRate > 0) buyerFee = disputePenalty;
  if (sellerGross === 0 && disputeRate > 0) sellerFee = disputePenalty;

  // 4. Final Nets
  const buyerNet = buyerGross - buyerFee;
  const sellerNet = sellerGross - sellerFee;

  // 5. Platform Fee aggregates both
  const platformFee = buyerFee + sellerFee;
  return { buyerGross, sellerGross, buyerFee, sellerFee, buyerNet, sellerNet, platformFee };
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
        event: 'EVIDENCE_SUBMITTED',
        by: raisedBy,
        timestamp: new Date().toISOString(),
        description: `${raisedBy.charAt(0).toUpperCase() + raisedBy.slice(1)} submitted initial evidence`,
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
        evidenceResponses: {
          [raisedBy]: {
            submittedAt: new Date().toISOString(),
            rebuttal: description,
            evidenceUrls
          }
        },
        timeline: initialTimeline,
        lastActivity: new Date(),
      },
    });

    // ── Step 3.5: Create the EVIDENCE_SUBMITTED DisputeEvent ────────────────
    await prisma.disputeEvent.create({
      data: {
        deedDisputeId: dispute.id,
        type: 'EVIDENCE_SUBMITTED',
        actorRole: raisedBy,
        payload: {
          rebuttal: description,
          evidenceUrls,
          isLate: false
        }
      }
    });

    // ── Step 4: Update deed status ────────────────────────────────
    await prisma.deed.update({
      where: { id: deedId },
      data: { status: 'DISPUTED' },
    });

    // ── Step 5: Trigger Notification ─────────────
    const notificationService = require('../services/notificationService');
    const targetUserId = raisedBy === 'buyer' ? sellerId : buyerId;
    const targetRole = raisedBy === 'buyer' ? 'seller' : 'buyer';
    
    await notificationService.createNotification({
      userId: targetUserId,
      userRole: targetRole,
      type: 'DISPUTE_RAISED',
      title: 'Dispute Raised',
      message: `A dispute was raised against you for order #${deed.id.slice(0, 8)}. You have 48 hours to submit evidence.`,
      link: `/${targetRole}/deed/${deed.id}`
    }).catch(err => console.error('Failed to send dispute notification:', err.message));

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
        status: 'CHALLENGE_PHASE',
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
        const { generateAIReport } = require('../services/disputeAI');
        await generateAIReport(id);
      } catch (e) {
        console.error('[Dispute AI] Re-analysis failed:', e.message);
      }
    });

    // [Shadow Mode] Independent comparison — polls for Gemini's DB write then runs new system
    setImmediate(() => {
      const { runShadowComparison } = require('../services/ai/shadowCompare');
      runShadowComparison(id).catch(err => console.error('[ShadowCompare] uncaught:', err.message));
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
        status: 'ESCALATED',
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

    let dispute = await prisma.deedDispute.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'desc' } } }
    });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const deed = await prisma.deed.findUnique({ 
      where: { id: dispute.deedId },
      include: { ledgerEntries: true }
    });
    const buyer = await prisma.buyer.findUnique({ where: { id: dispute.buyerId } }).catch(() => null);
    const seller = dispute.sellerId
      ? await prisma.seller.findUnique({ where: { id: dispute.sellerId } }).catch(() => null)
      : null;

    // ── Stage C1: Lazy-Eval Wrappers for Timeouts ──────────────────────────────
    
    // Wrapper 1: Evidence Phase Timeout (OPEN -> AI Trigger)
    if (dispute.status === 'OPEN') {
      const ageHours = (Date.now() - new Date(dispute.createdAt).getTime()) / (1000 * 60 * 60);
      if (ageHours > disputeConfig.EVIDENCE_LATE_WINDOW_HOURS) {
        // Atomic optimistic lock on lastActivity (60s debounce)
        const lock = await prisma.deedDispute.updateMany({
          where: { 
            id: dispute.id, 
            status: 'OPEN',
            lastActivity: { lt: new Date(Date.now() - 60000) } 
          },
          data: { lastActivity: new Date() }
        });
        
        if (lock.count === 1) {
          // Guard against slow prior AI generation
          const existingReport = await prisma.disputeEvent.count({
            where: { deedDisputeId: dispute.id, type: 'AI_REPORT' }
          });
          
          if (existingReport === 0) {
            console.log(`[Lazy Wrapper] 48h elapsed in OPEN. Lock acquired. Triggering AI_REPORT...`);
            generateAIReport(dispute.id).catch(err => console.error("AI Gen Error:", err));
          }
        }
      }
    }
    
    // Wrapper 2: Challenge Phase Timeout (CHALLENGE_PHASE -> RESOLVED)
    if (dispute.status === 'CHALLENGE_PHASE') {
      const latestAiReportEvent = await prisma.disputeEvent.findFirst({
        where: { deedDisputeId: dispute.id, type: 'AI_REPORT' },
        orderBy: { createdAt: 'desc' }
      });
      
      if (latestAiReportEvent) {
        const totalAiReports = await prisma.disputeEvent.count({
          where: { deedDisputeId: dispute.id, type: 'AI_REPORT' }
        });

        let readyToSettle = false;
        let shouldTriggerReAnalysis = false;
        
        if (totalAiReports >= 2) {
          readyToSettle = true;
        } else {
          const reportAgeHours = (Date.now() - new Date(latestAiReportEvent.createdAt).getTime()) / (1000 * 60 * 60);
          if (reportAgeHours > disputeConfig.CHALLENGE_WINDOW_HOURS) {
            const challengeCount = await prisma.disputeEvent.count({
              where: { deedDisputeId: dispute.id, type: 'CHALLENGE' }
            });
            
            if (challengeCount === 0) {
              readyToSettle = true;
            } else if (challengeCount === 1) {
              shouldTriggerReAnalysis = true;
            }
          }
        }

        if (shouldTriggerReAnalysis) {
          console.log(`[Lazy Wrapper] 24h elapsed for ${dispute.id} with 1 challenge. Triggering AI Re-Analysis (Verdict 2)...`);
          const { generateAIReport } = require('../services/disputeAI');
          generateAIReport(dispute.id).catch(err => console.error("AI Re-Analysis Error from Wrapper:", err));
        } else if (readyToSettle) {
          const recommendation = latestAiReportEvent?.payload?.recommendation;

          // Explicit Guard
          if (recommendation !== 'REFUND_BUYER' && recommendation !== 'RELEASE_TO_SELLER') {
            const updated = await prisma.deedDispute.updateMany({
              where: { id: dispute.id, status: 'CHALLENGE_PHASE' },
              data: { status: 'ESCALATED', lastActivity: new Date() }
            });
            
            if (updated.count === 1) {
              console.log(`[Lazy Wrapper] Timeout elapsed in CHALLENGE_PHASE, but recommendation was ${recommendation}. Escalating...`);
              await prisma.disputeEvent.create({
                data: {
                  deedDisputeId: dispute.id,
                  type: 'ESCALATED',
                  actorRole: 'system-lazy-eval',
                  payload: { reason: 'Auto-settlement condition reached, but AI recommendation was MANUAL_REVIEW_REQUIRED. Escalating instead.' }
                }
              });
              dispute.status = 'ESCALATED';
            }
          } else {
            const { processTimeoutSettlement } = require('../services/settlementService');
            const settled = await processTimeoutSettlement({
              dispute,
              deed,
              recommendation,
              triggerSource: 'system-lazy-eval'
            });
            if (settled) {
              dispute.status = 'RESOLVED';
            }
          }
        }
      }
    }

    const scopeBox = deed?.scopeBox || {};
    const price = parseInt(deed?.amount ? deed.amount / 100 : scopeBox.price || 0, 10);
    
    const feeModelStatus = dispute.status === 'ESCALATED' ? 'ESCALATED' : 'RESOLVED';
    
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
              amount: deed.amount,
              deadline: deed.deadline,
              description: deed.description,
              deliverableFormats: deed.deliverableFormats,
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
    const { generateAIReport } = require('../services/disputeAI');

    const dispute = await prisma.deedDispute.findUnique({ where: { id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    await generateAIReport(id);
    
    // Fetch updated dispute to return the aiAnalysis
    const updatedDispute = await prisma.deedDispute.findUnique({ where: { id } });
    return res.json({ success: true, data: updatedDispute.aiAnalysis, message: 'AI analysis complete' });
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
    if (dispute.status !== 'ESCALATED') {
      return res.status(400).json({ success: false, message: 'Dispute must be in ESCALATED state for admin decision' });
    }
    
    const deed = dispute.deedId ? await prisma.deed.findUnique({ where: { id: dispute.deedId } }) : null;
    if (!deed) {
      return res.status(404).json({ success: false, message: 'Deed not found' });
    }

    const { executeSettlementTransaction } = require('../services/settlementService');
    await executeSettlementTransaction({
      dispute,
      deed,
      recommendation: action,
      buyerPct,
      actorRole: 'admin',
      actorId: req.user?.userId || req.user?.id || 'admin',
      notes,
      enhancedAnalysis,
      scopeCompliance
    });

    const finalDispute = await prisma.deedDispute.findUnique({ where: { id } });
    return res.json({ success: true, message: 'Dispute resolved successfully', data: finalDispute });
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
      prisma.deedDispute.count({ where: { status: 'CHALLENGE_PHASE' } }),
      prisma.deedDispute.count({ where: { status: 'RESOLVED' } }),
      prisma.deedDispute.count({ where: { status: 'ESCALATED' } }),
    ]);
    return res.json({ success: true, data: { total, open, underReview, resolved, mediation } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch dispute statistics' });
  }
};

// ─── Stage B: Event Ingestion (Part 2 Target Architecture) ───────────────────

const submitEvidenceEvent = async (req, res) => {
  try {
    const { id: deedId } = req.params;
    const { rebuttal } = req.body;
    
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) return res.status(404).json({ success: false, message: 'Deed not found' });
    
    // 1. Authorization Guard
    if (req.user.id !== deed.buyerId && req.user.id !== deed.sellerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const dispute = await prisma.deedDispute.findUnique({
      where: { deedId },
      include: { events: true }
    });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    
    if (dispute.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: 'Dispute is not in evidence collection phase' });
    }
    
    const actorRole = req.user.id === deed.buyerId ? 'buyer' : 'seller';
    
    // 2. Limit 1 per side check
    const existingSubmission = dispute.events.find(e => e.type === 'EVIDENCE_SUBMITTED' && e.actorRole === actorRole);
    if (existingSubmission) {
      return res.status(400).json({ success: false, message: 'Evidence already submitted for this party' });
    }
    
    // 3. Timeout Logic
    const disputeAgeHours = (new Date() - new Date(dispute.createdAt)) / (1000 * 60 * 60);
    if (disputeAgeHours > disputeConfig.EVIDENCE_LATE_WINDOW_HOURS) {
      return res.status(403).json({ success: false, message: 'Evidence window closed' });
    }
    
    const isLate = disputeAgeHours > disputeConfig.EVIDENCE_WINDOW_HOURS;
    
    const evidenceFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    })) : [];
    const evidenceUrls = evidenceFiles.map(file => `/uploads/${file.filename}`);
    
    const newEvent = await prisma.disputeEvent.create({
      data: {
        deedDisputeId: dispute.id,
        type: 'EVIDENCE_SUBMITTED',
        actorRole,
        actorId: req.user.id,
        payload: {
          rebuttal: rebuttal || '',
          evidenceUrls,
          isLate
        }
      }
    });

    // Mirror into AuditLedger so the Activity Log on the deed page stays complete.
    // Fire-and-forget — a ledger write failure must never block evidence submission.
    ledgerService.appendEvent(deedId, 'EVIDENCE_SUBMITTED', actorRole, req.user.id, {
      isLate,
      fileCount: evidenceUrls.length,
      disputeId: dispute.id
    }).catch(err => console.error('[Ledger] EVIDENCE_SUBMITTED write failed:', err.message));
    
    // 4.5. Backwards Compatibility: Update the legacy JSON column so the UI recognizes the submission
    const currentResponses = dispute.evidenceResponses && typeof dispute.evidenceResponses === 'object' ? dispute.evidenceResponses : {};
    await prisma.deedDispute.update({
      where: { id: dispute.id },
      data: {
        evidenceResponses: {
          ...currentResponses,
          [actorRole]: {
            submittedAt: new Date().toISOString(),
            rebuttal: rebuttal || '',
            evidenceUrls
          }
        }
      }
    });
    
    // 5. Trigger AI when counterparty submits
    if (actorRole !== dispute.raisedBy) {
      // Async trigger AI Report
      setImmediate(() => {
        console.log(`[Dispute ${dispute.id}] Counterparty submitted evidence, triggering AI report...`);
        generateAIReport(dispute.id).catch(err => console.error("AI Gen Error:", err));
      });

      // [Shadow Mode] Independent comparison — polls for Gemini's DB write then runs new system
      setImmediate(() => {
        const { runShadowComparison } = require('../services/ai/shadowCompare');
        runShadowComparison(dispute.id).catch(err => console.error('[ShadowCompare] uncaught:', err.message));
      });
    }
    
    return res.json({ success: true, message: 'Evidence submitted successfully', data: newEvent });
  } catch (e) {
    console.error("submitEvidenceEvent Error:", e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const submitChallengeEvent = async (req, res) => {
  try {
    const { id: deedId } = req.params;
    const { rebuttal } = req.body;
    
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) return res.status(404).json({ success: false, message: 'Deed not found' });
    
    // 1. Authorization Guard
    if (req.user.id !== deed.buyerId && req.user.id !== deed.sellerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const dispute = await prisma.deedDispute.findUnique({
      where: { deedId },
      include: { events: { orderBy: { createdAt: 'desc' } } }
    });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    
    if (dispute.status !== 'CHALLENGE_PHASE') {
      return res.status(400).json({ success: false, message: 'Dispute is not in challenge phase' });
    }
    
    const actorRole = req.user.id === deed.buyerId ? 'buyer' : 'seller';
    
    // 2. Limit 1 per side check
    const existingChallenge = dispute.events.find(e => e.type === 'CHALLENGE' && e.actorRole === actorRole);
    if (existingChallenge) {
      return res.status(400).json({ success: false, message: 'Challenge already submitted for this party' });
    }
    
    // 3. Timeout Logic: find most recent AI_REPORT
    const aiReportEvent = dispute.events.find(e => e.type === 'AI_REPORT');
    if (!aiReportEvent) {
      return res.status(400).json({ success: false, message: 'No AI Report exists yet' });
    }
    const reportAgeHours = (new Date() - new Date(aiReportEvent.createdAt)) / (1000 * 60 * 60);
    if (reportAgeHours > disputeConfig.CHALLENGE_WINDOW_HOURS) {
      return res.status(403).json({ success: false, message: 'Challenge window closed' });
    }
    
    if (!rebuttal) {
       return res.status(400).json({ success: false, message: 'Rebuttal is required for a challenge' });
    }
    
    const evidenceFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    })) : [];
    const evidenceUrls = evidenceFiles.map(file => `/uploads/${file.filename}`);
    
    // 4. Create DisputeEvent
    const newEvent = await prisma.disputeEvent.create({
      data: {
        deedDisputeId: dispute.id,
        type: 'CHALLENGE',
        actorRole,
        actorId: req.user.id,
        payload: {
          rebuttal,
          evidenceUrls
        }
      }
    });

    // Mirror into AuditLedger (fire-and-forget).
    ledgerService.appendEvent(deedId, 'DISPUTE_CHALLENGE', actorRole, req.user.id, {
      fileCount: evidenceUrls.length,
      disputeId: dispute.id
    }).catch(err => console.error('[Ledger] DISPUTE_CHALLENGE write failed:', err.message));
    
    // 5. Active Triggers
    const challengeCount = await prisma.disputeEvent.count({
      where: { deedDisputeId: dispute.id, type: 'CHALLENGE' }
    });
    
    if (challengeCount === 1) {
      console.log(`[Dispute ${dispute.id}] 1 challenge submitted. Waiting for counterparty or 24h timeout...`);
    } else if (challengeCount === 2) {
      // Both parties challenged. The challenge window is effectively over. 
      // Trigger AI re-analysis immediately.
      setImmediate(async () => {
        try {
          console.log(`[Dispute ${dispute.id}] Both parties challenged. Triggering AI re-analysis (Verdict 2)...`);
          const { generateAIReport } = require('../services/disputeAI');
          await generateAIReport(dispute.id, { triggeredBySecondChallenge: true });
        } catch (err) {
          // generateAIReport only re-throws when BOTH the AI run AND its internal
          // fallback escalation failed (see disputeAI.js). Apply emergency escalation
          // here as the last line of defence so the dispute never stalls indefinitely.
          console.error(`[Dispute ${dispute.id}] AI re-analysis trigger failed — applying emergency escalation:`, err.message);
          try {
            await prisma.deedDispute.updateMany({
              where: { id: dispute.id, status: { notIn: ['ESCALATED', 'RESOLVED'] } },
              data: { status: 'ESCALATED', lastActivity: new Date() }
            });
            console.log(`[Dispute ${dispute.id}] Emergency escalation applied.`);
          } catch (dbErr) {
            console.error(`[Dispute ${dispute.id}] Emergency escalation also failed:`, dbErr.message);
          }
        }
      });

      // [Shadow Mode] Independent comparison
      setImmediate(() => {
        const { runShadowComparison } = require('../services/ai/shadowCompare');
        runShadowComparison(dispute.id).catch(err => console.error('[ShadowCompare] uncaught:', err.message));
      });
    }
    
    return res.json({ success: true, message: 'Challenge submitted successfully', data: newEvent });
  } catch (e) {
    console.error("submitChallengeEvent Error:", e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
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
  submitEvidenceEvent,
  submitChallengeEvent,
  calculateResolutionAmounts,
};

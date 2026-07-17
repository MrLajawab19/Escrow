const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateAdmin } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ── Admin auth middleware ───────────────────────────────────────────────────────

function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    req.admin = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// ── Auto-flag logic ────────────────────────────────────────────────────────────

function computeFlag(dispute, order) {
  if (!order) return { flag: 'MANUAL', riskScore: 30, riskReason: 'Standard dispute' };
  const scopeBox = order.scopeBox && typeof order.scopeBox === 'object' ? order.scopeBox : {};
  const price = parseInt(scopeBox.price || 0, 10);
  const isAfterDelivery = order.status === 'SUBMITTED' || order.status === 'APPROVED';
  const isHighValue = price > 30000;

  if (isAfterDelivery && isHighValue) return { flag: 'AUTO_FLAGGED', riskScore: 90, riskReason: 'High-value dispute after delivery' };
  if (isAfterDelivery) return { flag: 'AUTO_FLAGGED', riskScore: 65, riskReason: 'Dispute raised after delivery submitted' };
  if (isHighValue) return { flag: 'AUTO_FLAGGED', riskScore: 55, riskReason: `High-value order (₹${price / 100})` };
  return { flag: 'MANUAL', riskScore: 25, riskReason: 'Standard dispute' };
}

// ── GET /api/admin/stats ───────────────────────────────────────────────────────

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const activeStatuses = ['PENDING_SELLER', 'PENDING_SIGNATURES', 'ACTIVE', 'ESCROW_LOCKED', 'IN_PROGRESS', 'SUBMITTED', 'CHANGES_REQUESTED', 'DISPUTED', 'ARBITRATING', 'ARBITRATED', 'ESCALATED'];
    const completedStatuses = ['CONFIRMED', 'CLOSED', 'CANCELLED'];

    const [
      totalOrders, activeOrders, completedOrders,
      totalDisputes, openDisputes, challengeDisputes, escalatedDisputes, resolvedDisputes,
      totalBuyers, totalSellers, recentDisputes,
    ] = await Promise.all([
      prisma.deed.count(),
      prisma.deed.count({ where: { status: { in: activeStatuses } } }),
      prisma.deed.count({ where: { status: { in: completedStatuses } } }),
      prisma.deedDispute.count(),
      prisma.deedDispute.count({ where: { status: 'OPEN' } }),
      prisma.deedDispute.count({ where: { status: 'CHALLENGE_PHASE' } }),
      prisma.deedDispute.count({ where: { status: 'ESCALATED' } }),
      prisma.deedDispute.count({ where: { status: 'RESOLVED' } }),
      prisma.buyer.count(),
      prisma.seller.count(),
      prisma.deedDispute.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    // Status breakdown
    const statusGroups = await prisma.deed.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const ordersByStatus = statusGroups.map(g => ({ status: g.status, count: g._count.id }));

    return res.json({
      success: true,
      data: {
        totalOrders, activeOrders, completedOrders,
        totalDisputes, openDisputes, challengeDisputes, escalatedDisputes, resolvedDisputes,
        totalBuyers, totalSellers, recentDisputes, ordersByStatus,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ── GET /api/admin/disputes ────────────────────────────────────────────────────

router.get('/disputes', adminAuth, async (req, res) => {
  try {
    const { status, flag, search, stale } = req.query;
    const where = {};
    if (status) where.status = status;

    if (stale === 'true') {
      const { EVIDENCE_LATE_WINDOW_HOURS, CHALLENGE_WINDOW_HOURS } = require('../config/disputeConfig');
      const evidenceCutoff = new Date(Date.now() - EVIDENCE_LATE_WINDOW_HOURS * 60 * 60 * 1000);
      const challengeCutoff = new Date(Date.now() - CHALLENGE_WINDOW_HOURS * 60 * 60 * 1000);

      where.OR = [
        { status: 'OPEN', lastActivity: { lt: evidenceCutoff } },
        { status: 'CHALLENGE_PHASE', lastActivity: { lt: challengeCutoff } }
      ];
    }

    const disputes = await prisma.deedDispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const deedIds = [...new Set(disputes.map(d => d.deedId).filter(Boolean))];
    const deeds = await prisma.deed.findMany({ where: { id: { in: deedIds } } });
    const deedMap = deeds.reduce((acc, d) => { acc[d.id] = d; return acc; }, {});

    // For listing, we might need buyer names and seller contacts. 
    const buyerIds = [...new Set(deeds.map(d => d.buyerId).filter(Boolean))];
    const buyers = await prisma.buyer.findMany({ where: { id: { in: buyerIds } } });
    const buyerMap = buyers.reduce((acc, b) => { acc[b.id] = b; return acc; }, {});

    const sellerIds = [...new Set(deeds.map(d => d.sellerId).filter(Boolean))];
    const sellers = await prisma.seller.findMany({ where: { id: { in: sellerIds } } });
    const sellerMap = sellers.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

    const enriched = disputes.map(d => {
      const deed = deedMap[d.deedId] || null;
      const buyer = deed ? buyerMap[deed.buyerId] : null;
      const seller = deed ? sellerMap[deed.sellerId] : null;
      // computeFlag is tightly coupled to order shape, we pass deed and mock what it needs
      const { flag: autoFlag, riskScore, riskReason } = computeFlag(d, deed);
      return {
        ...d,
        deed: deed ? {
          id: deed.id, status: deed.status, scopeBox: deed.scopeBox,
          buyerName: buyer ? `${buyer.firstName} ${buyer.lastName}` : 'Unknown', 
          sellerContact: seller?.email || 'Unknown',
          currency: deed.currency,
          createdAt: deed.createdAt,
        } : null,
        autoFlag, riskScore, riskReason,
      };
    });

    const filtered = flag ? enriched.filter(d => d.autoFlag === flag) : enriched;
    const searched = search
      ? filtered.filter(d =>
          d.deedId?.toLowerCase().includes(search.toLowerCase()) ||
          d.reason?.toLowerCase().includes(search.toLowerCase()) ||
          d.description?.toLowerCase().includes(search.toLowerCase())
        )
      : filtered;

    const { limit = 20, page = 1 } = req.query;
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const paginatedDisputes = searched.slice(skip, skip + take);

    return res.json({ 
      success: true, 
      data: {
        disputes: paginatedDisputes,
        total: searched.length,
        page: parseInt(page, 10),
        limit: take
      } 
    });
  } catch (err) {
    console.error('Admin disputes error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch disputes' });
  }
});

// ── GET /api/admin/disputes/:id ────────────────────────────────────────────────

const getDisputeFull = async (req, res) => {
  try {
    const dispute = await prisma.deedDispute.findUnique({ where: { id: req.params.id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const [deed, buyer, seller] = await Promise.all([
      prisma.deed.findUnique({ where: { id: dispute.deedId }, include: { ledgerEntries: true } }).catch(() => null),
      prisma.buyer.findUnique({ where: { id: dispute.buyerId } }).catch(() => null),
      dispute.sellerId ? prisma.seller.findUnique({ where: { id: dispute.sellerId } }).catch(() => null) : null,
    ]);

    const { flag: autoFlag, riskScore, riskReason } = computeFlag(dispute, deed);

    const deedTimeline = (Array.isArray(deed?.ledgerEntries) ? deed.ledgerEntries : []).map(log => ({
      event: log.eventType,
      timestamp: log.timestamp,
      by: log.actorRole,
      description: (log.eventType || '').replace(/_/g, ' '),
    }));
    
    // Extract deliveryFiles from ledger
    let deliveryFiles = [];
    if (deed?.ledgerEntries) {
      const deliveryLogs = deed.ledgerEntries.filter(e => e.eventType === 'DELIVERY_CLAIMED');
      if (deliveryLogs.length > 0) {
        try {
           const payload = JSON.parse(deliveryLogs[deliveryLogs.length - 1].payload);
           deliveryFiles = payload.fileUrls || [];
        } catch(e){}
      }
    }

    const disputeTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
    const combinedTimeline = [...deedTimeline, ...disputeTimeline]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.json({
      success: true,
      data: {
        dispute,
        deed: deed ? {
          id: deed.id, status: deed.status, scopeBox: deed.scopeBox,
          buyerName: buyer ? `${buyer.firstName} ${buyer.lastName}` : 'Unknown', buyerEmail: buyer?.email,
          currency: deed.currency, sellerContact: seller?.email,
          deliveryFiles: deliveryFiles, createdAt: deed.createdAt, updatedAt: deed.updatedAt,
        } : null,
        buyer: buyer ? { id: buyer.id, firstName: buyer.firstName, lastName: buyer.lastName, email: buyer.email } : null,
        seller: seller ? { id: seller.id, firstName: seller.firstName, lastName: seller.lastName, email: seller.email, businessName: seller.businessName } : null,
        autoFlag, riskScore, riskReason,
        timeline: combinedTimeline,
      },
    });
  } catch (err) {
    console.error('Admin dispute detail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dispute detail' });
  }
};

router.get('/disputes/:id', adminAuth, getDisputeFull);
router.get('/disputes/:id/full', adminAuth, getDisputeFull);

// ── POST /api/admin/disputes/:id/resolve ──────────────────────────────────────

router.post('/disputes/:id/resolve', adminAuth, async (req, res) => {
  try {
    const { action, notes } = req.body;
    if (!action) return res.status(400).json({ success: false, message: 'action is required (REFUND or RELEASE)' });

    const dispute = await prisma.deedDispute.findUnique({ where: { id: req.params.id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    if (dispute.status === 'RESOLVED') return res.status(400).json({ success: false, message: 'Dispute already resolved' });

    const resolution = action === 'REFUND' ? 'REFUND_BUYER' : 'RELEASE_TO_SELLER';
    const orderStatus = action === 'REFUND' ? 'REFUNDED' : 'COMPLETED';

    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
    const resolutionEntry = {
      event: 'DISPUTE_RESOLVED',
      by: 'admin',
      timestamp: new Date().toISOString(),
      description: `Admin resolved: ${action === 'REFUND' ? 'Refunded buyer' : 'Released payment to seller'}`,
      notes: notes || '',
    };

    const updatedDispute = await prisma.deedDispute.update({
      where: { id: req.params.id },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedBy: req.admin?.id || 'admin',
        resolvedAt: new Date(),
        timeline: [...currentTimeline, resolutionEntry],
        lastActivity: new Date(),
      },
    });

    if (dispute.orderId) {
      await prisma.deed.update({
        where: { id: dispute.orderId },
        data: { status: orderStatus },
      });
    } else if (dispute.deedId) {
      await prisma.deed.update({
        where: { id: dispute.deedId },
        data: { status: orderStatus },
      });
    }

    return res.json({ success: true, message: `Dispute resolved: ${action}`, data: updatedDispute });
  } catch (err) {
    console.error('Admin resolve error:', err);
    return res.status(500).json({ success: false, message: 'Failed to resolve dispute' });
  }
});

// ── POST /api/admin/disputes/:id/ai-analysis ──────────────────────────────────

router.post('/disputes/:id/ai-analysis', adminAuth, async (req, res) => {
  try {
    const dispute = await prisma.deedDispute.findUnique({ where: { id: req.params.id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    
    const { generateAIReport } = require('../services/disputeAI');
    await generateAIReport(dispute.id);
    
    const updatedDispute = await prisma.deedDispute.findUnique({
      where: { id: dispute.id }
    });

    return res.json({ success: true, message: 'AI Analysis manually triggered.', data: updatedDispute });
  } catch (err) {
    console.error('Admin AI analysis error:', err);
    return res.status(500).json({ success: false, message: 'Failed to trigger AI analysis: ' + err.message });
  }
});

// ── GET /api/admin/deeds ─────────────────────────────────────────────────────

router.get('/deeds', adminAuth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const deeds = await prisma.deed.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    
    const total = await prisma.deed.count();

    return res.json({ 
      success: true, 
      data: {
        deeds,
        total,
        page: parseInt(page, 10),
        limit: take
      } 
    });
  } catch (err) {
    console.error('Admin deeds error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch deeds' });
  }
});

// ── GET /api/admin/buyers ─────────────────────────────────────────────────────

router.get('/buyers', adminAuth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const buyers = await prisma.buyer.findMany({ 
      select: { id: true, email: true, firstName: true, lastName: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    const total = await prisma.buyer.count();

    return res.json({ success: true, data: { buyers, total, page: parseInt(page, 10), limit: take } });
  } catch (err) {
    console.error('Admin buyers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch buyers' });
  }
});

// ── GET /api/admin/sellers ────────────────────────────────────────────────────

router.get('/sellers', adminAuth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const sellers = await prisma.seller.findMany({ 
      select: { id: true, email: true, firstName: true, lastName: true, businessName: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    const total = await prisma.seller.count();

    return res.json({ success: true, data: { sellers, total, page: parseInt(page, 10), limit: take } });
  } catch (err) {
    console.error('Admin sellers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch sellers' });
  }
});

// ── POST /api/admin/users/:id/suspend ───────────────────────────────────────
router.post('/users/:id/suspend', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let user = await prisma.buyer.updateMany({ where: { id }, data: { status: 'suspended' } });
    if (user.count === 0) {
      user = await prisma.seller.updateMany({ where: { id }, data: { status: 'suspended' } });
    }
    return res.json({ success: true, message: 'User suspended' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to suspend user' });
  }
});

// ── POST /api/admin/users/:id/activate ──────────────────────────────────────
router.post('/users/:id/activate', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let user = await prisma.buyer.updateMany({ where: { id }, data: { status: 'active' } });
    if (user.count === 0) {
      user = await prisma.seller.updateMany({ where: { id }, data: { status: 'active' } });
    }
    return res.json({ success: true, message: 'User activated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to activate user' });
  }
});

// ── POST /api/admin/seed ────────────────────────────────────────────────────
router.post('/seed', async (req, res) => {
  try {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return res.status(400).json({ success: false, message: 'Admin credentials not found in env' });
    }
    
    const existing = await prisma.admin.findUnique({ where: { email: ADMIN_EMAIL } });
    if (existing) return res.status(400).json({ success: false, message: 'Admin already exists' });
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const admin = await prisma.admin.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: 'System Admin'
      }
    });
    
    return res.status(201).json({ success: true, message: 'Admin created' });
  } catch (err) {
    console.error('Seed Admin Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to seed admin' });
  }
});

// ── GET /api/admin/financials ────────────────────────────────────────────────
router.get('/financials', adminAuth, async (req, res) => {
  try {
    const [wallets, lockedTx, releasedTx, recentTransactions] = await Promise.all([
      prisma.wallet.findMany({ select: { lockedBalance: true } }),
      prisma.walletTransaction.aggregate({
        where: { category: 'ESCROW_LOCK', status: 'SUCCESS' },
        _sum: { amount: true }
      }),
      prisma.walletTransaction.aggregate({
        where: { category: 'ESCROW_RELEASE', status: 'SUCCESS' },
        _sum: { amount: true, fee: true }
      }),
      prisma.walletTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { wallet: { select: { userRole: true, userId: true } } }
      })
    ]);

    const totalActiveEscrow = wallets.reduce((sum, w) => sum + (w.lockedBalance || 0), 0);
    const totalEscrowVolume = lockedTx._sum.amount || 0;
    
    // In our system right now we might not be explicitly storing fee on ESCROW_RELEASE
    // So we can compute a mock platform revenue (e.g., 5% of released volume)
    const totalReleasedVolume = releasedTx._sum.amount || 0;
    const totalPlatformRevenue = (releasedTx._sum.fee || 0) > 0 
      ? releasedTx._sum.fee 
      : totalReleasedVolume * 0.05; 

    // Time-series data: Group by day for the last 30 days (simplified)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyVolumeRaw = await prisma.walletTransaction.groupBy({
      by: ['createdAt'], // Grouping by createdAt requires date truncating which Prisma doesn't do natively across all DBs easily
      where: { category: 'ESCROW_LOCK', status: 'SUCCESS', createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true }
    });
    
    // Since Prisma groupBy doesn't easily truncate to Date, let's just fetch recent locks and group in JS
    const recentLocks = await prisma.walletTransaction.findMany({
      where: { category: 'ESCROW_LOCK', status: 'SUCCESS', createdAt: { gte: thirtyDaysAgo } },
      select: { amount: true, createdAt: true }
    });
    
    const volumeByDay = {};
    recentLocks.forEach(tx => {
      const dateStr = tx.createdAt.toISOString().split('T')[0];
      volumeByDay[dateStr] = (volumeByDay[dateStr] || 0) + tx.amount;
    });
    
    const revenueOverTime = Object.keys(volumeByDay).sort().map(date => ({
      date,
      volume: volumeByDay[date],
      revenue: volumeByDay[date] * 0.05
    }));

    return res.json({
      success: true,
      data: {
        totalActiveEscrow,
        totalEscrowVolume,
        totalPlatformRevenue,
        recentTransactions,
        revenueOverTime
      }
    });
  } catch (err) {
    console.error('Admin financials error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch financials' });
  }
});

// +?+? GET /api/admin/kyc (Queue)
router.get('/kyc', adminAuth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const pendingKyc = await prisma.kYC.findMany({
      where: { reviewStatus: 'PENDING', idDocUrls: { isEmpty: false } },
      orderBy: { submittedAt: 'asc' },
      take,
      skip,
    });
    
    const total = await prisma.kYC.count({
      where: { reviewStatus: 'PENDING', idDocUrls: { isEmpty: false } }
    });

    return res.json({ success: true, data: { pendingKyc, total, page: parseInt(page, 10), limit: take } });
  } catch (err) {
    console.error('Admin KYC error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch KYC queue' });
  }
});

// +?+? POST /api/admin/kyc/:id/approve
router.post('/kyc/:id/approve', adminAuth, async (req, res) => {
  try {
    const kyc = await prisma.kYC.update({
      where: { id: req.params.id },
      data: { reviewStatus: 'APPROVED', kycComplete: true, completedAt: new Date() }
    });
    return res.json({ success: true, message: 'KYC Approved', data: kyc });
  } catch (err) {
    console.error('Admin KYC approve error:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve KYC' });
  }
});

// +?+? POST /api/admin/kyc/:id/reject
router.post('/kyc/:id/reject', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const kyc = await prisma.kYC.update({
      where: { id: req.params.id },
      data: { reviewStatus: 'REJECTED', kycComplete: false, rejectionReason: reason || 'Invalid documents' }
    });
    return res.json({ success: true, message: 'KYC Rejected', data: kyc });
  } catch (err) {
    console.error('Admin KYC reject error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject KYC' });
  }
});

// ── GET /api/admin/deeds ──────────────────────────────────────────────────────
router.get('/deeds', adminAuth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const deeds = await prisma.deed.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        milestones: { select: { id: true, status: true, amount: true } }
      }
    });
    
    const total = await prisma.deed.count();

    return res.json({ 
      success: true, 
      data: {
        deeds,
        total,
        page: parseInt(page, 10),
        limit: take
      } 
    });
  } catch (err) {
    console.error('Admin deeds error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch deeds' });
  }
});

// ── GET /api/admin/deeds/:id ──────────────────────────────────────────────────
router.get('/deeds/:id', adminAuth, async (req, res) => {
  try {
    const deed = await prisma.deed.findUnique({
      where: { id: req.params.id },
      include: {
        milestones: { orderBy: { milestoneNumber: 'asc' } },
        ledgerEntries: { orderBy: { createdAt: 'asc' } },
        dispute: true
      }
    });
    if (!deed) return res.status(404).json({ success: false, message: 'Deed not found' });
    return res.json({ success: true, data: deed });
  } catch (err) {
    console.error('Admin deed detail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch deed details' });
  }
});

// Reconcile a user's locked balance
router.get('/reconcile-wallet/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const reconciliation = await walletService.verifyLockedBalance(userId);
    res.json(reconciliation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
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
  const price = parseFloat(scopeBox.price || 0);
  const isAfterDelivery = order.status === 'SUBMITTED' || order.status === 'APPROVED';
  const isHighValue = price > 300;

  if (isAfterDelivery && isHighValue) return { flag: 'AUTO_FLAGGED', riskScore: 90, riskReason: 'High-value dispute after delivery' };
  if (isAfterDelivery) return { flag: 'AUTO_FLAGGED', riskScore: 65, riskReason: 'Dispute raised after delivery submitted' };
  if (isHighValue) return { flag: 'AUTO_FLAGGED', riskScore: 55, riskReason: `High-value order (₹${price})` };
  return { flag: 'MANUAL', riskScore: 25, riskReason: 'Standard dispute' };
}

// ── GET /api/admin/stats ───────────────────────────────────────────────────────

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const activeStatuses = ['PLACED', 'ESCROW_FUNDED', 'IN_PROGRESS', 'SUBMITTED', 'CHANGES_REQUESTED', 'ACCEPTED', 'DISPUTED'];
    const completedStatuses = ['COMPLETED', 'RELEASED', 'REFUNDED', 'CANCELLED'];

    const [
      totalOrders, activeOrders, completedOrders,
      totalDisputes, openDisputes, underReviewDisputes, resolvedDisputes,
      totalBuyers, totalSellers, recentDisputes,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: activeStatuses } } }),
      prisma.order.count({ where: { status: { in: completedStatuses } } }),
      prisma.orderDispute.count(),
      prisma.orderDispute.count({ where: { status: 'OPEN' } }),
      prisma.orderDispute.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.orderDispute.count({ where: { status: 'RESOLVED' } }),
      prisma.buyer.count(),
      prisma.seller.count(),
      prisma.orderDispute.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    // Status breakdown
    const statusGroups = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const ordersByStatus = statusGroups.map(g => ({ status: g.status, count: g._count.id }));

    return res.json({
      success: true,
      data: {
        totalOrders, activeOrders, completedOrders,
        totalDisputes, openDisputes, underReviewDisputes, resolvedDisputes,
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
    const { status, flag, search } = req.query;
    const where = {};
    if (status) where.status = status;

    const disputes = await prisma.orderDispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const enriched = await Promise.all(disputes.map(async (d) => {
      const order = await prisma.order.findUnique({ where: { id: d.orderId } }).catch(() => null);
      const { flag: autoFlag, riskScore, riskReason } = computeFlag(d, order);
      return {
        ...d,
        order: order ? {
          id: order.id, status: order.status, scopeBox: order.scopeBox,
          buyerName: order.buyerName, currency: order.currency,
          sellerContact: order.sellerContact, createdAt: order.createdAt,
        } : null,
        autoFlag, riskScore, riskReason,
      };
    }));

    const filtered = flag ? enriched.filter(d => d.autoFlag === flag) : enriched;
    const searched = search
      ? filtered.filter(d =>
          d.orderId?.toLowerCase().includes(search.toLowerCase()) ||
          d.reason?.toLowerCase().includes(search.toLowerCase()) ||
          d.description?.toLowerCase().includes(search.toLowerCase())
        )
      : filtered;

    return res.json({ success: true, data: searched });
  } catch (err) {
    console.error('Admin disputes error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch disputes' });
  }
});

// ── GET /api/admin/disputes/:id ────────────────────────────────────────────────

router.get('/disputes/:id', adminAuth, async (req, res) => {
  try {
    const dispute = await prisma.orderDispute.findUnique({ where: { id: req.params.id } });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const [order, buyer, seller] = await Promise.all([
      prisma.order.findUnique({ where: { id: dispute.orderId } }).catch(() => null),
      prisma.buyer.findUnique({ where: { id: dispute.buyerId } }).catch(() => null),
      dispute.sellerId ? prisma.seller.findUnique({ where: { id: dispute.sellerId } }).catch(() => null) : null,
    ]);

    const { flag: autoFlag, riskScore, riskReason } = computeFlag(dispute, order);

    const orderTimeline = (Array.isArray(order?.orderLogs) ? order.orderLogs : []).map(log => ({
      event: log.event,
      timestamp: log.timestamp,
      by: log.byUserId,
      description: (log.event || '').replace(/_/g, ' '),
    }));
    const disputeTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
    const combinedTimeline = [...orderTimeline, ...disputeTimeline]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.json({
      success: true,
      data: {
        dispute,
        order: order ? {
          id: order.id, status: order.status, scopeBox: order.scopeBox,
          buyerName: order.buyerName, buyerEmail: order.buyerEmail,
          currency: order.currency, sellerContact: order.sellerContact,
          deliveryFiles: order.deliveryFiles, createdAt: order.createdAt, updatedAt: order.updatedAt,
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
});

// ── POST /api/admin/disputes/:id/resolve ──────────────────────────────────────

router.post('/disputes/:id/resolve', adminAuth, async (req, res) => {
  try {
    const { action, notes } = req.body;
    if (!action) return res.status(400).json({ success: false, message: 'action is required (REFUND or RELEASE)' });

    const dispute = await prisma.orderDispute.findUnique({ where: { id: req.params.id } });
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

    const updatedDispute = await prisma.orderDispute.update({
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

    await prisma.order.update({
      where: { id: dispute.orderId },
      data: { status: orderStatus },
    });

    return res.json({ success: true, message: `Dispute resolved: ${action}`, data: updatedDispute });
  } catch (err) {
    console.error('Admin resolve error:', err);
    return res.status(500).json({ success: false, message: 'Failed to resolve dispute' });
  }
});

// ── GET /api/admin/orders ─────────────────────────────────────────────────────

router.get('/orders', adminAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ success: true, data: orders });
  } catch (err) {
    console.error('Admin orders error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────

router.get('/users', adminAuth, async (req, res) => {
  try {
    const [buyers, sellers] = await Promise.all([
      prisma.buyer.findMany({ select: { id: true, email: true, firstName: true, lastName: true, status: true, createdAt: true } }),
      prisma.seller.findMany({ select: { id: true, email: true, firstName: true, lastName: true, businessName: true, status: true, createdAt: true } }),
    ]);
    return res.json({ success: true, data: { buyers, sellers } });
  } catch (err) {
    console.error('Admin users error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// +?+? GET /api/admin/kyc (Queue)
router.get('/kyc', adminAuth, async (req, res) => {
  try {
    const pendingKyc = await prisma.kYC.findMany({
      where: { reviewStatus: 'PENDING', idDocUrls: { isEmpty: false } },
      orderBy: { submittedAt: 'asc' }
    });
    return res.json({ success: true, data: pendingKyc });
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

module.exports = router;


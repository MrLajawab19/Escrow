const express = require('express');
const router = express.Router();
const { Sequelize, Op } = require('sequelize');
const config = require('../config/config.json');

// Initialize database connection
const sequelize = new Sequelize(config.development);
const Order = require('../models/order')(sequelize, Sequelize.DataTypes);
const Dispute = require('../models/dispute')(sequelize, Sequelize.DataTypes);
const Buyer = require('../models/buyer')(sequelize, Sequelize.DataTypes);
const Seller = require('../models/seller')(sequelize, Sequelize.DataTypes);

const { authenticateToken } = require('../middleware/auth');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const jwt = require('jsonwebtoken');

// Admin auth middleware (inline, no DB lookup needed for admin)
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

// Auto-flag logic: flag a dispute if order value > 300 or buyer raised after SUBMITTED
function computeFlag(dispute, order) {
  if (!order) return { flag: 'MANUAL', riskScore: 30, riskReason: 'Standard dispute' };
  const price = parseFloat(order.scopeBox?.price || 0);
  const isAfterDelivery = order.status === 'SUBMITTED' || order.status === 'APPROVED';
  const isHighValue = price > 300;

  if (isAfterDelivery && isHighValue) {
    return { flag: 'AUTO_FLAGGED', riskScore: 90, riskReason: 'High-value dispute after delivery' };
  } else if (isAfterDelivery) {
    return { flag: 'AUTO_FLAGGED', riskScore: 65, riskReason: 'Dispute raised after delivery submitted' };
  } else if (isHighValue) {
    return { flag: 'AUTO_FLAGGED', riskScore: 55, riskReason: `High-value order ($${price})` };
  }
  return { flag: 'MANUAL', riskScore: 25, riskReason: 'Standard dispute' };
}

// GET /api/admin/stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const activeStatuses = ['PLACED', 'ESCROW_FUNDED', 'IN_PROGRESS', 'SUBMITTED', 'CHANGES_REQUESTED', 'ACCEPTED', 'DISPUTED'];
    const activeOrders = await Order.count({ where: { status: { [Op.in]: activeStatuses } } });
    const completedOrders = await Order.count({ where: { status: { [Op.in]: ['COMPLETED', 'RELEASED', 'REFUNDED', 'CANCELLED'] } } });
    const totalDisputes = await Dispute.count();
    const openDisputes = await Dispute.count({ where: { status: 'OPEN' } });
    const underReviewDisputes = await Dispute.count({ where: { status: 'UNDER_REVIEW' } });
    const resolvedDisputes = await Dispute.count({ where: { status: 'RESOLVED' } });
    const totalBuyers = await Buyer.count();
    const totalSellers = await Seller.count();

    // Orders by status breakdown
    const statusCounts = await Order.findAll({
      attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true
    });

    // Recent disputes (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentDisputes = await Dispute.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } });

    res.json({
      success: true,
      data: {
        totalOrders,
        activeOrders,
        completedOrders,
        totalDisputes,
        openDisputes,
        underReviewDisputes,
        resolvedDisputes,
        totalBuyers,
        totalSellers,
        recentDisputes,
        ordersByStatus: statusCounts
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// GET /api/admin/disputes
router.get('/disputes', adminAuth, async (req, res) => {
  try {
    const { status, flag, search } = req.query;
    const where = {};
    if (status) where.status = status;

    const disputes = await Dispute.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    // Enrich with order data + auto-flag
    const enriched = await Promise.all(disputes.map(async (d) => {
      const order = await Order.findByPk(d.orderId);
      const { flag: autoFlag, riskScore, riskReason } = computeFlag(d, order);
      return {
        ...d.toJSON(),
        order: order ? {
          id: order.id,
          status: order.status,
          scopeBox: order.scopeBox,
          buyerName: order.buyerName,
          currency: order.currency,
          sellerContact: order.sellerContact,
          createdAt: order.createdAt
        } : null,
        autoFlag,
        riskScore,
        riskReason
      };
    }));

    // Apply flag filter after enrichment
    const filtered = flag
      ? enriched.filter(d => d.autoFlag === flag)
      : enriched;

    // Apply search filter
    const searched = search
      ? filtered.filter(d =>
          d.orderId?.toLowerCase().includes(search.toLowerCase()) ||
          d.reason?.toLowerCase().includes(search.toLowerCase()) ||
          d.description?.toLowerCase().includes(search.toLowerCase())
        )
      : filtered;

    res.json({ success: true, data: searched });
  } catch (err) {
    console.error('Admin disputes error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch disputes' });
  }
});

// GET /api/admin/disputes/:id  
router.get('/disputes/:id', adminAuth, async (req, res) => {
  try {
    const dispute = await Dispute.findByPk(req.params.id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const order = await Order.findByPk(dispute.orderId);
    const buyer = await Buyer.findByPk(dispute.buyerId).catch(() => null);
    const seller = await Seller.findByPk(dispute.sellerId).catch(() => null);

    const { flag: autoFlag, riskScore, riskReason } = computeFlag(dispute, order);

    // Build timeline from order logs + dispute events
    const orderTimeline = (order?.orderLogs || []).map(log => ({
      event: log.event,
      timestamp: log.timestamp,
      by: log.byUserId,
      description: log.event.replace(/_/g, ' ')
    }));
    const disputeTimeline = dispute.timeline || [];
    const combinedTimeline = [...orderTimeline, ...disputeTimeline]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      success: true,
      data: {
        dispute: dispute.toJSON(),
        order: order ? {
          id: order.id,
          status: order.status,
          scopeBox: order.scopeBox,
          buyerName: order.buyerName,
          buyerEmail: order.buyerEmail,
          currency: order.currency,
          sellerContact: order.sellerContact,
          deliveryFiles: order.deliveryFiles,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        } : null,
        buyer: buyer ? { id: buyer.id, firstName: buyer.firstName, lastName: buyer.lastName, email: buyer.email } : null,
        seller: seller ? { id: seller.id, firstName: seller.firstName, lastName: seller.lastName, email: seller.email, businessName: seller.businessName } : null,
        autoFlag,
        riskScore,
        riskReason,
        timeline: combinedTimeline
      }
    });
  } catch (err) {
    console.error('Admin dispute detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dispute detail' });
  }
});

// POST /api/admin/disputes/:id/resolve
router.post('/disputes/:id/resolve', adminAuth, async (req, res) => {
  try {
    const { action, notes } = req.body; // action: "REFUND" | "RELEASE"
    if (!action) return res.status(400).json({ success: false, message: 'action is required (REFUND or RELEASE)' });

    const dispute = await Dispute.findByPk(req.params.id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    if (dispute.status === 'RESOLVED') return res.status(400).json({ success: false, message: 'Dispute already resolved' });

    const resolution = action === 'REFUND' ? 'REFUND_BUYER' : 'RELEASE_TO_SELLER';
    const orderStatus = action === 'REFUND' ? 'REFUNDED' : 'COMPLETED';

    const resolutionEntry = {
      event: 'DISPUTE_RESOLVED',
      by: 'admin',
      timestamp: new Date().toISOString(),
      description: `Admin resolved: ${action === 'REFUND' ? 'Refunded buyer' : 'Released payment to seller'}`,
      notes: notes || ''
    };

    await dispute.update({
      status: 'RESOLVED',
      resolution,
      resolutionNotes: notes || '',
      resolvedAt: new Date(),
      timeline: [...(dispute.timeline || []), resolutionEntry],
      lastActivity: new Date()
    });

    await Order.update({ status: orderStatus }, { where: { id: dispute.orderId } });

    res.json({ success: true, message: `Dispute resolved: ${action}`, data: dispute });
  } catch (err) {
    console.error('Admin resolve error:', err);
    res.status(500).json({ success: false, message: 'Failed to resolve dispute' });
  }
});

// GET /api/admin/orders
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

module.exports = router;

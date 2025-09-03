const { v4: uuidv4 } = require('uuid');
// Reuse centralized models
const { Dispute, Order } = require('../models');

// Create dispute
const createDispute = async (req, res) => {
  try {
    const {
      orderId,
      reason,
      description,
      requestedResolution,
      priority = 'MEDIUM'
    } = req.body;

    if (!orderId || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, reason, and description are required'
      });
    }

    // Get order details
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Determine who raised the dispute
    const raisedBy = req.user.role; // 'buyer' or 'seller'
    const buyerId = order.buyerId;
    const sellerId = order.sellerId;

    // Check if dispute already exists
    const existingDispute = await Dispute.findOne({
      where: { orderId }
    });

    if (existingDispute) {
      return res.status(400).json({
        success: false,
        message: 'Dispute already exists for this order'
      });
    }

    // Handle uploaded files
    const evidenceFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    const evidenceUrls = evidenceFiles.map(file => `/uploads/${file.filename}`);

    // Create dispute
    const dispute = await Dispute.create({
      orderId,
      buyerId,
      sellerId,
      raisedBy,
      reason,
      description,
      evidenceUrls,
      requestedResolution,
      priority,
      status: 'OPEN',
      timeline: [{
        event: 'DISPUTE_CREATED',
        by: req.user.role,
        timestamp: new Date().toISOString(),
        description: `Dispute raised by ${req.user.role}`,
        notes: description
      }],
      lastActivity: new Date()
    });

    // Update order status
    await Order.update(
      {
        status: 'DISPUTED',
        disputeId: dispute.id
      },
      { where: { id: orderId } }
    );

    res.status(201).json({
      success: true,
      data: dispute,
      message: 'Dispute created successfully'
    });

  } catch (error) {
    console.error('Error creating dispute:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dispute'
    });
  }
};

// Get all disputes (admin only)
const getAllDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: disputes
    });

  } catch (error) {
    console.error('Error fetching disputes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch disputes'
    });
  }
};

// Get dispute by ID
const getDisputeById = async (req, res) => {
  try {
    const { id } = req.params;

    const dispute = await Dispute.findByPk(id);

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    res.json({
      success: true,
      data: dispute
    });

  } catch (error) {
    console.error('Error fetching dispute:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dispute'
    });
  }
};

// Get disputes by user
const getDisputesByUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let whereClause = {};
    if (userRole === 'buyer') {
      whereClause.buyerId = userId;
    } else if (userRole === 'seller') {
      whereClause.sellerId = userId;
    }

    const disputes = await Dispute.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: disputes
    });

  } catch (error) {
    console.error('Error fetching user disputes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user disputes'
    });
  }
};

// Update dispute status
const updateDisputeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const dispute = await Dispute.findByPk(id);
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    // Get current timeline
    const currentTimeline = dispute.timeline || [];
    
    // Add new timeline entry
    const newTimelineEntry = {
      event: 'STATUS_UPDATED',
      by: req.user.role,
      timestamp: new Date().toISOString(),
      description: `Status changed to ${status}`,
      notes: notes || ''
    };

    // Update dispute
    await dispute.update({
      status,
      timeline: [...currentTimeline, newTimelineEntry],
      lastActivity: new Date()
    });

    res.json({
      success: true,
      data: dispute,
      message: 'Dispute status updated successfully'
    });

  } catch (error) {
    console.error('Error updating dispute status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dispute status'
    });
  }
};

// Resolve dispute
const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      resolution,
      resolutionAmount,
      resolutionNotes,
      resolvedBy = 'admin'
    } = req.body;

    const dispute = await Dispute.findByPk(id);
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    // Get current timeline
    const currentTimeline = dispute.timeline || [];
    
    // Add resolution timeline entry
    const resolutionEntry = {
      event: 'DISPUTE_RESOLVED',
      by: req.user.role,
      timestamp: new Date().toISOString(),
      description: `Dispute resolved with ${resolution}`,
      notes: resolutionNotes || ''
    };

    // Update dispute
    await dispute.update({
      status: 'RESOLVED',
      resolution,
      resolutionAmount,
      resolutionNotes,
      resolvedBy: req.user.userId, // Use actual user ID instead of string
      resolvedAt: new Date(),
      timeline: [...currentTimeline, resolutionEntry],
      lastActivity: new Date()
    });

    // Update order status based on resolution
    let orderStatus = 'COMPLETED';
    if (resolution === 'REFUND_BUYER' || resolution === 'PARTIAL_REFUND') {
      orderStatus = 'CANCELLED';
    } else if (resolution === 'RELEASE_TO_SELLER') {
      orderStatus = 'COMPLETED';
    }

    await Order.update(
      { status: orderStatus },
      { where: { id: dispute.orderId } }
    );

    res.json({
      success: true,
      data: dispute,
      message: 'Dispute resolved successfully'
    });

  } catch (error) {
    console.error('Error resolving dispute:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve dispute'
    });
  }
};

// Add evidence to dispute
const addEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Evidence files are required'
      });
    }

    const dispute = await Dispute.findByPk(id);
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    // Handle uploaded files
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

    const evidenceUrls = evidenceFiles.map(file => `/uploads/${file.filename}`);

    // Get current evidence and timeline
    const currentEvidence = dispute.evidenceUrls || [];
    const currentTimeline = dispute.timeline || [];

    // Add evidence timeline entry
    const evidenceEntry = {
      event: 'EVIDENCE_ADDED',
      by: req.user.role,
      timestamp: new Date().toISOString(),
      description: `Evidence added: ${evidenceFiles.length} file(s)`,
      notes: description || ''
    };

    // Update dispute
    await dispute.update({
      evidenceUrls: [...currentEvidence, ...evidenceUrls],
      timeline: [...currentTimeline, evidenceEntry],
      lastActivity: new Date()
    });

    res.json({
      success: true,
      data: dispute,
      message: 'Evidence added successfully'
    });

  } catch (error) {
    console.error('Error adding evidence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add evidence'
    });
  }
};

// Get dispute statistics
const getDisputeStats = async (req, res) => {
  try {
    const total = await Dispute.count();
    const open = await Dispute.count({ where: { status: 'OPEN' } });
    const underReview = await Dispute.count({ where: { status: 'UNDER_REVIEW' } });
    const resolved = await Dispute.count({ where: { status: 'RESOLVED' } });

    res.json({
      success: true,
      data: {
        total,
        open,
        underReview,
        resolved
      }
    });

  } catch (error) {
    console.error('Error fetching dispute stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dispute statistics'
    });
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
  getDisputeStats
}; 
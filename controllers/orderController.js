const orderService = require('../services/orderService');
const { v4: uuidv4 } = require('uuid');

// POST /api/orders - Create new order
async function createOrder(req, res) {
  try {
    const { 
      buyerName, 
      platform, 
      productLink, 
      country, 
      currency, 
      sellerContact, 
      scopeBox 
    } = req.body;

    // Validation
    if (!buyerName || !platform || !productLink || !country || !currency || !sellerContact || !scopeBox) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: buyerName, platform, productLink, country, currency, sellerContact, scopeBox'
      });
    }

    // Validate scopeBox fields
    if (!scopeBox.productType || !scopeBox.productLink || !scopeBox.description || !scopeBox.condition) {
      return res.status(400).json({
        success: false,
        message: 'Missing required scopeBox fields: productType, productLink, description, condition'
      });
    }

    // Generate unique IDs and escrow link
    const buyerId = uuidv4();
    const sellerId = uuidv4();
    const escrowLink = `https://escrowx.app/order/${Math.random().toString(36).substring(2, 8)}`;

    const order = await orderService.createOrder({
      buyerId,
      sellerId,
      buyerName,
      platform,
      productLink,
      country,
      currency,
      sellerContact,
      escrowLink,
      scopeBox
    });

    // Simulate sending email/SMS
    console.log(`Escrow link sent to seller: ${sellerContact}`);
    console.log(`Order created for buyer: ${buyerName}`);

    res.status(201).json({
      success: true,
      data: {
        ...order,
        escrowLink
      },
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
}

// POST /api/orders/:id/fund-escrow - Fund escrow
async function fundEscrow(req, res) {
  try {
    const { id } = req.params;
    const { buyerId } = req.body;

    if (!buyerId) {
      return res.status(400).json({
        success: false,
        message: 'buyerId is required'
      });
    }

    const order = await orderService.fundEscrow(id, buyerId);

    res.json({
      success: true,
      data: order,
      message: 'Escrow funded successfully'
    });
  } catch (error) {
    console.error('Error funding escrow:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fund escrow'
    });
  }
}

// PATCH /api/orders/:id/start - Start work
async function startWork(req, res) {
  try {
    const { id } = req.params;
    const { sellerId } = req.body;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'sellerId is required'
      });
    }

    const order = await orderService.startWork(id, sellerId);

    res.json({
      success: true,
      data: order,
      message: 'Work started successfully'
    });
  } catch (error) {
    console.error('Error starting work:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start work'
    });
  }
}

// PATCH /api/orders/:id/submit - Submit delivery
async function submitDelivery(req, res) {
  try {
    const { id } = req.params;
    const { sellerId, deliveryFiles } = req.body;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'sellerId is required'
      });
    }

    const order = await orderService.submitDelivery(id, sellerId, deliveryFiles || []);

    res.json({
      success: true,
      data: order,
      message: 'Delivery submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting delivery:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit delivery'
    });
  }
}

// PATCH /api/orders/:id/approve - Approve delivery
async function approveDelivery(req, res) {
  try {
    const { id } = req.params;
    const { buyerId } = req.body;

    if (!buyerId) {
      return res.status(400).json({
        success: false,
        message: 'buyerId is required'
      });
    }

    const order = await orderService.approveDelivery(id, buyerId);

    res.json({
      success: true,
      data: order,
      message: 'Delivery approved successfully'
    });
  } catch (error) {
    console.error('Error approving delivery:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve delivery'
    });
  }
}

// PATCH /api/orders/:id/dispute - Raise dispute
async function raiseDispute(req, res) {
  try {
    const { id } = req.params;
    const { userId, disputeData } = req.body;

    if (!userId || !disputeData) {
      return res.status(400).json({
        success: false,
        message: 'userId and disputeData are required'
      });
    }

    const order = await orderService.raiseDispute(id, userId, disputeData);

    res.json({
      success: true,
      data: order,
      message: 'Dispute raised successfully'
    });
  } catch (error) {
    console.error('Error raising dispute:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to raise dispute'
    });
  }
}

// PATCH /api/orders/:id/release - Release funds (admin)
async function releaseFunds(req, res) {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'adminId is required'
      });
    }

    const order = await orderService.releaseFunds(id, adminId);

    res.json({
      success: true,
      data: order,
      message: 'Funds released successfully'
    });
  } catch (error) {
    console.error('Error releasing funds:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to release funds'
    });
  }
}

// PATCH /api/orders/:id/refund - Refund buyer (admin)
async function refundBuyer(req, res) {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'adminId is required'
      });
    }

    const order = await orderService.refundBuyer(id, adminId);

    res.json({
      success: true,
      data: order,
      message: 'Buyer refunded successfully'
    });
  } catch (error) {
    console.error('Error refunding buyer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to refund buyer'
    });
  }
}

// GET /api/orders/:id - Get order by ID
async function getOrder(req, res) {
  try {
    const { id } = req.params;

    const order = await orderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get order'
    });
  }
}

// GET /api/orders/user/:userId - Get orders by user
async function getOrdersByUser(req, res) {
  try {
    const { userId } = req.params;
    const { role = 'buyer' } = req.query;

    const orders = await orderService.getOrdersByUser(userId, role);

    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user orders'
    });
  }
}

module.exports = {
  createOrder,
  fundEscrow,
  startWork,
  submitDelivery,
  approveDelivery,
  raiseDispute,
  releaseFunds,
  refundBuyer,
  getOrder,
  getOrdersByUser
}; 
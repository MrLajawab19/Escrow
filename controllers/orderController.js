const orderService = require('../services/orderService');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// Helper function to verify buyer token
function verifyBuyerToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No authentication token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    return decoded;
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
}

// POST /api/orders - Create new order
async function createOrder(req, res) {
  try {
    // Verify buyer authentication
    let buyerData;
    try {
      buyerData = verifyBuyerToken(req);
    } catch (authError) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login as a buyer.'
      });
    }

    const { 
      platform, 
      productLink, 
      country, 
      currency, 
      sellerContact, 
      scopeBox 
    } = req.body;

    // Enhanced validation
    if (!platform || !productLink || !country || !currency || !sellerContact || !scopeBox) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: platform, productLink, country, currency, sellerContact, scopeBox'
      });
    }

    // Validate scopeBox fields
    if (!scopeBox.productType || !scopeBox.productLink || !scopeBox.description || 
        !scopeBox.condition || !scopeBox.deadline || !scopeBox.price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required scopeBox fields: productType, productLink, description, condition, deadline, price'
      });
    }

    // Validate price
    const price = parseFloat(scopeBox.price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price. Must be a positive number.'
      });
    }

    // Validate deadline
    const deadline = new Date(scopeBox.deadline);
    if (isNaN(deadline.getTime()) || deadline <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deadline. Must be a future date.'
      });
    }

    // Generate unique order ID and escrow link
    const orderId = uuidv4();
    const sellerId = uuidv4();
    const escrowLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/seller/order/${orderId}`;
    const orderTrackingLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/buyer/order/${orderId}`;

    // Create order with buyer authentication
    const order = await orderService.createOrder({
      orderId,
      buyerId: buyerData.userId,
      sellerId,
      buyerName: buyerData.firstName + ' ' + buyerData.lastName,
      buyerEmail: buyerData.email,
      platform,
      productLink,
      country,
      currency,
      sellerContact,
      escrowLink,
      orderTrackingLink,
      scopeBox: {
        ...scopeBox,
        price: price,
        deadline: deadline.toISOString()
      }
    });

    // Send notification to seller (simulated)
    await sendSellerNotification(sellerContact, {
      orderId,
      escrowLink,
      buyerName: buyerData.firstName + ' ' + buyerData.lastName,
      platform,
      productType: scopeBox.productType,
      price: `${currency} ${price.toFixed(2)}`,
      deadline: deadline.toLocaleDateString()
    });

    // Send confirmation to buyer (simulated)
    await sendBuyerConfirmation(buyerData.email, {
      orderId,
      orderTrackingLink,
      platform,
      productType: scopeBox.productType,
      price: `${currency} ${price.toFixed(2)}`,
      deadline: deadline.toLocaleDateString()
    });

    console.log(`✅ Order created successfully:`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Buyer: ${buyerData.firstName} ${buyerData.lastName} (${buyerData.email})`);
    console.log(`   Platform: ${platform}`);
    console.log(`   Price: ${currency} ${price.toFixed(2)}`);
    console.log(`   Seller Contact: ${sellerContact}`);
    console.log(`   Escrow Link: ${escrowLink}`);
    console.log(`   Tracking Link: ${orderTrackingLink}`);

    res.status(201).json({
      success: true,
      data: {
        orderId,
        escrowLink,
        orderTrackingLink,
        status: order.status,
        buyerName: buyerData.firstName + ' ' + buyerData.lastName,
        platform,
        productType: scopeBox.productType,
        price: `${currency} ${price.toFixed(2)}`,
        deadline: deadline.toLocaleDateString(),
        createdAt: order.createdAt
      },
      message: 'Order created successfully! Escrow link has been sent to the seller.'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
}

// Helper function to send seller notification
async function sendSellerNotification(sellerContact, orderData) {
  try {
    // Simulate email/SMS sending
    console.log(`📧 Sending notification to seller: ${sellerContact}`);
    console.log(`   Subject: New Escrow Order - ${orderData.orderId}`);
    console.log(`   Message: You have received a new escrow order from ${orderData.buyerName}`);
    console.log(`   Platform: ${orderData.platform}`);
    console.log(`   Product: ${orderData.productType}`);
    console.log(`   Price: ${orderData.price}`);
    console.log(`   Deadline: ${orderData.deadline}`);
    console.log(`   Escrow Link: ${orderData.escrowLink}`);
    
    // In a real implementation, you would:
    // 1. Send email using nodemailer or similar
    // 2. Send SMS using Twilio or similar
    // 3. Store notification in database
    // 4. Handle delivery failures
    
    return true;
  } catch (error) {
    console.error('Failed to send seller notification:', error);
    return false;
  }
}

// Helper function to send buyer confirmation
async function sendBuyerConfirmation(buyerEmail, orderData) {
  try {
    console.log(`📧 Sending confirmation to buyer: ${buyerEmail}`);
    console.log(`   Subject: Order Created Successfully - ${orderData.orderId}`);
    console.log(`   Message: Your escrow order has been created successfully`);
    console.log(`   Order ID: ${orderData.orderId}`);
    console.log(`   Platform: ${orderData.platform}`);
    console.log(`   Product: ${orderData.productType}`);
    console.log(`   Price: ${orderData.price}`);
    console.log(`   Deadline: ${orderData.deadline}`);
    console.log(`   Tracking Link: ${orderData.orderTrackingLink}`);
    
    return true;
  } catch (error) {
    console.error('Failed to send buyer confirmation:', error);
    return false;
  }
}

// Helper function to send scope box to seller
async function sendScopeBoxToSeller(sellerContact, scopeData) {
  try {
    console.log(`📧 Sending scope box to seller: ${sellerContact}`);
    console.log(`   Subject: New Project Scope - Order ${scopeData.orderId}`);
    console.log(`   Message: You have received a new project scope from ${scopeData.buyerName}`);
    console.log(`   Order ID: ${scopeData.orderId}`);
    console.log(`   Platform: ${scopeData.platform}`);
    console.log(`   Product Type: ${scopeData.productType}`);
    console.log(`   Price: ${scopeData.price}`);
    console.log(`   Deadline: ${scopeData.deadline}`);
    console.log(`   Description: ${scopeData.description}`);
    console.log(`   Attachments: ${scopeData.attachments?.length || 0} files`);
    console.log(`   Escrow Link: ${scopeData.escrowLink}`);
    
    // In a real implementation, you would:
    // 1. Send email with detailed scope box
    // 2. Include all project requirements
    // 3. Attach any uploaded files
    // 4. Provide escrow link for seller to accept
    // 5. Include payment terms and conditions
    
    return true;
  } catch (error) {
    console.error('Failed to send scope box to seller:', error);
    return false;
  }
}

// POST /api/orders/:id/fund-escrow - Fund escrow
async function fundEscrow(req, res) {
  try {
    const { id } = req.params;
    const { buyerId, paymentMethod, amount } = req.body;

    if (!buyerId) {
      return res.status(400).json({
        success: false,
        message: 'buyerId is required'
      });
    }

    // Verify buyer authentication
    let buyerData;
    try {
      buyerData = verifyBuyerToken(req);
    } catch (authError) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login as a buyer.'
      });
    }

    // Simulate payment processing
    console.log(`💳 Processing payment for order ${id}:`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Payment Method: ${paymentMethod}`);
    console.log(`   Buyer: ${buyerData.firstName} ${buyerData.lastName}`);

    // Fund the escrow
    const order = await orderService.fundEscrow(id, buyerId);

    // Send scope box to seller
    await sendScopeBoxToSeller(order.sellerContact, {
      orderId: order.id,
      buyerName: order.buyerName,
      platform: order.platform,
      productType: order.scopeBox.productType,
      price: `${order.currency} ${order.scopeBox.price}`,
      deadline: new Date(order.scopeBox.deadline).toLocaleDateString(),
      description: order.scopeBox.description,
      attachments: order.scopeBox.attachments,
      escrowLink: order.escrowLink
    });

    console.log(`✅ Escrow funded successfully for order ${id}`);
    console.log(`📧 Scope box sent to seller: ${order.sellerContact}`);

    res.json({
      success: true,
      data: order,
      message: 'Escrow funded successfully and scope box sent to seller'
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
    const { userId, reason, description, requestedResolution } = req.body;

    if (!userId || !reason || !description || !requestedResolution) {
      return res.status(400).json({
        success: false,
        message: 'userId, reason, description, and requestedResolution are required'
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

    const disputeData = {
      reason,
      description,
      requestedResolution,
      evidenceFiles
    };

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

// GET /api/orders/buyer - Get all orders for authenticated buyer
async function getBuyerOrders(req, res) {
  try {
    // Verify buyer authentication
    let buyerData;
    try {
      buyerData = verifyBuyerToken(req);
    } catch (authError) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login as a buyer.'
      });
    }

    const orders = await orderService.getBuyerOrders(buyerData.userId);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders'
    });
  }
}

// PATCH /api/orders/:id/cancel - Cancel order (buyer only)
async function cancelOrder(req, res) {
  try {
    const { id } = req.params;
    
    // Verify buyer authentication
    let buyerData;
    try {
      buyerData = verifyBuyerToken(req);
    } catch (authError) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login as a buyer.'
      });
    }

    const order = await orderService.cancelOrder(id, buyerData.userId);

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel order'
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
  getBuyerOrders,
  cancelOrder,
  getOrdersByUser
}; 
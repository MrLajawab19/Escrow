const orderService = require('../services/orderService');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');
const config = require('../config/config.json');

// Service-specific field requirements (matching frontend field names)
const SERVICE_FIELD_REQUIREMENTS = {
  'Logo design': ['businessName', 'keywordIndustry', 'logoStyle', 'colorPreferred'],
  'Poster/flyer/banner design': ['width', 'height', 'resolution', 'orientation', 'designStyle', 'brandColors', 'fonts', 'textContent'],
  'Social media post creation': ['postFormat', 'aspectRatio', 'resolution', 'postCount', 'finalCaption', 'hashtags'],
  'Video editing': ['duration', 'resolution', 'format', 'editingStyle', 'musicRequired', 'colorGrading'],
  'Motion graphics': ['duration', 'resolution', 'format', 'animationStyle', 'complexity'],
  'NFT art creation': ['artStyle', 'resolution', 'format', 'rarity', 'blockchain', 'metadata'],
  'Illustration / Comics': ['artStyle', 'resolution', 'format', 'pageCount', 'colorScheme'],
  '3D modeling / rendering': ['modelType', 'resolution', 'format', 'complexity', 'textures', 'lighting'],
  'Website development': ['websiteType', 'pages', 'features', 'technologies', 'responsiveDesign', 'hosting'],
  'App development': ['appType', 'platforms', 'features', 'technologies', 'uiDesign'],
  'Instagram Growth': ['targetFollowers', 'growthStrategy', 'contentType', 'engagement'],
  'Instagram Promotion': ['promotionGoals', 'targetAudience', 'campaignDuration'],
  'YouTube promotion': ['channelUrl', 'promotionType', 'campaignDuration', 'audienceTargeting'],
  'Influencer shoutouts': ['platforms', 'campaignDuration', 'targetAudience', 'expectedReach'],
  'Gaming account sales': ['gameName', 'platform', 'accountLevel', 'accountRegion', 'newEmail'],
  'Physical Item Escrow (No COD)': ['itemName', 'itemCondition', 'shippingMethod', 'trackingRequired'],
  'Content Writing': ['wordCount', 'tone', 'topic', 'targetAudience'],
  'Script Writing': ['scriptType', 'targetAudience', 'toneStyle', 'wordCount', 'keyMessage'],
  'Landing Page Creation': ['pagePurpose', 'technologyStack', 'numberOfSections', 'responsiveDesign']
};

// Function to validate XBox fields based on service type
function validateXBoxFields(xBox) {
  // Basic required fields for all services
  const basicRequiredFields = ['title', 'productType', 'productLink', 'description', 'deadline', 'price'];
  
  for (const field of basicRequiredFields) {
    if (!xBox[field]) {
      return {
        isValid: false,
        message: `Missing required XBox field: ${field}`
      };
    }
  }

  // Service-specific validation
  const serviceType = xBox.productType;
  const requiredFields = SERVICE_FIELD_REQUIREMENTS[serviceType];
  
  if (requiredFields) {
    // Check service-specific fields
    const serviceSpecificKey = getServiceSpecificKey(serviceType);
    const serviceSpecificData = xBox[serviceSpecificKey];
    
    if (!serviceSpecificData) {
      return {
        isValid: false,
        message: `Missing ${serviceType} specific data in XBox`
      };
    }
    
    for (const field of requiredFields) {
      if (!serviceSpecificData[field]) {
        return {
          isValid: false,
          message: `Missing required ${serviceType} field: ${field}`
        };
      }
    }
  } else {
    // For services without specific requirements, check if condition is needed
    const servicesWithoutCondition = [
      'Logo design', 'Poster/flyer/banner design', 'Social media post creation', 
      'Video editing', 'Motion graphics', 'NFT art creation', 'Illustration / Comics',
      '3D modeling / rendering', 'Website development', 'Gaming account sales'
    ];
    
    if (!servicesWithoutCondition.includes(serviceType) && !xBox.condition) {
      return {
        isValid: false,
        message: `Missing required XBox field for ${serviceType}: condition`
      };
    }
  }
  
  return { isValid: true };
}

// Helper function to get service-specific data key
function getServiceSpecificKey(serviceType) {
  const keyMap = {
    'Logo design': 'logoSpecific',
    'Poster/flyer/banner design': 'posterSpecific',
    'Social media post creation': 'socialPostSpecific',
    'Video editing': 'videoEditingSpecific',
    'Motion graphics': 'motionGraphicsSpecific',
    'NFT art creation': 'nftArtSpecific',
    'Illustration / Comics': 'illustrationSpecific',
    '3D modeling / rendering': '3dModelingSpecific',
    'Website development': 'websiteDevelopmentSpecific',
    'App development': 'appDevelopmentSpecific',
    'Instagram Growth': 'instagramGrowthSpecific',
    'Instagram Promotion': 'instagramPromotionSpecific',
    'YouTube promotion': 'youtubePromotionSpecific',
    'Influencer shoutouts': 'influencerShoutoutSpecific',
    'Gaming account sales': 'gamingAccountSaleSpecific',
    'Content Writing': 'contentWritingSpecific',
    'Script Writing': 'scriptWritingSpecific',
    'Landing Page Creation': 'landingPageSpecific'
  };
  
  return keyMap[serviceType] || 'serviceSpecific';
}

// Initialize Sequelize
const sequelize = new Sequelize(config.development);
const Seller = require('../models/seller')(sequelize, Sequelize.DataTypes);

// Helper function to verify buyer token
function verifyBuyerToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No authentication token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    console.log('Decoded token:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
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
      scopeBox: xBox 
    } = req.body;

    // Enhanced validation
    if (!platform || !productLink || !country || !currency || !sellerContact || !xBox) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: platform, productLink, country, currency, sellerContact, xBox'
      });
    }

    // Validate XBox fields with conditional validation based on service type
    const validationResult = validateXBoxFields(xBox);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: validationResult.message
      });
    }

    // Validate price
    const price = parseFloat(xBox.price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price. Must be a positive number.'
      });
    }

    // Validate deadline
    const deadline = new Date(xBox.deadline);
    if (isNaN(deadline.getTime()) || deadline <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deadline. Must be a future date.'
      });
    }

    // Generate unique order ID and escrow link
    const orderId = uuidv4();
    
    // Find or create seller based on sellerContact (email)
    let sellerId = null;
    try {
      const seller = await Seller.findOne({ where: { email: sellerContact } });
      
      if (seller) {
        sellerId = seller.id;
      } else {
        // If seller doesn't exist, create a placeholder seller
        try {
          const newSeller = await Seller.create({
            id: uuidv4(),
            email: sellerContact,
            firstName: 'Seller',
            lastName: 'User',
            phone: sellerContact,
            country: 'US',
            businessName: 'Freelance Seller',
            isVerified: true,
            status: 'active',
            password: 'temp_password_' + Date.now() // Add required password field
          });
          sellerId = newSeller.id;
        } catch (createError) {
          console.error('Error creating seller:', createError);
          // Continue without sellerId - order will be created with sellerContact only
          sellerId = null;
        }
      }
    } catch (error) {
      console.error('Error finding/creating seller:', error);
      // Continue without sellerId - order will be created with sellerContact only
      sellerId = null;
    }
    
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
        ...xBox,
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
      productType: xBox.productType,
      price: `${currency} ${price.toFixed(2)}`,
      deadline: deadline.toLocaleDateString()
    });

    // Send confirmation to buyer (simulated)
    await sendBuyerConfirmation(buyerData.email, {
      orderId,
      orderTrackingLink,
      platform,
      productType: xBox.productType,
      price: `${currency} ${price.toFixed(2)}`,
      deadline: deadline.toLocaleDateString()
    });

    console.log(`✅ Order created successfully:`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Buyer: ${buyerData.firstName} ${buyerData.lastName} (${buyerData.email})`);
    console.log(`   Platform: ${platform}`);
    console.log(`   Service: ${xBox.productType}`);
    console.log(`   Price: ${currency} ${price.toFixed(2)}`);
    console.log(`   Seller Contact: ${sellerContact}`);
    console.log(`   Escrow Link: ${escrowLink}`);
    console.log(`   Tracking Link: ${orderTrackingLink}`);

        res.status(201).json({
          success: true,
          data: {
            id: order.id,
            orderId: orderId,
            escrowLink,
            orderTrackingLink,
            status: order.status,
            buyerName: buyerData.firstName + ' ' + buyerData.lastName,
            platform,
            productType: xBox.productType,
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
    const { buyerId, paymentMethod, amount, cardDetails } = req.body;

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

    // Validate payment method
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Validate card details for credit card payments
    if (paymentMethod === 'credit_card') {
      if (!cardDetails) {
        return res.status(400).json({
          success: false,
          message: 'Card details are required for credit card payments'
        });
      }

      // Validate card number (basic validation)
      if (!cardDetails.cardNumber || cardDetails.cardNumber.length < 13) {
        return res.status(400).json({
          success: false,
          message: 'Invalid card number. Please check your card details and try again.'
        });
      }

      // Validate expiry date
      if (!cardDetails.expiryMonth || !cardDetails.expiryYear) {
        return res.status(400).json({
          success: false,
          message: 'Card expiry date is required. Please check your card details and try again.'
        });
      }

      // Validate CVV
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Invalid CVV. Please check your card details and try again.'
        });
      }

      // Check if card is expired
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

      if (parseInt(cardDetails.expiryYear) < currentYear || 
          (parseInt(cardDetails.expiryYear) === currentYear && parseInt(cardDetails.expiryMonth) < currentMonth)) {
        return res.status(400).json({
          success: false,
          message: 'Card has expired. Please use a valid card.'
        });
      }
    }

    // Simulate payment processing with validation
    console.log(`💳 Processing payment for order ${id}:`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Payment Method: ${paymentMethod}`);
    console.log(`   Buyer: ${buyerData.firstName} ${buyerData.lastName}`);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate payment success (in real implementation, this would call a payment gateway)
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo

    if (!paymentSuccess) {
      return res.status(400).json({
        success: false,
        message: 'Payment failed. Please check your card details and try again.'
      });
    }

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
      message: 'Payment processed successfully and escrow funded'
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

// PATCH /api/orders/:id/release - Release funds to seller (buyer only)
async function releaseFunds(req, res) {
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

    const order = await orderService.releaseFunds(id, buyerData.userId);

    // Send confirmation to buyer
    try {
      await sendBuyerReleaseConfirmation(buyerData.email, order);
    } catch (notificationError) {
      console.error('Error sending buyer confirmation:', notificationError);
      // Don't fail the entire operation if notification fails
    }

    res.json({
      success: true,
      data: order,
      message: 'Funds released successfully to seller. Order completed.'
    });
  } catch (error) {
    console.error('Error releasing funds:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to release funds'
    });
  }
}

// Send confirmation to buyer about fund release
async function sendBuyerReleaseConfirmation(buyerEmail, order) {
  const { id, scopeBox } = order;
  
  console.log('📧 Sending release confirmation to buyer:', buyerEmail);
  console.log('   Subject: Funds Released - Order', id);
  console.log('   Message: Your funds have been released to the seller');
  console.log('   Order ID:', id);
  console.log('   Amount:', scopeBox?.price || 0);
  console.log('   Status: COMPLETED');
  
  // In a real implementation, you would:
  // 1. Send email to buyer
  // 2. Update buyer's transaction history
  // 3. Send receipt/invoice
  
  console.log('✅ Release confirmation sent to buyer');
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

// GET /api/orders/seller - Get all orders for authenticated seller
async function getSellerOrders(req, res) {
  try {
    // Verify seller authentication
    let sellerData;
    try {
      sellerData = verifySellerToken(req);
    } catch (authError) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login as a seller.'
      });
    }

    const orders = await orderService.getSellerOrders(sellerData.userId);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders'
    });
  }
}

// Helper function to verify seller token
function verifySellerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Access token required');
  }

  const token = authHeader.substring(7);
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'seller') {
      throw new Error('Seller access required');
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: decoded.role
    };
  } catch (error) {
    throw new Error('Invalid token');
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

// PATCH /api/orders/:id/accept - Accept order (seller only)
async function acceptOrder(req, res) {
  try {
    const { id } = req.params;
    
    // Verify seller authentication
    let sellerData;
    try {
      sellerData = verifySellerToken(req);
    } catch (authError) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login as a seller.'
      });
    }

    const order = await orderService.acceptOrder(id, sellerData.userId);

    res.json({
      success: true,
      data: order,
      message: 'Order accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept order'
    });
  }
}

// PATCH /api/orders/:id/reject - Reject order (seller only)
async function rejectOrder(req, res) {
  try {
    const { id } = req.params;
    
    // Verify seller authentication
    let sellerData;
    try {
      sellerData = verifySellerToken(req);
    } catch (authError) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login as a seller.'
      });
    }

    const order = await orderService.rejectOrder(id, sellerData.userId);

    res.json({
      success: true,
      data: order,
      message: 'Order rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject order'
    });
  }
}

// PATCH /api/orders/:id/request-changes - Request changes to order (seller only)
async function requestChanges(req, res) {
  try {
    const { id } = req.params;
    const { scopeBox, changesRequested } = req.body;
    
    // Verify seller authentication
    let sellerData;
    try {
      sellerData = verifySellerToken(req);
    } catch (authError) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login as a seller.'
      });
    }

    const order = await orderService.requestChanges(id, sellerData.userId, { scopeBox, changesRequested });

    res.json({
      success: true,
      data: order,
      message: 'Changes requested successfully'
    });
  } catch (error) {
    console.error('Error requesting changes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to request changes'
    });
  }
}

// PATCH /api/orders/:id/accept-changes - Accept changes (buyer only)
async function acceptChanges(req, res) {
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

    const order = await orderService.acceptChanges(id, buyerData.userId);

    res.json({
      success: true,
      data: order,
      message: 'Changes accepted successfully. Order status updated to IN_PROGRESS.'
    });
  } catch (error) {
    console.error('Error accepting changes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept changes'
    });
  }
}

// PATCH /api/orders/:id/reject-changes - Reject changes (buyer only)
async function rejectChanges(req, res) {
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

    const order = await orderService.rejectChanges(id, buyerData.userId);

    res.json({
      success: true,
      data: order,
      message: 'Changes rejected successfully. Order status updated to REJECTED.'
    });
  } catch (error) {
    console.error('Error rejecting changes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject changes'
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
  getSellerOrders,
  cancelOrder,
  getOrdersByUser,
  acceptOrder,
  rejectOrder,
  requestChanges,
  acceptChanges,
  rejectChanges
}; 
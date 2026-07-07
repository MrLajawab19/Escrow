const { PrismaClient } = require('@prisma/client');
const orderService = require('../services/orderService');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ── Scope box helpers ──────────────────────────────────────────────────────────

const CONTENT_WRITING_FIELDS = ['topic', 'tone', 'wordCount', 'targetAudience', 'keywords'];

function normalizeProductType(pt) {
  return (pt || '').trim();
}

function hasCompleteContentWritingPayload(xBox) {
  const cw = xBox?.contentWritingSpecific;
  if (!cw) return false;
  return CONTENT_WRITING_FIELDS.some(f => cw[f]);
}

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
  'Content Writing': CONTENT_WRITING_FIELDS,
  'Blog writing': CONTENT_WRITING_FIELDS,
  'SEO writing': CONTENT_WRITING_FIELDS,
  'Ghostwriting': CONTENT_WRITING_FIELDS,
  'Copywriting for ads': CONTENT_WRITING_FIELDS,
  'Social media captions': CONTENT_WRITING_FIELDS,
  'Email marketing content': CONTENT_WRITING_FIELDS,
  'Reddit/Quora answers': CONTENT_WRITING_FIELDS,
  'Script Writing': ['scriptType', 'targetAudience', 'toneStyle', 'wordCount', 'keyMessage'],
  'Landing Page Creation': ['pagePurpose', 'technologyStack', 'numberOfSections', 'responsiveDesign'],
};

function scopeSkipsXBoxProductLink(xBox) {
  const pt = normalizeProductType(xBox?.productType);
  if (pt && SERVICE_FIELD_REQUIREMENTS[pt] === CONTENT_WRITING_FIELDS) return true;
  return hasCompleteContentWritingPayload(xBox);
}

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
    'Blog writing': 'contentWritingSpecific',
    'SEO writing': 'contentWritingSpecific',
    'Ghostwriting': 'contentWritingSpecific',
    'Copywriting for ads': 'contentWritingSpecific',
    'Social media captions': 'contentWritingSpecific',
    'Email marketing content': 'contentWritingSpecific',
    'Reddit/Quora answers': 'contentWritingSpecific',
    'Script Writing': 'scriptWritingSpecific',
    'Landing Page Creation': 'landingPageSpecific',
  };
  return keyMap[serviceType] || 'serviceSpecific';
}

function validateXBoxFields(xBox) {
  const normalizedType = normalizeProductType(xBox.productType);
  if (normalizedType !== xBox.productType) xBox.productType = normalizedType;

  const basicRequiredFields = ['title', 'productType', 'description', 'deadline', 'price'];
  if (!scopeSkipsXBoxProductLink(xBox)) basicRequiredFields.push('productLink');

  for (const field of basicRequiredFields) {
    if (!xBox[field]) return { isValid: false, message: `Missing required XBox field: ${field}` };
  }

  const serviceType = xBox.productType;
  const requiredFields = SERVICE_FIELD_REQUIREMENTS[serviceType];

  if (!requiredFields && hasCompleteContentWritingPayload(xBox)) return { isValid: true };

  if (requiredFields) {
    const serviceSpecificKey = getServiceSpecificKey(serviceType);
    const serviceSpecificData = xBox[serviceSpecificKey];
    if (!serviceSpecificData) return { isValid: false, message: `Missing ${serviceType} specific data in XBox` };
    for (const field of requiredFields) {
      if (!serviceSpecificData[field]) return { isValid: false, message: `Missing required ${serviceType} field: ${field}` };
    }
  }

  return { isValid: true };
}

// ── POST /api/orders — Create new order ────────────────────────────────────────
// NOTE: Authentication handled by middleware — req.user is guaranteed to be set.

// ── POST /api/orders — Create new order (REMOVED: Handled by Deeds API) ──────


const Razorpay = require('razorpay');

// ── POST /api/orders/:id/fund-escrow ──────────────────────────────────────────

async function fundEscrow(req, res) {
  try {
    const { id } = req.params;
    const buyerData = req.user;
    if (buyerData.role !== 'buyer') return res.status(403).json({ success: false, message: 'Only buyers can fund escrow' });

    const { amount } = req.body;
    if (!amount) return res.status(400).json({ success: false, message: 'Amount is required' });

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create a Razorpay Order
    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_order_${id}`,
      notes: {
        orderId: id,
        buyerId: buyerData.id
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    if (!razorpayOrder) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
    }

    return res.json({ 
      success: true, 
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: id
      }, 
      message: 'Razorpay order created successfully' 
    });
  } catch (error) {
    console.error('fundEscrow error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fund escrow' });
  }
}
// ── PATCH /api/orders/:id/start ────────────────────────────────────────────────

async function startWork(req, res) {
  try {
    const { id } = req.params;
    const sellerData = req.user;
    if (sellerData.role !== 'seller') return res.status(403).json({ success: false, message: 'Only sellers can start work' });
    const order = await orderService.startWork(id, sellerData.id);
    return res.json({ success: true, data: order, message: 'Work started' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── PATCH /api/orders/:id/submit ──────────────────────────────────────────────

async function submitDelivery(req, res) {
  try {
    const { id } = req.params;
    const sellerData = req.user;
    if (sellerData.role !== 'seller') return res.status(403).json({ success: false, message: 'Only sellers can submit delivery' });

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.sellerId !== sellerData.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const status = String(order.status ?? '').trim().toUpperCase();
    const allowed = ['ESCROW_FUNDED', 'ACCEPTED', 'IN_PROGRESS'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot submit from status "${order.status}"` });
    }

    const files = req.files ? req.files.map(f => ({ filename: f.filename, path: f.path, size: f.size, mimetype: f.mimetype })) : (req.body.deliveryFiles || []);
    const mergedFiles = [...(order.deliveryFiles || []), ...(Array.isArray(files) ? files : [])];
    const currentLogs = Array.isArray(order.orderLogs) ? order.orderLogs : [];

    const updated = await prisma.order.update({
      where: { id },
      data: {
        deliveryFiles: mergedFiles,
        status: 'SUBMITTED',
        orderLogs: [...currentLogs, {
          event: 'DELIVERY_SUBMITTED',
          byUserId: sellerData.id,
          timestamp: new Date().toISOString(),
          previousStatus: order.status,
          newStatus: 'SUBMITTED',
        }],
      },
    });

    // Trigger Notification for the buyer
    const notificationService = require('../services/notificationService');
    await notificationService.createNotification({
      userId: updated.buyerId,
      userRole: 'buyer',
      type: 'ORDER_UPDATE',
      title: 'Delivery Submitted',
      message: `The seller has submitted the delivery for ${updated.scopeBox?.title || 'an order'}. Please review.`,
      link: '/buyer-dashboard',
      emailOptions: {
        templateName: 'deliverySubmitted',
        context: { order: updated }
      }
    });

    return res.json({ success: true, data: updated, message: 'Delivery submitted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── PATCH /api/orders/:id/approve ─────────────────────────────────────────────

async function approveDelivery(req, res) {
  try {
    const { id } = req.params;
    const buyerData = req.user;
    if (buyerData.role !== 'buyer') return res.status(403).json({ success: false, message: 'Only buyers can approve delivery' });
    const order = await orderService.approveDelivery(id, buyerData.id);

    // Trigger Notification for the seller
    if (order.sellerId) {
      const notificationService = require('../services/notificationService');
      await notificationService.createNotification({
        userId: order.sellerId,
        userRole: 'seller',
        type: 'ORDER_UPDATE',
        title: 'Delivery Approved',
        message: `The buyer has approved your delivery for ${order.scopeBox?.title || 'an order'}.`,
        link: '/seller-dashboard',
        emailOptions: {
          to: order.sellerContact,
          subject: 'Delivery Approved!',
          actionText: 'View Details'
        }
      });
    }

    return res.json({ success: true, data: order, message: 'Delivery approved' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── PATCH /api/orders/:id/dispute ─────────────────────────────────────────────

async function raiseDispute(req, res) {
  try {
    const { id } = req.params;
    const userData = req.user;
    const { reason, description, requestedResolution } = req.body;

    if (!reason || !description || !requestedResolution) {
      return res.status(400).json({ success: false, message: 'reason, description, and requestedResolution are required' });
    }

    const evidenceFiles = req.files ? req.files.map(f => ({ filename: f.filename, path: f.path })) : [];
    const order = await orderService.raiseDispute(id, userData.id, { reason, description, requestedResolution, evidenceFiles });

    // Trigger Notification for the other party
    const notificationService = require('../services/notificationService');
    const notifyUserId = userData.role === 'buyer' ? order.sellerId : order.buyerId;
    const notifyUserRole = userData.role === 'buyer' ? 'seller' : 'buyer';

    if (notifyUserId) {
      await notificationService.createNotification({
        userId: notifyUserId,
        userRole: notifyUserRole,
        type: 'DISPUTE',
        title: 'Dispute Raised',
        message: `A dispute has been raised for ${order.scopeBox?.title || 'an order'}. Reason: ${reason}.`,
        link: `/${notifyUserRole}-dashboard`,
        emailOptions: {
          templateName: 'disputeRaised',
          context: { dispute: { orderId: order.id, reason } }
        }
      });
    }

    return res.json({ success: true, data: order, message: 'Dispute raised' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── PATCH /api/orders/:id/release ─────────────────────────────────────────────

async function releaseFunds(req, res) {
  try {
    const { id } = req.params;
    const buyerData = req.user;
    if (buyerData.role !== 'buyer') return res.status(403).json({ success: false, message: 'Only buyers can release funds' });
    const order = await orderService.releaseFunds(id, buyerData.id);
    return res.json({ success: true, data: order, message: 'Funds released. Order completed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── PATCH /api/orders/:id/refund ──────────────────────────────────────────────

async function refundBuyer(req, res) {
  try {
    const { id } = req.params;
    const userData = req.user;
    if (userData.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    const order = await orderService.refundBuyer(id, userData.id);
    return res.json({ success: true, data: order, message: 'Buyer refunded' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── GET /api/orders/:id ───────────────────────────────────────────────────────

async function getOrder(req, res) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── GET /api/orders/buyer ─────────────────────────────────────────────────────

async function getBuyerOrders(req, res) {
  try {
    const buyerData = req.user;
    const orders = await orderService.getBuyerOrders(buyerData.id);
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── GET /api/orders/seller ────────────────────────────────────────────────────

async function getSellerOrders(req, res) {
  try {
    const sellerData = req.user;
    const orders = await orderService.getSellerOrders(sellerData.id);
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── PATCH /api/orders/:id/cancel ──────────────────────────────────────────────

async function cancelOrder(req, res) {
  try {
    const { id } = req.params;
    const buyerData = req.user;
    if (buyerData.role !== 'buyer') return res.status(403).json({ success: false, message: 'Only buyers can cancel orders' });
    const order = await orderService.cancelOrder(id, buyerData.id);
    return res.json({ success: true, data: order, message: 'Order cancelled' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── GET /api/orders/user/:userId ──────────────────────────────────────────────

async function getOrdersByUser(req, res) {
  try {
    const { userId } = req.params;
    const { role = 'buyer' } = req.query;
    const orders = await orderService.getOrdersByUser(userId, role);
    return res.json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── PATCH /api/orders/:id/accept ──────────────────────────────────────────────

async function acceptOrder(req, res) {
  try {
    const { id } = req.params;
    const sellerData = req.user;
    if (sellerData.role !== 'seller') return res.status(403).json({ success: false, message: 'Only sellers can accept orders' });
    const order = await orderService.acceptOrder(id, sellerData.id);
    return res.json({ success: true, data: order, message: 'Order accepted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── PATCH /api/orders/:id/start-work ──────────────────────────────────────────

async function startWorkFromAccepted(req, res) {
  try {
    const { id } = req.params;
    const sellerData = req.user;
    if (sellerData.role !== 'seller') return res.status(403).json({ success: false, message: 'Only sellers can start work' });
    const order = await orderService.startWorkFromAccepted(id, sellerData.id);
    return res.json({ success: true, data: order, message: 'Work started' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── PATCH /api/orders/:id/reject ──────────────────────────────────────────────

async function rejectOrder(req, res) {
  try {
    const { id } = req.params;
    const sellerData = req.user;
    if (sellerData.role !== 'seller') return res.status(403).json({ success: false, message: 'Only sellers can reject orders' });
    const order = await orderService.rejectOrder(id, sellerData.id);
    return res.json({ success: true, data: order, message: 'Order rejected' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── PATCH /api/orders/:id/request-changes ────────────────────────────────────

async function requestChanges(req, res) {
  try {
    const { id } = req.params;
    const sellerData = req.user;
    if (sellerData.role !== 'seller') return res.status(403).json({ success: false, message: 'Only sellers can request changes' });
    const order = await orderService.requestChanges(id, sellerData.id, req.body);
    return res.json({ success: true, data: order, message: 'Changes requested' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── PATCH /api/orders/:id/accept-changes ─────────────────────────────────────

async function acceptChanges(req, res) {
  try {
    const { id } = req.params;
    const buyerData = req.user;
    if (buyerData.role !== 'buyer') return res.status(403).json({ success: false, message: 'Only buyers can accept changes' });
    const order = await orderService.acceptChanges(id, buyerData.id);
    return res.json({ success: true, data: order, message: 'Changes accepted. Order is now IN_PROGRESS.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ── PATCH /api/orders/:id/reject-changes ─────────────────────────────────────

async function rejectChanges(req, res) {
  try {
    const { id } = req.params;
    const buyerData = req.user;
    if (buyerData.role !== 'buyer') return res.status(403).json({ success: false, message: 'Only buyers can reject changes' });
    const order = await orderService.rejectChanges(id, buyerData.id);
    return res.json({ success: true, data: order, message: 'Changes rejected.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  fundEscrow, startWork, submitDelivery, approveDelivery,
  raiseDispute, releaseFunds, refundBuyer, getOrder, getBuyerOrders,
  getSellerOrders, cancelOrder, getOrdersByUser, acceptOrder, rejectOrder,
  startWorkFromAccepted, requestChanges, acceptChanges, rejectChanges,
};
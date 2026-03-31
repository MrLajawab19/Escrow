const { Order } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Status transition rules
const STATUS_TRANSITIONS = {
  'PLACED': ['ESCROW_FUNDED', 'DISPUTED'],
  // SUBMITTED: seller can deliver once escrow is funded (even before formal "accept" in edge cases)
  'ESCROW_FUNDED': ['IN_PROGRESS', 'DISPUTED', 'SUBMITTED'],
  // ACCEPTED: set by acceptOrder(); sellers need to submit delivery from here (not only IN_PROGRESS)
  'ACCEPTED': ['SUBMITTED', 'DISPUTED', 'IN_PROGRESS'],
  'IN_PROGRESS': ['SUBMITTED', 'DISPUTED'],
  'SUBMITTED': ['COMPLETED', 'DISPUTED'],
  'APPROVED': ['RELEASED', 'REFUNDED'],
  'COMPLETED': [],
  'DISPUTED': ['IN_PROGRESS', 'RELEASED', 'REFUNDED'],
  'RELEASED': [],
  'REFUNDED': []
};

// Guarantee seller can finish delivery after accept (defensive — avoids stale deployments missing edges)
STATUS_TRANSITIONS.ACCEPTED = [
  ...new Set([
    ...(STATUS_TRANSITIONS.ACCEPTED || []),
    'SUBMITTED',
    'DISPUTED',
    'IN_PROGRESS'
  ])
];

// Validate status transition
function isValidStatusTransition(currentStatus, newStatus) {
  const cur = String(currentStatus ?? '').trim();
  const next = String(newStatus ?? '').trim();
  const allowedTransitions = STATUS_TRANSITIONS[cur] || [];
  return allowedTransitions.includes(next);
}

// Update order status with logging
async function updateOrderStatus(orderId, newStatus, byUserId, additionalData = {}) {
  const order = await Order.findByPk(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }

  if (!isValidStatusTransition(order.status, newStatus)) {
    throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
  }

  const logEntry = {
    event: `STATUS_CHANGED_TO_${newStatus}`,
    byUserId,
    timestamp: new Date().toISOString(),
    previousStatus: order.status,
    newStatus,
    ...additionalData
  };

  await order.update({
    status: newStatus,
    orderLogs: [...(order.orderLogs || []), logEntry]
  });

  return order;
}

// Create new order
async function createOrder(orderData) {
  const { 
    orderId,
    buyerId, 
    sellerId, 
    buyerName,
    buyerEmail,
    platform,
    productLink,
    country,
    currency,
    sellerContact,
    escrowLink,
    orderTrackingLink,
    scopeBox 
  } = orderData;
  
  const logEntry = {
    event: 'ORDER_CREATED',
    byUserId: buyerId,
    timestamp: new Date().toISOString(),
    buyerName,
    buyerEmail,
    platform,
    productLink,
    country,
    currency,
    sellerContact,
    escrowLink,
    orderTrackingLink
  };

  return await Order.create({
    id: orderId,
    buyerId,
    sellerId,
    buyerName,
    buyerEmail,
    platform,
    productLink,
    country,
    currency,
    sellerContact,
    escrowLink,
    orderTrackingLink,
    scopeBox,
    status: 'PLACED',
    orderLogs: [logEntry]
  });
}

// Fund escrow
async function fundEscrow(orderId, buyerId) {
  return await updateOrderStatus(orderId, 'ESCROW_FUNDED', buyerId, {
    event: 'ESCROW_FUNDED'
  });
}

// Start work
async function startWork(orderId, sellerId) {
  return await updateOrderStatus(orderId, 'IN_PROGRESS', sellerId, {
    event: 'WORK_STARTED'
  });
}

// Submit delivery — updates status without going through STATUS_TRANSITIONS so ACCEPTED/ESCROW_FUNDED/IN_PROGRESS
// always work (avoids mismatches between Sequelize enum values and transition map keys).
async function submitDelivery(orderId, sellerId, deliveryFiles) {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.sellerId !== sellerId) {
    throw new Error('Unauthorized: Only the seller can submit delivery');
  }

  const status = String(order.status ?? '').trim();
  const allowedBeforeSubmit = ['ESCROW_FUNDED', 'ACCEPTED', 'IN_PROGRESS'];
  if (!allowedBeforeSubmit.includes(status)) {
    throw new Error(
      `Cannot submit delivery from status "${status}". Allowed: ${allowedBeforeSubmit.join(', ')}`
    );
  }

  const mergedFiles = [...(order.deliveryFiles || []), ...(deliveryFiles || [])];

  const logEntry = {
    event: 'DELIVERY_SUBMITTED',
    byUserId: sellerId,
    timestamp: new Date().toISOString(),
    previousStatus: status,
    newStatus: 'SUBMITTED',
    deliveryFiles: deliveryFiles || []
  };

  await order.update({
    deliveryFiles: mergedFiles,
    status: 'SUBMITTED',
    orderLogs: [...(order.orderLogs || []), logEntry]
  });

  return order;
}

// Approve delivery
async function approveDelivery(orderId, buyerId) {
  return await updateOrderStatus(orderId, 'APPROVED', buyerId, {
    event: 'DELIVERY_APPROVED'
  });
}

// Raise dispute
async function raiseDispute(orderId, userId, disputeData) {
  const disputeId = uuidv4();
  
  return await updateOrderStatus(orderId, 'DISPUTED', userId, {
    event: 'DISPUTE_RAISED',
    disputeId,
    disputeData
  });
}

// Release funds (buyer only)
async function releaseFunds(orderId, buyerId) {
  const order = await Order.findByPk(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  if (order.buyerId !== buyerId) {
    throw new Error('Unauthorized: Only the buyer can release funds for this order');
  }
  
  // Only allow release if order is SUBMITTED
  if (order.status !== 'SUBMITTED') {
    throw new Error('Order must be in SUBMITTED status to release funds');
  }
  
  const previousStatus = order.status;
  order.status = 'COMPLETED';
  
  // Add completion log
  const logEntry = {
    event: 'ORDER_COMPLETED',
    byUserId: buyerId,
    timestamp: new Date().toISOString(),
    previousStatus,
    newStatus: 'COMPLETED',
    reason: 'Funds released by buyer',
    action: 'FUNDS_RELEASED_TO_SELLER'
  };
  
  order.orderLogs = [...(order.orderLogs || []), logEntry];
  
  // Save the order first
  await order.save();
  
  // Send notification to seller about payment
  try {
    await sendSellerPaymentNotification(order);
  } catch (notificationError) {
    console.error('Error sending seller payment notification:', notificationError);
    // Don't fail the entire operation if notification fails
  }
  
  return order;
}

// Send payment notification to seller
async function sendSellerPaymentNotification(order) {
  const { sellerContact, scopeBox, id } = order;
  
  console.log('📧 Sending payment notification to seller:', sellerContact);
  console.log('   Subject: Payment Received - Order', id);
  console.log('   Message: Your payment has been released for the completed order');
  console.log('   Order ID:', id);
  console.log('   Amount:', scopeBox?.price || 0);
  console.log('   Status: COMPLETED');
  
  // In a real implementation, you would:
  // 1. Send email/SMS to seller
  // 2. Update seller's account balance
  // 3. Send confirmation to buyer
  // 4. Update escrow account
  
  // For now, we'll just log the notification
  console.log('✅ Payment notification sent to seller');
}

// Refund buyer (admin only)
async function refundBuyer(orderId, adminId) {
  return await updateOrderStatus(orderId, 'REFUNDED', adminId, {
    event: 'BUYER_REFUNDED'
  });
}

// Accept order (seller only) — moves to ACCEPTED and records time for buyer "Accepted" → "In progress" (1h) UI
async function acceptOrder(orderId, sellerId) {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.sellerId !== sellerId) {
    throw new Error('Unauthorized: Only the assigned seller can accept this order');
  }

  if (order.status !== 'ESCROW_FUNDED') {
    throw new Error('Order must be in ESCROW_FUNDED status to be accepted');
  }

  const acceptedAt = new Date();

  const updated = await updateOrderStatus(orderId, 'ACCEPTED', sellerId, {
    event: 'ORDER_ACCEPTED',
    reason: 'Accepted by seller — work in progress'
  });

  await updated.update({ sellerAcceptedAt: acceptedAt });
  return updated.reload();
}

// Start work from accepted status (seller only) - moves from ACCEPTED to IN_PROGRESS
async function startWorkFromAccepted(orderId, sellerId) {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.sellerId !== sellerId) {
    throw new Error('Unauthorized: Only the assigned seller can start work on this order');
  }

  if (order.status !== 'ACCEPTED') {
    throw new Error('Order must be in ACCEPTED status to start work');
  }

  return await updateOrderStatus(orderId, 'IN_PROGRESS', sellerId, {
    event: 'WORK_STARTED',
    reason: 'Work started by seller'
  });
}

// Reject order (seller only)
async function rejectOrder(orderId, sellerId) {
  const order = await Order.findByPk(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  if (order.sellerId !== sellerId) {
    throw new Error('Unauthorized: Only the assigned seller can reject this order');
  }
  
  // Only allow rejection if order is ESCROW_FUNDED
  if (order.status !== 'ESCROW_FUNDED') {
    throw new Error('Order must be in ESCROW_FUNDED status to be rejected');
  }
  
  const previousStatus = order.status;
  order.status = 'REJECTED';
  
  // Add rejection log
  const logEntry = {
    event: 'ORDER_REJECTED',
    byUserId: sellerId,
    timestamp: new Date().toISOString(),
    previousStatus,
    newStatus: 'REJECTED',
    reason: 'Rejected by seller'
  };
  
  order.orderLogs = [...(order.orderLogs || []), logEntry];
  
  return await order.save();
}

// Request changes to order (seller only)
async function requestChanges(orderId, sellerId, changesData) {
  const order = await Order.findByPk(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  if (order.sellerId !== sellerId) {
    throw new Error('Unauthorized: Only the assigned seller can request changes to this order');
  }
  
  // Only allow changes request if order is ESCROW_FUNDED
  if (order.status !== 'ESCROW_FUNDED') {
    throw new Error('Order must be in ESCROW_FUNDED status to request changes');
  }
  
  const previousStatus = order.status;
  order.status = 'CHANGES_REQUESTED';
  
  // Store the proposed changes separately
  order.proposedScopeBox = {
    ...order.scopeBox,
    ...changesData.scopeBox,
    changesRequested: true,
    requestedBy: 'seller',
    requestedAt: new Date().toISOString(),
    changeReason: changesData.scopeBox?.changeReason || 'Changes requested by seller'
  };
  
  // Add changes request log
  const logEntry = {
    event: 'CHANGES_REQUESTED',
    byUserId: sellerId,
    timestamp: new Date().toISOString(),
    previousStatus,
    newStatus: 'CHANGES_REQUESTED',
    reason: 'Changes requested by seller',
    changesRequested: true
  };
  
  order.orderLogs = [...(order.orderLogs || []), logEntry];
  
  return await order.save();
}

// Accept changes (buyer only)
async function acceptChanges(orderId, buyerId) {
  const order = await Order.findByPk(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  if (order.buyerId !== buyerId) {
    throw new Error('Unauthorized: Only the buyer can accept changes to this order');
  }
  
  // Only allow acceptance if order is CHANGES_REQUESTED
  if (order.status !== 'CHANGES_REQUESTED') {
    throw new Error('Order must be in CHANGES_REQUESTED status to accept changes');
  }
  
  const previousStatus = order.status;
  order.status = 'IN_PROGRESS';
  
  // Update scope box with the proposed changes
  if (order.proposedScopeBox) {
    order.scopeBox = order.proposedScopeBox;
    order.proposedScopeBox = null; // Clear the proposed changes
  }
  
  // Add acceptance log
  const logEntry = {
    event: 'CHANGES_ACCEPTED',
    byUserId: buyerId,
    timestamp: new Date().toISOString(),
    previousStatus,
    newStatus: 'IN_PROGRESS',
    reason: 'Changes accepted by buyer'
  };
  
  order.orderLogs = [...(order.orderLogs || []), logEntry];
  
  return await order.save();
}

// Reject changes (buyer only)
async function rejectChanges(orderId, buyerId) {
  const order = await Order.findByPk(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  if (order.buyerId !== buyerId) {
    throw new Error('Unauthorized: Only the buyer can reject changes to this order');
  }
  
  // Only allow rejection if order is CHANGES_REQUESTED
  if (order.status !== 'CHANGES_REQUESTED') {
    throw new Error('Order must be in CHANGES_REQUESTED status to reject changes');
  }
  
  const previousStatus = order.status;
  order.status = 'REJECTED';
  
  // Clear the proposed changes
  order.proposedScopeBox = null;
  
  // Add rejection log
  const logEntry = {
    event: 'CHANGES_REJECTED',
    byUserId: buyerId,
    timestamp: new Date().toISOString(),
    previousStatus,
    newStatus: 'REJECTED',
    reason: 'Changes rejected by buyer'
  };
  
  order.orderLogs = [...(order.orderLogs || []), logEntry];
  
  return await order.save();
}

// Get order by ID
async function getOrderById(orderId) {
  return await Order.findByPk(orderId);
}

// Get buyer orders
async function getBuyerOrders(buyerId) {
  return await Order.findAll({
    where: { buyerId: buyerId },
    order: [['createdAt', 'DESC']]
  });
}

// Get seller orders
async function getSellerOrders(sellerId) {
  return await Order.findAll({
    where: { sellerId: sellerId },
    order: [['createdAt', 'DESC']]
  });
}

// Get orders by user (buyer or seller)
async function getOrdersByUser(userId, role = 'buyer') {
  const whereClause = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };
  return await Order.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']]
  });
}

// Cancel order (buyer only)
async function cancelOrder(orderId, buyerId) {
  const order = await Order.findByPk(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  if (order.buyerId !== buyerId) {
    throw new Error('Unauthorized: Only the buyer can cancel this order');
  }
  
  // Only allow cancellation if order is not accepted by seller yet
  if (order.status !== 'PLACED' && order.status !== 'ESCROW_FUNDED') {
    throw new Error('Order cannot be cancelled at this stage');
  }
  
  const previousStatus = order.status;
  order.status = 'CANCELLED';
  
  // Add cancellation log
  const logEntry = {
    event: 'ORDER_CANCELLED',
    byUserId: buyerId,
    timestamp: new Date().toISOString(),
    previousStatus,
    newStatus: 'CANCELLED',
    reason: 'Cancelled by buyer'
  };
  
  order.orderLogs = [...(order.orderLogs || []), logEntry];
  
  return await order.save();
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
  getOrderById,
  getBuyerOrders,
  getSellerOrders,
  cancelOrder,
  getOrdersByUser,
  updateOrderStatus,
  isValidStatusTransition,
  acceptOrder,
  rejectOrder,
  requestChanges,
  acceptChanges,
  rejectChanges,
  startWorkFromAccepted
};
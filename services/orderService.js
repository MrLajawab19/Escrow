const { Order } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Status transition rules
const STATUS_TRANSITIONS = {
  'PLACED': ['ESCROW_FUNDED', 'DISPUTED'],
  'ESCROW_FUNDED': ['IN_PROGRESS', 'DISPUTED'],
  'IN_PROGRESS': ['SUBMITTED', 'DISPUTED'],
  'SUBMITTED': ['APPROVED', 'DISPUTED'],
  'APPROVED': ['RELEASED', 'REFUNDED'],
  'DISPUTED': ['IN_PROGRESS', 'RELEASED', 'REFUNDED'],
  'RELEASED': [],
  'REFUNDED': []
};

// Validate status transition
function isValidStatusTransition(currentStatus, newStatus) {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
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
    orderLogs: [...order.orderLogs, logEntry]
  });

  return order;
}

// Create new order
async function createOrder(orderData) {
  const { 
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
  } = orderData;
  
  const logEntry = {
    event: 'ORDER_CREATED',
    byUserId: buyerId,
    timestamp: new Date().toISOString(),
    buyerName,
    platform,
    productLink,
    country,
    currency,
    sellerContact,
    escrowLink,
    scopeBox
  };

  return await Order.create({
    buyerId,
    sellerId,
    buyerName,
    platform,
    productLink,
    country,
    currency,
    sellerContact,
    escrowLink,
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

// Submit delivery
async function submitDelivery(orderId, sellerId, deliveryFiles) {
  const order = await Order.findByPk(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }

  if (order.sellerId !== sellerId) {
    throw new Error('Unauthorized: Only the seller can submit delivery');
  }

  await order.update({
    deliveryFiles: [...order.deliveryFiles, ...deliveryFiles]
  });

  return await updateOrderStatus(orderId, 'SUBMITTED', sellerId, {
    event: 'DELIVERY_SUBMITTED',
    deliveryFiles
  });
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

// Release funds (admin only)
async function releaseFunds(orderId, adminId) {
  return await updateOrderStatus(orderId, 'RELEASED', adminId, {
    event: 'FUNDS_RELEASED'
  });
}

// Refund buyer (admin only)
async function refundBuyer(orderId, adminId) {
  return await updateOrderStatus(orderId, 'REFUNDED', adminId, {
    event: 'BUYER_REFUNDED'
  });
}

// Get order by ID
async function getOrderById(orderId) {
  return await Order.findByPk(orderId);
}

// Get orders by user (buyer or seller)
async function getOrdersByUser(userId, role = 'buyer') {
  const whereClause = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };
  return await Order.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']]
  });
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
  getOrdersByUser,
  updateOrderStatus,
  isValidStatusTransition
}; 
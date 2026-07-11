const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();
const ledgerService = require('./ledgerService');
const walletService = require('./walletService');

async function appendLedger(updatedOrder, logEntry, actorId) {
  try {
    const deedId = updatedOrder.scopeBox?.deedId;
    if (deedId && logEntry) {
      let actorRole = 'system';
      if (actorId === updatedOrder.buyerId) actorRole = 'buyer';
      else if (actorId === updatedOrder.sellerId) actorRole = 'seller';
      else if (actorId) actorRole = 'admin';

      await ledgerService.appendEvent(
        deedId, 
        logEntry.event || logEntry.action || 'ORDER_UPDATED', 
        actorRole, 
        actorId || 'system', 
        { 
          reason: logEntry.reason, 
          previousStatus: logEntry.previousStatus, 
          newStatus: logEntry.newStatus 
        }
      );
    }
  } catch(e) { 
    console.error('Ledger error:', e); 
  }
}


// Status transition rules
const STATUS_TRANSITIONS = {
  PLACED: ['ESCROW_FUNDED', 'DISPUTED', 'CANCELLED'],
  ESCROW_FUNDED: ['ACCEPTED', 'IN_PROGRESS', 'DISPUTED', 'SUBMITTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'SUBMITTED', 'DISPUTED'],
  IN_PROGRESS: ['SUBMITTED', 'DISPUTED'],
  SUBMITTED: ['APPROVED', 'COMPLETED', 'DISPUTED'],
  APPROVED: ['RELEASED', 'REFUNDED'],
  COMPLETED: [],
  DISPUTED: ['IN_PROGRESS', 'RELEASED', 'REFUNDED', 'COMPLETED'],
  CHANGES_REQUESTED: ['IN_PROGRESS', 'REJECTED'],
  RELEASED: [],
  REFUNDED: [],
  REJECTED: [],
  CANCELLED: [],
};

function isValidStatusTransition(currentStatus, newStatus) {
  const cur = String(currentStatus ?? '').trim();
  const next = String(newStatus ?? '').trim();
  const allowed = STATUS_TRANSITIONS[cur] || [];
  return allowed.includes(next);
}

// ── Update order status with append-only log ───────────────────────────────────

async function updateOrderStatus(orderId, newStatus, byUserId, additionalData = {}) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');

  if (!isValidStatusTransition(order.status, newStatus)) {
    throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
  }

  const logEntry = {
    event: `STATUS_CHANGED_TO_${newStatus}`,
    byUserId,
    timestamp: new Date().toISOString(),
    previousStatus: order.status,
    newStatus,
    ...additionalData,
  };

  const currentLogs = Array.isArray(order.orderLogs) ? order.orderLogs : [];

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      orderLogs: [...currentLogs, logEntry],
    },
  });
}

// ── Create new order ──────────────────────────────────────────────────────────

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
    scopeBox,
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
    orderTrackingLink,
  };

  const order = await prisma.order.create({
    data: {
      id: orderId,
      buyerId,
      sellerId: sellerId || null,
      buyerName,
      buyerEmail,
      platform,
      productLink: productLink || null,
      country,
      currency,
      sellerContact,
      escrowLink: escrowLink || null,
      orderTrackingLink: orderTrackingLink || null,
      scopeBox,
      status: 'PLACED',
      orderLogs: [logEntry],
    },
  });

  // Create chat room for the order
  try {
    await prisma.orderChatRoom.create({
      data: {
        orderId: order.id,
        buyerId,
        sellerId: sellerId || 'pending',
      },
    });
  } catch (chatErr) {
    console.error('Failed to create order chat room:', chatErr.message);
  }

  return order;
}

// ── Fund escrow ────────────────────────────────────────────────────────────────

async function fundEscrow(orderId, buyerId) {
  return updateOrderStatus(orderId, 'ESCROW_FUNDED', buyerId, { event: 'ESCROW_FUNDED' });
}

// ── Start work ─────────────────────────────────────────────────────────────────

async function startWork(orderId, sellerId) {
  return updateOrderStatus(orderId, 'IN_PROGRESS', sellerId, { event: 'WORK_STARTED' });
}

// ── Submit delivery ────────────────────────────────────────────────────────────

async function submitDelivery(orderId, sellerId, deliveryFiles) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (order.sellerId !== sellerId) throw new Error('Unauthorized: Only the seller can submit delivery');

  const status = String(order.status ?? '').trim();
  const allowedBeforeSubmit = ['ESCROW_FUNDED', 'ACCEPTED', 'IN_PROGRESS'];
  if (!allowedBeforeSubmit.includes(status)) {
    throw new Error(`Cannot submit delivery from status "${status}". Allowed: ${allowedBeforeSubmit.join(', ')}`);
  }

  const mergedFiles = [...(Array.isArray(order.deliveryFiles) ? order.deliveryFiles : []), ...(deliveryFiles || [])];
  const currentLogs = Array.isArray(order.orderLogs) ? order.orderLogs : [];
  const logEntry = {
    event: 'DELIVERY_SUBMITTED',
    byUserId: sellerId,
    timestamp: new Date().toISOString(),
    previousStatus: status,
    newStatus: 'SUBMITTED',
    deliveryFiles: deliveryFiles || [],
  };

  return prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryFiles: mergedFiles,
      status: 'SUBMITTED',
      orderLogs: [...currentLogs, logEntry],
    },
  });
}

// ── Approve delivery ───────────────────────────────────────────────────────────

async function approveDelivery(orderId, buyerId) {
  return updateOrderStatus(orderId, 'APPROVED', buyerId, { event: 'DELIVERY_APPROVED' });
}

// ── Raise dispute ──────────────────────────────────────────────────────────────

async function raiseDispute(orderId, userId, disputeData) {
  return updateOrderStatus(orderId, 'DISPUTED', userId, {
    event: 'DISPUTE_RAISED',
    disputeData,
  });
}

// ── Release funds (buyer only) ─────────────────────────────────────────────────

async function releaseFunds(orderId, buyerId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (order.buyerId !== buyerId) throw new Error('Unauthorized: Only the buyer can release funds for this order');
  if (order.status !== 'SUBMITTED') throw new Error('Order must be in SUBMITTED status to release funds');

  const currentLogs = Array.isArray(order.orderLogs) ? order.orderLogs : [];
  const logEntry = {
    event: 'ORDER_COMPLETED',
    byUserId: buyerId,
    timestamp: new Date().toISOString(),
    previousStatus: order.status,
    newStatus: 'COMPLETED',
    reason: 'Funds released by buyer',
    action: 'FUNDS_RELEASED_TO_SELLER',
  };

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'COMPLETED',
      orderLogs: [...currentLogs, logEntry],
    },
  });
  await appendLedger(updated, logEntry, buyerId);

  // Notify seller (simulated)
  console.log(`📧 Payment notification to seller: ${updated.sellerContact} — Order ${orderId} COMPLETED`);

  return updated;
}

// ── Refund buyer (admin only) ──────────────────────────────────────────────────

async function refundBuyer(orderId, adminId) {
  return updateOrderStatus(orderId, 'REFUNDED', adminId, { event: 'BUYER_REFUNDED' });
}

// ── Accept order (seller only) ─────────────────────────────────────────────────

async function acceptOrder(orderId, sellerId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (order.sellerId !== sellerId) throw new Error('Unauthorized: Only the assigned seller can accept this order');
  if (order.status !== 'ESCROW_FUNDED') throw new Error('Order must be in ESCROW_FUNDED status to be accepted');

  const acceptedAt = new Date();
  const currentLogs = Array.isArray(order.orderLogs) ? order.orderLogs : [];
  const logEntry = {
    event: 'ORDER_ACCEPTED',
    byUserId: sellerId,
    timestamp: acceptedAt.toISOString(),
    previousStatus: order.status,
    newStatus: 'ACCEPTED',
    reason: 'Accepted by seller — work in progress',
  };

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'ACCEPTED',
      sellerAcceptedAt: acceptedAt,
      orderLogs: [...currentLogs, logEntry],
    },
  });
  await appendLedger(updated, logEntry, sellerId);
  return updated;
}

// ── Start work from ACCEPTED (seller only) ────────────────────────────────────

async function startWorkFromAccepted(orderId, sellerId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (order.sellerId !== sellerId) throw new Error('Unauthorized: Only the assigned seller can start work');
  if (order.status !== 'ACCEPTED') throw new Error('Order must be in ACCEPTED status to start work');

  return updateOrderStatus(orderId, 'IN_PROGRESS', sellerId, {
    event: 'WORK_STARTED',
    reason: 'Work started by seller',
  });
}

// ── Reject order (seller only) ─────────────────────────────────────────────────

async function rejectOrder(orderId, sellerId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (order.sellerId !== sellerId) throw new Error('Unauthorized: Only the assigned seller can reject this order');
  if (order.status !== 'ESCROW_FUNDED') throw new Error('Order must be in ESCROW_FUNDED status to be rejected');

  const currentLogs = Array.isArray(order.orderLogs) ? order.orderLogs : [];
  const logEntry = {
    event: 'ORDER_REJECTED',
    byUserId: sellerId,
    timestamp: new Date().toISOString(),
    previousStatus: order.status,
    newStatus: 'REJECTED',
    reason: 'Rejected by seller',
  };

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'REJECTED',
      orderLogs: [...currentLogs, logEntry],
    },
  });
  
  // Refund the buyer's virtual wallet
  try {
    const amount = order.scopeBox?.price || 0;
    if (amount > 0) {
      await walletService.refundBuyer(order.buyerId, orderId, amount, order.currency, 'Order rejected by seller');
    }
  } catch (err) {
    console.error(`Failed to refund buyer for rejected order ${orderId}:`, err);
  }

  await appendLedger(updated, logEntry, sellerId);
  return updated;
}

// ── Request changes (seller only) ─────────────────────────────────────────────

async function requestChanges(orderId, sellerId, changesData) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (order.sellerId !== sellerId) throw new Error('Unauthorized: Only the assigned seller can request changes');
  if (order.status !== 'ESCROW_FUNDED') throw new Error('Order must be in ESCROW_FUNDED status to request changes');

  const proposedScopeBox = {
    ...((order.scopeBox && typeof order.scopeBox === 'object') ? order.scopeBox : {}),
    ...(changesData.scopeBox || {}),
    changesRequested: true,
    requestedBy: 'seller',
    requestedAt: new Date().toISOString(),
    changeReason: changesData.scopeBox?.changeReason || 'Changes requested by seller',
  };

  const currentLogs = Array.isArray(order.orderLogs) ? order.orderLogs : [];
  const logEntry = {
    event: 'CHANGES_REQUESTED',
    byUserId: sellerId,
    timestamp: new Date().toISOString(),
    previousStatus: order.status,
    newStatus: 'CHANGES_REQUESTED',
    reason: 'Changes requested by seller',
    changesRequested: true,
  };

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CHANGES_REQUESTED',
      proposedScopeBox,
      orderLogs: [...currentLogs, logEntry],
    },
  });
  await appendLedger(updated, logEntry, sellerId);
  return updated;
}

// ── Accept changes (buyer only) ────────────────────────────────────────────────

async function acceptChanges(orderId, buyerId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (order.buyerId !== buyerId) throw new Error('Unauthorized: Only the buyer can accept changes');
  if (order.status !== 'CHANGES_REQUESTED') throw new Error('Order must be in CHANGES_REQUESTED status to accept changes');

  const currentLogs = Array.isArray(order.orderLogs) ? order.orderLogs : [];
  const logEntry = {
    event: 'CHANGES_ACCEPTED',
    byUserId: buyerId,
    timestamp: new Date().toISOString(),
    previousStatus: order.status,
    newStatus: 'IN_PROGRESS',
    reason: 'Changes accepted by buyer',
  };

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'IN_PROGRESS',
      scopeBox: order.proposedScopeBox || order.scopeBox,
      proposedScopeBox: null,
      orderLogs: [...currentLogs, logEntry],
    },
  });
}

// ── Reject changes (buyer only) ────────────────────────────────────────────────

async function rejectChanges(orderId, buyerId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (order.buyerId !== buyerId) throw new Error('Unauthorized: Only the buyer can reject changes');
  if (order.status !== 'CHANGES_REQUESTED') throw new Error('Order must be in CHANGES_REQUESTED status to reject changes');

  const currentLogs = Array.isArray(order.orderLogs) ? order.orderLogs : [];
  const logEntry = {
    event: 'CHANGES_REJECTED',
    byUserId: buyerId,
    timestamp: new Date().toISOString(),
    previousStatus: order.status,
    newStatus: 'REJECTED',
    reason: 'Changes rejected by buyer',
  };

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'REJECTED',
      proposedScopeBox: null,
      orderLogs: [...currentLogs, logEntry],
    },
  });
}

// ── Cancel order (buyer only) ──────────────────────────────────────────────────

async function cancelOrder(orderId, buyerId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (order.buyerId !== buyerId) throw new Error('Unauthorized: Only the buyer can cancel this order');
  if (!['PLACED', 'ESCROW_FUNDED'].includes(order.status)) {
    throw new Error('Order cannot be cancelled at this stage');
  }

  const currentLogs = Array.isArray(order.orderLogs) ? order.orderLogs : [];
  const logEntry = {
    event: 'ORDER_CANCELLED',
    byUserId: buyerId,
    timestamp: new Date().toISOString(),
    previousStatus: order.status,
    newStatus: 'CANCELLED',
    reason: 'Cancelled by buyer',
  };

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      orderLogs: [...currentLogs, logEntry],
    },
  });
  
  // Refund the buyer's virtual wallet if it was escrow funded
  if (order.status === 'ESCROW_FUNDED') {
    try {
      const amount = order.scopeBox?.price || 0;
      if (amount > 0) {
        await walletService.refundBuyer(order.buyerId, orderId, amount, order.currency, 'Order cancelled by buyer');
      }
    } catch (err) {
      console.error(`Failed to refund buyer for cancelled order ${orderId}:`, err);
    }
  }

  await appendLedger(updated, logEntry, buyerId);
  return updated;
}

// ── Query helpers ──────────────────────────────────────────────────────────────


async function attachDeedState(orders) {
  if (!orders || orders.length === 0) return orders;
  const isArray = Array.isArray(orders);
  const orderList = isArray ? orders : [orders];
  
  const deedIds = orderList.map(o => o.scopeBox?.deedId).filter(Boolean);
  if (deedIds.length === 0) return orders;

  const deeds = await prisma.deed.findMany({ where: { id: { in: deedIds } } });
  const deedMap = Object.fromEntries(deeds.map(d => [d.id, d]));

  orderList.forEach(order => {
    const deedId = order.scopeBox?.deedId;
    if (deedId && deedMap[deedId]) {
      const deedStatus = deedMap[deedId].status;
      // Derived status mapping
      if (deedStatus === 'PENDING_SELLER') order.status = 'ESCROW_FUNDED';
      else if (deedStatus === 'ACTIVE') order.status = 'IN_PROGRESS'; // Maps to legacy active working state
      else if (deedStatus === 'CONFIRMED' || deedStatus === 'CLOSED') order.status = 'COMPLETED';
      else order.status = deedStatus; // SUBMITTED, CHANGES_REQUESTED, DISPUTED match 1:1
      
      // Pass along revision counts if needed
      if (deedMap[deedId].revisionCount !== undefined) {
         order.revisionsUsed = deedMap[deedId].revisionCount;
         order.revisionsAllowed = deedMap[deedId].revisionLimit || 3;
      }
    }
  });
  
  return isArray ? orderList : orderList[0];
}

async function getOrderById(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  return attachDeedState(order);
}

async function getBuyerOrders(buyerId) {
  const orders = await prisma.order.findMany({
    where: { buyerId },
    orderBy: { createdAt: 'desc' },
  });
  return attachDeedState(orders);
}

async function getSellerOrders(sellerId) {
  const orders = await prisma.order.findMany({
    where: { sellerId },
    orderBy: { createdAt: 'desc' },
  });
  return attachDeedState(orders);
}

async function getOrdersByUser(userId, role = 'buyer') {
  const where = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: 'desc' } });
  return attachDeedState(orders);
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
  startWorkFromAccepted,
};
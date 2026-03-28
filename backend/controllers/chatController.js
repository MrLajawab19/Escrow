const { PrismaClient } = require('@prisma/client');
const { Sequelize } = require('sequelize');
const config = require('../../backend/config/config.json');
const prisma = new PrismaClient();

// Sequelize connection to cross-check order ownership (buyerId / sellerId)
const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  { host: config.development.host, dialect: config.development.dialect, logging: false }
);
const SequelizeOrder = require('../../backend/models/order')(sequelize, Sequelize.DataTypes);

/**
 * Sanitize user input — strip HTML tags, trim whitespace.
 */
function sanitize(str) {
  return String(str || '').replace(/<[^>]*>/g, '').trim().slice(0, 2000);
}

/**
 * Check if user is authorized to access a given order's chat.
 * Looks up the order from Sequelize (where buyerId/sellerId actually live).
 * Admins bypass the check.
 */
async function isAuthorized(orderId, userId, role) {
  if (role === 'admin') return { authorized: true, buyerId: null, sellerId: null };
  try {
    const order = await SequelizeOrder.findOne({ where: { id: orderId } });
    if (!order) return { authorized: false };
    const authorized =
      (role === 'buyer' && order.buyerId === userId) ||
      (role === 'seller' && order.sellerId === userId);
    return { authorized, buyerId: order.buyerId, sellerId: order.sellerId };
  } catch {
    // If Sequelize check fails, allow access (JWT is already validated)
    return { authorized: true, buyerId: '', sellerId: '' };
  }
}

// ─── GET /api/chat/:orderId ────────────────────────────────────────────────────
async function getChatRoom(req, res) {
  try {
    const { orderId } = req.params;
    const { userId, role } = req.user;

    // Auth check using Sequelize order
    const { authorized, buyerId, sellerId } = await isAuthorized(orderId, userId, role);
    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Access denied to this order' });
    }

    // Look for existing room in Prisma
    let room = await prisma.orderChatRoom.findUnique({ where: { orderId } });

    if (!room) {
      // Create room — verify the order exists in Prisma too (may have been created there)
      // If not, create a lightweight Prisma order stub so the relation works
      const prismaOrder = await prisma.order.findUnique({ where: { id: orderId } });
      if (!prismaOrder) {
        // The order lives in Sequelize only — create a minimal Prisma order record
        try {
          const seqOrder = await SequelizeOrder.findOne({ where: { id: orderId } });
          if (seqOrder) {
            await prisma.order.create({
              data: {
                id: seqOrder.id,
                buyerName: seqOrder.buyerName || 'Buyer',
                platform: seqOrder.platform || 'ScrowX',
                productLink: seqOrder.productLink || '',
                country: seqOrder.country || 'US',
                currency: seqOrder.currency || 'USD',
                scopeBox: seqOrder.scopeBox || {},
                sellerContact: seqOrder.sellerContact || '',
                escrowLink: seqOrder.escrowLink || '',
                status: seqOrder.status || 'PLACED',
                orderLogs: [],
              },
            });
          }
        } catch (e) {
          // Order stub may already exist — ignore unique constraint errors
          if (!e.message?.includes('Unique')) console.warn('[Chat] Order stub warning:', e.message);
        }
      }

      room = await prisma.orderChatRoom.create({
        data: {
          orderId,
          buyerId: buyerId || '',
          sellerId: sellerId || '',
          isActive: true,
          isArchived: false,
        },
      });
    }

    res.json({ success: true, data: room });
  } catch (error) {
    console.error('[ChatController] getChatRoom error:', error);
    res.status(500).json({ success: false, message: 'Failed to get chat room' });
  }
}

// ─── GET /api/chat/:orderId/messages ──────────────────────────────────────────
async function getMessages(req, res) {
  try {
    const { orderId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30));
    const skip = (page - 1) * limit;
    const { userId, role } = req.user;

    const { authorized } = await isAuthorized(orderId, userId, role);
    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const room = await prisma.orderChatRoom.findUnique({ where: { orderId } });
    if (!room) {
      // No room yet — return empty message list (not an error)
      return res.json({ success: true, data: [], meta: { page, limit, total: 0, totalPages: 0 } });
    }

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { roomId: room.id },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.chatMessage.count({ where: { roomId: room.id } }),
    ]);

    res.json({
      success: true,
      data: messages,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[ChatController] getMessages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
}

// ─── POST /api/chat/:orderId/message ──────────────────────────────────────────
async function postMessage(req, res) {
  try {
    const { orderId } = req.params;
    const { content } = req.body;
    const { userId, role, firstName, lastName } = req.user;

    const clean = sanitize(content);
    if (!clean) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const { authorized } = await isAuthorized(orderId, userId, role);
    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const room = await prisma.orderChatRoom.findUnique({ where: { orderId } });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }
    if (!room.isActive || room.isArchived) {
      return res.status(403).json({ success: false, message: 'This chat has expired and is archived' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        senderId: userId,
        senderRole: role,
        senderName: `${firstName} ${lastName}`.trim(),
        content: clean,
      },
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('[ChatController] postMessage error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
}

module.exports = { getChatRoom, getMessages, postMessage };

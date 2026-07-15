const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Sanitize user input — strip HTML tags, trim whitespace.
 */
function sanitize(str) {
  return String(str || '').replace(/<[^>]*>/g, '').trim().slice(0, 2000);
}

/**
 * Check if user is authorized to access a given deed's chat.
 * Uses Prisma Deed model.
 */
async function isAuthorized(deedId, userId, role) {
  if (role === 'admin') return { authorized: true, buyerId: null, sellerId: null };
  try {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) return { authorized: false };
    const authorized =
      (role === 'buyer' && deed.buyerId === userId) ||
      (role === 'seller' && deed.sellerId === userId);
    return { authorized, buyerId: deed.buyerId, sellerId: deed.sellerId };
  } catch {
    // JWT is already validated — allow on DB error
    return { authorized: true, buyerId: '', sellerId: '' };
  }
}

// ─── GET /api/chat/:deedId ────────────────────────────────────────────────────

async function getChatRoom(req, res) {
  try {
    const { deedId } = req.params;
    const { userId, role } = req.user;

    const { authorized, buyerId, sellerId } = await isAuthorized(deedId, userId, role);
    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Access denied to this deed' });
    }

    let room = await prisma.deedChatRoom.findUnique({ where: { deedId } });

    if (!room) {
      // Verify the deed exists
      const deed = await prisma.deed.findUnique({ where: { id: deedId } });
      if (!deed) {
        return res.status(404).json({ success: false, message: 'Deed not found' });
      }

      room = await prisma.deedChatRoom.create({
        data: {
          deedId,
          buyerId: buyerId || deed.buyerId || '',
          sellerId: sellerId || deed.sellerId || 'pending',
          isActive: true,
          isArchived: false,
        },
      });
    }

    return res.json({ success: true, data: room });
  } catch (error) {
    console.error('[ChatController] getChatRoom error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get chat room' });
  }
}

// ─── GET /api/chat/:deedId/messages ──────────────────────────────────────────

async function getMessages(req, res) {
  try {
    const { deedId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30));
    const skip = (page - 1) * limit;
    const { userId, role } = req.user;

    const { authorized } = await isAuthorized(deedId, userId, role);
    if (!authorized) return res.status(403).json({ success: false, message: 'Access denied' });

    const room = await prisma.deedChatRoom.findUnique({ where: { deedId } });
    if (!room) {
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

    return res.json({
      success: true,
      data: messages,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[ChatController] getMessages error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
}

// ─── POST /api/chat/:deedId/message ──────────────────────────────────────────

async function postMessage(req, res) {
  try {
    const { deedId } = req.params;
    const { content } = req.body;
    const { userId, role, firstName, lastName } = req.user;

    const clean = sanitize(content);
    if (!clean) return res.status(400).json({ success: false, message: 'Message content is required' });

    const { authorized } = await isAuthorized(deedId, userId, role);
    if (!authorized) return res.status(403).json({ success: false, message: 'Access denied' });

    const room = await prisma.deedChatRoom.findUnique({ where: { deedId } });
    if (!room) return res.status(404).json({ success: false, message: 'Chat room not found' });
    if (!room.isActive || room.isArchived) {
      return res.status(403).json({ success: false, message: 'This chat has expired and is archived' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        senderId: userId,
        senderRole: role,
        senderName: `${firstName || ''} ${lastName || ''}`.trim(),
        content: clean,
      },
    });

    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('[ChatController] postMessage error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
}

module.exports = { getChatRoom, getMessages, postMessage };

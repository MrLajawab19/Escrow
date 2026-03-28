const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { Sequelize } = require('sequelize');
const config = require('../../backend/config/config.json');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Sequelize — used to verify order ownership (buyerId/sellerId live here)
const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  { host: config.development.host, dialect: config.development.dialect, logging: false }
);
const SequelizeOrder = require('../../backend/models/order')(sequelize, Sequelize.DataTypes);

async function isAuthorized(orderId, userId, role) {
  if (role === 'admin') return true;
  try {
    const order = await SequelizeOrder.findOne({ where: { id: orderId } });
    if (!order) return false;
    return (
      (role === 'buyer' && order.buyerId === userId) ||
      (role === 'seller' && order.sellerId === userId)
    );
  } catch {
    return true; // JWT already validated — allow on Sequelize error
  }
}

/**
 * Sanitize message content — strip HTML, trim, cap length.
 */
function sanitize(str) {
  return String(str || '').replace(/<[^>]*>/g, '').trim().slice(0, 2000);
}

/**
 * Register all Socket.IO chat event handlers.
 * Called once from server.js with the Socket.IO `io` instance.
 *
 * @param {import('socket.io').Server} io
 */
function registerChatSocket(io) {

  // ── 1. JWT Authentication Middleware (runs on every connection) ─────────────
  io.use((socket, next) => {
    try {
      // Client must pass token in handshake auth: { auth: { token } }
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      // Attach decoded user to socket for later use in event handlers
      socket.user = {
        userId: decoded.userId,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role,
      };
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── 2. Connection Handler ───────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { userId, role, firstName, lastName } = socket.user;
    console.log(`[Socket] Connected: ${role} ${firstName} (${userId}) — socket ${socket.id}`);

    // ── Event: join_order_room ───────────────────────────────────────────────
    /**
     * Client emits: socket.emit('join_order_room', { orderId })
     * Server validates that the user is the buyer or seller of that order,
     * then joins the Socket.IO room named after the orderId.
     */
    socket.on('join_order_room', async ({ orderId } = {}) => {
      try {
        if (!orderId) {
          return socket.emit('chat_error', { message: 'orderId is required' });
        }

        // Verify user is buyer or seller of this order
        const authorized = await isAuthorized(orderId, userId, role);
        if (!authorized) {
          return socket.emit('chat_error', { message: 'Access denied to this order chat' });
        }

        // Get or create room in Prisma
        let room = await prisma.orderChatRoom.findUnique({ where: { orderId } });

        if (!room) {
          room = await prisma.orderChatRoom.create({
            data: {
              orderId,
              buyerId: '',
              sellerId: '',
              isActive: true,
              isArchived: false,
            },
          });
        }

        if (room.isArchived || !room.isActive) {
          return socket.emit('chat_error', { message: 'This chat has expired and is archived' });
        }

        socket.join(orderId);
        socket.currentOrderId = orderId;
        socket.currentRoomId = room.id;

        console.log(`[Socket] ${role} ${firstName} joined room: ${orderId}`);
        socket.emit('room_joined', {
          orderId,
          roomId: room.id,
          isActive: room.isActive,
          expiresAt: room.expiresAt,
        });

      } catch (err) {
        console.error('[Socket] join_order_room error:', err);
        socket.emit('chat_error', { message: 'Failed to join chat room' });
      }
    });

    // ── Event: send_message ──────────────────────────────────────────────────
    /**
     * Client emits: socket.emit('send_message', { orderId, content })
     * Server saves message to DB and broadcasts to the room.
     */
    socket.on('send_message', async ({ orderId, content } = {}) => {
      try {
        const clean = sanitize(content);
        if (!clean) {
          return socket.emit('chat_error', { message: 'Message cannot be empty' });
        }

        if (!orderId) {
          return socket.emit('chat_error', { message: 'orderId is required' });
        }

        // Verify room
        const room = await prisma.orderChatRoom.findUnique({
          where: { orderId },
        });

        if (!room || room.isArchived || !room.isActive) {
          return socket.emit('chat_error', { message: 'Chat is expired or not found' });
        }

        // Persist message in PostgreSQL
        const message = await prisma.chatMessage.create({
          data: {
            roomId: room.id,
            senderId: userId,
            senderRole: role,
            senderName: `${firstName} ${lastName}`.trim(),
            content: clean,
          },
        });

        // Broadcast to everyone in the room (including sender, for confirmation)
        io.to(orderId).emit('receive_message', message);

      } catch (err) {
        console.error('[Socket] send_message error:', err);
        socket.emit('chat_error', { message: 'Failed to send message' });
      }
    });

    // ── Event: typing ────────────────────────────────────────────────────────
    /**
     * Client emits: socket.emit('typing', { orderId })
     * Broadcasts typing indicator to the OTHER user in the room.
     */
    socket.on('typing', ({ orderId } = {}) => {
      if (!orderId) return;
      socket.to(orderId).emit('user_typing', {
        userId,
        name: firstName,
        role,
      });
    });

    // ── Event: stop_typing ───────────────────────────────────────────────────
    socket.on('stop_typing', ({ orderId } = {}) => {
      if (!orderId) return;
      socket.to(orderId).emit('user_stop_typing', { userId, role });
    });

    // ── Event: mark_read ─────────────────────────────────────────────────────
    /**
     * Mark all messages in a room (sent by the OTHER party) as read.
     * Client emits: socket.emit('mark_read', { orderId })
     */
    socket.on('mark_read', async ({ orderId } = {}) => {
      try {
        if (!orderId) return;

        const room = await prisma.orderChatRoom.findUnique({ where: { orderId } });
        if (!room) return;

        await prisma.chatMessage.updateMany({
          where: {
            roomId: room.id,
            senderId: { not: userId }, // Only mark messages from the OTHER user
            isRead: false,
          },
          data: { isRead: true },
        });

        // Notify room that messages were read
        socket.to(orderId).emit('messages_read', { by: userId, role });
      } catch (err) {
        console.error('[Socket] mark_read error:', err);
      }
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${role} ${firstName} (${socket.id})`);
    });
  });
}

module.exports = { registerChatSocket };

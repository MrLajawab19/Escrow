const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Archive chat rooms whose expiresAt has passed.
 * Sets isArchived = true, isActive = false.
 * Runs every hour via node-cron.
 */
async function archiveExpiredChats() {
  try {
    const now = new Date();

    const result = await prisma.orderChatRoom.updateMany({
      where: {
        isArchived: false,
        expiresAt: { lte: now },   // expiresAt is in the past
        expiresAt: { not: null },  // only rooms that have an expiry set
      },
      data: {
        isArchived: true,
        isActive: false,
      },
    });

    if (result.count > 0) {
      console.log(`[ChatExpiry] Archived ${result.count} expired chat room(s) at ${now.toISOString()}`);
    }
  } catch (err) {
    console.error('[ChatExpiry] Error archiving expired chats:', err);
  }
}

/**
 * Called from orderController/orderService when an order reaches SUBMITTED status.
 * Sets expiresAt = now + 48 hours on the linked chat room.
 *
 * @param {string} orderId
 */
async function scheduleRoomExpiry(orderId) {
  try {
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // +48h

    await prisma.orderChatRoom.updateMany({
      where: { orderId, isArchived: false },
      data: { expiresAt },
    });

    console.log(`[ChatExpiry] Set expiry for order ${orderId} chat room → ${expiresAt.toISOString()}`);
  } catch (err) {
    console.error(`[ChatExpiry] Failed to schedule expiry for order ${orderId}:`, err);
  }
}

/**
 * Start the cron job. Called once from server.js on startup.
 * Runs every hour at minute 0.
 */
function startChatExpiryCron() {
  // Run immediately on startup for any rooms that expired during downtime
  archiveExpiredChats();

  // Then schedule hourly
  cron.schedule('0 * * * *', () => {
    archiveExpiredChats();
  });

  console.log('[ChatExpiry] Cron job started — checking every hour');
}

module.exports = { startChatExpiryCron, scheduleRoomExpiry, archiveExpiredChats };

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getChatRoom, getMessages, postMessage } = require('../controllers/chatController');

// All chat routes require a valid JWT
router.use(authenticateToken);

// GET  /api/chat/:orderId           — fetch (or create) the chat room
router.get('/:orderId', getChatRoom);

// GET  /api/chat/:orderId/messages  — paginated message history
// Query: ?page=1&limit=30
router.get('/:orderId/messages', getMessages);

// POST /api/chat/:orderId/message   — HTTP fallback message send
// Body: { content: string }
router.post('/:orderId/message', postMessage);

module.exports = router;

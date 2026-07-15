const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getChatRoom, getMessages, postMessage } = require('../controllers/chatController');

// All chat routes require a valid JWT
router.use(authenticateToken);

// GET  /api/chat/:deedId           — fetch (or create) the chat room
router.get('/:deedId', getChatRoom);

// GET  /api/chat/:deedId/messages  — paginated message history
// Query: ?page=1&limit=30
router.get('/:deedId/messages', getMessages);

// POST /api/chat/:deedId/message   — HTTP fallback message send
// Body: { content: string }
router.post('/:deedId/message', postMessage);

module.exports = router;

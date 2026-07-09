const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

// ── File upload config ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip', 'application/x-zip-compressed',
    ];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'), false);
  },
});

// ── All order routes require authentication ───────────────────────────────────

// Orders are now exclusively created through Deeds (Deed -> Order bridge)
// router.post('/', authenticateToken, orderController.createOrder);

// Fund escrow (buyer)
router.post('/:id/fund-escrow', authenticateToken, orderController.fundEscrow);

// Seller actions
router.patch('/:id/accept', authenticateToken, orderController.acceptOrder);
router.patch('/:id/reject', authenticateToken, orderController.rejectOrder);
router.patch('/:id/start', authenticateToken, orderController.startWork);
router.patch('/:id/start-work', authenticateToken, orderController.startWorkFromAccepted);
router.patch('/:id/submit', authenticateToken, upload.array('deliveryFiles', 10), orderController.submitDelivery);
router.patch('/:id/request-changes', authenticateToken, orderController.requestChanges);
router.post('/:id/revision', authenticateToken, orderController.requestRevision); // distinct controller for buyers

// Buyer actions
router.patch('/:id/approve', authenticateToken, orderController.approveDelivery);
router.patch('/:id/accept-changes', authenticateToken, orderController.acceptChanges);
router.patch('/:id/reject-changes', authenticateToken, orderController.rejectChanges);
router.patch('/:id/release', authenticateToken, orderController.releaseFunds);
router.patch('/:id/cancel', authenticateToken, orderController.cancelOrder);

// Dispute (buyer or seller)
router.patch('/:id/dispute', authenticateToken, upload.array('evidence', 5), orderController.raiseDispute);

// Admin actions
router.patch('/:id/refund', authenticateToken, orderController.refundBuyer);

// ── Query routes (specific before parameterized) ───────────────────────────────
router.get('/buyer', authenticateToken, orderController.getBuyerOrders);
router.get('/seller', authenticateToken, orderController.getSellerOrders);
router.get('/user/:userId', authenticateToken, orderController.getOrdersByUser);
router.get('/:id', authenticateToken, orderController.getOrder);

module.exports = router;
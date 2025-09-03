const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRole, authenticateAdmin } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'application/pdf', 
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Order lifecycle routes
// Buyer-authenticated routes
router.post('/', authenticateToken, authorizeRole(['buyer']), orderController.createOrder);
router.post('/:id/fund-escrow', authenticateToken, authorizeRole(['buyer']), orderController.fundEscrow);
router.patch('/:id/approve', authenticateToken, authorizeRole(['buyer']), orderController.approveDelivery);
router.patch('/:id/release', authenticateToken, authorizeRole(['buyer']), orderController.releaseFunds);
router.patch('/:id/accept-changes', authenticateToken, authorizeRole(['buyer']), orderController.acceptChanges);
router.patch('/:id/reject-changes', authenticateToken, authorizeRole(['buyer']), orderController.rejectChanges);
router.patch('/:id/cancel', authenticateToken, authorizeRole(['buyer']), orderController.cancelOrder);
router.get('/buyer', authenticateToken, authorizeRole(['buyer']), orderController.getBuyerOrders);

// Seller-authenticated routes
router.patch('/:id/start', authenticateToken, authorizeRole(['seller']), orderController.startWork);
router.patch('/:id/submit', authenticateToken, authorizeRole(['seller']), orderController.submitDelivery);
router.patch('/:id/accept', authenticateToken, authorizeRole(['seller']), orderController.acceptOrder);
router.patch('/:id/reject', authenticateToken, authorizeRole(['seller']), orderController.rejectOrder);
router.patch('/:id/request-changes', authenticateToken, authorizeRole(['seller']), orderController.requestChanges);
router.get('/seller', authenticateToken, authorizeRole(['seller']), orderController.getSellerOrders);

// Disputes (either role)
router.patch('/:id/dispute', authenticateToken, upload.array('evidence', 5), orderController.raiseDispute);

// Remove duplicate unprotected routes

// Admin routes
router.patch('/:id/refund', authenticateAdmin, orderController.refundBuyer);

// Query routes - SPECIFIC ROUTES FIRST
router.get('/user/:userId', authenticateToken, orderController.getOrdersByUser);

// PARAMETERIZED ROUTES LAST
router.get('/:id', authenticateToken, orderController.getOrder);

// Release funds is a buyer action, route kept singular and secured above

module.exports = router; 
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const orderController = require('../controllers/orderController');

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
router.post('/', orderController.createOrder);
router.post('/:id/fund-escrow', orderController.fundEscrow);
router.patch('/:id/start', orderController.startWork);
router.patch('/:id/submit', orderController.submitDelivery);
router.patch('/:id/approve', orderController.approveDelivery);
router.patch('/:id/dispute', upload.array('evidence', 5), orderController.raiseDispute);

// Admin routes
router.patch('/:id/release', orderController.releaseFunds);
router.patch('/:id/refund', orderController.refundBuyer);

// Query routes
router.get('/buyer', orderController.getBuyerOrders);
router.get('/user/:userId', orderController.getOrdersByUser);
router.get('/:id', orderController.getOrder);

// Buyer actions
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router; 
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Order lifecycle routes
router.post('/', orderController.createOrder);
router.post('/:id/fund-escrow', orderController.fundEscrow);
router.patch('/:id/start', orderController.startWork);
router.patch('/:id/submit', orderController.submitDelivery);
router.patch('/:id/approve', orderController.approveDelivery);
router.patch('/:id/dispute', orderController.raiseDispute);

// Admin routes
router.patch('/:id/release', orderController.releaseFunds);
router.patch('/:id/refund', orderController.refundBuyer);

// Query routes
router.get('/:id', orderController.getOrder);
router.get('/user/:userId', orderController.getOrdersByUser);

module.exports = router; 
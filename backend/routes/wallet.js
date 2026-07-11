const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * Wallet Routes
 * All routes require authentication except noted
 */

// Razorpay Webhook (No auth required)
router.post('/razorpay-webhook', paymentController.handleRazorpayWebhook);

// Get or create wallet
router.post('/init', authenticateToken, walletController.getOrCreateWallet);

// Get wallet with balance
router.get('/', authenticateToken, walletController.getWallet);

// Get wallet summary
router.get('/summary', authenticateToken, walletController.getWalletSummary);

// Get transaction history
router.get('/transactions', authenticateToken, walletController.getTransactionHistory);

// Top up wallet
router.post('/top-up', authenticateToken, walletController.topUpWallet);

// Request withdrawal
router.post('/withdraw', authenticateToken, walletController.requestWithdrawal);

// Complete withdrawal (Admin only)
router.patch('/withdraw/:transactionId/complete', authenticateToken, walletController.completeWithdrawal);


// Refund buyer (Internal - called by order operations)
router.post('/refund', walletController.refundBuyer);

// Fail transaction (Admin only)
router.patch('/transaction/:transactionId/fail', authenticateToken, walletController.failTransaction);

// Get pending withdrawals (Admin only)
router.get('/admin/withdrawals', authenticateToken, walletController.getPendingWithdrawals);

module.exports = router;

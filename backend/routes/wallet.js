const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * Wallet Routes
 * All routes require authentication except noted
 */

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

// Lock escrow funds (Internal - called by order operations)
router.post('/escrow/lock', walletController.lockEscrowFunds);

// Release escrow funds (Internal - called by order operations)
router.post('/escrow/release', walletController.releaseEscrowFunds);

// Refund buyer (Internal - called by order operations)
router.post('/refund', walletController.refundBuyer);

// Fail transaction (Admin only)
router.patch('/transaction/:transactionId/fail', authenticateToken, walletController.failTransaction);

module.exports = router;

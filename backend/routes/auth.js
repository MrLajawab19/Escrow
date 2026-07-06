const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// ── Buyer routes ──────────────────────────────────────────────────────────────
router.post('/buyer/signup', authController.buyerSignup);
router.post('/buyer/login', authController.buyerLogin);

// ── Seller routes ─────────────────────────────────────────────────────────────
router.post('/seller/signup', authController.sellerSignup);
router.post('/seller/login', authController.sellerLogin);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.post('/admin/login', authController.adminLogin);

// ── Current user (token verify) ───────────────────────────────────────────────
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
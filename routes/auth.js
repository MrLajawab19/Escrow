const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Buyer authentication routes
router.post('/buyer/signup', authController.buyerSignup);
router.post('/buyer/login', authController.buyerLogin);
router.post('/buyer/logout', authController.buyerLogout);

// Seller authentication routes
router.post('/seller/signup', authController.sellerSignup);
router.post('/seller/login', authController.sellerLogin);
router.post('/seller/logout', authController.sellerLogout);

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Verify token route
router.get('/verify', authController.verifyToken);

module.exports = router; 
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Buyer routes
router.post('/buyer/signup', authController.buyerSignup);
router.post('/buyer/login', authController.buyerLogin);

// Seller routes
router.post('/seller/signup', authController.sellerSignup);
router.post('/seller/login', authController.sellerLogin);

// Admin routes (for testing)
router.post('/admin/login', (req, res) => {
  // Mock admin login for testing
  const { email, password } = req.body;
  
  if (email === 'admin@escrowx.com' && password === 'admin123') {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    const token = jwt.sign(
      {
        userId: 'admin-mock-id',
        email: 'admin@escrowx.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: 'admin-mock-id',
        email: 'admin@escrowx.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid admin credentials'
    });
  }
});

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Verify token route
router.get('/verify', authController.verifyToken);

module.exports = router; 
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Buyer routes
router.post('/buyer/signup', authController.buyerSignup);
router.post('/buyer/login', authController.buyerLogin);

// Seller routes
router.post('/seller/signup', authController.sellerSignup);
router.post('/seller/login', authController.sellerLogin);

// Admin routes (for testing only in non-production)
router.post('/admin/login', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Admin test login disabled in production' });
  }
  // Mock admin login for testing
  const { email, password } = req.body;
  
  if (email === 'admin@scrowx.com' && password === 'admin123') {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'Server misconfiguration: JWT_SECRET is not set' });
    }
    
    const adminToken = jwt.sign({
      userId: 'admin',
      email: 'admin@scrowx.com',
      role: 'admin'
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Admin login successful',
      token: adminToken,
      user: {
        id: 'admin',
        email: 'admin@scrowx.com',
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
const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { authenticateToken } = require('../middleware/auth');

router.post('/send-otp', authenticateToken, kycController.sendOTP);
router.post('/verify-otp', authenticateToken, kycController.verifyOTP);
router.get('/status', authenticateToken, kycController.getStatus);

module.exports = router;

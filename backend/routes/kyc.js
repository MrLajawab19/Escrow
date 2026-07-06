const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { authenticateToken } = require('../middleware/auth');

router.post('/send-otp', authenticateToken, kycController.sendOTP);
router.post('/verify-otp', authenticateToken, kycController.verifyOTP);
router.get('/status', authenticateToken, kycController.getStatus);

module.exports = router;

const upload = require('../middleware/upload');
router.post('/submit-id', authenticateToken, upload.array('documents', 2), kycController.submitID);


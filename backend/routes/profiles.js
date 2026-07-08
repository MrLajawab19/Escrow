const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

router.get('/seller/:id', authenticateToken, profileController.getSellerProfile);
router.get('/buyer/:id', authenticateToken, profileController.getBuyerProfile);

module.exports = router;

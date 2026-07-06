const express = require('express');
const router = express.Router();
const deedController = require('../controllers/deedController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, deedController.createDeed);
router.post('/:id/fund', authenticateToken, deedController.fundDeed);
router.post('/:id/accept-seller', authenticateToken, deedController.acceptDeed);
router.get('/buyer', authenticateToken, deedController.getBuyerDeeds);
router.get('/seller', authenticateToken, deedController.getSellerDeeds);

module.exports = router;

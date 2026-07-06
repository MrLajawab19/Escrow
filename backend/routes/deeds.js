const express = require('express');
const router = express.Router();
const deedController = require('../controllers/deedController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, deedController.createDeed);
router.post('/:id/fund', authenticateToken, deedController.fundDeed);
router.post('/:id/accept-seller', authenticateToken, deedController.acceptDeed);
router.get('/buyer', authenticateToken, deedController.getBuyerDeeds);
router.get('/seller', authenticateToken, deedController.getSellerDeeds);
router.get('/invite/:token', deedController.getDeedByInvite); // No auth needed to view invite (or we could enforce it, but typically invite is public until accepted)

module.exports = router;

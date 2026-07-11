const express = require('express');
const router = express.Router();
const deedController = require('../controllers/deedController');
const reviewController = require('../controllers/reviewController');
const milestoneController = require('../controllers/milestoneController');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const { requireKYC } = require('../middleware/kycGate');

router.post('/', authenticateToken, requireKYC, deedController.createDeed);
router.post('/:id/fund', authenticateToken, deedController.fundDeed);
router.post('/:id/verify-payment', authenticateToken, deedController.verifyPayment);
router.post('/:id/accept-seller', authenticateToken, deedController.acceptDeed);
router.get('/buyer', authenticateToken, deedController.getBuyerDeeds);
router.get('/seller', authenticateToken, deedController.getSellerDeeds);
router.get('/invite/:token', deedController.getDeedByInvite); // No auth needed to view invite (or we could enforce it, but typically invite is public until accepted)
router.get('/:id', authenticateToken, deedController.getDeedById);

router.post('/:id/review', authenticateToken, reviewController.createReview);

// Signing
router.post('/:id/sign-buyer', authenticateToken, deedController.signDeedBuyer);
router.post('/:id/sign-seller', authenticateToken, deedController.signDeedSeller);

// Money Moving Actions
router.post('/:id/release', authenticateToken, deedController.releasePayment);
router.post('/:id/cancel', authenticateToken, deedController.cancelDeed);
router.post('/:id/reject', authenticateToken, deedController.rejectDeed);
router.post('/:id/refund', authenticateAdmin, deedController.adminRefund);

// Milestones
router.patch('/:id/milestones/:mId/submit', authenticateToken, milestoneController.submitMilestone);
router.patch('/:id/milestones/:mId/approve', authenticateToken, milestoneController.approveMilestone);
router.patch('/:id/milestones/:mId/dispute', authenticateToken, milestoneController.disputeMilestone);


// Workflow routes
router.post('/:id/submit', authenticateToken, deedController.submitDelivery);
router.post('/:id/confirm', authenticateToken, deedController.confirmDelivery);
router.post('/:id/dispute', authenticateToken, deedController.raiseDispute);
router.post('/:id/request-changes', authenticateToken, deedController.requestChanges);
router.post('/:id/accept-changes', authenticateToken, deedController.acceptChanges);
router.post('/:id/reject-changes', authenticateToken, deedController.rejectChanges);

module.exports = router;

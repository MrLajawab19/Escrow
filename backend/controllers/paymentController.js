const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const paymentService = require('../services/paymentService');
const walletService = require('../services/walletService');
const deedService = require('../services/deedService');

const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = JSON.stringify(req.body);

    // 1. Verify Signature
    try {
      if (!paymentService.verifyWebhookSignature(payload, signature)) {
        console.error('Invalid Razorpay webhook signature');
        return res.status(400).send('Invalid signature');
      }
    } catch (err) {
      console.error(err.message);
      return res.status(500).send(err.message);
    }

    const eventId = req.headers['x-razorpay-event-id'];
    const eventName = req.body.event;

    // 2. Webhook Idempotency Core
    // We attempt to insert the event_id into the DB. If it fails with a UniqueConstraint violation,
    // we know it's a duplicate and we immediately return 200 OK.
    try {
      if (eventId) {
        await prisma.webhookEvent.create({
          data: { id: eventId, provider: 'RAZORPAY', status: 'PROCESSING' }
        });
      }
    } catch (error) {
      if (error.code === 'P2002') { // Unique constraint failed
        console.log(`Duplicate webhook event ignored: ${eventId}`);
        return res.status(200).send('OK'); // Acknowledge duplicate to prevent retries
      }
      throw error;
    }

    // 3. Process the payload
    if (eventName === 'payment.captured' || eventName === 'order.paid') {
      const paymentEntity = req.body.payload.payment.entity;
      const notes = paymentEntity.notes || {};
      const userId = notes.userId;
      const targetDeedId = notes.targetDeedId;
      const amountPaise = paymentEntity.amount; 
      
      if (userId) {
        // Step 1: Wallet Top-Up (CREDIT)
        // Ensure this is a separate transaction so that the money is secured first.
        const topUpTx = await walletService.topUpWallet(
          userId, 
          amountPaise, 
          'Razorpay', 
          paymentEntity.id
        );
        console.log(`Successfully credited ${amountPaise} paise to user ${userId}'s wallet.`);

        // Step 2: JIT Deed Funding
        if (targetDeedId) {
          try {
             // Fund the deed from the now-sufficient wallet balance
             await deedService.fundDeed(targetDeedId, userId);
             console.log(`JIT Funding Successful: Deed ${targetDeedId} locked.`);
          } catch (fundError) {
             // If fundDeed fails, we DO NOT throw back to the top-level catch block!
             // We catch it here so the webhook returns 200 OK, the CREDIT remains safely in the wallet,
             // and the user simply uses their new balance manually.
             console.error(`JIT Funding Failed for Deed ${targetDeedId}, but money is safe in wallet. Error:`, fundError.message);
          }
        }
      }
    } else if (eventName === 'payout.processed') {
      const payoutEntity = req.body.payload.payout.entity;
      const referenceId = payoutEntity.reference_id; // This is our WalletTransaction ID
      
      if (referenceId) {
        // Complete the pending withdrawal
        await walletService.completeWithdrawal(referenceId, 'admin'); // system action
        console.log(`Payout ${payoutEntity.id} processed successfully. Transaction ${referenceId} marked SUCCESS.`);
      }
    } else if (eventName === 'payout.reversed' || eventName === 'payout.failed') {
       const payoutEntity = req.body.payload.payout.entity;
       const referenceId = payoutEntity.reference_id;
       if (referenceId) {
          // Fail the transaction and refund the balance
          await walletService.failTransaction(referenceId, 'admin');
          console.log(`Payout ${payoutEntity.id} failed. Transaction ${referenceId} reverted.`);
       }
    }

    // Mark WebhookEvent as completed
    if (eventId) {
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: { status: 'COMPLETED' }
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Let Razorpay know we failed, so they retry later
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  handleRazorpayWebhook
};

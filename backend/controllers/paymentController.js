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
    if (eventId) {
      let eventRecord = await prisma.webhookEvent.findUnique({ where: { id: eventId } });
      if (eventRecord) {
        if (eventRecord.status === 'COMPLETED') {
           console.log(`Duplicate webhook event safely ignored: ${eventId}`);
           return res.status(200).send('OK');
        } else if (eventRecord.status === 'PROCESSING') {
           const age = Date.now() - eventRecord.updatedAt.getTime();
           if (age < 5 * 60 * 1000) {
              // Likely a concurrent race, tell Razorpay to back off and retry later
              return res.status(429).send('Processing in progress, try again later');
           }
           // Else, it's a stale crashed event. Let it re-process.
           await prisma.webhookEvent.update({
             where: { id: eventId },
             data: { updatedAt: new Date() }
           });
        } else if (eventRecord.status === 'FAILED') {
           // Allow retry
           await prisma.webhookEvent.update({
             where: { id: eventId },
             data: { status: 'PROCESSING', updatedAt: new Date() }
           });
        }
      } else {
        try {
          await prisma.webhookEvent.create({
            data: { id: eventId, provider: 'RAZORPAY', status: 'PROCESSING' }
          });
        } catch (error) {
          if (error.code === 'P2002') {
             // Concurrent request beat us to the insert
             return res.status(429).send('Concurrent request processing');
          }
          throw error;
        }
      }
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
             console.error(`JIT Funding Failed for Deed ${targetDeedId}, but money is safe in wallet. Error:`, fundError.message);
             // Notify the buyer so they aren't left in the dark
             const notificationService = require('../services/notificationService');
             await notificationService.createNotification({
                userId,
                userRole: 'buyer',
                type: 'WALLET_UPDATE',
                title: 'Wallet Topped Up, but Deed Funding Failed',
                message: `Your wallet was successfully topped up with ₹${amountPaise / 100}, but we couldn't automatically fund your deed. You can fund it manually from your dashboard. Reason: ${fundError.message}`,
                link: '/buyer-dashboard'
             }).catch(err => console.error('Failed to send notification:', err.message));
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
    if (req.headers['x-razorpay-event-id']) {
       await prisma.webhookEvent.updateMany({
         where: { id: req.headers['x-razorpay-event-id'], status: 'PROCESSING' },
         data: { status: 'FAILED' }
       }).catch(e => console.error("Failed to update webhook status to FAILED", e));
    }
    // Let Razorpay know we failed, so they retry later
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  handleRazorpayWebhook
};

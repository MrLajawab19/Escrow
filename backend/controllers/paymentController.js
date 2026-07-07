const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not set in environment variables');
      return res.status(500).send('Webhook secret not configured');
    }

    const signature = req.headers['x-razorpay-signature'];
    const payload = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid signature');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = req.body.payload.payment.entity;
      const orderId = paymentEntity.notes?.orderId; 
      const type = paymentEntity.notes?.type;
      const buyerId = paymentEntity.notes?.buyerId;
      
      if (orderId) {
        if (type === 'deed') {
          // It's a deed
          const deed = await prisma.deed.findUnique({ where: { id: orderId } });
          if (deed && deed.status === 'DRAFT') {
            const deedService = require('../services/deedService');
            await deedService.fundDeed(orderId, buyerId);
            console.log(`Deed ${orderId} successfully funded via Razorpay Webhook`);
          }
        } else {
          // It's a regular order
          const order = await prisma.order.findUnique({ where: { id: orderId } });
          if (order && order.status === 'PLACED') {
            // Fund Escrow
            const logEntry = {
              event: 'ESCROW_FUNDED_VIA_RAZORPAY',
              timestamp: new Date().toISOString(),
              razorpayPaymentId: paymentEntity.id,
              amount: paymentEntity.amount / 100 // convert back to INR from paise
            };
            
            const currentLogs = Array.isArray(order.orderLogs) ? order.orderLogs : [];
            
            await prisma.order.update({
              where: { id: orderId },
              data: {
                status: 'ESCROW_FUNDED',
                orderLogs: [...currentLogs, logEntry]
              }
            });
            
            console.log(`Order ${orderId} successfully funded via Razorpay Webhook`);
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  handleRazorpayWebhook
};

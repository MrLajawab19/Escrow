const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const http = require('http');

const prisma = new PrismaClient();
const PORT = 3000;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'scrowx_razorpay_webhook_secret_2026';

function generateSignature(payload) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
}

function sendWebhookRequest(payloadObj, signature, eventId) {
  return new Promise((resolve, reject) => {
    const payloadStr = JSON.stringify(payloadObj);
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/wallet/razorpay-webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': eventId
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(payloadStr);
    req.end();
  });
}

async function runTest() {
  try {
    let buyer = await prisma.buyer.findFirst();
    let wallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: buyer.id, userRole: 'buyer', balance: 0 } });
    }
    console.log('BEFORE BALANCE:', wallet.balance);

    // Simulate webhook
    const eventId = 'evt_plain_' + Date.now();
    const payload = {
      entity: 'event',
      account_id: 'acc_test',
      event: 'order.paid',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: 'pay_plain_' + Date.now(),
            amount: 50000, // 500 rupees
            currency: 'INR',
            status: 'authorized',
            notes: {
              userId: buyer.id,
              type: 'wallet_topup'
            }
          }
        }
      }
    };

    const sig = generateSignature(JSON.stringify(payload));
    const res = await sendWebhookRequest(payload, sig, eventId);
    console.log('Webhook Fired. Status:', res.status);

    await new Promise(r => setTimeout(r, 2000));

    let updatedWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
    console.log('AFTER BALANCE:', updatedWallet.balance);
    console.log('DIFFERENCE:', updatedWallet.balance - wallet.balance);

  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();

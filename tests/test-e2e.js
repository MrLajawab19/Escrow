// TEST: End-to-End Escrow Lifecycle
// Run via: `node tests/test-e2e.js`
// Simulates the full happy-path of an escrow order: creation -> funding -> seller joining -> submission -> confirmation -> fund release.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const deedService = require('../backend/services/deedService');

const crypto = require('crypto');
const http = require('http');

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

async function runE2E() {
  try {
    console.log("--- STARTING E2E TEST: ORIGINAL SIMPLE PATH ---");
    
    // 1. Setup mock users
    let buyer = await prisma.buyer.findFirst();
    let seller = await prisma.seller.findFirst();
    if (!buyer || !seller) throw new Error("Need a buyer and seller in DB");

    // Give buyer money
    let buyerWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
    if (!buyerWallet) {
      buyerWallet = await prisma.wallet.create({ data: { userId: buyer.id, userRole: 'buyer', balance: 100000 }});
    } else {
      await prisma.wallet.update({ where: { id: buyerWallet.id }, data: { balance: 100000 } });
    }

    // 2. Create Deed
    console.log("1. Buyer creates Deed...");
    const deed = await deedService.createDeed(buyer.id, {
      title: "Test Original Simple Path",
      description: "Testing original path without revisions",
      amount: 10000,
      currency: "USD",
      deadline: new Date(Date.now() + 86400000).toISOString(),
      transactionType: "SERVICE",
      sellerEmail: seller.email,
      acceptanceCriteria: "Look good"
    });
    console.log(`   Deed created. Status: ${deed.status}`);

    // 3. Fund Deed via Webhook
    console.log("2. Buyer funds Deed via Razorpay Webhook...");
    const eventId = `evt_e2e_${Date.now()}`;
    const payload = {
      entity: "event",
      account_id: "acc_test",
      event: "order.paid",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: `pay_e2e_${Date.now()}`,
            amount: 10000, 
            currency: "INR",
            status: "authorized",
            notes: {
              userId: buyer.id,
              type: "jit_topup",
              targetDeedId: deed.id
            }
          }
        }
      }
    };

    const sig = generateSignature(JSON.stringify(payload));
    const res = await sendWebhookRequest(payload, sig, eventId);
    console.log(`   Webhook fired. Status: ${res.status}`);
    
    // Wait for webhook async processing
    await new Promise(r => setTimeout(r, 2000));
    
    let currentDeed = await prisma.deed.findUnique({ where: { id: deed.id } });
    console.log(`   Deed funded via JIT. Status: ${currentDeed.status}`);

    // 4. Seller Joins
    console.log("3. Seller joins...");
    await deedService.sellerJoin(currentDeed.inviteToken, seller.id);
    currentDeed = await prisma.deed.findUnique({ where: { id: deed.id } });
    console.log(`   Seller joined. Deed Status: ${currentDeed.status}`);
    
    // 5. Seller Submits Delivery (New Route)
    console.log("4. Seller Submits Delivery...");
    await deedService.submitDelivery(deed.id, seller.id, { description: "Here is the work" });
    currentDeed = await prisma.deed.findUnique({ where: { id: deed.id } });
    console.log(`   Delivery submitted. Deed Status: ${currentDeed.status}`);

    // 6. Buyer Approves & Releases
    console.log("5. Buyer Approves and Releases Funds...");
    await deedService.confirmDelivery(deed.id, buyer.id);
    currentDeed = await prisma.deed.findUnique({ where: { id: deed.id } });
    console.log(`   Delivery confirmed. Deed Status: ${currentDeed.status}`);
    
    await deedService.releasePayment(deed.id, 'buyer');
    currentDeed = await prisma.deed.findUnique({ where: { id: deed.id } });
    console.log(`   Funds released. Deed Status: ${currentDeed.status}`);

  } catch (error) {
    console.error("ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runE2E();

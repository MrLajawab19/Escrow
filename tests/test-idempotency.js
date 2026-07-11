const crypto = require('crypto');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
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

async function runTests() {
  console.log("Setting up test data...");
  let buyer = await prisma.buyer.findFirst();
  let seller = await prisma.seller.findFirst();
  
  if (!buyer || !seller) {
     console.log("Seeding test users...");
     buyer = await prisma.buyer.create({ data: { firstName: 'B1', lastName: 'L1', email: 'buyer1@test.com', password: 'hash' } });
     seller = await prisma.seller.create({ data: { firstName: 'S1', lastName: 'L2', email: 'seller1@test.com', password: 'hash', phone: '123' } });
     await prisma.wallet.create({ data: { userId: buyer.id, userRole: 'buyer', balance: 0, lockedBalance: 0, currency: 'INR' } });
     await prisma.wallet.create({ data: { userId: seller.id, userRole: 'seller', balance: 0, lockedBalance: 0, currency: 'INR' } });
  }

  // Create a fresh deed for testing
  const deedService = require('../backend/services/deedService');
  const deed = await deedService.createDeed(buyer.id, {
      title: "Idempotency Test Deed",
      description: "Testing webhook idempotency",
      amount: 500000, // 5000 INR
      currency: "INR",
      deadline: new Date(Date.now() + 86400000).toISOString(),
      transactionType: "SERVICE",
      sellerEmail: seller.email,
      acceptanceCriteria: "Test"
  });

  console.log(`Deed created: ${deed.id} [Status: ${deed.status}]`);
  
  const initialWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  console.log(`Initial Wallet Balance: ${initialWallet ? initialWallet.balance : 0}`);

  // Test 1: Wrong Signature
  console.log("\n--- TEST 1: Wrong Signature ---");
  const wrongSigPayload = { event: 'payment.captured' };
  const res1 = await sendWebhookRequest(wrongSigPayload, 'invalid_signature', 'evt_bad_sig');
  console.log(`Response Status: ${res1.status}`);
  console.log(`Response Body: ${res1.data}`);
  if (res1.status !== 400) console.error("TEST 1 FAILED! Expected 400.");
  else console.log("TEST 1 PASSED!");

  // Test 2: Concurrent Identical Webhooks (Same Event ID)
  console.log("\n--- TEST 2: Concurrent Identical Webhooks (Idempotency) ---");
  const eventIdConcurrent = `evt_${Date.now()}`;
  const payload2 = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: `pay_${Date.now()}`,
          amount: 500000,
          notes: { userId: buyer.id, targetDeedId: deed.id, type: 'jit_topup' }
        }
      }
    }
  };
  const sig2 = generateSignature(JSON.stringify(payload2));
  
  console.log("Firing two identical webhooks simultaneously...");
  const [resA, resB] = await Promise.all([
     sendWebhookRequest(payload2, sig2, eventIdConcurrent),
     sendWebhookRequest(payload2, sig2, eventIdConcurrent)
  ]);
  
  console.log(`Request A Status: ${resA.status} | Body: ${resA.data}`);
  console.log(`Request B Status: ${resB.status} | Body: ${resB.data}`);
  
  const midWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  const midDeed = await prisma.deed.findUnique({ where: { id: deed.id } });
  const events = await prisma.webhookEvent.findMany({ where: { id: eventIdConcurrent } });
  
  console.log(`DB WebhookEvent entries for ${eventIdConcurrent}: ${events.length} (Expected: 1)`);
  console.log(`Deed Status: ${midDeed.status} (Expected: PENDING_SELLER)`);
  if (events.length === 1 && midDeed.status === 'PENDING_SELLER') console.log("TEST 2 PASSED!");
  else console.error("TEST 2 FAILED!");

  // Test 3: Duplicate Payments (Different Event IDs, Same targetDeedId)
  console.log("\n--- TEST 3: Duplicate Payments (JIT Failure Safety) ---");
  console.log("Simulating the user accidentally paying twice for the exact same deed.");
  const eventIdDup = `evt_dup_${Date.now()}`;
  const payload3 = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: `pay_dup_${Date.now()}`,
          amount: 500000,
          notes: { userId: buyer.id, targetDeedId: deed.id, type: 'jit_topup' }
        }
      }
    }
  };
  const sig3 = generateSignature(JSON.stringify(payload3));
  
  console.log("Firing second webhook with a DIFFERENT event ID...");
  const res3 = await sendWebhookRequest(payload3, sig3, eventIdDup);
  console.log(`Request Status: ${res3.status} | Body: ${res3.data}`);
  
  const finalWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  const finalDeed = await prisma.deed.findUnique({ where: { id: deed.id } });
  const notification = await prisma.notification.findFirst({
     where: { userId: buyer.id, type: 'WALLET_UPDATE' },
     orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Final Deed Status: ${finalDeed.status} (Still PENDING_SELLER)`);
  console.log(`Final Wallet Balance: ${finalWallet.balance} (Expected: Increased by 500000)`);
  if (notification) {
     console.log(`Notification sent to buyer: "${notification.title}" - ${notification.message}`);
  }
  
  if (finalDeed.status === 'PENDING_SELLER' && finalWallet.balance > midWallet.balance && notification) {
     console.log("TEST 3 PASSED! Second payment safely kept in wallet and buyer notified.");
  } else {
     console.error("TEST 3 FAILED!");
  }

  // Test 4: Stuck-PROCESSING Bug Scenario
  console.log("\n--- TEST 4: Stuck-PROCESSING Crash Recovery ---");
  console.log("Simulating a webhook that previously crashed and left the DB in PROCESSING state.");
  const eventIdStuck = `evt_stuck_${Date.now()}`;
  
  // Directly insert a STUCK processing event
  await prisma.webhookEvent.create({
    data: {
      id: eventIdStuck,
      provider: 'RAZORPAY',
      status: 'PROCESSING'
    }
  });

  // Backdate the updatedAt to year 2000 to avoid timezone issues
  await prisma.$executeRaw`UPDATE "WebhookEvent" SET "updatedAt" = '2000-01-01 00:00:00Z' WHERE "id" = ${eventIdStuck}`;

  const payload4 = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: `pay_stuck_${Date.now()}`,
          amount: 500000,
          notes: { userId: buyer.id, targetDeedId: deed.id, type: 'jit_topup' }
        }
      }
    }
  };
  const sig4 = generateSignature(JSON.stringify(payload4));
  
  console.log("Firing webhook retry for the stuck event ID...");
  const res4 = await sendWebhookRequest(payload4, sig4, eventIdStuck);
  console.log(`Request Status: ${res4.status} | Body: ${res4.data}`);
  
  const recoveredEvent = await prisma.webhookEvent.findUnique({ where: { id: eventIdStuck } });
  console.log(`Event Status after retry: ${recoveredEvent.status} (Expected: COMPLETED)`);
  
  if (res4.status === 200 && recoveredEvent.status === 'COMPLETED') {
     console.log("TEST 4 PASSED! Webhook properly recovered a stale crashed event instead of ignoring it.");
  } else {
     console.error("TEST 4 FAILED!");
  }

  process.exit(0);
}

runTests().catch(e => { console.error(e); process.exit(1); });

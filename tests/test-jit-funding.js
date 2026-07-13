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
  console.log("Setting up JIT Test...");
  let buyer = await prisma.buyer.findFirst();
  let seller = await prisma.seller.findFirst();

  // Reset wallet state for isolated test
  await prisma.wallet.update({
    where: { userId: buyer.id },
    data: { balance: 0, lockedBalance: 0 }
  });

  let buyerWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });

  console.log(`Initial Wallet Balance (paise): ₹${buyerWallet.balance}`);

  // Create a DRAFT deed using PAISE (150000 = ₹1500)
  const deed = await prisma.deed.create({
    data: {
      buyerId: buyer.id,
      sellerId: seller.id,
      title: "JIT Funding Test Deed",
      description: "Testing webhook auto-funding",
      acceptanceCriteria: "Funds should be safely secured via webhook",
      amount: 150000, 
      currency: "INR",
      status: "DRAFT",
      inviteToken: crypto.randomBytes(16).toString("hex")
    }
  });

  console.log(`Created DRAFT Deed ID: ${deed.id}`);
  console.log(`Deed Amount: ₹${deed.amount}`);

  const eventId = `evt_jit_${Date.now()}`;
  const payload = {
    entity: "event",
    account_id: "acc_test",
    event: "order.paid", // Accurate Razorpay successful payment event
    contains: ["payment"],
    payload: {
      payment: {
        entity: {
          id: `pay_jit_${Date.now()}`,
          amount: 150000, // Matching ₹1500 * 100 in paise
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
  
  console.log("Sending JIT webhook...");
  const res = await sendWebhookRequest(payload, sig, eventId);
  console.log("Webhook Response:", res.status, res.data);

  // Allow webhook to process asynchronously
  await new Promise(r => setTimeout(r, 2000));

  const updatedWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  const updatedDeed = await prisma.deed.findUnique({ where: { id: deed.id } });

  console.log(`Final Wallet Balance (paise): ₹${updatedWallet.balance}`);
  console.log(`Final Wallet Locked Balance (paise): ₹${updatedWallet.lockedBalance}`);
  console.log(`Final Deed Status: ${updatedDeed.status}`);

  if (updatedDeed.status === "ESCROW_FUNDED" || updatedDeed.status === "PENDING_SELLER") {
    console.log("✅ JIT Funding successful! Deed is funded.");
  } else {
    console.log("❌ JIT Funding failed! Deed status is not ESCROW_FUNDED.");
  }
}

runTests().catch(console.error).finally(() => prisma.$disconnect());

/**
 * Test 3: Concurrent verify-payment + webhook — proves no double-credit.
 *
 * Strategy: Create a fresh DRAFT deed, manually top up the wallet so there's
 * enough balance, then fire both the direct topUpWallet call AND a simulated
 * webhook call for the same razorpayOrderId simultaneously via Promise.all.
 * Verify the wallet balance only increased by `amount` once, not twice.
 *
 * Run with: node backend/scripts/test_concurrent_idempotency.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const http = require('http');
const walletService = require('../services/walletService');
const deedService = require('../services/deedService');


// ── Config ─────────────────────────────────────────────────────────────────
const TEST_AMOUNT_PAISE = 5000; // ₹50 in paise
const SIMULATED_ORDER_ID = `order_conctest_${Date.now()}`;
const SIMULATED_PAYMENT_ID = `pay_conctest_${Date.now()}`;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'scrowx_razorpay_webhook_secret_2026';
const SERVER_PORT = 3000;

function generateWebhookSignature(payload) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
}

function sendWebhook(payloadObj, eventId) {
  return new Promise((resolve, reject) => {
    const payloadStr = JSON.stringify(payloadObj);
    const sig = generateWebhookSignature(payloadStr);
    const options = {
      hostname: 'localhost', port: SERVER_PORT,
      path: '/api/wallet/razorpay-webhook', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadStr),
        'x-razorpay-signature': sig,
        'x-razorpay-event-id': eventId
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(payloadStr);
    req.end();
  });
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Test 3: Concurrent verify-payment + webhook idempotency');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ── Setup ──────────────────────────────────────────────────────────────────
  const buyer = await prisma.buyer.findFirst();
  if (!buyer) throw new Error('No buyer found in DB. Run seed script first.');

  // Ensure wallet exists with enough balance
  let wallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: buyer.id, userRole: 'buyer', currency: 'INR', balance: 0 } });
  }
  
  // Seed a known starting balance so we can verify exactly
  await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: 1000000 } }); // ₹10,000
  
  const balanceBefore = (await prisma.wallet.findUnique({ where: { id: wallet.id } })).balance;
  console.log(`[Setup] Wallet balance before test: ₹${balanceBefore / 100}`);

  // Create a fresh DRAFT deed
  const deed = await prisma.deed.create({
    data: {
      buyerId: buyer.id, title: 'Concurrent Idempotency Test Deed',
      description: 'Used for Test 3 concurrent verification', acceptanceCriteria: 'Test passes',
      amount: TEST_AMOUNT_PAISE, currency: 'INR', status: 'DRAFT',
      inviteToken: crypto.randomBytes(16).toString('hex'),
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
  
  // Create the INITIATED placeholder (simulating the top-up order endpoint)
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id, type: 'CREDIT', category: 'TOP_UP',
      amount: TEST_AMOUNT_PAISE, currency: 'INR', status: 'INITIATED',
      description: `Top-up for Deed ${deed.id}`, reference: deed.id,
      razorpayOrderId: SIMULATED_ORDER_ID, fee: 0, netAmount: TEST_AMOUNT_PAISE
    }
  });
  console.log(`[Setup] Created DRAFT deed: ${deed.id}`);
  console.log(`[Setup] Created INITIATED placeholder for order: ${SIMULATED_ORDER_ID}`);

  // ── Concurrent Execution ───────────────────────────────────────────────────
  console.log('\n[Test] Firing topUpWallet + webhook simultaneously via Promise.all...\n');

  const webhookPayload = {
    entity: 'event', account_id: 'acc_test', event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: SIMULATED_PAYMENT_ID,
          amount: TEST_AMOUNT_PAISE,
          currency: 'INR',
          status: 'captured',
          order_id: SIMULATED_ORDER_ID,
          notes: { userId: buyer.id, type: 'jit_topup', targetDeedId: deed.id }
        }
      }
    }
  };
  const webhookEventId = `evt_conctest_${Date.now()}`;

  const [directResult, webhookResult] = await Promise.allSettled([
    // Call 1: Direct topUpWallet (simulates verify-payment path)
    walletService.topUpWallet(buyer.id, TEST_AMOUNT_PAISE, 'Razorpay', deed.id, SIMULATED_ORDER_ID)
      .then(r => { console.log('[Direct] topUpWallet settled → tx status:', r.status); return r; }),

    // Call 2: Webhook (simulates Razorpay webhook arriving at same time)
    // Small delay to ensure the direct call has started but not completed
    new Promise(resolve => setTimeout(resolve, 50)).then(() =>
      sendWebhook(webhookPayload, webhookEventId)
        .then(r => { console.log('[Webhook] HTTP response:', r.status, r.body.substring(0, 100)); return r; })
    )
  ]);

  // Allow any async DB writes to finish
  await new Promise(r => setTimeout(r, 1500));

  // ── Verification ───────────────────────────────────────────────────────────
  console.log('\n─── Results ───────────────────────────────────────────────');

  const walletAfter = await prisma.wallet.findUnique({ where: { id: wallet.id } });
  const topUpTxs = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id, category: 'TOP_UP', reference: deed.id },
    orderBy: { createdAt: 'asc' }
  });
  const deedAfter = await prisma.deed.findUnique({ where: { id: deed.id } });

  console.log(`\nBalance before: ₹${balanceBefore / 100}`);
  console.log(`Balance after:  ₹${walletAfter.balance / 100}`);
  const balanceDiff = walletAfter.balance - balanceBefore;
  console.log(`Balance diff:   ₹${balanceDiff / 100} (expected: ₹${TEST_AMOUNT_PAISE / 100})`);

  console.log(`\nTOP_UP transactions for this deed (${topUpTxs.length} total):`);
  topUpTxs.forEach((tx, i) => {
    console.log(`  [${i + 1}] status=${tx.status}, amount=${tx.amount}, razorpayOrderId=${tx.razorpayOrderId}`);
  });

  console.log(`\nDeed status: ${deedAfter.status}`);

  // ── Pass/Fail ──────────────────────────────────────────────────────────────
  console.log('\n─── Assertions ────────────────────────────────────────────');

  const successTxCount = topUpTxs.filter(t => t.status === 'SUCCESS').length;
  const expectedBalanceDiff = TEST_AMOUNT_PAISE; // Should only go up once

  const assertions = [
    {
      name: 'Balance incremented exactly once (no double-credit)',
      pass: balanceDiff === expectedBalanceDiff,
      detail: `diff=${balanceDiff}, expected=${expectedBalanceDiff}`
    },
    {
      name: 'Exactly one SUCCESS TOP_UP transaction (not two)',
      pass: successTxCount === 1,
      detail: `found ${successTxCount} SUCCESS tx(s)`
    },
    {
      name: 'Deed advanced from DRAFT (fundDeed ran exactly once)',
      pass: deedAfter.status === 'PENDING_SELLER',
      detail: `deed.status=${deedAfter.status}`
    }
  ];

  let allPassed = true;
  assertions.forEach(a => {
    const icon = a.pass ? '✅' : '❌';
    console.log(`  ${icon} ${a.name}: ${a.detail}`);
    if (!a.pass) allPassed = false;
  });

  console.log(`\n${allPassed ? '✅ ALL ASSERTIONS PASSED — idempotency confirmed' : '❌ SOME ASSERTIONS FAILED — double-credit may have occurred'}`);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  await prisma.walletTransaction.deleteMany({ where: { walletId: wallet.id, reference: deed.id } });
  await prisma.auditLedger.deleteMany({ where: { deedId: deed.id } });
  await prisma.deedChatRoom.deleteMany({ where: { deedId: deed.id } });
  await prisma.deed.delete({ where: { id: deed.id } });
  await prisma.webhookEvent.deleteMany({ where: { id: webhookEventId } });
  // Reset wallet balance to avoid affecting other tests
  await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: 500000 } });
  console.log('\n[Cleanup] Test deed, transactions, and ledger entries removed.');


  return allPassed;
}

main()
  .then(passed => {
    prisma.$disconnect();
    process.exit(passed ? 0 : 1);
  })
  .catch(e => {
    console.error('\n[FATAL]', e);
    prisma.$disconnect();
    process.exit(1);
  });

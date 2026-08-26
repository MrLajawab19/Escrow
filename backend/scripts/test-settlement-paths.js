'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { resolveDispute, getFullDisputeDetail } = require('../controllers/disputeController');

async function createSyntheticDispute(testName, aiRecommendation) {
  // Create buyer and seller
  const buyerEmail = `buyer_${Date.now()}@scrowx.test`;
  const sellerEmail = `seller_${Date.now()}@scrowx.test`;
  
  const buyer = await prisma.buyer.create({
    data: { email: buyerEmail, password: 'pw', firstName: 'Test', lastName: 'Buyer' }
  });
  const seller = await prisma.seller.create({
    data: { email: sellerEmail, password: 'pw', firstName: 'Test', lastName: 'Seller' }
  });
  
  // Create wallets
  await prisma.wallet.create({ data: { userId: buyer.id, userRole: 'buyer', balance: 500000, lockedBalance: 10000 } });
  await prisma.wallet.create({ data: { userId: seller.id, userRole: 'seller', balance: 0, lockedBalance: 0 } });
  
  // Create deed
  const deed = await prisma.deed.create({
    data: {
      title: `Test Deed - ${testName}`,
      description: '[SYNTHETIC_TEST] ' + testName,
      acceptanceCriteria: 'None',
      buyerId: buyer.id,
      sellerId: seller.id,
      amount: 10000,
      currency: 'INR',
      status: 'DISPUTED'
    }
  });
  
  // Create dispute
  const dispute = await prisma.deedDispute.create({
    data: {
      deedId: deed.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      raisedBy: 'buyer',
      reason: 'QUALITY_ISSUE',
      description: '[SYNTHETIC_TEST] ' + testName,
      status: 'CHALLENGE_PHASE'
    }
  });

  if (aiRecommendation !== undefined) {
    // Create AI_REPORT event
    // Backdate by 49 hours to trigger the 48h timeout
    const pastDate = new Date(Date.now() - 49 * 60 * 60 * 1000);
    await prisma.disputeEvent.create({
      data: {
        deedDisputeId: dispute.id,
        type: 'AI_REPORT',
        actorRole: 'ai',
        createdAt: pastDate,
        payload: { recommendation: aiRecommendation, reasoning: "Synthetic test reasoning" }
      }
    });
  }
  
  return { deed, dispute, buyerId: buyer.id, sellerId: seller.id };
}

async function runTests() {
  console.log("Starting Settlement Tests...");

  // ── TEST 1: Admin Path Regression ──────────────────────────────────────────
  console.log("\n--- TEST 1: Admin path regression test ---");
  const t1 = await createSyntheticDispute("Admin Regression", "MANUAL_REVIEW_REQUIRED");
  await prisma.deedDispute.update({ where: { id: t1.dispute.id }, data: { status: 'ESCALATED' } }); // Admin requires ESCALATED
  
  let resJson1 = null;
  await resolveDispute(
    { params: { id: t1.dispute.id }, body: { action: 'REFUND_BUYER', buyerPct: 100, notes: 'Admin resolving test' }, user: { id: 'admin123', role: 'admin' } },
    { json: (data) => { resJson1 = data; return data; }, status: () => ({ json: (data) => { resJson1 = data; return data; } }) }
  );
  
  const w1B = await prisma.wallet.findUnique({ where: { userId: t1.buyerId } });
  const e1 = await prisma.disputeEvent.findMany({ where: { deedDisputeId: t1.dispute.id, type: 'SETTLEMENT' } });
  console.log("Admin API Success:", resJson1?.success);
  console.log("Buyer Wallet Locked Balance (Expected 0):", w1B.lockedBalance);
  console.log("Settlement Event created:", e1.length === 1);
  console.log("Deed status:", (await prisma.deed.findUnique({ where: { id: t1.deed.id } })).status);

  // ── TEST 2: Auto-Settlement Happy Path ─────────────────────────────────────
  console.log("\n--- TEST 2: Auto-settlement happy path (REFUND_BUYER) ---");
  const t2 = await createSyntheticDispute("Auto Happy Path", "REFUND_BUYER");
  
  let resJson2 = null;
  await getFullDisputeDetail(
    { params: { id: t2.dispute.id } },
    { json: (data) => { resJson2 = data; return data; }, status: () => ({ json: (data) => { resJson2 = data; return data; } }) }
  );
  
  const w2B = await prisma.wallet.findUnique({ where: { userId: t2.buyerId } });
  const e2 = await prisma.disputeEvent.findMany({ where: { deedDisputeId: t2.dispute.id, type: 'SETTLEMENT' } });
  const d2 = await prisma.deedDispute.findUnique({ where: { id: t2.dispute.id } });
  console.log("Buyer Wallet Locked Balance (Expected 0):", w2B.lockedBalance);
  console.log("Settlement Event created:", e2.length === 1);
  if (e2.length === 1) {
    const p = typeof e2[0].payload === 'string' ? JSON.parse(e2[0].payload) : e2[0].payload;
    console.log("fundsDisbursed flag:", p.fundsDisbursed);
  }
  console.log("Dispute status:", d2.status);
  console.log("Deed status:", (await prisma.deed.findUnique({ where: { id: t2.deed.id } })).status);

  // ── TEST 3: Auto-Settlement Guard Path ─────────────────────────────────────
  console.log("\n--- TEST 3: Auto-settlement guard path (MANUAL_REVIEW_REQUIRED) ---");
  const t3 = await createSyntheticDispute("Auto Guard Path", "MANUAL_REVIEW_REQUIRED");
  
  await getFullDisputeDetail(
    { params: { id: t3.dispute.id } },
    { json: (data) => data, status: () => ({ json: (data) => data }) }
  );
  
  const w3B = await prisma.wallet.findUnique({ where: { userId: t3.buyerId } });
  const e3 = await prisma.disputeEvent.findMany({ where: { deedDisputeId: t3.dispute.id, type: 'ESCALATED' } });
  const d3 = await prisma.deedDispute.findUnique({ where: { id: t3.dispute.id } });
  console.log("Buyer Wallet Locked Balance (Expected 10000):", w3B.lockedBalance);
  console.log("ESCALATED Event created:", e3.length === 1);
  if (e3.length === 1) {
    const p = typeof e3[0].payload === 'string' ? JSON.parse(e3[0].payload) : e3[0].payload;
    console.log("Escalation Reason:", p.reason);
  }
  console.log("Dispute status:", d3.status);

  // ── TEST 4: Edge Case (Missing AI_REPORT) ──────────────────────────────────
  console.log("\n--- TEST 4: Auto-settlement edge case (Missing AI_REPORT) ---");
  const t4 = await createSyntheticDispute("Auto Missing AI", undefined);
  
  // Need to manipulate firstAiReportEvent fetch in the controller logic, but if there's no AI_REPORT, 
  // reportAgeHours check fails. Wait, if there's NO AI_REPORT, how can it be in CHALLENGE_PHASE?
  // Let's create an AI_REPORT but with NO recommendation.
  const pastDate4 = new Date(Date.now() - 49 * 60 * 60 * 1000);
  await prisma.disputeEvent.create({
    data: {
      deedDisputeId: t4.dispute.id,
      type: 'AI_REPORT',
      actorRole: 'ai',
      createdAt: pastDate4,
      payload: { somethingElse: true } // No recommendation
    }
  });

  await getFullDisputeDetail(
    { params: { id: t4.dispute.id } },
    { json: (data) => data, status: () => ({ json: (data) => data }) }
  );
  
  const w4B = await prisma.wallet.findUnique({ where: { userId: t4.buyerId } });
  const e4 = await prisma.disputeEvent.findMany({ where: { deedDisputeId: t4.dispute.id, type: 'ESCALATED' } });
  const d4 = await prisma.deedDispute.findUnique({ where: { id: t4.dispute.id } });
  console.log("Buyer Wallet Locked Balance (Expected 10000):", w4B.lockedBalance);
  console.log("ESCALATED Event created:", e4.length === 1);
  console.log("Dispute status:", d4.status);

  console.log("\nTests Complete.");
}

runTests().catch(console.error).finally(() => prisma.$disconnect());

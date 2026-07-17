const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const deedService = require('../services/deedService');

// Stub req/res for disputeController
const mockReq = (params, body, user) => ({ params, body, user });
const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.data = data; return res; };
  return res;
};

const { createDispute, smartEscalate, resolveDispute } = require('../controllers/disputeController');

async function runPhase3Test(buyerPct, testName, forceZeroBalance = false, actionOverride = 'PARTIAL_REFUND') {
  console.log(`\n======================================================`);
  console.log(`TEST: ${testName} (Buyer Pct: ${buyerPct}%)`);
  console.log(`======================================================`);
  
  const buyer = await prisma.buyer.findFirst();
  const seller = await prisma.seller.findFirst();

  const oddDeedAmount = 10005; // Odd amount
  console.log(`--- Simulating Dispute Path for Deed Amount: ₹${oddDeedAmount / 100} (${oddDeedAmount} paise) ---`);

  // Ensure seller wallet exists
  let sellerWallet = await prisma.wallet.findUnique({ where: { userId: seller.id } });
  if (!sellerWallet) {
    sellerWallet = await prisma.wallet.create({ data: { userId: seller.id, userRole: 'seller' } });
  }

  // Handle forcing 0 balance for the loser to test negative capability
  if (forceZeroBalance) {
    if (buyerPct === 100) {
       await prisma.wallet.update({ where: { userId: seller.id }, data: { balance: 0 } });
    } else if (buyerPct === 0) {
       await prisma.wallet.update({ where: { userId: buyer.id }, data: { balance: 0 } });
    }
  } else {
    // Standard setup
    await prisma.wallet.update({ where: { userId: buyer.id }, data: { balance: 20000 } });
  }

  // Refresh wallets
  let buyerWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  sellerWallet = await prisma.wallet.findUnique({ where: { userId: seller.id } });

  const initialBuyerBalance = buyerWallet.balance;
  const initialSellerBalance = sellerWallet.balance;

  // 1. Create & Fund Deed
  // We temporarily give buyer enough funds just to fund the deed if they were zeroed out
  if (initialBuyerBalance < oddDeedAmount) {
     await prisma.wallet.update({ where: { userId: buyer.id }, data: { balance: { increment: oddDeedAmount } } });
  }
  
  const deedData = {
    title: `Phase 3 Dispute Deed - ${testName}`,
    description: "Testing odd amount fee logic on dispute",
    amount: oddDeedAmount,
    acceptanceCriteria: "Test"
  };
  const deed = await deedService.createDeed(buyer.id, deedData);
  await deedService.fundDeed(deed.id, buyer.id);
  
  // If we wanted their balance at 0 after funding, reset it.
  if (forceZeroBalance && buyerPct === 0) {
    await prisma.wallet.update({ where: { userId: buyer.id }, data: { balance: 0 } });
  }

  buyerWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  const actualPostFundBuyerBalance = buyerWallet.balance;

  // 2. Seller Joins -> Activates Deed
  await deedService.sellerJoin(deed.inviteToken, seller.id);
  // 3. Submit Delivery
  await deedService.submitDelivery(deed.id, seller.id, { files: [] });

  // 4. Create Dispute (via Controller)
  const reqCreate = mockReq({}, { deedId: deed.id, reason: 'QUALITY_ISSUE', description: 'Not good enough' }, { role: 'buyer', userId: buyer.id });
  const resCreate = mockRes();
  await createDispute(reqCreate, resCreate);
  const dispute = resCreate.data.data.dispute;

  // 5. Escalate Dispute (to trigger ESCALATED fee tier = 2% dispute rate)
  const reqEscalate = mockReq({ id: dispute.id }, { reason: 'I want an admin' }, { role: 'buyer', userId: buyer.id });
  const resEscalate = mockRes();
  await smartEscalate(reqEscalate, resEscalate);

  // 6. Resolve Dispute
  let reqBody = { action: actionOverride, notes: 'Resolving test' };
  if (actionOverride === 'PARTIAL_REFUND') {
    reqBody.buyerPct = buyerPct;
  }
  const reqResolve = mockReq({ id: dispute.id }, reqBody, { role: 'admin', userId: 'admin-1', id: 'admin-1' });
  const resResolve = mockRes();
  await resolveDispute(reqResolve, resResolve);

  // Verification
  const finalDeed = await prisma.deed.findUnique({ where: { id: deed.id } });
  const finalDispute = await prisma.deedDispute.findUnique({ where: { id: dispute.id } });

  if (finalDeed.status === 'CLOSED' && finalDispute.status === 'RESOLVED') {
    console.log("✅ Status exact match: Deed CLOSED and Dispute RESOLVED");
  } else {
    console.log(`❌ Status mismatch! Deed: ${finalDeed?.status}, Dispute: ${finalDispute?.status}`);
  }

  console.log("\n--- Dispute Events Check ---");
  const humanDecisionEvent = await prisma.disputeEvent.findFirst({
    where: { deedDisputeId: dispute.id, type: 'HUMAN_DECISION' }
  });
  const settlementEvent = await prisma.disputeEvent.findFirst({
    where: { deedDisputeId: dispute.id, type: 'SETTLEMENT' }
  });

  if (humanDecisionEvent) {
    console.log(`✅ HUMAN_DECISION event written. Payload: ${humanDecisionEvent.payload}`);
  } else {
    console.log("❌ Missing HUMAN_DECISION event!");
  }

  if (settlementEvent) {
    console.log(`✅ SETTLEMENT event written. Payload: ${settlementEvent.payload}`);
  } else {
    console.log("❌ Missing SETTLEMENT event!");
  }

  const finalBuyerWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  const finalSellerWallet = await prisma.wallet.findUnique({ where: { userId: seller.id } });

  const buyerBalanceIncrease = finalBuyerWallet.balance - actualPostFundBuyerBalance;
  const sellerBalanceIncrease = finalSellerWallet.balance - initialSellerBalance;

  console.log(`\nBuyer Net Received: ${buyerBalanceIncrease}`);
  console.log(`Seller Net Received: ${sellerBalanceIncrease}`);
  
  if (forceZeroBalance) {
     if (buyerPct === 100) {
        console.log(`Seller pre-dispute balance was 0. Final balance is now: ${finalSellerWallet.balance}`);
        if (finalSellerWallet.balance < 0) console.log("✅ Negative balance properly recorded (debt incurred).");
        else console.log("❌ Failed to go negative!");
     } else if (buyerPct === 0) {
        console.log(`Buyer pre-dispute balance was 0. Final balance is now: ${finalBuyerWallet.balance}`);
        if (finalBuyerWallet.balance < 0) console.log("✅ Negative balance properly recorded (debt incurred).");
        else console.log("❌ Failed to go negative!");
     }
  }

  const buyerTx = await prisma.walletTransaction.findFirst({ where: { category: 'DISPUTE_REFUND', reference: dispute.id }, orderBy: { createdAt: 'desc' } });
  const sellerTx = await prisma.walletTransaction.findFirst({ where: { category: 'DISPUTE_RELEASE', reference: dispute.id }, orderBy: { createdAt: 'desc' } });

  const platformFeeTaken = (buyerTx?.fee || 0) + (sellerTx?.fee || 0);
  console.log(`\nPlatform Fee exact check:`);
  console.log(`Buyer Net (${buyerBalanceIncrease}) + Seller Net (${sellerBalanceIncrease}) + Platform Fee (${platformFeeTaken}) = ${buyerBalanceIncrease + sellerBalanceIncrease + platformFeeTaken}`);
  console.log(`Original Deed Amount: ${oddDeedAmount}`);
  
  if (buyerBalanceIncrease + sellerBalanceIncrease + platformFeeTaken === oddDeedAmount) {
    console.log("✅ Exactly zero paisa lost!");
  } else {
    console.log("❌ Remainder check failed!");
  }
}

async function runAll() {
  // Baseline test (60-40 split)
  // Old logic results for 60/40 on 10005 price: BuyerNet: 5883, SellerNet: 3822
  await runPhase3Test(60, "Baseline 60/40 Split");
  
  // New edge cases 100/0 and 0/100
  // With forceZeroBalance = true to prove negative balance
  await runPhase3Test(100, "Literal REFUND Action", true, "REFUND");
  await runPhase3Test(0, "Literal RELEASE Action", true, "RELEASE");
}

runAll().catch(console.error).finally(() => prisma.$disconnect());

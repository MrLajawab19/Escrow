const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const deedService = require('../services/deedService');
const orderService = require('../services/orderService');

// Stub req/res for disputeController
const mockReq = (params, body, user) => ({ params, body, user });
const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.data = data; return res; };
  return res;
};

const { createDispute, smartEscalate, resolveDispute } = require('../controllers/disputeController');

async function runPhase3Test() {
  console.log("Setting up Phase 3 Dispute Test...");
  const buyer = await prisma.buyer.findFirst();
  const seller = await prisma.seller.findFirst();

  const oddDeedAmount = 10005; // Odd amount
  console.log(`\n--- Simulating Dispute Path for Deed Amount: ₹${oddDeedAmount / 100} (${oddDeedAmount} paise) ---`);

  await prisma.wallet.update({
    where: { userId: buyer.id },
    data: { balance: 20000 } 
  });

  let buyerWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  let sellerWallet = await prisma.wallet.findUnique({ where: { userId: seller.id } });
  if (!sellerWallet) {
    sellerWallet = await prisma.wallet.create({ data: { userId: seller.id, userRole: 'seller' } });
  }

  const initialBuyerBalance = buyerWallet.balance;
  const initialSellerBalance = sellerWallet.balance;

  // 1. Create & Fund Deed
  const deedData = {
    title: "Phase 3 Dispute Deed",
    description: "Testing odd amount fee logic on dispute",
    amount: oddDeedAmount,
    acceptanceCriteria: "Test"
  };
  const deed = await deedService.createDeed(buyer.id, deedData);
  await deedService.fundDeed(deed.id, buyer.id);
  console.log("1. Deed Created & Funded");

  // 2. Seller Joins -> Creates Order
  const { order } = await deedService.sellerJoin(deed.inviteToken, seller.id);
  console.log("2. Seller Joined, Order Created:", order.id);

  // 3. Submit Delivery
  await orderService.submitDelivery(order.id, seller.id, []);
  console.log("3. Delivery Submitted");

  // 4. Create Dispute (via Controller)
  const reqCreate = mockReq(
    {}, 
    { orderId: order.id, reason: 'QUALITY_ISSUE', description: 'Not good enough' },
    { role: 'buyer', userId: buyer.id }
  );
  const resCreate = mockRes();
  await createDispute(reqCreate, resCreate);
  if (!resCreate.data.success) throw new Error("Failed to create dispute: " + JSON.stringify(resCreate.data));
  const dispute = resCreate.data.data.dispute;
  console.log("4. Dispute Created:", dispute.id);

  // 5. Escalate Dispute (to trigger ESCALATED fee tier = 2% dispute rate)
  const reqEscalate = mockReq(
    { id: dispute.id },
    { reason: 'I want an admin' },
    { role: 'buyer', userId: buyer.id }
  );
  const resEscalate = mockRes();
  await smartEscalate(reqEscalate, resEscalate);
  console.log("5. Dispute Escalated (MEDIATION state)");

  // 6. Resolve Dispute (60% Buyer / 40% Seller)
  console.log("6. Resolving Dispute (60% Buyer / 40% Seller)");
  const reqResolve = mockReq(
    { id: dispute.id },
    { action: 'PARTIAL_REFUND', buyerPct: 60, notes: 'Resolving test' },
    { role: 'admin', userId: 'admin-1', id: 'admin-1' }
  );
  const resResolve = mockRes();
  await resolveDispute(reqResolve, resResolve);
  if (!resResolve.data.success) throw new Error("Failed to resolve dispute: " + JSON.stringify(resResolve.data));
  console.log("   Resolved successfully.");

  // Verification
  console.log("\n--- Verification (ESCALATED / 60-40 Split) ---");
  const finalBuyerWallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  const finalSellerWallet = await prisma.wallet.findUnique({ where: { userId: seller.id } });

  const expectedBuyerStart = initialBuyerBalance - oddDeedAmount;
  const buyerBalanceIncrease = finalBuyerWallet.balance - expectedBuyerStart;
  const sellerBalanceIncrease = finalSellerWallet.balance - initialSellerBalance;

  const EXPECTED_BUYER_NET = 5883;
  const EXPECTED_SELLER_NET = 3822;
  const EXPECTED_PLATFORM_FEE = 300;

  console.log(`Buyer Gross Expected: 6003`);
  console.log(`Seller Gross Expected: 4002`);
  
  console.log(`\nBuyer Net Received: ${buyerBalanceIncrease} (Expected: ${EXPECTED_BUYER_NET})`);
  console.log(`Seller Net Received: ${sellerBalanceIncrease} (Expected: ${EXPECTED_SELLER_NET})`);
  
  if (buyerBalanceIncrease === EXPECTED_BUYER_NET && sellerBalanceIncrease === EXPECTED_SELLER_NET) {
    console.log("✅ Math exactly matches! Both nets match expectations.");
  } else {
    console.log("❌ Math mismatch!");
  }

  // Fetch transactions to verify metadata
  const buyerTx = await prisma.walletTransaction.findFirst({
    where: { category: 'DISPUTE_REFUND', reference: dispute.id },
    orderBy: { createdAt: 'desc' }
  });
  const sellerTx = await prisma.walletTransaction.findFirst({
    where: { category: 'DISPUTE_RELEASE', reference: dispute.id },
    orderBy: { createdAt: 'desc' }
  });

  console.log("\nBuyer WalletTransaction Metadata:");
  console.log(JSON.stringify(buyerTx?.metadata, null, 2));

  console.log("\nSeller WalletTransaction Metadata:");
  console.log(JSON.stringify(sellerTx?.metadata, null, 2));
  
  const platformFeeTaken = (buyerTx?.metadata.feeDeducted || 0) + (sellerTx?.metadata.feeDeducted || 0);
  console.log(`\nPlatform Fee exact check:`);
  console.log(`Buyer Net (${buyerBalanceIncrease}) + Seller Net (${sellerBalanceIncrease}) + Platform Fee (${platformFeeTaken}) = ${buyerBalanceIncrease + sellerBalanceIncrease + platformFeeTaken}`);
  console.log(`Original Deed Amount: ${oddDeedAmount}`);
  
  if (buyerBalanceIncrease + sellerBalanceIncrease + platformFeeTaken === oddDeedAmount) {
    console.log("✅ Exactly zero paisa lost!");
  } else {
    console.log("❌ Remainder check failed!");
  }
}

runPhase3Test().catch(console.error).finally(() => prisma.$disconnect());

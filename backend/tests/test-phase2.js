const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const walletService = require('../services/walletService');
const deedService = require('../services/deedService');

async function runPhase2Test() {
  console.log("Setting up Phase 2 Happy Path Test...");
  const buyer = await prisma.buyer.findFirst();
  const seller = await prisma.seller.findFirst();
  
  // Ensure buyer has enough funds
  await prisma.wallet.update({
    where: { userId: buyer.id },
    data: { balance: 20000 } // Enough for our 10005 test
  });

  // Get initial seller balance
  let sellerWallet = await prisma.wallet.findUnique({ where: { userId: seller.id } });
  if (!sellerWallet) {
    sellerWallet = await prisma.wallet.create({ data: { userId: seller.id, userRole: 'seller' } });
  }
  const initialSellerBalance = sellerWallet.balance;

  const oddDeedAmount = 10005; // Odd amount to test the 2.5% flooring
  console.log(`\n--- Simulating Full Happy Path for Deed Amount: ₹${oddDeedAmount / 100} (${oddDeedAmount} paise) ---`);

  // 1. Create Deed
  const deedData = {
    title: "Phase 2 Test Deed",
    description: "Testing odd amount fee logic",
    amount: oddDeedAmount,
    acceptanceCriteria: "Test criteria"
  };
  const deed = await deedService.createDeed(buyer.id, deedData);
  console.log("1. Deed Created:", deed.id);

  // 2. Fund Deed
  await deedService.fundDeed(deed.id, buyer.id);
  console.log("2. Deed Funded");

  // 3. Seller Joins
  await deedService.sellerJoin(deed.inviteToken, seller.id);
  console.log("3. Seller Joined");

  // Sign step is skipped as sellerJoin sets it to ACTIVE directly in this flow.
  console.log("4. Deed is ACTIVE");

  // 4. Submit Delivery
  await deedService.submitDelivery(deed.id, seller.id, { description: "Here is the work" });
  console.log("5. Delivery Submitted");

  // 5. Confirm Delivery
  await deedService.confirmDelivery(deed.id, buyer.id);
  console.log("6. Delivery Confirmed");

  // 6. Release Payment
  const releasedDeed = await deedService.releasePayment(deed.id, 'system');
  console.log("7. Payment Released. Final Deed Status:", releasedDeed.status);

  // Verification
  console.log("\n--- Verification ---");
  const finalSellerWallet = await prisma.wallet.findUnique({ where: { userId: seller.id } });
  const balanceIncrease = finalSellerWallet.balance - initialSellerBalance;
  
  console.log(`Seller Initial Balance: ${initialSellerBalance}`);
  console.log(`Seller Final Balance: ${finalSellerWallet.balance}`);
  console.log(`Balance Increase (Net Amount Received): ${balanceIncrease}`);

  const expectedFee = Math.floor(oddDeedAmount * 0.025);
  const expectedNet = oddDeedAmount - expectedFee;
  console.log(`Expected Fee (2.5% of ${oddDeedAmount}): ${expectedFee}`);
  console.log(`Expected Net: ${expectedNet}`);

  if (balanceIncrease === expectedNet) {
    console.log("✅ Math exactly matches! Seller net exactly matches expectation.");
  } else {
    console.log("❌ Math mismatch!");
  }

  // Fetch transaction to verify metadata
  const tx = await prisma.walletTransaction.findFirst({
    where: { category: 'ESCROW_RELEASE', reference: deed.id },
    orderBy: { createdAt: 'desc' }
  });

  console.log("\nSeller WalletTransaction Metadata:");
  console.log(JSON.stringify(tx.metadata, null, 2));
  
  console.log("\nPlatform Fee exact check:");
  console.log(`Seller Net (${sellerNet = tx.netAmount}) + Platform Fee (${tx.metadata.feeDeducted}) = ${sellerNet + tx.metadata.feeDeducted}`);
  console.log(`Original Deed Amount: ${oddDeedAmount}`);
  if (sellerNet + tx.metadata.feeDeducted === oddDeedAmount) {
    console.log("✅ Exactly zero paisa lost!");
  } else {
    console.log("❌ Remainder check failed!");
  }
}

runPhase2Test().catch(console.error).finally(() => prisma.$disconnect());

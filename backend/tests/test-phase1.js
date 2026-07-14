const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const walletService = require('../services/walletService');

async function runTests() {
  console.log("Setting up Phase 1 Test...");
  const buyer = await prisma.buyer.findFirst();
  
  // Reset balance for clear testing
  await prisma.wallet.update({
    where: { userId: buyer.id },
    data: { balance: 0 }
  });

  console.log("\n--- TEST 1: Top-Up Zero Fee ---");
  console.log("Topping up ₹10,000 (1000000 paise)...");
  const topUpTx = await walletService.topUpWallet(buyer.id, 1000000, 'card');
  
  const walletAfterTopUp = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  
  console.log("Transaction Amount:", topUpTx.amount);
  console.log("Transaction Fee Deducted:", topUpTx.fee);
  console.log("Transaction Net Amount:", topUpTx.netAmount);
  console.log("Wallet Balance After Top-Up:", walletAfterTopUp.balance);
  if (topUpTx.fee === 0 && topUpTx.netAmount === 1000000 && walletAfterTopUp.balance === 1000000) {
      console.log("✅ Top-up test passed! Zero fee applied.");
  } else {
      console.log("❌ Top-up test failed!");
  }

  console.log("\n--- TEST 2: Withdrawal Zero Fee ---");
  console.log("Withdrawing ₹5,000 (500000 paise)...");
  const withdrawalTx = await walletService.requestWithdrawal(buyer.id, 500000, { bank: "TEST" });
  
  const walletAfterWithdrawal = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
  
  console.log("Transaction Amount:", withdrawalTx.amount);
  console.log("Transaction Fee Deducted:", withdrawalTx.fee);
  console.log("Transaction Net Amount:", withdrawalTx.netAmount);
  console.log("Wallet Balance After Withdrawal:", walletAfterWithdrawal.balance);
  
  if (withdrawalTx.fee === 0 && withdrawalTx.netAmount === 500000 && walletAfterWithdrawal.balance === 500000) {
      console.log("✅ Withdrawal test passed! Zero fee applied.");
  } else {
      console.log("❌ Withdrawal test failed!");
  }
}

runTests().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { setWalletBalance } = require('./backend/tests/testHelper');
const walletService = require('./backend/services/walletService');

async function main() {
  console.log("--- Testing Ledger Auto-Sync ---");
  
  // Create a temporary user and wallet with intentional drift
  const user = await prisma.buyer.create({
    data: {
      email: 'sync-test-user@example.com',
      password: 'password',
      firstName: 'Sync',
      lastName: 'Test'
    }
  });

  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      userRole: 'buyer',
      balance: 5000 // Fake cache balance
    }
  });

  // Create a single transaction so ledger sum is 1000
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'CREDIT',
      category: 'DEPOSIT',
      amount: 1000,
      netAmount: 1000,
      status: 'SUCCESS',
      description: 'Initial deposit'
    }
  });

  console.log(`[Before] DB Cache Balance: 5000`);
  console.log(`[Before] Ledger Sum: 1000`);
  console.log(`[Action] Calling setWalletBalance(user.id, 0)...`);
  
  // We want to force it to 0. Since ledger sum is 1000, it should insert a DEBIT of 1000.
  await setWalletBalance(user.id, 0);

  const updatedWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
  
  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id, status: 'SUCCESS' },
    orderBy: { createdAt: 'asc' }
  });
  
  const ledgerSum = walletService.calculateBalanceFromTransactions(transactions);

  console.log(`[After] DB Cache Balance: ${updatedWallet.balance}`);
  console.log(`[After] Ledger Sum: ${ledgerSum}`);
  
  console.log("\nTransaction History:");
  transactions.forEach(t => {
    console.log(` - ${t.type} | ${t.category} | ${t.netAmount}`);
  });
  
  if (updatedWallet.balance === 0 && ledgerSum === 0) {
    console.log("\n✅ SUCCESS: Ledger and Cache are perfectly synchronized at 0.");
  } else {
    console.log("\n❌ FAILED: Ledger and Cache mismatch.");
  }

  // Cleanup
  await prisma.walletTransaction.deleteMany({ where: { walletId: wallet.id } });
  await prisma.wallet.delete({ where: { id: wallet.id } });
  await prisma.buyer.delete({ where: { id: user.id } });
}

main().catch(console.error).finally(() => prisma.$disconnect());

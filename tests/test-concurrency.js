// TEST: Concurrency validation for Wallet & Deeds
// Run via: `node tests/test-concurrency.js`
// Validates optimistic concurrency locks during concurrent withdrawals and deed funding to prevent double-spending or race conditions.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const walletService = require('../backend/services/walletService');
const deedService = require('../backend/services/deedService');
const { v4: uuidv4 } = require('uuid');

async function runTests() {
  console.log("=== STARTING CONCURRENCY TESTS ===");
  
  // Create a mock user
  const userId = uuidv4();
  await prisma.buyer.create({
    data: { id: userId, email: `${userId}@test.com`, password: 'pwd', firstName: 'Test', lastName: 'User' }
  });

  // Create wallet and set balance to exactly 100
  const wallet = await prisma.wallet.create({
    data: { userId, userRole: 'buyer', currency: 'INR', balance: 100 }
  });

  console.log(`Initial balance: 100, attempting 5 concurrent withdrawals of 100`);

  const withdrawalPromises = [];
  for (let i = 0; i < 5; i++) {
    withdrawalPromises.push(
      walletService.requestWithdrawal(userId, 100, { accountNumber: '123' })
        .then(res => `SUCCESS: Withdrawal ${i + 1} processed`)
        .catch(err => `FAILED: Withdrawal ${i + 1} - ${err.message}`)
    );
  }

  const results1 = await Promise.all(withdrawalPromises);
  results1.forEach(r => console.log(r));

  const updatedWallet = await prisma.wallet.findUnique({ where: { userId } });
  console.log(`Final wallet balance: ${updatedWallet.balance}`);

  console.log(`\n--- Test 2: fundDeed Concurrency ---`);
  // Top up wallet to 100 again
  await prisma.wallet.update({ where: { userId }, data: { balance: 100, lockedBalance: 0 } });
  console.log(`Balance reset to 100, attempting 2 concurrent fundDeed calls for 100 each`);

  // Create 2 draft deeds for 100 each
  const deed1 = await prisma.deed.create({
    data: { title: 'Deed 1', description: 'test', acceptanceCriteria: 'none', buyerId: userId, amount: 100, currency: 'INR', status: 'DRAFT' }
  });
  const deed2 = await prisma.deed.create({
    data: { title: 'Deed 2', description: 'test', acceptanceCriteria: 'none', buyerId: userId, amount: 100, currency: 'INR', status: 'DRAFT' }
  });

  const fundPromises = [
    deedService.fundDeed(deed1.id, userId)
      .then(res => `SUCCESS: Deed 1 funded`)
      .catch(err => `FAILED: Deed 1 - ${err.message}`),
    deedService.fundDeed(deed2.id, userId)
      .then(res => `SUCCESS: Deed 2 funded`)
      .catch(err => `FAILED: Deed 2 - ${err.message}`)
  ];

  const results2 = await Promise.all(fundPromises);
  results2.forEach(r => console.log(r));

  const finalWallet = await prisma.wallet.findUnique({ where: { userId } });
  console.log(`Final wallet balance: ${finalWallet.balance}, Locked balance: ${finalWallet.lockedBalance}`);

  // Cleanup
  await prisma.auditLedger.deleteMany({ where: { deedId: { in: [deed1.id, deed2.id] } } });
  await prisma.deed.deleteMany({ where: { id: { in: [deed1.id, deed2.id] } } });
  await prisma.walletTransaction.deleteMany({ where: { walletId: wallet.id } });
  await prisma.wallet.delete({ where: { id: wallet.id } });
  await prisma.buyer.delete({ where: { id: userId } });
  
  console.log("\n=== CONCURRENCY TESTS FINISHED ===");
}

runTests().catch(console.error).finally(() => prisma.$disconnect());

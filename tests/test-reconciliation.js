// TEST: Periodic ledger-derived lockedBalance reconciliation
// Run via: `node tests/test-reconciliation.js`
// Verifies that every buyer's lockedBalance mathematically matches the sum of their active escrow deeds.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const walletService = require('../backend/services/walletService');

async function checkAllWallets() {
  const wallets = await prisma.wallet.findMany();
  console.log(`Found ${wallets.length} wallets to reconcile.`);
  
  let mismatches = 0;
  for (const wallet of wallets) {
    if (wallet.userRole !== 'buyer') continue; // only buyers hold locked balance

    const res = await walletService.verifyLockedBalance(wallet.userId);
    if (!res.isMatch) {
      console.log(`[MISMATCH] User ${wallet.userId} | Stored: ${res.storedLockedBalance} | Derived: ${res.derivedLockedBalance} | Diff: ${res.difference}`);
      mismatches++;
    }
  }

  if (mismatches === 0) {
    console.log("All buyer wallets successfully reconciled! 0 mismatches found.");
  } else {
    console.log(`\nFound ${mismatches} mismatches in total.`);
  }
}

checkAllWallets()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

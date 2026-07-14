const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const walletService = require('./services/walletService');

async function main() {
  const buyerId = 'b47e3cda-28a3-4086-9893-6715343bbeb1';
  const sellerId = '2e5b399b-ed56-4a94-80c9-a0cc80ddb211';
  
  console.log('--- RECONCILIATION BUYER ---');
  const buyerSummary = await walletService.getWalletSummary(buyerId, 'buyer');
  console.log(`getWalletSummary.lockedEscrowBalance: ${buyerSummary.lockedEscrowBalance}`);
  
  const buyerWallet = await prisma.wallet.findUnique({ where: { userId: buyerId } });
  
  // Ledger Truth calculation taking into account architectural gaps:
  // 1. ESCROW_LOCK transactions lock funds.
  // 2. releasePayment/refundBuyer CLOSE deeds, but releasePayment doesn't create a tx on the buyer's wallet.
  // So we must subtract the amounts of any CLOSED deeds that had an ESCROW_LOCK.
  const lockTxs = await prisma.walletTransaction.findMany({
    where: { walletId: buyerWallet.id, category: 'ESCROW_LOCK', status: 'SUCCESS' }
  });
  
  let totalLocks = 0;
  let closedOrRefunded = 0;
  
  for (const tx of lockTxs) {
    totalLocks += tx.amount;
    const deed = await prisma.deed.findUnique({ where: { id: tx.reference } });
    if (deed && (deed.status === 'CLOSED' || deed.status === 'CANCELLED')) {
      closedOrRefunded += tx.amount;
    }
  }
  
  const adjustedLedgerTruth = totalLocks - closedOrRefunded;
  console.log(`Ledger total ESCROW_LOCKs: ${totalLocks}`);
  console.log(`Minus CLOSED/CANCELLED deed amounts: ${closedOrRefunded}`);
  console.log(`Adjusted Ledger Truth: ${adjustedLedgerTruth}`);
  console.log(`Discrepancy: ${buyerSummary.lockedEscrowBalance - adjustedLedgerTruth}`);
  
  console.log('\n--- RECONCILIATION SELLER ---');
  const sellerSummary = await walletService.getWalletSummary(sellerId, 'seller');
  console.log(`getWalletSummary.pendingEarnings: ${sellerSummary.pendingEarnings}`);
  
  const activeStatuses = ['PENDING_SELLER', 'PENDING_SIGNATURES', 'ACTIVE', 'SUBMITTED', 'CHANGES_REQUESTED', 'DISPUTED'];
  const sellerDeeds = await prisma.deed.findMany({
    where: { sellerId: sellerId, status: { in: activeStatuses } }
  });
  
  let derivedPendingEarnings = 0;
  sellerDeeds.forEach(d => {
    if (d.status !== 'DISPUTED') derivedPendingEarnings += d.amount;
  });
  console.log(`Deeds (Active) Sum for Seller: ${derivedPendingEarnings}`);
  
  const sellerWallet = await prisma.wallet.findUnique({ where: { userId: sellerId } });
  const sellerTxs = await prisma.walletTransaction.aggregate({
    _sum: { amount: true },
    where: { walletId: sellerWallet.id, status: 'SUCCESS' } // All successful txs
  });
  console.log(`Ledger Truth (WalletTransactions) for Seller: ${sellerTxs._sum.amount || 0}`);
  
  console.log('\nNOTE on Seller: The Ledger has 0 pending earnings because ESCROW_LOCK is on the BUYER wallet, and the seller only receives a transaction (ESCROW_RELEASE) when the deed is CLOSED. Comparing pendingEarnings to the Ledger will ALWAYS result in a discrepancy until completion.');

}

main().catch(console.error).finally(() => prisma.$disconnect());

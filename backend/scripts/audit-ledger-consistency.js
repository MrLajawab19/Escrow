'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const ledgerService = require('../services/ledgerService');
const prisma = new PrismaClient();

async function runLedgerAudit() {
  console.log('=== SCROWX LEDGER CONSISTENCY & INTEGRITY AUDIT ===\n');

  // 1. Audit Wallets
  const wallets = await prisma.wallet.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const totalWallets = wallets.length;
  let zeroDriftCount = 0;
  let driftedCount = 0;
  let lockedBalanceMatches = 0;
  let lockedBalanceMismatches = 0;

  const activeDeedStatuses = [
    'PENDING_SELLER', 'PENDING_SIGNATURES', 'ACTIVE', 'ESCROW_LOCKED',
    'IN_PROGRESS', 'SUBMITTED', 'CONFIRMED', 'DISPUTED', 'ARBITRATING',
    'ARBITRATED', 'ESCALATED', 'CHANGES_REQUESTED'
  ];

  console.log('--- WALLET RECONCILIATION ---');
  console.log(
    'Wallet ID'.padEnd(38) +
    'Role'.padEnd(8) +
    'Stored Bal'.padStart(12) +
    'Tx Bal'.padStart(12) +
    'Drift'.padStart(10) +
    'Stored Lk'.padStart(12) +
    'Deed Lk'.padStart(12) +
    'Lk Match'.padStart(10)
  );
  console.log('-'.repeat(114));

  for (const w of wallets) {
    const txs = await prisma.walletTransaction.findMany({
      where: { walletId: w.id, status: 'SUCCESS' }
    });

    const txCalculatedBalance = txs.reduce((bal, t) => {
      if (t.type === 'CREDIT') return bal + t.netAmount;
      if (t.type === 'DEBIT') return bal - t.netAmount;
      return bal;
    }, 0);

    const balanceDrift = w.balance - txCalculatedBalance;
    if (balanceDrift === 0) {
      zeroDriftCount++;
    } else {
      driftedCount++;
    }

    // Locked balance derived from active deeds where user is buyer
    const activeDeedAgg = await prisma.deed.aggregate({
      _sum: { amount: true },
      where: {
        buyerId: w.userId,
        status: { in: activeDeedStatuses }
      }
    });
    const derivedLocked = activeDeedAgg._sum.amount || 0;
    const isLockedMatch = w.lockedBalance === derivedLocked;

    if (isLockedMatch) {
      lockedBalanceMatches++;
    } else {
      lockedBalanceMismatches++;
    }

    console.log(
      w.id.padEnd(38) +
      w.userRole.padEnd(8) +
      w.balance.toString().padStart(12) +
      txCalculatedBalance.toString().padStart(12) +
      balanceDrift.toString().padStart(10) +
      w.lockedBalance.toString().padStart(12) +
      derivedLocked.toString().padStart(12) +
      (isLockedMatch ? 'YES' : 'NO').padStart(10)
    );
  }

  // 2. Audit SHA-256 Hash Chains per Deed in AuditLedger
  console.log('\n--- AUDIT LEDGER SHA-256 HASH CHAIN VERIFICATION ---');
  const deeds = await prisma.deed.findMany({
    select: { id: true, title: true }
  });

  let totalChainsChecked = 0;
  let validChainsCount = 0;
  let brokenChainsCount = 0;
  let deedsWithLedgerEntries = 0;

  for (const deed of deeds) {
    const count = await prisma.auditLedger.count({ where: { deedId: deed.id } });
    if (count > 0) {
      deedsWithLedgerEntries++;
      totalChainsChecked++;
      const verification = await ledgerService.verifyChain(deed.id);
      if (verification.isValid) {
        validChainsCount++;
      } else {
        brokenChainsCount++;
        console.error(
          `[BROKEN CHAIN] Deed ${deed.id} broken at seq ${verification.brokenAtSequence} (${verification.brokenAtEvent})`
        );
      }
    }
  }

  console.log('\n=== LEDGER AUDIT SUMMARY ===');
  console.log(`Total Wallets Checked:            ${totalWallets}`);
  console.log(`Wallets with Zero Balance Drift:  ${zeroDriftCount} / ${totalWallets} (${((zeroDriftCount / totalWallets) * 100).toFixed(1)}%)`);
  console.log(`Wallets with Balance Drift:       ${driftedCount}`);
  console.log(`Wallets with Locked Bal Match:    ${lockedBalanceMatches} / ${totalWallets}`);
  console.log(`Total Deeds:                      ${deeds.length}`);
  console.log(`Deeds with AuditLedger Entries:   ${deedsWithLedgerEntries}`);
  console.log(`Hash Chains Verified Valid:       ${validChainsCount} / ${totalChainsChecked} (${totalChainsChecked > 0 ? ((validChainsCount / totalChainsChecked) * 100).toFixed(1) : 0}%)`);
  console.log(`Broken Hash Chains:               ${brokenChainsCount}`);

  await prisma.$disconnect();
}

runLedgerAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

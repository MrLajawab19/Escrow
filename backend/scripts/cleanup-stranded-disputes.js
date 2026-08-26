'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupStrandedDisputes() {
  const targetIds = [
    'c3cdfd4c-f3ff-4c78-bbc4-20bd937e1f5e',
    '1787f395-f99f-41b9-ab5e-53b28ada2a28'
  ];

  console.log("Starting cleanup for IDs:", targetIds);

  // 1. Fetch to get Deed IDs before deletion
  const disputes = await prisma.deedDispute.findMany({
    where: { id: { in: targetIds } },
    select: { id: true, deedId: true }
  });

  if (disputes.length === 0) {
    console.log("No matching disputes found. Already cleaned up?");
    return;
  }

  const deedIds = disputes.map(d => d.deedId).filter(Boolean);

  console.log(`Found ${disputes.length} disputes. Associated Deeds:`, deedIds);

  // 2. Perform atomic deletion and reset
  await prisma.$transaction(async (tx) => {
    // Delete Events
    const eventsDeleted = await tx.disputeEvent.deleteMany({
      where: { deedDisputeId: { in: targetIds } }
    });
    console.log(`Deleted ${eventsDeleted.count} DisputeEvents.`);

    // Delete Disputes
    const disputesDeleted = await tx.deedDispute.deleteMany({
      where: { id: { in: targetIds } }
    });
    console.log(`Deleted ${disputesDeleted.count} DeedDisputes.`);

    // Reset Deeds to ACTIVE
    if (deedIds.length > 0) {
      const deedsUpdated = await tx.deed.updateMany({
        where: { id: { in: deedIds } },
        data: { status: 'ACTIVE' }
      });
      console.log(`Reset ${deedsUpdated.count} Deeds to ACTIVE status.`);
    }
  });

  console.log("\nCleanup successful. Verifying final state...");

  // 3. Verify
  const remainingDisputes = await prisma.deedDispute.count({
    where: { id: { in: targetIds } }
  });
  console.log(`Remaining Disputes: ${remainingDisputes} (Expected 0)`);

  const updatedDeeds = await prisma.deed.findMany({
    where: { id: { in: deedIds } },
    select: { id: true, status: true }
  });
  console.log("Deeds after cleanup:");
  updatedDeeds.forEach(d => console.log(`  - Deed ${d.id}: ${d.status}`));

  const wts = await prisma.walletTransaction.findMany({
    where: { reference: { in: deedIds } },
    select: { id: true, category: true, amount: true }
  });
  console.log(`WalletTransactions for these Deeds: ${wts.length} (Expected 2 total)`);
  wts.forEach(wt => console.log(`  - WT ${wt.id}: ${wt.category} of ${wt.amount}`));
}

cleanupStrandedDisputes().catch(console.error).finally(() => prisma.$disconnect());

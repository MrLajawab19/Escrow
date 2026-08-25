/**
 * cleanup-synthetic-disputes.js
 * Removes all records created by seed-synthetic-disputes.js.
 *
 * Identifies synthetic records by the "[SYNTHETIC_TEST]" prefix in:
 *   - Deed.description
 *   - DeedDispute.description
 *   - Buyer.email (*.scrowx.test domain)
 *   - Seller.email (*.scrowx.test domain)
 *
 * Deletion order respects FK constraints:
 *   DisputeEvent → DeedDispute → Deed → Wallet → Buyer/Seller
 *
 * Usage:
 *   node backend/scripts/cleanup-synthetic-disputes.js
 *
 * WARNING: This permanently deletes data. Run only after extracting shadow-mode
 * numbers and before real user onboarding.
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SYNTHETIC_TAG    = '[SYNTHETIC_TEST]';
const SYNTHETIC_DOMAIN = '@scrowx.test';

(async () => {
  console.log('\n[Cleanup] ═══════════════════════════════════════════════════');
  console.log('[Cleanup] Starting synthetic dispute cleanup...');
  console.log(`[Cleanup] Tag: "${SYNTHETIC_TAG}"  Domain: "*${SYNTHETIC_DOMAIN}"`);
  console.log('[Cleanup] ═══════════════════════════════════════════════════\n');

  // ── Step 1: Find all synthetic disputes (via description prefix) ─────────────
  const syntheticDisputes = await prisma.deedDispute.findMany({
    where: { description: { contains: SYNTHETIC_TAG } },
    select: { id: true, deedId: true },
  });
  console.log(`[Cleanup] Found ${syntheticDisputes.length} synthetic DeedDispute records.`);

  const disputeIds = syntheticDisputes.map((d) => d.id);
  const deedIds    = syntheticDisputes.map((d) => d.deedId).filter(Boolean);

  // ── Step 2: Delete DisputeEvents (cascade would handle this, but explicit is safer) ──
  if (disputeIds.length > 0) {
    const evResult = await prisma.disputeEvent.deleteMany({
      where: { deedDisputeId: { in: disputeIds } },
    });
    console.log(`[Cleanup] Deleted ${evResult.count} DisputeEvent records.`);
  }

  // ── Step 3: Delete DeedDispute records ──────────────────────────────────────
  if (disputeIds.length > 0) {
    const ddResult = await prisma.deedDispute.deleteMany({
      where: { id: { in: disputeIds } },
    });
    console.log(`[Cleanup] Deleted ${ddResult.count} DeedDispute records.`);
  }

  // ── Step 4: Delete synthetic Deed records ───────────────────────────────────
  // Also catches any deeds whose disputes were already deleted manually
  const syntheticDeeds = await prisma.deed.findMany({
    where: { description: { contains: SYNTHETIC_TAG } },
    select: { id: true },
  });
  const allDeedIds = [...new Set([...deedIds, ...syntheticDeeds.map((d) => d.id)])];

  if (allDeedIds.length > 0) {
    const dResult = await prisma.deed.deleteMany({
      where: { id: { in: allDeedIds } },
    });
    console.log(`[Cleanup] Deleted ${dResult.count} Deed records.`);
  }

  // ── Step 5: Find and delete synthetic Buyers ────────────────────────────────
  const syntheticBuyers = await prisma.buyer.findMany({
    where: { email: { endsWith: SYNTHETIC_DOMAIN } },
    select: { id: true, email: true },
  });
  console.log(`[Cleanup] Found ${syntheticBuyers.length} synthetic Buyer accounts.`);

  for (const buyer of syntheticBuyers) {
    // Delete wallet first (FK on userId — unique, so at most 1)
    const wResult = await prisma.wallet.deleteMany({ where: { userId: buyer.id } });
    await prisma.buyer.delete({ where: { id: buyer.id } });
    console.log(`[Cleanup]   Removed buyer ${buyer.email} + ${wResult.count} wallet(s).`);
  }

  // ── Step 6: Find and delete synthetic Sellers ───────────────────────────────
  const syntheticSellers = await prisma.seller.findMany({
    where: { email: { endsWith: SYNTHETIC_DOMAIN } },
    select: { id: true, email: true },
  });
  console.log(`[Cleanup] Found ${syntheticSellers.length} synthetic Seller accounts.`);

  for (const seller of syntheticSellers) {
    const wResult = await prisma.wallet.deleteMany({ where: { userId: seller.id } });
    await prisma.seller.delete({ where: { id: seller.id } });
    console.log(`[Cleanup]   Removed seller ${seller.email} + ${wResult.count} wallet(s).`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n[Cleanup] ═══════════════════════════════════════════════════');
  console.log('[Cleanup] Complete. All synthetic records removed.');
  console.log('[Cleanup] The database is clean for real user onboarding.');
  console.log('[Cleanup] ═══════════════════════════════════════════════════\n');

  await prisma.$disconnect();
})().catch(async (err) => {
  console.error('[Cleanup] Fatal error:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});

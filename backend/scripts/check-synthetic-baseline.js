/**
 * check-synthetic-baseline.js
 * Sanity-check: counts synthetic disputes and whether each has an AI_REPORT event.
 * Reusable before and after seed runs.
 */
'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const disputes = await prisma.deedDispute.findMany({
    where: { description: { contains: '[SYNTHETIC_TEST]' } },
    include: {
      events: { where: { type: 'AI_REPORT' } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (disputes.length === 0) {
    console.log('[Baseline] DB baseline: CLEAN — 0 synthetic records.');
    await prisma.$disconnect();
    return;
  }

  const withReport   = disputes.filter(d => d.events.length > 0);
  const withoutReport = disputes.filter(d => d.events.length === 0);

  console.log(`[Baseline] Total synthetic disputes: ${disputes.length}`);
  console.log(`[Baseline]   With AI_REPORT (legacy success): ${withReport.length}`);
  console.log(`[Baseline]   Without AI_REPORT (legacy failed/never triggered): ${withoutReport.length}`);

  if (withoutReport.length > 0) {
    console.log('[Baseline] Disputes missing AI_REPORT:');
    for (const d of withoutReport) {
      console.log(`  ${d.id}  ${d.description.slice(0, 75)}`);
    }
  }

  await prisma.$disconnect();
})().catch(err => {
  console.error('[Baseline] Error:', err.message);
  process.exit(1);
});

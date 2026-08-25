/**
 * rerun-shadow-for-failed.js
 * Re-runs runShadowComparison on disputes that already have an AI_REPORT
 * but whose shadowCompare previously crashed (the D1/E1/E2/E3 high-stakes cases).
 *
 * Also re-triggers generateAIReport + runShadowComparison for disputes
 * that have NO AI_REPORT at all (D2/D3/F1/F2/F3 — legacy 429 failures).
 *
 * Usage:
 *   node backend/scripts/rerun-shadow-for-failed.js
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { PrismaClient }       = require('@prisma/client');
const { generateAIReport }   = require('../services/disputeAI');
const { runShadowComparison } = require('../services/ai/shadowCompare');

const prisma = new PrismaClient();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('\n[Rerun] Fetching all synthetic disputes...');

  const disputes = await prisma.deedDispute.findMany({
    where: { description: { contains: '[SYNTHETIC_TEST]' } },
    include: {
      events: { where: { type: 'AI_REPORT' } },
      deed: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Split into two groups:
  //   1. Has AI_REPORT but shadow comparison may have crashed — re-run shadow only
  //   2. No AI_REPORT at all — needs legacy trigger THEN shadow
  const needsShadowOnly = disputes.filter(d => d.events.length > 0);
  const needsFullRerun  = disputes.filter(d => d.events.length === 0);

  console.log(`[Rerun] ${needsShadowOnly.length} disputes have AI_REPORT — re-running shadow compare only`);
  console.log(`[Rerun] ${needsFullRerun.length} disputes have NO AI_REPORT — triggering generateAIReport + shadow`);

  // ── Group 1: Shadow-only re-runs (D1, E1, E2, E3 — had AI_REPORT, crash was in shadow) ──
  for (const d of needsShadowOnly) {
    const desc = d.description.slice(0, 60);
    console.log(`\n[Rerun] Shadow-only: ${d.id} | ${desc}`);
    await sleep(3000); // brief pause between shadow calls
    await runShadowComparison(d.id);
  }

  // ── Group 2: Full re-trigger (D2, D3, F1, F2, F3) ──────────────────────────
  for (const d of needsFullRerun) {
    const desc = d.description.slice(0, 60);
    console.log(`\n[Rerun] Full rerun: ${d.id} | ${desc}`);
    console.log(`[Rerun] → Triggering generateAIReport...`);

    try {
      await generateAIReport(d.id);
    } catch (err) {
      const is429 = err.status === 429 || (err.message || '').includes('429');
      if (is429) {
        const match = (err.message || '').match(/retry in (\d+)/);
        const waitMs = match ? (parseInt(match[1], 10) + 5) * 1000 : 65000;
        console.warn(`[Rerun] 429 hit — waiting ${waitMs / 1000}s before retry...`);
        await sleep(waitMs);
        await generateAIReport(d.id);
      } else {
        console.error(`[Rerun] generateAIReport threw (non-429):`, err.message);
      }
    }

    await sleep(2000); // grace period for DB write
    console.log(`[Rerun] → Running runShadowComparison...`);
    await runShadowComparison(d.id);
    await sleep(15000); // respect legacy Flash rate limits
  }

  console.log('\n[Rerun] Complete.');
  await prisma.$disconnect();
})().catch(async err => {
  console.error('[Rerun] Fatal:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});

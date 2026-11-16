'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const { runFullArbitrationPipeline } = require('../services/ai/runFullArbitrationPipeline');
const disputeConfig = require('../config/disputeConfig');

const prisma = new PrismaClient();

function isHighStakes(currency, amount) {
  const curr = (currency || 'INR').toUpperCase();
  const thresholdMajor = curr === 'USD'
    ? disputeConfig.HIGH_VALUE_THRESHOLD_USD
    : disputeConfig.HIGH_VALUE_THRESHOLD_INR;
  return (amount || 0) >= thresholdMajor * 100;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runPipelineLatencyBenchmark() {
  console.log('=== MULTI-AGENT ARBITRATION PIPELINE LATENCY BENCHMARK ===\n');

  // Find up to 10 disputes with deeds
  const disputes = await prisma.deedDispute.findMany({
    where: {
      deed: { isNot: null }
    },
    take: 10,
    include: {
      deed: true,
      events: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  if (disputes.length === 0) {
    console.error('No disputes found in database. Seed disputes first.');
    process.exit(1);
  }

  console.log(`Loaded ${disputes.length} disputes for benchmarking.\n`);
  console.log(
    'Run'.padEnd(6) +
    'Dispute ID'.padEnd(38) +
    'Stakes'.padEnd(10) +
    'Latency (ms)'.padStart(14) +
    'Latency (s)'.padStart(14) +
    'Provider'.padStart(25) +
    'Verdict'.padStart(25) +
    'Status'.padStart(10)
  );
  console.log('-'.repeat(142));

  const runs = [];
  const latenciesMs = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < disputes.length; i++) {
    const d = disputes[i];
    const highStakes = isHighStakes(d.deed.currency, d.deed.amount);

    const [buyer, seller] = await Promise.all([
      prisma.buyer.findUnique({ where: { id: d.buyerId } }),
      prisma.seller.findUnique({ where: { id: d.sellerId } })
    ]);

    const start = performance.now();
    let result = null;
    let failed = false;
    let errorMsg = null;

    try {
      result = await runFullArbitrationPipeline({
        dispute: d,
        deed: d.deed,
        evidenceEvents: d.events || [],
        buyer: buyer || { createdAt: new Date(), kycComplete: true },
        seller: seller || { createdAt: new Date(), kycComplete: true, totalDeeds: 1, completedDeeds: 1, rating: 5.0 },
        priorDisputeHistory: null,
        highStakes
      });
      successCount++;
    } catch (err) {
      failed = true;
      failCount++;
      errorMsg = err.message;
    }
    const durationMs = performance.now() - start;
    const durationSec = durationMs / 1000;

    if (!failed) {
      latenciesMs.push(durationMs);
    }

    const providerUsed = result ? (result.providerUsed || 'unknown') : 'FAILED';
    const recommendation = result ? result.recommendation : (errorMsg || 'FAILED');

    runs.push({
      run: i + 1,
      disputeId: d.id,
      durationMs,
      durationSec,
      providerUsed,
      recommendation,
      failed,
      highStakes
    });

    console.log(
      `#${i + 1}`.padEnd(6) +
      d.id.padEnd(38) +
      (highStakes ? 'HIGH' : 'LOW').padEnd(10) +
      durationMs.toFixed(2).padStart(14) +
      durationSec.toFixed(3).padStart(14) +
      providerUsed.padStart(25) +
      recommendation.padStart(25) +
      (failed ? 'FAILED' : 'SUCCESS').padStart(10)
    );

    // Short sleep between runs to be polite to LLM rate limits
    if (i < disputes.length - 1) {
      await sleep(1500);
    }
  }

  latenciesMs.sort((a, b) => a - b);
  const totalSamples = latenciesMs.length;

  const minMs = totalSamples > 0 ? latenciesMs[0] : 0;
  const maxMs = totalSamples > 0 ? latenciesMs[totalSamples - 1] : 0;
  const avgMs = totalSamples > 0 ? (latenciesMs.reduce((a, b) => a + b, 0) / totalSamples) : 0;
  const p50Ms = totalSamples > 0 ? latenciesMs[Math.floor(totalSamples * 0.5)] : 0;
  const p95Ms = totalSamples > 0 ? latenciesMs[Math.floor(totalSamples * 0.95)] || latenciesMs[totalSamples - 1] : 0;

  console.log('\n=== PIPELINE LATENCY SUMMARY ===');
  console.log(`Total Samples Attempted: ${disputes.length}`);
  console.log(`Successful Runs:         ${successCount}`);
  console.log(`Failed Runs:             ${failCount}`);
  console.log(`\nMetrics (in Milliseconds):`);
  console.log(`  Min Latency:    ${minMs.toFixed(2)} ms`);
  console.log(`  Max Latency:    ${maxMs.toFixed(2)} ms`);
  console.log(`  Average:        ${avgMs.toFixed(2)} ms`);
  console.log(`  Median (p50):   ${p50Ms.toFixed(2)} ms`);
  console.log(`  p95:            ${p95Ms.toFixed(2)} ms`);

  console.log(`\nMetrics (in Seconds):`);
  console.log(`  Min Latency:    ${(minMs / 1000).toFixed(3)} s`);
  console.log(`  Max Latency:    ${(maxMs / 1000).toFixed(3)} s`);
  console.log(`  Average:        ${(avgMs / 1000).toFixed(3)} s`);
  console.log(`  Median (p50):   ${(p50Ms / 1000).toFixed(3)} s`);
  console.log(`  p95:            ${(p95Ms / 1000).toFixed(3)} s`);

  console.log('\nProvider Distribution:');
  const providerCounts = runs.reduce((acc, r) => {
    acc[r.providerUsed] = (acc[r.providerUsed] || 0) + 1;
    return acc;
  }, {});
  for (const [p, c] of Object.entries(providerCounts)) {
    console.log(`  ${p}: ${c} / ${runs.length} runs (${((c / runs.length) * 100).toFixed(1)}%)`);
  }

  await prisma.$disconnect();
}

runPipelineLatencyBenchmark().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});

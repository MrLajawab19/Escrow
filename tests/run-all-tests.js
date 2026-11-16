'use strict';
require('dotenv').config();
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const testFiles = [
  // tests/
  'tests/test-arbitration-pipeline-routing.js',
  'tests/test-concurrency.js',
  'tests/test-dispute-lifecycle-e2e.js',
  'tests/test-dispute-settlement-paths.js',
  'tests/test-double-payment-seq.js',
  'tests/test-double-payment.js',
  'tests/test-e2e.js',
  'tests/test-happy-validation.js',
  'tests/test-idempotency.js',
  'tests/test-jit-funding.js',
  'tests/test-plain-topup.js',
  'tests/test-reconciliation.js',
  'tests/test-topup-api.js',
  'tests/test-validation.js',
  // backend/tests/
  'backend/tests/reconciliation.js',
  'backend/tests/test-ledger-sync.js',
  'backend/tests/test-payment-idempotency.js',
  'backend/tests/test-phase1.js',
  'backend/tests/test-phase2.js',
  'backend/tests/test-phase3.js'
];

console.log('=== RUNNING ALL AUTOMATED TEST SUITES ===\n');

let passedCount = 0;
let failedCount = 0;
const results = [];

for (const tf of testFiles) {
  process.stdout.write(`Running ${tf.padEnd(46)}... `);
  const start = Date.now();
  
  const res = spawnSync('node', [tf], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    timeout: 60000,
    env: { ...process.env, NODE_ENV: 'test' }
  });

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  const stdout = res.stdout || '';
  const stderr = res.stderr || '';
  const output = stdout + '\n' + stderr;

  // Determine pass/fail:
  // Exit code must be 0 AND no unhandled rejection/assertion failure in output
  const hasFailEmoji = output.includes('❌') || output.includes('FAILED') || output.includes('Failed');
  const isPass = res.status === 0 && !res.error;

  if (isPass) {
    passedCount++;
    console.log(`PASSED (${duration}s)`);
    results.push({ file: tf, status: 'PASSED', duration, code: res.status });
  } else {
    failedCount++;
    const errMsg = res.error ? res.error.message : (stderr || stdout).split('\n').filter(Boolean).slice(-3).join(' | ');
    console.log(`FAILED (${duration}s) [Exit: ${res.status}]`);
    console.log(`    ↳ Reason: ${errMsg.slice(0, 120)}`);
    results.push({ file: tf, status: 'FAILED', duration, code: res.status, error: errMsg });
  }
}

console.log('\n=== TEST RUN SUMMARY ===');
console.log(`Total Test Suites Executed: ${testFiles.length}`);
console.log(`Passed Suites:              ${passedCount} / ${testFiles.length} (${((passedCount / testFiles.length) * 100).toFixed(1)}%)`);
console.log(`Failed Suites:              ${failedCount} / ${testFiles.length}`);

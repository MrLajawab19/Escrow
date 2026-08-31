/**
 * test-evidence-extractor.js
 * Standalone test for EvidenceExtractor.js — 4 scenarios:
 *
 *   Case 1: Text-only evidence, no images — tests ModelRouter text path
 *   Case 2: Chat screenshot image — tests vision path + real transcription
 *   Case 3: Sparse/no evidence from both parties — tests edge case handling
 *   Case 4: Image fetch failure (non-existent file) — tests graceful fallback
 *
 * Usage:
 *   node backend/scripts/test-evidence-extractor.js
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { extractEvidence } = require('../services/ai/agents/EvidenceExtractor');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function header(label) {
  console.log(`\n${'═'.repeat(68)}`);
  console.log(`  ${label}`);
  console.log('═'.repeat(68));
}

function printResult(result) {
  console.log('\n[Result]');
  console.log(`  extractionError: ${result.extractionError}`);
  console.log(`  visionUsed:      ${result.visionUsed}`);
  console.log(`  providerUsed:    ${result.providerUsed}`);
  console.log(`  facts (${result.facts.length}):`);
  for (const f of result.facts) {
    console.log(`    [${f.source}] (conf=${f.confidence}) (media=${f.mediaUrl || 'none'}) ${f.fact}`);
  }
  if (result.unresolvedGaps.length > 0) {
    console.log(`  unresolvedGaps (${result.unresolvedGaps.length}):`);
    for (const g of result.unresolvedGaps) console.log(`    - ${g}`);
  }
  if (result.flagsForReview.length > 0) {
    console.log(`  flagsForReview (${result.flagsForReview.length}):`);
    for (const f of result.flagsForReview) console.log(`    ⚠ ${f}`);
  }
}

(async () => {

  // ══ CASE 1: Text-only evidence, clean case ════════════════════════════════
  header('CASE 1: Text-only evidence — no images (ModelRouter text path)');

  const case1 = await extractEvidence({
    buyerEvidence: {
      rebuttal:     'The seller promised delivery by August 10th in our agreement. It is now August 18th and nothing has been delivered. I have been chasing them for 8 days.',
      evidenceUrls: ['/uploads/contract-scan.pdf', '/uploads/payment-receipt.pdf'],
      isLate:       false,
    },
    sellerEvidence: {
      rebuttal:     'Delivery was delayed due to client changing requirements on August 7th. The new scope required 2 additional weeks. Client approved this verbally.',
      evidenceUrls: ['/uploads/revised-scope.docx'],
      isLate:       false,
    },
    disputeReason:      'Non-delivery',
    disputeDescription: 'Website development project. ₹25,000 paid upfront. Deadline Aug 10 missed.',
  });

  printResult(case1);
  const case1Pass = !case1.extractionError && case1.facts.length > 0 && !case1.visionUsed;
  console.log(`\n  Case 1: ${case1Pass ? '✅ PASS' : '❌ FAIL'} (extractionError=${case1.extractionError}, facts=${case1.facts.length}, visionUsed=${case1.visionUsed})`);

  await sleep(10000); // rate-limit gap

  // ══ CASE 2: Chat screenshot — vision path ════════════════════════════════
  header('CASE 2: Chat screenshot image — vision path (OCR + transcription)');
  console.log('  Using: uploads/test-chat-screenshot.jpg (WhatsApp chat between client and dev)');
  console.log('  Expected: model transcribes actual messages, not just "a chat was provided"');

  const case2 = await extractEvidence({
    buyerEvidence: {
      rebuttal:     'I am attaching a WhatsApp screenshot showing the seller admitted to multiple delays and delivering wrong design.',
      evidenceUrls: ['/uploads/test-chat-screenshot.jpg'],
      isLate:       false,
    },
    sellerEvidence: {
      rebuttal:     'The design shown was just a draft. Client approved the direction before I proceeded.',
      evidenceUrls: [],
      isLate:       true,
    },
    disputeReason:      'Unsatisfactory delivery / design does not match brief',
    disputeDescription: 'Web development contract. Client claims delivered design does not match agreed mockup.',
  });

  printResult(case2);
  const case2Pass = !case2.extractionError && case2.visionUsed && case2.facts.length > 0;
  // Additional check: at least one fact should reference actual chat content (not just "image was provided")
  const hasActualTranscription = case2.facts.some(f =>
    f.source === 'buyer_evidence_image' &&
    (f.fact.toLowerCase().includes('deliver') || f.fact.toLowerCase().includes('delay') || f.fact.toLowerCase().includes('payment gateway') || f.fact.toLowerCase().includes('design'))
  );
  console.log(`\n  Case 2 basic:         ${case2Pass ? '✅ PASS' : '❌ FAIL'} (extractionError=${case2.extractionError}, visionUsed=${case2.visionUsed}, facts=${case2.facts.length})`);
  console.log(`  Case 2 transcription: ${hasActualTranscription ? '✅ PASS — model extracted actual chat content' : '⚠ WARN — no clear evidence of actual message transcription'}`);

  await sleep(15000); // longer gap — vision calls are heavier

  // ══ CASE 3: Sparse/no evidence ════════════════════════════════════════════
  header('CASE 3: Sparse evidence — no files, no rebuttal text from seller');

  const case3 = await extractEvidence({
    buyerEvidence: {
      rebuttal:     'The product was never delivered.',
      evidenceUrls: [],
      isLate:       false,
    },
    sellerEvidence:    null, // seller never submitted evidence
    disputeReason:     'Non-delivery',
    disputeDescription: 'Small services contract. Buyer paid ₹5,000. Seller went silent.',
  });

  printResult(case3);
  const case3Pass = !case3.extractionError && case3.facts.length > 0 &&
    (case3.unresolvedGaps.length > 0 || case3.flagsForReview.length > 0);
  console.log(`\n  Case 3: ${case3Pass ? '✅ PASS' : '❌ FAIL'} (extractionError=${case3.extractionError}, facts=${case3.facts.length}, gaps=${case3.unresolvedGaps.length})`);

  await sleep(10000);

  // ══ CASE 4: Image file not found on disk ══════════════════════════════════
  header('CASE 4: Image file not found on disk — graceful fallback to text-only');
  console.log('  Evidence URL points to a non-existent file. Should fallback to text-only extraction.');

  const case4 = await extractEvidence({
    buyerEvidence: {
      rebuttal:     'I have a screenshot of our agreement but cannot attach it now. The seller agreed to deliver by Friday.',
      evidenceUrls: ['/uploads/nonexistent-file-abc123.png'], // does not exist
      isLate:       false,
    },
    sellerEvidence: {
      rebuttal:     'No such agreement was made. Delivery was always estimated.',
      evidenceUrls: [],
      isLate:       false,
    },
    disputeReason:     'Breach of agreed deadline',
    disputeDescription: 'Freelance logo design. Seller claims no firm deadline was set.',
  });

  printResult(case4);
  // The nonexistent image should cause visionUsed=false (loadImageFromDisk returns null for missing files)
  // and the text-only path should run normally
  const case4Pass = !case4.extractionError && case4.facts.length > 0 && !case4.visionUsed;
  console.log(`\n  Case 4: ${case4Pass ? '✅ PASS — fell back to text-only when image missing' : '❌ FAIL'} (extractionError=${case4.extractionError}, visionUsed=${case4.visionUsed})`);

  // ══ Final summary ══════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(68)}`);
  console.log('  EVIDENCE EXTRACTOR TEST SUMMARY');
  console.log('═'.repeat(68));
  console.log(`  Case 1 (text-only, clean):              ${case1Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Case 2 (vision/OCR, chat screenshot):   ${case2Pass ? '✅ PASS' : '❌ FAIL'}${hasActualTranscription ? ' + transcription ✅' : ' + transcription ⚠'}`);
  console.log(`  Case 3 (sparse/no seller evidence):     ${case3Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Case 4 (image file missing → fallback): ${case4Pass ? '✅ PASS' : '❌ FAIL'}`);
  const allPass = case1Pass && case2Pass && case3Pass && case4Pass;
  console.log(`\n  Overall: ${allPass ? '✅ ALL PASS' : '❌ ONE OR MORE FAILURES'}`);
  console.log('═'.repeat(68) + '\n');

})().catch(err => {
  console.error('[test-evidence-extractor] Fatal:', err.message);
  process.exit(1);
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const disputeController = require('../backend/controllers/disputeController');

async function runE2E() {
  console.log('--- STARTING E2E TEST ---');

  // Find a deed to dispute
  let deed = await prisma.deed.findFirst({
    where: { 
      deedDispute: null,
      sellerId: { not: null }
    }
  });
  
  if (!deed) {
    console.log('No deeds found at all. Cannot run test.');
    return;
  }
  
  // Temporarily set it to IN_PROGRESS
  await prisma.deed.update({ where: { id: deed.id }, data: { status: 'IN_PROGRESS' } });

  console.log(`Using Deed: ${deed.id}`);

  // 1. Mock createDispute
  let resData1 = null;
  const mockReq1 = {
    user: { role: 'buyer', id: deed.buyerId },
    params: {},
    body: {
      deedId: deed.id,
      reason: 'QUALITY_ISSUE',
      description: 'E2E Test Dispute Creation',
      priority: 'HIGH'
    },
    files: []
  };
  
  const mockRes1 = {
    status: (code) => { console.log(`[createDispute] Status: ${code}`); return mockRes1; },
    json: (data) => { resData1 = data; console.log(`[createDispute] Response: ${data.message}`); }
  };

  console.log('\n--- 1. Creating Dispute ---');
  await disputeController.createDispute(mockReq1, mockRes1);

  if (!resData1 || !resData1.success) {
    console.error('Failed to create dispute', resData1);
    return;
  }

  const disputeId = resData1.data.dispute.id;
  console.log(`Dispute Created: ${disputeId}`);

  // Verify DB state after creation
  const createdDispute = await prisma.deedDispute.findUnique({
    where: { id: disputeId },
    include: { events: true }
  });

  console.log(`\n--- 2. Verifying Initial State ---`);
  console.log(`evidenceResponses Keys:`, Object.keys(createdDispute.evidenceResponses));
  const submitEvents = createdDispute.events.filter(e => e.type === 'EVIDENCE_SUBMITTED');
  console.log(`EVIDENCE_SUBMITTED Events Count: ${submitEvents.length}`);
  console.log(`First Event Actor: ${submitEvents[0]?.actorRole}`);

  if (Object.keys(createdDispute.evidenceResponses).length !== 1 || submitEvents.length !== 1) {
    console.error('Initial state verification failed!');
    return;
  }

  // 3. Mock submitEvidenceEvent (counterparty)
  let resData2 = null;
  const mockReq2 = {
    user: { role: 'seller', id: deed.sellerId },
    params: { id: deed.id },
    body: { rebuttal: 'E2E Counterparty Rebuttal' },
    files: []
  };

  // Wait, let's check submitEvidenceEvent signature in disputeController.js.
  // It expects req.params.id to be the deedId.
  
  const mockRes2 = {
    status: (code) => { console.log(`[submitEvidenceEvent] Status: ${code}`); return mockRes2; },
    json: (data) => { resData2 = data; console.log(`[submitEvidenceEvent] Response: ${data.message}`); }
  };

  console.log('\n--- 3. Counterparty Submitting Evidence ---');
  await disputeController.submitEvidenceEvent(mockReq2, mockRes2);

  // Wait a moment for setImmediate to fire AI (if we were mocking it properly, but here we can just observe if it didn't crash)
  await new Promise(resolve => setTimeout(resolve, 2000));

  const finalDispute = await prisma.deedDispute.findUnique({
    where: { id: disputeId },
    include: { events: true }
  });

  console.log(`\n--- 4. Verifying Final State ---`);
  const finalSubmitEvents = finalDispute.events.filter(e => e.type === 'EVIDENCE_SUBMITTED');
  console.log(`EVIDENCE_SUBMITTED Events Count: ${finalSubmitEvents.length}`);
  console.log('AI Reports Generated:', finalDispute.events.filter(e => e.type === 'AI_REPORT').length);
  
  // Clean up
  await prisma.disputeEvent.deleteMany({ where: { deedDisputeId: disputeId }});
  await prisma.deedDispute.delete({ where: { id: disputeId }});
  await prisma.deed.update({ where: { id: deed.id }, data: { status: 'IN_PROGRESS' } });
  console.log('\nCleaned up test data.');
}

runE2E()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

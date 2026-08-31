const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

// Enable the flag at the process level for testing
process.env.FEATURE_NEW_ARBITRATION_ENABLED = 'true';
// Suppress some verbose logs if we want, but let's keep them to trace execution
// process.env.NODE_ENV = 'test';

const { generateAIReport } = require('../backend/services/disputeAI');

async function createTestDispute(amount) {
  // 1. Create mock users
  const buyerId = uuidv4();
  const sellerId = uuidv4();
  
  await prisma.buyer.create({
    data: { id: buyerId, email: `buyer_${buyerId}@test.com`, firstName: 'Test', lastName: 'Buyer', password: 'testpassword' }
  });
  await prisma.seller.create({
    data: { id: sellerId, email: `seller_${sellerId}@test.com`, firstName: 'Test', lastName: 'Seller', password: 'testpassword' }
  });
  
  // 2. Create mock deed
  const deedId = uuidv4();
  await prisma.deed.create({
    data: {
      id: deedId,
      buyerId,
      sellerId,
      title: 'Test Deed for Arbitration',
      description: 'Need a test artifact',
      acceptanceCriteria: 'Needs to be good',
      amount,
      currency: 'INR',
      status: 'DISPUTED'
    }
  });

  // 3. Create mock dispute
  const disputeId = uuidv4();
  const dispute = await prisma.deedDispute.create({
    data: {
      id: disputeId,
      deedId,
      buyerId,
      sellerId,
      raisedBy: 'buyer',
      status: 'CHALLENGE_PHASE', // Required so generateAIReport knows it's a first pass or re-analysis
      reason: 'quality_issues',
      description: 'It is really bad',
      evidenceResponses: {
        buyer: { rebuttal: 'Buyer says the quality is bad.', evidenceUrls: [] },
        seller: { rebuttal: 'Seller says it is perfect.', evidenceUrls: [] }
      }
    }
  });
  
  return disputeId;
}

async function runTest(testName, amount, simulateFailure = false) {
  console.log(`\n=============================================================`);
  console.log(`🧪 RUNNING TEST: ${testName} (Amount: ${amount})`);
  console.log(`=============================================================`);
  
  let backupMethod;
  if (simulateFailure) {
    // We can simulate a failure by mocking something deep inside the new pipeline
    // or we can just mock runFullArbitrationPipeline if we can intercept it,
    // but the cleanest way without touching src is to temporarily mock a dependency it uses.
    // Actually, we can just throw an error inside the new pipeline.
    const pipelineMod = require('../backend/services/ai/runFullArbitrationPipeline');
    backupMethod = pipelineMod.runFullArbitrationPipeline;
    pipelineMod.runFullArbitrationPipeline = async () => {
      throw new Error("Simulated Pipeline 2 failure for testing!");
    };
  }
  
  const disputeId = await createTestDispute(amount);
  
  try {
    // Run the actual function
    await generateAIReport(disputeId);
    
    // Check results
    const reportEvent = await prisma.disputeEvent.findFirst({
      where: { deedDisputeId: disputeId, type: 'AI_REPORT' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (reportEvent) {
      console.log(`✅ AI_REPORT Event created successfully.`);
      console.log(`   resolvedBy: ${reportEvent.payload.resolvedBy}`);
      console.log(`   pipelineVersion: ${reportEvent.payload.pipelineVersion}`);
      
      if (!simulateFailure) {
        if (reportEvent.payload.resolvedBy === 'new_system' && reportEvent.payload.pipelineVersion === 'full_v1') {
          console.log(`✅ SUCCESS: Routed through Pipeline 2 (New System).`);
        } else {
          console.log(`❌ FAILURE: Did NOT route through Pipeline 2! Payload:`, reportEvent.payload);
        }
      } else {
         if (reportEvent.payload.resolvedBy !== 'new_system') {
           console.log(`✅ SUCCESS: Correctly fell back to Legacy System on failure.`);
         } else {
           console.log(`❌ FAILURE: Did not fall back properly!`);
         }
      }
    } else {
      console.log(`❌ FAILURE: No AI_REPORT event generated!`);
      
      const escalationEvent = await prisma.disputeEvent.findFirst({
        where: { deedDisputeId: disputeId, type: 'ESCALATED' },
        orderBy: { createdAt: 'desc' }
      });
      if (escalationEvent) {
        console.log(`⚠️ Note: It escalated instead. Reason:`, escalationEvent.payload.reason);
      }
    }
    
  } catch (err) {
    console.error(`❌ Unexpected error during test:`, err);
  }
  
  if (simulateFailure) {
    const pipelineMod = require('../backend/services/ai/runFullArbitrationPipeline');
    pipelineMod.runFullArbitrationPipeline = backupMethod;
  }
}

async function main() {
  // Test 1: Low-Stakes
  // High stakes threshold INR is 100000 by default (1000 INR * 100 subunits)
  await runTest("Low-Stakes Dispute", 50000); // ₹500
  
  // Test 2: High-Stakes
  await runTest("High-Stakes Dispute", 2000000); // ₹20000
  
  // Test 3: High-Stakes with Pipeline 2 Failure (Fallback Test)
  await runTest("High-Stakes Dispute (Simulated Pipeline 2 Failure)", 2000000, true);
  
  console.log(`\n🎉 All tests complete.`);
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

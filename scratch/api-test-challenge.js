const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:3000/api/disputes';

async function runApiTest(name, amount) {
  console.log(`\n=============================================================`);
  console.log(`🧪 RUNNING API TEST: ${name} (Amount: ${amount})`);
  console.log(`=============================================================`);

  const buyerId = uuidv4();
  const sellerId = uuidv4();

  // Create users
  await prisma.buyer.create({
    data: { id: buyerId, email: `api-buyer-${Date.now()}@test.com`, firstName: "API", lastName: "Buyer", password: "password", phone: "1234567890" }
  });
  await prisma.seller.create({
    data: { id: sellerId, email: `api-seller-${Date.now()}@test.com`, firstName: "API", lastName: "Seller", password: "password", phone: "0987654321" }
  });

  // Create mock deed
  const deedId = uuidv4();
  await prisma.deed.create({
    data: {
      id: deedId,
      buyerId,
      sellerId,
      title: 'API Test Deed',
      description: 'API test',
      acceptanceCriteria: 'Needs to work',
      amount,
      currency: 'INR',
      status: 'DISPUTED'
    }
  });

  // Create mock dispute
  const disputeId = uuidv4();
  await prisma.deedDispute.create({
    data: {
      id: disputeId,
      deedId,
      buyerId,
      sellerId,
      raisedBy: 'buyer',
      status: 'OPEN', // API triggers generation when counterparty evidence is submitted
      reason: 'quality_issues',
      description: 'Bad API response',
      evidenceResponses: {
        buyer: { rebuttal: 'Buyer says bad.', evidenceUrls: [] }
      }
    }
  });

  // Trigger the AI Report by submitting the seller's evidence via API
  console.log('Sending seller evidence via API...');
  
  // Create a JWT token for the seller
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET || 'secret');

  try {
    const FormData = require('form-data');
    const fs = require('fs');
    
    const form = new FormData();
    form.append('rebuttal', 'Seller says perfect.');
    form.append('files', fs.createReadStream('scratch/dummy.txt'));

    const res = await axios.post(`${API_URL}/deed/${deedId}/evidence`, form, {
      headers: { 
        ...form.getHeaders(),
        Authorization: `Bearer ${token}` 
      }
    });

    console.log(`API Response: ${res.status}`);
  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
  }

  // Wait for the background AI task to finish
  console.log('Waiting for AI processing (approx 20s)...');
  await new Promise(resolve => setTimeout(resolve, 20000));

  // Check the DB
  const dispute = await prisma.deedDispute.findUnique({ where: { id: disputeId } });
  const events = await prisma.disputeEvent.findMany({ where: { deedDisputeId: disputeId } });
  
  const aiReport = events.find(e => e.type === 'AI_REPORT');
  
  if (!aiReport) {
    console.log(`❌ FAILURE: No AI_REPORT event found in DB.`);
    return;
  }

  console.log(`✅ AI_REPORT found. resolvedBy: ${aiReport.payload?.resolvedBy}, pipeline: ${aiReport.payload?.pipelineVersion}`);
  
  if (aiReport.payload?.resolvedBy !== 'new_system') {
    console.log(`❌ FAILURE: Did not route through new_system! (was ${aiReport.payload?.resolvedBy})`);
  } else {
    console.log(`✅ SUCCESS: Routed through Pipeline 2 (New System).`);
  }

  console.log(`Final Dispute Status in DB: ${dispute.status}`);
}

async function main() {
  await runApiTest("Low-Stakes Dispute", 50000); // ₹500
  await runApiTest("High-Stakes Dispute", 2000000); // ₹20000
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

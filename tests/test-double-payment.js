const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const PORT = 3000;

function sendTopUpRequest(token, payloadObj) {
  return new Promise((resolve, reject) => {
    const payloadStr = JSON.stringify(payloadObj);
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/wallet/top-up',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payloadStr)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(payloadStr);
    req.end();
  });
}

async function runTests() {
  console.log("Setting up Double-Payment Test...");
  const buyer = await prisma.buyer.findFirst();
  const token = jwt.sign({ id: buyer.id, role: 'buyer' }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', { expiresIn: '1h' });

  // 1. Create a DRAFT deed
  const deed = await prisma.deed.create({
    data: {
      buyerId: buyer.id,
      sellerId: buyer.id, 
      title: "Double Payment Test Deed",
      description: "Testing concurrent top-ups",
      acceptanceCriteria: "None",
      amount: 12345, 
      currency: "INR",
      status: "DRAFT",
      inviteToken: "dp-invite-" + Date.now()
    }
  });

  const payload = { amount: 12345, targetDeedId: deed.id };
  console.log("Simulating 2 concurrent top-up requests for deed:", deed.id);

  // Send two requests at the exact same time
  const [res1, res2] = await Promise.all([
    sendTopUpRequest(token, payload),
    sendTopUpRequest(token, payload)
  ]);

  console.log("\n--- Request 1 Response ---");
  console.log("Status:", res1.status);
  console.log("Message:", res1.data.message);
  console.log("Razorpay Order ID:", res1.data.data?.razorpayOrderId);

  console.log("\n--- Request 2 Response ---");
  console.log("Status:", res2.status);
  console.log("Message:", res2.data.message);
  console.log("Razorpay Order ID:", res2.data.data?.razorpayOrderId);
  
  if (res2.data.message === 'Reused existing pending Razorpay order') {
      console.log("\n✅ SUCCESS: The second request correctly identified the lock/initiated transaction and reused the Order ID!");
  } else if (res2.status === 500 && res2.data.message === 'CONCURRENT_CREATION') {
      console.log("\n✅ SUCCESS: The second request correctly hit the atomic lock guard (CONCURRENT_CREATION)!");
  } else {
      console.log("\n❌ FAILED: The second request did not handle concurrency properly.");
  }

  // Check the database
  const txs = await prisma.walletTransaction.findMany({
    where: { 
      walletId: (await prisma.wallet.findUnique({where: {userId: buyer.id}})).id,
      category: 'TOP_UP',
      reference: deed.id
    }
  });
  console.log(`\nFound ${txs.length} transactions in DB for this deed.`);
  for (const t of txs) {
     console.log(`- ID: ${t.id} | Status: ${t.status} | Razorpay ID: ${t.razorpayOrderId}`);
  }

}

runTests().catch(console.error).finally(() => prisma.$disconnect());

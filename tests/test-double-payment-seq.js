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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runTests() {
  console.log("Setting up Sequence Double-Payment Test...");
  const buyer = await prisma.buyer.findFirst();
  const token = jwt.sign({ id: buyer.id, role: 'buyer' }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', { expiresIn: '1h' });

  // 1. Create a DRAFT deed
  const deed = await prisma.deed.create({
    data: {
      buyerId: buyer.id,
      sellerId: buyer.id, 
      title: "Double Payment Sequence Test",
      description: "Testing sequential top-ups",
      acceptanceCriteria: "None",
      amount: 12345, 
      currency: "INR",
      status: "DRAFT",
      inviteToken: "dps-invite-" + Date.now()
    }
  });

  const payload = { amount: 12345, targetDeedId: deed.id };
  console.log("Sending Request 1 for deed:", deed.id);
  const res1 = await sendTopUpRequest(token, payload);
  console.log("Request 1 Status:", res1.status);
  console.log("Request 1 Order ID:", res1.data.data?.razorpayOrderId);
  
  console.log("Waiting 2 seconds before Request 2...");
  await sleep(2000);

  console.log("Sending Request 2 for same deed...");
  const res2 = await sendTopUpRequest(token, payload);

  console.log("Request 2 Status:", res2.status);
  console.log("Request 2 Message:", res2.data.message);
  console.log("Request 2 Order ID:", res2.data.data?.razorpayOrderId);
  
  if (res2.data.message === 'Reused existing pending Razorpay order' && res1.data.data?.razorpayOrderId === res2.data.data?.razorpayOrderId) {
      console.log("\n✅ SUCCESS: Sequential test correctly identified the INITIATED transaction and reused the Order ID!");
  } else {
      console.log("\n❌ FAILED: Sequential test did not handle reuse properly.");
  }
}

runTests().catch(console.error).finally(() => prisma.$disconnect());

const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
  console.log("Testing Wallet Top-Up API...");
  
  const jwt = require('jsonwebtoken');
  const buyer = await prisma.buyer.findFirst();
  const token = jwt.sign({ id: buyer.id, role: 'buyer' }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', { expiresIn: '1h' });

  // 1. Plain Top-Up (like TopUpModal) - User wants to add ₹100
  const plainPayload = { amount: 10000 }; // Math.round(100 * 100)
  console.log("Sending Plain Top-Up payload:", plainPayload);
  
  const res1 = await sendTopUpRequest(token, plainPayload);
  console.log("Plain Top-Up Response Status:", res1.status);
  console.log("Plain Top-Up Razorpay Order Amount (should be 10000 paise):", res1.data.data?.amount);
  
  // 2. JIT Top-Up (like NewDeedPage) - Deed is ₹1500
  const jitPayload = { amount: 150000, targetDeedId: 'some-fake-id' };
  console.log("\nSending JIT Top-Up payload:", jitPayload);
  
  const res2 = await sendTopUpRequest(token, jitPayload);
  console.log("JIT Top-Up Response Status:", res2.status);
  console.log("JIT Top-Up Razorpay Order Amount (should be 150000 paise):", res2.data.data?.amount);

}

runTests().catch(console.error).finally(() => prisma.$disconnect());

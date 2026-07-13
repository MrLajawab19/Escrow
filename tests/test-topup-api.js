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
  
  // 2. JIT Top-Up (like NewDeedPage) - Valid Deed
  const validDeed = await prisma.deed.create({
    data: {
      buyerId: buyer.id,
      sellerId: buyer.id, // For test simplicity
      title: "Valid JIT Deed",
      description: "Testing successful validation",
      acceptanceCriteria: "None",
      amount: 150000, 
      currency: "INR",
      status: "DRAFT",
      inviteToken: "valid-invite-" + Date.now()
    }
  });

  const jitPayload = { amount: 150000, targetDeedId: validDeed.id };
  console.log("\nSending JIT Top-Up payload with Valid Deed ID:", jitPayload);
  
  const res2 = await sendTopUpRequest(token, jitPayload);
  console.log("JIT Top-Up Response Status:", res2.status);
  console.log("JIT Top-Up Razorpay Order Amount (should be 150000 paise):", res2.data.data?.amount);

  // 3. JIT Top-Up with WRONG Deed ID (Fake ID)
  const fakeJitPayload = { amount: 150000, targetDeedId: 'invalid-deed-id' };
  console.log("\nSending JIT Top-Up payload with Fake Deed ID:", fakeJitPayload);
  const res3 = await sendTopUpRequest(token, fakeJitPayload);
  console.log("Fake Deed ID Response Status (should be 404):", res3.status);
  console.log("Fake Deed ID Response Message:", res3.data.message);

  // 4. JIT Top-Up with WRONG Buyer (Deed belongs to someone else)
  let otherBuyer = await prisma.buyer.findFirst({ where: { id: { not: buyer.id } } });
  if (!otherBuyer) {
    const fakeUserId = "fake-user-" + Date.now();
    otherBuyer = await prisma.buyer.create({
      data: {
        id: fakeUserId,
        email: fakeUserId + "@example.com",
        password: "dummy",
        firstName: "Fake",
        lastName: "User"
      }
    });
  }

  const otherDeed = await prisma.deed.create({
    data: {
      buyerId: otherBuyer.id,
      sellerId: otherBuyer.id,
      title: "Other Buyer's Deed",
      description: "Testing unauthorized access",
      acceptanceCriteria: "None",
      amount: 200000, 
      currency: "INR",
      status: "DRAFT",
      inviteToken: "fake-invite-" + Date.now()
    }
  });

  const unauthorizedPayload = { amount: 150000, targetDeedId: otherDeed.id };
  console.log("\nSending JIT Top-Up payload for someone else's deed:", unauthorizedPayload);
  const res4 = await sendTopUpRequest(token, unauthorizedPayload);
  console.log("Unauthorized Deed Response Status (should be 403):", res4.status);
  console.log("Unauthorized Deed Response Message:", res4.data.message);

  // 5. JIT Top-Up with WRONG Status (Deed is already ACTIVE)
  const activeDeed = await prisma.deed.create({
    data: {
      buyerId: buyer.id,
      sellerId: buyer.id,
      title: "Active Deed",
      description: "Testing status validation",
      acceptanceCriteria: "None",
      amount: 150000, 
      currency: "INR",
      status: "ACTIVE",
      inviteToken: "active-invite-" + Date.now()
    }
  });

  const wrongStatusPayload = { amount: 150000, targetDeedId: activeDeed.id };
  console.log("\nSending JIT Top-Up payload for an ACTIVE deed:", wrongStatusPayload);
  const res5 = await sendTopUpRequest(token, wrongStatusPayload);
  console.log("Wrong Status Deed Response Status (should be 400):", res5.status);
  console.log("Wrong Status Deed Response Message:", res5.data.message);

}

runTests().catch(console.error).finally(() => prisma.$disconnect());

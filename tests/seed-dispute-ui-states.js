const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

async function main() {
  const buyerId = uuidv4();
  const sellerId = uuidv4();

  // Create users
  await prisma.buyer.create({
    data: { id: buyerId, email: `api-buyer-${Date.now()}@test.com`, firstName: "UI", lastName: "Buyer", password: "password", phone: "1234567890" }
  });
  await prisma.seller.create({
    data: { id: sellerId, email: `api-seller-${Date.now()}@test.com`, firstName: "UI", lastName: "Seller", password: "password", phone: "0987654321" }
  });

  async function createDisputeCase(name, configureEvents) {
    const deedId = uuidv4();
    await prisma.deed.create({
      data: {
        id: deedId, buyerId, sellerId, title: name, description: `Test description for ${name}`, acceptanceCriteria: 'Looks good', amount: 50000, currency: 'USD', status: 'DISPUTED'
      }
    });

    const disputeId = uuidv4();
    await prisma.deedDispute.create({
      data: {
        id: disputeId, deedId, buyerId, sellerId, raisedBy: 'buyer', status: 'CHALLENGE_PHASE', reason: 'quality_issues', description: 'Test complaint'
      }
    });

    await configureEvents(disputeId);
    console.log(`Created: ${name} (Dispute ID: ${disputeId})`);
  }

  // Case 1: One verdict ("not yet challenged")
  await createDisputeCase("UI Case 1: Not Challenged", async (disputeId) => {
    await prisma.disputeEvent.create({
      data: {
        deedDisputeId: disputeId, type: 'AI_REPORT', actorRole: 'ai',
        payload: {
          recommendation: 'PARTIAL_REFUND',
          reasoning: 'Buyer showed missing elements.',
          confidenceScore: 85,
          extractedFacts: [
            { fact: "Buyer claims missing file.", source: "buyer_evidence_text", confidence: 0.9, mediaUrl: null }
          ],
          evidenceGaps: [], evidenceFlags: []
        }
      }
    });
  });

  // Case 2: Two verdicts with real media
  await createDisputeCase("UI Case 2: Two Verdicts + Media", async (disputeId) => {
    await prisma.disputeEvent.create({
      data: {
        deedDisputeId: disputeId, type: 'AI_REPORT', actorRole: 'ai', createdAt: new Date(Date.now() - 100000),
        payload: {
          recommendation: 'REFUND_BUYER', reasoning: 'Initial evidence leans towards buyer.', confidenceScore: 70,
          extractedFacts: [{ fact: "Initial text.", source: "buyer_evidence_text", confidence: 0.8, mediaUrl: null }]
        }
      }
    });
    await prisma.disputeEvent.create({
      data: {
        deedDisputeId: disputeId, type: 'CHALLENGE', actorRole: 'seller', payload: { text: "No way" }
      }
    });
    await prisma.disputeEvent.create({
      data: {
        deedDisputeId: disputeId, type: 'AI_REPORT', actorRole: 'ai',
        payload: {
          recommendation: 'RELEASE_TO_SELLER', reasoning: 'Challenge evidence proves seller completed the work.', confidenceScore: 95,
          extractedFacts: [
            { fact: "Seller uploaded final delivery.", source: "seller_evidence_image", confidence: 0.98, mediaUrl: "https://picsum.photos/400/300" },
            { fact: "Broken image claim.", source: "buyer_evidence_image", confidence: 1, mediaUrl: "/uploads/missing-image.png" }
          ],
          evidenceGaps: ["The file /uploads/missing-image.png failed to load"], evidenceFlags: []
        }
      }
    });
  });

  // Case 3: Older dispute without mediaUrl
  await createDisputeCase("UI Case 3: Older Legacy Format", async (disputeId) => {
    await prisma.disputeEvent.create({
      data: {
        deedDisputeId: disputeId, type: 'AI_REPORT', actorRole: 'ai',
        payload: {
          recommendation: 'REFUND_BUYER', reasoning: 'Pre-mediaUrl era.', confidenceScore: 80,
          extractedFacts: [
            { fact: "Buyer says it's broken.", source: "buyer_evidence_text", confidence: 0.8 },
            { fact: "Seller says it works.", source: "seller_rebuttal", confidence: 0.7 }
          ],
          evidenceGaps: [], evidenceFlags: []
        }
      }
    });
  });

}
main();

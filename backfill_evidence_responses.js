const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  const openDisputes = await prisma.deedDispute.findMany({ where: { status: 'OPEN' } });
  
  console.log(`Found ${openDisputes.length} OPEN disputes. Backfilling...`);

  for (const dispute of openDisputes) {
    if (Object.keys(dispute.evidenceResponses || {}).length === 0) {
      console.log(`Backfilling dispute ${dispute.id}...`);
      
      const newEvidenceResponses = {
        [dispute.raisedBy]: {
          submittedAt: dispute.createdAt.toISOString(),
          rebuttal: dispute.description,
          evidenceUrls: dispute.evidenceUrls || []
        }
      };
      
      // Update evidenceResponses
      await prisma.deedDispute.update({
        where: { id: dispute.id },
        data: { evidenceResponses: newEvidenceResponses }
      });
      
      // Create EVIDENCE_SUBMITTED event
      await prisma.disputeEvent.create({
        data: {
          deedDisputeId: dispute.id,
          type: 'EVIDENCE_SUBMITTED',
          actorRole: dispute.raisedBy,
          createdAt: dispute.createdAt, // backdate it to creation
          payload: {
            rebuttal: dispute.description,
            evidenceUrls: dispute.evidenceUrls || [],
            isLate: false
          }
        }
      });
      console.log(`- Successfully backfilled ${dispute.id}`);
    } else {
      console.log(`Dispute ${dispute.id} already has evidenceResponses. Skipping.`);
    }
  }
  
  const verifiedDisputes = await prisma.deedDispute.findMany({ where: { status: 'OPEN' } });
  console.log('--- VERIFICATION ---');
  verifiedDisputes.forEach(d => {
    console.log(`ID: ${d.id} | evidenceResponses keys: ${Object.keys(d.evidenceResponses).join(',')}`);
  });
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const openDisputes = await prisma.deedDispute.findMany({ 
    where: { status: 'OPEN' },
    include: {
      buyer: true,
      seller: true,
      events: true
    }
  });
  
  openDisputes.forEach(d => {
    console.log(`Dispute ID: ${d.id}`);
    console.log(`- raisedBy: ${d.raisedBy}`);
    console.log(`- evidenceResponses: ${JSON.stringify(d.evidenceResponses)}`);
    console.log(`- buyer email: ${d.buyer?.email}`);
    console.log(`- seller email: ${d.seller?.email}`);
    console.log(`- EVIDENCE_SUBMITTED events: ${d.events.filter(e => e.type === 'EVIDENCE_SUBMITTED').length}`);
    console.log('---');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

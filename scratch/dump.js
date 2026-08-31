const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function run() {
  const disputes = await prisma.deedDispute.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
    include: {
      deed: true,
      events: {
        where: { type: 'AI_REPORT' },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  fs.writeFileSync('scratch/dispute_data.json', JSON.stringify(disputes, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());

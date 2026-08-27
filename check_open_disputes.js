const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const openDisputes = await prisma.deedDispute.findMany({ where: { status: 'OPEN' } });
  console.log(JSON.stringify(openDisputes, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

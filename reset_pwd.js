const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash("password123", 10);
  await prisma.buyer.updateMany({ data: { password: hash } });
  await prisma.seller.updateMany({ data: { password: hash } });
  console.log("Passwords updated to password123. Hash:", hash);
  const b = await prisma.buyer.findFirst();
  console.log("Valid check:", await bcrypt.compare("password123", b.password));
}
main().finally(()=>prisma.$disconnect());

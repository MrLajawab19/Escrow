/**
 * Seed Admin Script
 * Creates the initial admin account from environment variables.
 * Run once: node backend/scripts/seedAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@scrowx.com';
  const password = process.env.ADMIN_PASSWORD || 'ScrowX@Admin2024!';
  const name = process.env.ADMIN_NAME || 'ScrowX Admin';

  try {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      console.log(`✅ Admin already exists: ${email}`);
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({
      data: { email, password: hashed, name, role: 'admin' },
    });

    console.log(`✅ Admin created successfully:`);
    console.log(`   Email   : ${admin.email}`);
    console.log(`   Name    : ${admin.name}`);
    console.log(`   Password: ${password}`);
    console.log(`\n⚠️  Change the password after first login!`);
  } catch (err) {
    console.error('❌ Failed to seed admin:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();

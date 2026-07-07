const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanTestData() {
  console.log('🧹 Starting cleanup of test data...');

  try {
    // We will target any users with "test" in their email to prevent accidentally deleting real users
    const testBuyers = await prisma.buyer.findMany({ where: { email: { contains: 'test' } } });
    const testSellers = await prisma.seller.findMany({ where: { email: { contains: 'test' } } });

    const buyerIds = testBuyers.map(b => b.id);
    const sellerIds = testSellers.map(s => s.id);
    const allUserIds = [...buyerIds, ...sellerIds];

    if (allUserIds.length === 0) {
      console.log('✅ No test users found. Database is already clean!');
      return;
    }

    console.log(`Found ${testBuyers.length} test buyers and ${testSellers.length} test sellers.`);

    // 1. Delete associated Wallets & Transactions
    const wallets = await prisma.wallet.findMany({ where: { userId: { in: allUserIds } } });
    const walletIds = wallets.map(w => w.id);
    await prisma.walletTransaction.deleteMany({ where: { walletId: { in: walletIds } } });
    await prisma.wallet.deleteMany({ where: { userId: { in: allUserIds } } });
    console.log('  - Deleted Wallets & Transactions');

    // 2. Delete Notifications
    await prisma.notification.deleteMany({ where: { userId: { in: allUserIds } } });
    console.log('  - Deleted Notifications');

    // 3. Delete KYC & OTPs
    await prisma.kYC.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.oTPRecord.deleteMany(); // OTPs are transient anyway
    console.log('  - Deleted KYC & OTP Records');

    // 4. Find all Orders tied to these users
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { buyerId: { in: buyerIds } },
          { sellerId: { in: sellerIds } }
        ]
      }
    });
    const orderIds = orders.map(o => o.id);

    if (orderIds.length > 0) {
      // 5. Delete Order-related relations (Disputes, Chats, Messages)
      const chatRooms = await prisma.orderChatRoom.findMany({ where: { orderId: { in: orderIds } } });
      const roomIds = chatRooms.map(r => r.id);
      
      await prisma.orderChatMessage.deleteMany({ where: { roomId: { in: roomIds } } });
      await prisma.orderChatRoom.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.orderDispute.deleteMany({ where: { orderId: { in: orderIds } } });
      
      // 6. Delete Orders
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
      console.log(`  - Deleted ${orderIds.length} Orders and their related Disputes/Chats`);
    }

    // 7. Find all Deeds tied to these users
    const deeds = await prisma.deed.findMany({
      where: {
        OR: [
          { buyerId: { in: buyerIds } },
          { sellerId: { in: sellerIds } }
        ]
      }
    });
    const deedIds = deeds.map(d => d.id);

    if (deedIds.length > 0) {
      // 8. Delete Deed-related relations (Ledger, Milestones, Chat, Escalations, Disputes)
      const deedChatRooms = await prisma.deedChatRoom.findMany({ where: { deedId: { in: deedIds } } });
      const deedRoomIds = deedChatRooms.map(r => r.id);
      
      await prisma.chatMessage.deleteMany({ where: { roomId: { in: deedRoomIds } } });
      await prisma.deedChatRoom.deleteMany({ where: { deedId: { in: deedIds } } });
      
      const deedDisputes = await prisma.dispute.findMany({ where: { deedId: { in: deedIds } } });
      const deedDisputeIds = deedDisputes.map(d => d.id);
      
      await prisma.humanEscalation.deleteMany({ where: { disputeId: { in: deedDisputeIds } } });
      await prisma.dispute.deleteMany({ where: { deedId: { in: deedIds } } });
      
      await prisma.auditLedger.deleteMany({ where: { deedId: { in: deedIds } } });
      await prisma.milestone.deleteMany({ where: { deedId: { in: deedIds } } });
      
      // 9. Delete Deeds
      await prisma.deed.deleteMany({ where: { id: { in: deedIds } } });
      console.log(`  - Deleted ${deedIds.length} Deeds and their related Ledgers/Milestones/Disputes`);
    }

    // 10. Finally, delete the Users
    await prisma.buyer.deleteMany({ where: { id: { in: buyerIds } } });
    await prisma.seller.deleteMany({ where: { id: { in: sellerIds } } });
    console.log('  - Deleted Test Buyers and Sellers');

    console.log('🎉 Cleanup complete! Database is fresh.');

  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData();

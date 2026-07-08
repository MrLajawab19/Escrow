const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getSellerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const seller = await prisma.seller.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        country: true,
        businessName: true,
        isVerified: true,
        kycComplete: true,
        profileImage: true,
        totalDeeds: true,
        completedDeeds: true,
        rating: true,
        createdAt: true,
      }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    const reviews = await prisma.review.findMany({
      where: { sellerId: id },
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true,
            country: true
          }
        },
        deed: {
            select: {
                title: true
            }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ seller, reviews });
  } catch (error) {
    console.error('Get Seller Profile Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getBuyerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const buyer = await prisma.buyer.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        country: true,
        isVerified: true,
        kycComplete: true,
        profileImage: true,
        createdAt: true,
      }
    });

    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    // Get order stats
    const totalDeeds = await prisma.deed.count({
      where: { buyerId: id }
    });

    const activeDeedsCount = await prisma.deed.count({
      where: {
        buyerId: id,
        status: {
          in: ['ACTIVE', 'IN_PROGRESS', 'SUBMITTED', 'ESCROW_LOCKED']
        }
      }
    });

    const completedDeedsList = await prisma.deed.findMany({
      where: { buyerId: id, status: 'CLOSED' },
      select: { amount: true }
    });

    const totalSpent = completedDeedsList.reduce((sum, deed) => sum + deed.amount, 0);

    res.json({ buyer, stats: { totalDeeds, activeDeedsCount, totalSpent } });
  } catch (error) {
    console.error('Get Buyer Profile Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

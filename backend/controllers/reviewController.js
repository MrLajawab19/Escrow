const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createReview = async (req, res) => {
  try {
    const { id: deedId } = req.params;
    const { rating, comment } = req.body;
    const buyerId = req.user.id;

    if (req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can leave reviews' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const deed = await prisma.deed.findUnique({
      where: { id: deedId },
      include: { review: true }
    });

    if (!deed) {
      return res.status(404).json({ error: 'Deed not found' });
    }

    if (deed.buyerId !== buyerId) {
      return res.status(403).json({ error: 'You are not the buyer of this deed' });
    }

    if (deed.status !== 'CLOSED') {
      return res.status(400).json({ error: 'Can only review closed deeds' });
    }

    if (deed.review) {
      return res.status(400).json({ error: 'You have already reviewed this deed' });
    }

    if (!deed.sellerId) {
       return res.status(400).json({ error: 'No seller associated with this deed' });
    }

    const review = await prisma.review.create({
      data: {
        deedId,
        buyerId,
        sellerId: deed.sellerId,
        rating,
        comment
      }
    });

    // Update Seller's rating and completedDeeds
    // First, get all reviews for the seller to calculate the new average
    const sellerReviews = await prisma.review.findMany({
      where: { sellerId: deed.sellerId }
    });
    
    const totalRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverage = sellerReviews.length > 0 ? (totalRating / sellerReviews.length) : rating;

    await prisma.seller.update({
      where: { id: deed.sellerId },
      data: {
        rating: newAverage,
        completedDeeds: {
          increment: 1
        }
      }
    });

    res.status(201).json({ message: 'Review submitted successfully', review });

  } catch (error) {
    console.error('Create Review Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Submit Milestone ────────────────────────────────────────────────────────
exports.submitMilestone = async (req, res) => {
  try {
    const { id: deedId, mId: milestoneId } = req.params;
    const sellerId = req.user.id;

    // Verify deed and milestone
    const deed = await prisma.deed.findUnique({
      where: { id: deedId },
      include: { milestones: { where: { id: milestoneId } } }
    });

    if (!deed || deed.sellerId !== sellerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized or Deed not found' });
    }

    if (deed.milestones.length === 0) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const milestone = deed.milestones[0];
    if (milestone.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Milestone is not in PENDING status' });
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date()
      }
    });

    // Log to AuditLedger
    await prisma.auditLedger.create({
      data: {
        deedId,
        actorId: sellerId,
        actorRole: 'SELLER',
        action: 'MILESTONE_SUBMITTED',
        details: { milestoneId, title: milestone.title }
      }
    });

    res.json({ success: true, data: updatedMilestone });
  } catch (error) {
    console.error('Submit Milestone Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ── Approve Milestone ───────────────────────────────────────────────────────
exports.approveMilestone = async (req, res) => {
  try {
    const { id: deedId, mId: milestoneId } = req.params;
    const buyerId = req.user.id;

    // Verify deed and milestone
    const deed = await prisma.deed.findUnique({
      where: { id: deedId },
      include: { milestones: { where: { id: milestoneId } } }
    });

    if (!deed || deed.buyerId !== buyerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized or Deed not found' });
    }

    if (deed.milestones.length === 0) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const milestone = deed.milestones[0];
    if (milestone.status !== 'SUBMITTED') {
      return res.status(400).json({ success: false, message: 'Milestone must be SUBMITTED to approve' });
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        paidAt: new Date()
      }
    });

    // Handle wallet transfer for milestone amount
    // Deduct from buyer locked balance, add to seller balance
    await prisma.$transaction(async (tx) => {
      // Find wallets
      const buyerWallet = await tx.wallet.findUnique({ where: { userId: buyerId } });
      const sellerWallet = await tx.wallet.findUnique({ where: { userId: deed.sellerId } });

      if (buyerWallet && sellerWallet) {
        // Move locked to actual payment (mock simplified for MVP)
        await tx.wallet.update({
          where: { userId: buyerId },
          data: { lockedBalance: { decrement: milestone.amount } }
        });
        await tx.wallet.update({
          where: { userId: deed.sellerId },
          data: { balance: { increment: milestone.amount } }
        });
      }
    });

    // Log to AuditLedger
    await prisma.auditLedger.create({
      data: {
        deedId,
        actorId: buyerId,
        actorRole: 'BUYER',
        action: 'MILESTONE_APPROVED',
        details: { milestoneId, title: milestone.title, amount: milestone.amount }
      }
    });

    res.json({ success: true, data: updatedMilestone });
  } catch (error) {
    console.error('Approve Milestone Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ── Dispute Milestone ───────────────────────────────────────────────────────
exports.disputeMilestone = async (req, res) => {
  try {
    const { id: deedId, mId: milestoneId } = req.params;
    const buyerId = req.user.id;
    const { reason } = req.body;

    const deed = await prisma.deed.findUnique({
      where: { id: deedId },
      include: { milestones: { where: { id: milestoneId } } }
    });

    if (!deed || deed.buyerId !== buyerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized or Deed not found' });
    }

    if (deed.milestones.length === 0) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'DISPUTED'
      }
    });

    // Log to AuditLedger
    await prisma.auditLedger.create({
      data: {
        deedId,
        actorId: buyerId,
        actorRole: 'BUYER',
        action: 'MILESTONE_DISPUTED',
        details: { milestoneId, title: updatedMilestone.title, reason }
      }
    });

    res.json({ success: true, data: updatedMilestone });
  } catch (error) {
    console.error('Dispute Milestone Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

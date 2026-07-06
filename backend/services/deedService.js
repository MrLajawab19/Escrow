const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const prisma = new PrismaClient();
const ledgerService = require("./ledgerService");

// Dispute fee by day number (% of deed amount)
const DISPUTE_FEE_BY_DAY = { 1: 7.5, 2: 8.5, 3: 10.0, 4: 11.0, 5: 12.0, 6: 13.5, 7: 15.0 };

function getDisputeFeePercentage(dayNumber) {
  return DISPUTE_FEE_BY_DAY[Math.min(dayNumber, 7)] || 15.0;
}

function computeDayNumber(createdAt) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return Math.max(1, Math.min(7, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
}

function hashDeedContent(deed) {
  const content = JSON.stringify({
    title: deed.title,
    description: deed.description,
    acceptanceCriteria: deed.acceptanceCriteria,
    amount: deed.amount,
    currency: deed.currency,
    deadline: deed.deadline,
  });
  return crypto.createHash("sha256").update(content).digest("hex");
}

class DeedService {
  // ── CREATE ────────────────────────────────────────────────────────────────

  async createDeed(buyerId, data) {
    const inviteToken = uuidv4();
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const deed = await prisma.deed.create({
      data: {
        title: data.title,
        transactionType: data.transactionType || "SERVICE",
        description: data.description,
        acceptanceCriteria: data.acceptanceCriteria,
        buyerId,
        amount: parseFloat(data.amount),
        currency: data.currency || "INR",
        paymentMethod: data.paymentMethod || null,
        paymentReference: data.paymentReference || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        revisionLimit: parseInt(data.revisionLimit) || 0,
        deliverableFormats: data.deliverableFormats || [],
        isMilestone: data.isMilestone || false,
        inviteToken,
        inviteExpiresAt,
        status: "PENDING_SELLER",
      },
    });

    // Create chat room
    await prisma.deedChatRoom.create({
      data: { deedId: deed.id, buyerId, sellerId: "pending" },
    });

    // Create milestones if provided
    if (data.isMilestone && data.milestones && data.milestones.length > 0) {
      await prisma.milestone.createMany({
        data: data.milestones.map((m, i) => ({
          deedId: deed.id,
          milestoneNumber: i + 1,
          title: m.title,
          description: m.description || null,
          acceptanceCriteria: m.acceptanceCriteria || null,
          amount: parseFloat(m.amount),
          deadline: m.deadline ? new Date(m.deadline) : null,
          autoPay: m.autoPay || false,
        })),
      });
    }

    // Ledger: DEED_CREATED
    await ledgerService.appendEvent(deed.id, "DEED_CREATED", "buyer", buyerId, {
      title: deed.title,
      transactionType: deed.transactionType,
      amount: deed.amount,
      currency: deed.currency,
    });

    return deed;
  }

  // ── SELLER JOIN via invite link ──────────────────────────────────────────

  async sellerJoin(inviteToken, sellerId) {
    const deed = await prisma.deed.findUnique({ where: { inviteToken } });
    if (!deed) throw new Error("DEED_NOT_FOUND");
    if (deed.status !== "PENDING_SELLER") throw new Error("DEED_NOT_AWAITING_SELLER");
    if (deed.inviteExpiresAt && deed.inviteExpiresAt < new Date()) throw new Error("INVITE_EXPIRED");

    const updated = await prisma.deed.update({
      where: { id: deed.id },
      data: { sellerId, status: "PENDING_SIGNATURES" },
    });

    // Update chat room with real sellerId
    await prisma.deedChatRoom.update({
      where: { deedId: deed.id },
      data: { sellerId },
    });

    await ledgerService.appendEvent(deed.id, "SELLER_JOINED", "seller", sellerId, { sellerId });

    return updated;
  }

  // ── SIGNING ───────────────────────────────────────────────────────────────

  async signDeed(deedId, userId, role) {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) throw new Error("DEED_NOT_FOUND");
    if (!["PENDING_SIGNATURES"].includes(deed.status)) throw new Error("DEED_NOT_SIGNABLE");

    const now = new Date();
    const updateData = {};
    const eventType = role === "buyer" ? "DEED_SIGNED_BUYER" : "DEED_SIGNED_SELLER";

    if (role === "buyer" && deed.buyerId === userId) {
      if (deed.buyerSignedAt) throw new Error("ALREADY_SIGNED");
      updateData.buyerSignedAt = now;
    } else if (role === "seller" && deed.sellerId === userId) {
      if (deed.sellerSignedAt) throw new Error("ALREADY_SIGNED");
      updateData.sellerSignedAt = now;
    } else {
      throw new Error("NOT_A_PARTY");
    }

    // If both signed, move to ACTIVE and lock content hash
    const bothSigned =
      (role === "buyer" && deed.sellerSignedAt) ||
      (role === "seller" && deed.buyerSignedAt);

    if (bothSigned) {
      updateData.status = "ACTIVE";
      updateData.contentHash = hashDeedContent(deed);
    }

    const updated = await prisma.deed.update({ where: { id: deedId }, data: updateData });

    await ledgerService.appendEvent(deedId, eventType, role, userId, { signedAt: now });

    if (bothSigned) {
      await ledgerService.appendEvent(deedId, "DEED_LOCKED", "system", "system", {
        contentHash: updateData.contentHash,
      });
    }

    return updated;
  }

  // ── ESCROW LOCK ───────────────────────────────────────────────────────────

  async lockEscrow(deedId, buyerId) {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed || deed.buyerId !== buyerId) throw new Error("DEED_NOT_FOUND");
    if (deed.status !== "ACTIVE") throw new Error("DEED_NOT_ACTIVE");

    const wallet = await prisma.wallet.findUnique({ where: { userId: buyerId } });
    if (!wallet || wallet.balance < deed.amount) throw new Error("INSUFFICIENT_BALANCE");

    // Deduct from balance, add to lockedBalance
    await prisma.wallet.update({
      where: { userId: buyerId },
      data: {
        balance: { decrement: deed.amount },
        lockedBalance: { increment: deed.amount },
      },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "DEBIT",
        category: "ESCROW_LOCK",
        amount: deed.amount,
        currency: deed.currency,
        status: "SUCCESS",
        description: `Escrow locked for deed: ${deed.title}`,
        reference: deedId,
        netAmount: deed.amount,
      },
    });

    const updated = await prisma.deed.update({
      where: { id: deedId },
      data: { status: "ESCROW_LOCKED" },
    });

    await ledgerService.appendEvent(deedId, "ESCROW_LOCKED", "buyer", buyerId, {
      amount: deed.amount,
      currency: deed.currency,
    });

    return updated;
  }

  // ── SELLER CLAIMS DELIVERY ────────────────────────────────────────────────

  async submitDelivery(deedId, sellerId, deliveryData) {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed || deed.sellerId !== sellerId) throw new Error("DEED_NOT_FOUND");
    if (!["ESCROW_LOCKED", "IN_PROGRESS"].includes(deed.status)) {
      throw new Error("DEED_NOT_IN_PROGRESS");
    }

    const disputeWindowEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const updated = await prisma.deed.update({
      where: { id: deedId },
      data: { status: "SUBMITTED", disputeWindowEnds },
    });

    await ledgerService.appendEvent(deedId, "DELIVERY_CLAIMED", "seller", sellerId, {
      description: deliveryData.description,
      fileCount: (deliveryData.fileUrls || []).length,
      externalLinks: deliveryData.externalLinks || [],
      disputeWindowEnds,
    });

    return updated;
  }

  // ── BUYER CONFIRMS DELIVERY ───────────────────────────────────────────────

  async confirmDelivery(deedId, buyerId) {
    const deed = await prisma.deed.findUnique({
      where: { id: deedId },
      include: { milestones: true },
    });
    if (!deed || deed.buyerId !== buyerId) throw new Error("DEED_NOT_FOUND");
    if (deed.status !== "SUBMITTED") throw new Error("DEED_NOT_SUBMITTED");

    const updated = await prisma.deed.update({
      where: { id: deedId },
      data: { status: "CONFIRMED" },
    });

    await ledgerService.appendEvent(deedId, "DELIVERY_CONFIRMED", "buyer", buyerId, {
      confirmedAt: new Date(),
    });

    // Auto-release after 48h handled by cron — schedule here by just marking CONFIRMED
    return updated;
  }

  // ── RELEASE PAYMENT TO SELLER ─────────────────────────────────────────────

  async releasePayment(deedId, triggeredBy = "system") {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) throw new Error("DEED_NOT_FOUND");
    if (!["CONFIRMED", "ARBITRATED"].includes(deed.status)) throw new Error("DEED_NOT_RELEASABLE");

    const buyerWallet = await prisma.wallet.findUnique({ where: { userId: deed.buyerId } });
    if (!buyerWallet) throw new Error("BUYER_WALLET_NOT_FOUND");

    await prisma.wallet.update({
      where: { userId: deed.buyerId },
      data: { lockedBalance: { decrement: deed.amount } },
    });

    let sellerWallet = await prisma.wallet.findUnique({ where: { userId: deed.sellerId } });
    if (!sellerWallet) {
      sellerWallet = await prisma.wallet.create({
        data: { userId: deed.sellerId, userRole: "seller", currency: deed.currency },
      });
    }

    await prisma.wallet.update({
      where: { userId: deed.sellerId },
      data: { balance: { increment: deed.amount } },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: sellerWallet.id,
        type: "CREDIT",
        category: "ESCROW_RELEASE",
        amount: deed.amount,
        currency: deed.currency,
        status: "SUCCESS",
        description: `Payment released for deed: ${deed.title}`,
        reference: deedId,
        netAmount: deed.amount,
      },
    });

    const updated = await prisma.deed.update({
      where: { id: deedId },
      data: { status: "CLOSED" },
    });

    await ledgerService.appendEvent(deedId, "PAYMENT_RELEASED", "system", triggeredBy, {
      amount: deed.amount,
      to: "seller",
      triggeredBy,
    });

    return updated;
  }

  // ── REFUND TO BUYER ───────────────────────────────────────────────────────

  async refundBuyer(deedId, triggeredBy = "system") {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) throw new Error("DEED_NOT_FOUND");

    const wallet = await prisma.wallet.findUnique({ where: { userId: deed.buyerId } });
    if (!wallet) throw new Error("BUYER_WALLET_NOT_FOUND");

    await prisma.wallet.update({
      where: { userId: deed.buyerId },
      data: {
        balance: { increment: deed.amount },
        lockedBalance: { decrement: deed.amount },
      },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        category: "REFUND",
        amount: deed.amount,
        currency: deed.currency,
        status: "SUCCESS",
        description: `Refund for deed: ${deed.title}`,
        reference: deedId,
        netAmount: deed.amount,
      },
    });

    const updated = await prisma.deed.update({
      where: { id: deedId },
      data: { status: "CLOSED" },
    });

    await ledgerService.appendEvent(deedId, "PAYMENT_REFUNDED", "system", triggeredBy, {
      amount: deed.amount,
      to: "buyer",
      triggeredBy,
    });

    return updated;
  }

  // ── RAISE DISPUTE ─────────────────────────────────────────────────────────

  async raiseDispute(deedId, userId, role, data) {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) throw new Error("DEED_NOT_FOUND");
    if (!["SUBMITTED", "CONFIRMED", "ESCROW_LOCKED", "IN_PROGRESS"].includes(deed.status)) {
      throw new Error("DEED_NOT_DISPUTABLE");
    }

    if (deed.disputeWindowEnds && deed.disputeWindowEnds < new Date()) {
      throw new Error("DISPUTE_WINDOW_CLOSED");
    }

    const dayNumber = computeDayNumber(deed.createdAt);
    const feePercentage = getDisputeFeePercentage(dayNumber);
    const feeAmount = (feePercentage / 100) * deed.amount;
    const counterWindowEnds = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const dispute = await prisma.dispute.create({
      data: {
        deedId,
        raisedById: userId,
        raisedByRole: role,
        reason: data.reason,
        description: data.description,
        evidenceUrls: data.evidenceUrls || [],
        deedClauseCited: data.deedClauseCited || [],
        dayNumber,
        feePercentage,
        feeAmount,
        counterWindowEnds,
        status: "COUNTER_WINDOW",
      },
    });

    await prisma.deed.update({
      where: { id: deedId },
      data: { status: "DISPUTED" },
    });

    await ledgerService.appendEvent(deedId, "DISPUTE_RAISED", role, userId, {
      reason: data.reason,
      dayNumber,
      feePercentage,
      feeAmount,
      counterWindowEnds,
    });

    return dispute;
  }

  // ── QUERY ─────────────────────────────────────────────────────────────────

  async getDeed(deedId, userId) {
    return prisma.deed.findUnique({
      where: { id: deedId },
      include: {
        milestones: { orderBy: { milestoneNumber: "asc" } },
        dispute: { include: { escalation: true } },
        chatRoom: { include: { messages: { take: 1, orderBy: { createdAt: "desc" } } } },
      },
    });
  }

  async getBuyerDeeds(buyerId) {
    return prisma.deed.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
      include: { dispute: true, milestones: true },
    });
  }

  async getSellerDeeds(sellerId) {
    return prisma.deed.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      include: { dispute: true, milestones: true },
    });
  }

  async getDeedByInviteToken(inviteToken) {
    return prisma.deed.findUnique({ where: { inviteToken } });
  }
}

module.exports = new DeedService();

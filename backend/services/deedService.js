const { validateAmount } = require("../utils/validationUtils");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const prisma = new PrismaClient();
const ledgerService = require("./ledgerService");
// Day number calculation kept for legacy logging

function computeDayNumber(createdAt) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return Math.max(1, Math.min(7, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
}

function hashDeedContent(deed) {
  const content = JSON.stringify({
    title: deed.title,
            deedId: deed.id,
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
    data.amount = validateAmount(data.amount);
    const inviteToken = uuidv4();
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const deed = await prisma.deed.create({
      data: {
        title: data.title,
        transactionType: data.transactionType || "SERVICE",
        description: data.description,
        acceptanceCriteria: data.acceptanceCriteria,
        buyerId,
        amount: parseInt(data.amount),
        currency: data.currency || "INR",
        paymentMethod: data.paymentMethod || null,
        paymentReference: data.paymentReference || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        revisionLimit: parseInt(data.revisionLimit) || 0,
        deliverableFormats: data.deliverableFormats || [],
        isMilestone: data.isMilestone || false,
        scopeBox: data.scopeBox || null,
        inviteToken,
        inviteExpiresAt,
        status: "DRAFT",
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
          amount: parseInt(m.amount),
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

  // ── FUND DEED ─────────────────────────────────────────────────────────────

  async fundDeed(deedId, buyerId) {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed || deed.buyerId !== buyerId) throw new Error("DEED_NOT_FOUND");
    if (deed.status !== "DRAFT") throw new Error("DEED_NOT_IN_DRAFT_STATE");

    const wallet = await prisma.wallet.findUnique({ where: { userId: buyerId } });
    if (!wallet) throw new Error("WALLET_NOT_FOUND");

    await prisma.$transaction(async (tx) => {
      // Subphase A: Atomic decrement with guard condition
      const updateResult = await tx.wallet.updateMany({
        where: {
          id: wallet.id,
          balance: { gte: deed.amount }
        },
        data: {
          balance: { decrement: deed.amount },
          lockedBalance: { increment: deed.amount }
        }
      });

      if (updateResult.count === 0) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          category: "ESCROW_LOCK",
          amount: deed.amount,
          currency: deed.currency,
          status: "SUCCESS",
          description: `Funds locked for deed: ${deed.title}`,
          reference: deedId,
          netAmount: deed.amount,
        },
      });

      await tx.deed.update({
        where: { id: deedId },
        data: { status: "PENDING_SELLER" },
      });
    });

    await ledgerService.appendEvent(deedId, "FUNDS_LOCKED", "buyer", buyerId, {
      amount: deed.amount,
      currency: deed.currency,
    });

    return await prisma.deed.findUnique({ where: { id: deedId } });
  }

  // ── SELLER JOIN (ACCEPT DEED) ─────────────────────────────────────────────

  async sellerJoin(inviteToken, sellerId) {
    const deed = await prisma.deed.findUnique({ where: { inviteToken }, include: { chatRoom: true } });
    if (!deed) throw new Error("DEED_NOT_FOUND");
    if (deed.status !== "PENDING_SELLER") throw new Error("DEED_NOT_AWAITING_SELLER");
    if (deed.inviteExpiresAt && deed.inviteExpiresAt < new Date()) throw new Error("INVITE_EXPIRED");

    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new Error("SELLER_NOT_FOUND");
    
    const buyer = await prisma.buyer.findUnique({ where: { id: deed.buyerId } });
    const buyerName = buyer ? `${buyer.firstName} ${buyer.lastName}` : "Buyer";
    const buyerEmail = buyer ? buyer.email : "buyer@example.com";

    // 1. Update Deed to ACTIVE
    // 2. Update Wallet (Funds are already locked, but we keep them in lockedBalance until RELEASE or REFUND)
    const updatedDeed = await prisma.deed.update({
      where: { id: deed.id },
      data: { sellerId, status: "ACTIVE", contentHash: hashDeedContent(deed) },
    });

    // Update Deed chat room with real sellerId
    if (deed.chatRoom) {
      await prisma.deedChatRoom.update({
        where: { deedId: deed.id },
        data: { sellerId },
      });
    }

    await ledgerService.appendEvent(deed.id, "SELLER_JOINED", "seller", sellerId, { sellerId });
    await ledgerService.appendEvent(deed.id, "DEED_LOCKED", "system", "system", { contentHash: updatedDeed.contentHash });

    return { deed: updatedDeed };
  }

  // ── SIGNING ───────────────────────────────────────────────────────────────

  async signDeed(deedId, userId, role) {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) throw new Error("DEED_NOT_FOUND");
    if (deed.amount !== undefined) validateAmount(deed.amount);
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


  // ── SELLER CLAIMS DELIVERY ────────────────────────────────────────────────

  async submitDelivery(deedId, sellerId, deliveryData) {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed || deed.sellerId !== sellerId) throw new Error("DEED_NOT_FOUND");
    if (!["ESCROW_LOCKED", "IN_PROGRESS", "ACTIVE"].includes(deed.status)) {
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
      fileUrls: deliveryData.fileUrls || [],
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
    if (deed.amount !== undefined) validateAmount(deed.amount);
    if (!["CONFIRMED", "ARBITRATED"].includes(deed.status)) throw new Error("DEED_NOT_RELEASABLE");

    await prisma.$transaction(async (tx) => {
      // Subphase A: Atomic decrement of locked balance with guard condition
      const updateResult = await tx.wallet.updateMany({
        where: { userId: deed.buyerId, lockedBalance: { gte: deed.amount } },
        data: { lockedBalance: { decrement: deed.amount } },
      });

      if (updateResult.count === 0) {
        throw new Error("INSUFFICIENT_LOCKED_BALANCE");
      }

      let sellerWallet = await tx.wallet.findUnique({ where: { userId: deed.sellerId } });
      if (!sellerWallet) {
        sellerWallet = await tx.wallet.create({
          data: { userId: deed.sellerId, userRole: "seller", currency: deed.currency },
        });
      }

      // Phase 2: Happy-Path 2.5% Seller Fee
      const sellerBaseRate = 0.025; // 2.5%
      const platformFee = Math.floor(deed.amount * sellerBaseRate);
      const sellerNet = deed.amount - platformFee;

      // Atomic increment of seller balance (safe pattern: increment without exact-match balance guard)
      await tx.wallet.update({
        where: { userId: deed.sellerId },
        data: { balance: { increment: sellerNet } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: sellerWallet.id,
          type: "CREDIT",
          category: "ESCROW_RELEASE",
          amount: deed.amount,
          currency: deed.currency,
          status: "SUCCESS",
          description: `Payment released for deed: ${deed.title}`,
          reference: deedId,
          netAmount: sellerNet,
          metadata: {
            feeTier: "HAPPY_PATH_SELLER_2_5",
            feePercentage: 2.5,
            baseAmount: deed.amount,
            feeDeducted: platformFee
          }
        },
      });

      await tx.deed.update({
        where: { id: deedId },
        data: { status: "CLOSED" },
      });
    });

    await ledgerService.appendEvent(deedId, "PAYMENT_RELEASED", "system", triggeredBy, {
      amount: deed.amount,
      to: "seller",
      triggeredBy,
    });

    return await prisma.deed.findUnique({ where: { id: deedId } });
  }

  // ── REFUND TO BUYER ───────────────────────────────────────────────────────

  async refundBuyer(deedId, triggeredBy = "system") {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) throw new Error("DEED_NOT_FOUND");
    if (deed.amount !== undefined) validateAmount(deed.amount);

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: deed.buyerId } });
      if (!wallet) throw new Error("BUYER_WALLET_NOT_FOUND");

      // Subphase A: Atomic lockedBalance decrement with guard condition
      const updateResult = await tx.wallet.updateMany({
        where: { id: wallet.id, lockedBalance: { gte: deed.amount } },
        data: {
          balance: { increment: deed.amount },
          lockedBalance: { decrement: deed.amount },
        },
      });

      if (updateResult.count === 0) {
        throw new Error("INSUFFICIENT_LOCKED_BALANCE");
      }

      await tx.walletTransaction.create({
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

      await tx.deed.update({
        where: { id: deedId },
        data: { status: "CLOSED" },
      });
    });

    await ledgerService.appendEvent(deedId, "PAYMENT_REFUNDED", "system", triggeredBy, {
      amount: deed.amount,
      to: "buyer",
      triggeredBy,
    });

    return await prisma.deed.findUnique({ where: { id: deedId } });
  }

  // ── RAISE DISPUTE ─────────────────────────────────────────────────────────

  async raiseDispute(deedId, userId, role, data) {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) throw new Error("DEED_NOT_FOUND");
    if (deed.amount !== undefined) validateAmount(deed.amount);
    if (!["SUBMITTED", "CONFIRMED", "ESCROW_LOCKED", "IN_PROGRESS", "ACTIVE", "CHANGES_REQUESTED"].includes(deed.status)) {
      throw new Error("DEED_NOT_DISPUTABLE");
    }

    if (deed.disputeWindowEnds && deed.disputeWindowEnds < new Date()) {
      throw new Error("DISPUTE_WINDOW_CLOSED");
    }

    const dayNumber = computeDayNumber(deed.createdAt);
    const counterWindowEnds = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const dispute = await prisma.orderDispute.create({
      data: {
        deedId,
        buyerId: deed.buyerId,
        sellerId: deed.sellerId,
        raisedBy: role,
        reason: data.reason,
        description: data.description,
        evidenceUrls: data.evidenceUrls || [],
        status: "OPEN",
      },
    });

    await prisma.deed.update({
      where: { id: deedId },
      data: { status: "DISPUTED" },
    });

    // TODO (Stage B): Trigger AI engine synchronously or asynchronously here

    await ledgerService.appendEvent(deedId, "DISPUTE_RAISED", role, userId, {
      reason: data.reason,
      dayNumber,
      counterWindowEnds,
    });

    return dispute;
  }

  // ── QUERY ─────────────────────────────────────────────────────────────────

  
  // ── REVISIONS ─────────────────────────────────────────────────────────────

  async requestChanges(deedId, buyerId, changesData) {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed || deed.buyerId !== buyerId) throw new Error("DEED_NOT_FOUND");
    if (deed.status !== "SUBMITTED") throw new Error("DEED_NOT_SUBMITTED");

    // Enforce revision limit if set
    if (deed.revisionLimit > 0 && deed.revisionCount >= deed.revisionLimit) {
      throw new Error("REVISION_LIMIT_REACHED");
    }

    const updated = await prisma.deed.update({
      where: { id: deedId },
      data: { 
        status: "CHANGES_REQUESTED",
        revisionCount: { increment: 1 }
      },
    });

    await ledgerService.appendEvent(deedId, "CHANGES_REQUESTED", "buyer", buyerId, {
      reason: changesData.reason || "",
      description: changesData.description || "",
      revisionNumber: deed.revisionCount + 1
    });

    return updated;
  }

  async acceptChanges(deedId, sellerId) {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed || deed.sellerId !== sellerId) throw new Error("DEED_NOT_FOUND");
    if (deed.status !== "CHANGES_REQUESTED") throw new Error("NO_CHANGES_REQUESTED");

    const updated = await prisma.deed.update({
      where: { id: deedId },
      data: { status: "ACTIVE" },
    });

    await ledgerService.appendEvent(deedId, "CHANGES_ACCEPTED", "seller", sellerId, {});
    return updated;
  }

  async rejectChanges(deedId, sellerId) {
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed || deed.sellerId !== sellerId) throw new Error("DEED_NOT_FOUND");
    if (deed.status !== "CHANGES_REQUESTED") throw new Error("NO_CHANGES_REQUESTED");

    // Automatically raise a dispute since seller rejected buyer's requested changes
    const data = {
      reason: "OTHER",
      description: "Seller rejected the requested revisions.",
      evidenceUrls: []
    };
    
    // Call the existing raiseDispute engine
    return await this.raiseDispute(deedId, sellerId, "seller", data);
  }

  async getDeed(deedId, userId) {
    return prisma.deed.findUnique({
      where: { id: deedId },
      include: {
        milestones: { orderBy: { milestoneNumber: "asc" } },
        orderDispute: true,
        chatRoom: { include: { messages: { take: 1, orderBy: { createdAt: "desc" } } } },
      },
    });
  }

  async getBuyerDeeds(buyerId) {
    return prisma.deed.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
      include: { orderDispute: true, milestones: true },
    });
  }

  async getSellerDeeds(sellerId) {
    return prisma.deed.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      include: { orderDispute: true, milestones: true },
    });
  }

  async getDeedByInviteToken(inviteToken) {
    return prisma.deed.findUnique({ where: { inviteToken } });
  }
}

module.exports = new DeedService();

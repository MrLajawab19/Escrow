'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { convertCurrency } = require('../utils/currencyUtils');

/**
 * Shared transaction logic for resolving a dispute and moving funds.
 * 
 * @param {object} params
 * @param {object} params.dispute - The DeedDispute record.
 * @param {object} params.deed - The Deed record.
 * @param {string} params.recommendation - Action string, e.g. "REFUND_BUYER", "RELEASE_TO_SELLER".
 * @param {number} params.buyerPct - The percentage of the amount to refund to the buyer.
 * @param {string} params.actorRole - Role of the actor resolving the dispute (e.g. 'admin' or 'system').
 * @param {string} params.actorId - ID of the actor (can be null if system).
 * @param {string} params.notes - Optional notes.
 * @param {object} [params.enhancedAnalysis] - Optional enhanced analysis JSON.
 * @param {object} [params.scopeCompliance] - Optional scope compliance JSON.
 * @returns {Promise<void>}
 */
async function executeSettlementTransaction({ 
  dispute, 
  deed, 
  recommendation, 
  buyerPct, 
  actorRole, 
  actorId, 
  notes,
  enhancedAnalysis,
  scopeCompliance
}) {
  // Require at runtime to avoid circular dependency with disputeController
  const { calculateResolutionAmounts } = require('../controllers/disputeController');

  const resolutionMap = { REFUND: 'REFUND_BUYER', RELEASE: 'RELEASE_TO_SELLER', PARTIAL_REFUND: 'PARTIAL_REFUND' };
  const resolution = resolutionMap[recommendation] || recommendation;

  // --- Phase 3: Dual-sided fee split and Wallet Balance updates ---
  let finalBuyerPct = 100;
  if (buyerPct !== undefined) {
    finalBuyerPct = buyerPct;
  } else if (resolution === 'RELEASE_TO_SELLER' || resolution.includes('RELEASE')) {
    finalBuyerPct = 0;
  }
  // Note: defaulting to 100 when buyerPct is undefined is intentionally kept for the admin path.
  // The auto-settle caller must ALWAYS pass an explicit buyerPct per the upstream guard.

  const price = parseInt(deed?.amount || 0, 10);
  const feeModelStatus = dispute.status === 'ESCALATED' ? 'ESCALATED' : 'RESOLVED';
  const split = calculateResolutionAmounts(price, finalBuyerPct, feeModelStatus);

  await prisma.$transaction(async (tx) => {
    // 1. Un-lock Buyer's balance (gte guard ensures we don't underflow or double-spend)
    const buyerId = deed.buyerId;
    const buyerWallet = await tx.wallet.findUnique({ where: { userId: buyerId } });
    if (!buyerWallet) throw new Error("BUYER_WALLET_NOT_FOUND");

    const priceInBuyerCurrency = convertCurrency(price, deed?.currency || 'INR', buyerWallet.currency);

    const updateLock = await tx.wallet.updateMany({
      where: { id: buyerWallet.id, lockedBalance: { gte: priceInBuyerCurrency } },
      data: { lockedBalance: { decrement: priceInBuyerCurrency } }
    });
    if (updateLock.count === 0) throw new Error("INSUFFICIENT_LOCKED_BALANCE");

    // 2. Refund/Penalty Buyer (increment/decrement)
    if (split.buyerNet !== 0) {
      const buyerNetInBuyerCurrency = convertCurrency(split.buyerNet, deed?.currency || 'INR', buyerWallet.currency);
      await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: { balance: { increment: buyerNetInBuyerCurrency } }
      });
      await tx.walletTransaction.create({
        data: {
          walletId: buyerWallet.id,
          type: "CREDIT",
          category: "DISPUTE_REFUND",
          amount: split.buyerGross,
          currency: deed?.currency || "INR",
          status: "SUCCESS",
          description: `Dispute Refund: ${deed?.title || dispute.id}`,
          reference: dispute.id,
          netAmount: split.buyerNet,
          fee: split.buyerFee,
          metadata: {
            feeTier: `DISPUTE_${feeModelStatus}_BUYER`,
            feePercentage: feeModelStatus === 'ESCALATED' ? 2 : (feeModelStatus === 'RESOLVED' ? 1 : 0),
            baseAmount: split.buyerGross,
            feeDeducted: split.buyerFee,
            convertedAmount: buyerNetInBuyerCurrency,
            walletCurrency: buyerWallet.currency
          }
        }
      });
    }

    // 3. Credit/Penalty Seller (increment/decrement)
    const sellerId = deed.sellerId;
    if (split.sellerNet !== 0 && sellerId) {
      let sellerWallet = await tx.wallet.findUnique({ where: { userId: sellerId } });
      if (!sellerWallet) {
        sellerWallet = await tx.wallet.create({
          data: { userId: sellerId, userRole: "seller", currency: deed?.currency || "INR" }
        });
      }
      
      const sellerNetInSellerCurrency = convertCurrency(split.sellerNet, deed?.currency || 'INR', sellerWallet.currency);

      await tx.wallet.update({
        where: { id: sellerWallet.id },
        data: { balance: { increment: sellerNetInSellerCurrency } }
      });
      await tx.walletTransaction.create({
        data: {
          walletId: sellerWallet.id,
          type: "CREDIT",
          category: "DISPUTE_RELEASE",
          amount: split.sellerGross,
          currency: deed?.currency || "INR",
          status: "SUCCESS",
          description: `Dispute Release: ${deed?.title || dispute.id}`,
          reference: dispute.id,
          netAmount: split.sellerNet,
          fee: split.sellerFee,
          metadata: {
            feeTier: `DISPUTE_${feeModelStatus}_SELLER`,
            feePercentage: feeModelStatus === 'ESCALATED' ? 4.5 : (feeModelStatus === 'RESOLVED' ? 3.5 : 0), // 2.5% base + 1% or 2%
            baseAmount: split.sellerGross,
            feeDeducted: split.sellerFee,
            convertedAmount: sellerNetInSellerCurrency,
            walletCurrency: sellerWallet.currency
          }
        }
      });
    }

    // --- End of Wallet updates ---

    // Write HUMAN_DECISION event
    await tx.disputeEvent.create({
      data: {
        deedDisputeId: dispute.id,
        eventType: undefined,
        type: 'HUMAN_DECISION',
        actorRole: actorRole,
        actorId: actorId,
        payload: JSON.stringify({ action: resolution, finalBuyerPct, notes: notes || '' })
      }
    });

    // Write SETTLEMENT event
    await tx.disputeEvent.create({
      data: {
        deedDisputeId: dispute.id,
        eventType: undefined,
        type: 'SETTLEMENT',
        actorRole: 'system',
        payload: JSON.stringify({ 
          buyerNet: split.buyerNet, sellerNet: split.sellerNet, 
          buyerFee: split.buyerFee, sellerFee: split.sellerFee, 
          platformFee: split.platformFee,
          fundsDisbursed: true
        })
      }
    });

    const currentTimeline = Array.isArray(dispute.timeline) ? dispute.timeline : [];
    const updateData = {
      status: 'RESOLVED',
      resolution,
      resolvedBy: actorId || 'system',
      resolvedAt: new Date(),
      timeline: [
        ...currentTimeline,
        {
          event: 'DISPUTE_RESOLVED',
          by: actorRole,
          timestamp: new Date().toISOString(),
          description: `${actorRole === 'admin' ? 'Admin resolved' : 'System auto-resolved'}: ${resolution} (Buyer: ${finalBuyerPct}%)`,
          notes: notes || '',
          enhancedAnalysis: enhancedAnalysis || null,
          scopeCompliance: scopeCompliance || null,
        },
      ],
      lastActivity: new Date(),
    };

    if (enhancedAnalysis) updateData.enhancedAnalysis = enhancedAnalysis;
    if (scopeCompliance) updateData.scopeCompliance = scopeCompliance;

    await tx.deedDispute.update({ where: { id: dispute.id }, data: updateData });

    if (dispute.deedId) {
      await tx.deed.update({
        where: { id: dispute.deedId },
        data: { status: 'CLOSED' }, 
      });
    }
  });
}

module.exports = { executeSettlementTransaction };

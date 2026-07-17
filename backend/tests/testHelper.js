const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const walletService = require('../services/walletService');

/**
 * Sets the wallet balance to the target amount by creating a TEST_ADJUSTMENT ledger transaction.
 * This ensures the database cache and the double-entry ledger remain synchronized during tests.
 * 
 * @param {string} userId - The user ID whose wallet balance should be adjusted.
 * @param {number} targetBalance - The desired target balance in smallest units (cents/paise).
 * @returns {object} The updated wallet object.
 */
async function setWalletBalance(userId, targetBalance) {
  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found for testing');

    // Calculate current ledger balance
    const transactions = await tx.walletTransaction.findMany({
      where: {
        walletId: wallet.id,
        status: 'SUCCESS',
      },
    });
    const currentBalance = walletService.calculateBalanceFromTransactions(transactions);

    const difference = targetBalance - currentBalance;

    if (difference !== 0) {
      const type = difference > 0 ? 'CREDIT' : 'DEBIT';
      const absDifference = Math.abs(difference);

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          category: 'TEST_ADJUSTMENT',
          amount: absDifference,
          netAmount: absDifference,
          status: 'SUCCESS',
          description: `Test setup adjustment to force balance to ${targetBalance}`,
        }
      });

      // Update the cache column
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: targetBalance }
      });
    }

    return await tx.wallet.findUnique({ where: { userId } });
  });
}

module.exports = {
  setWalletBalance,
};

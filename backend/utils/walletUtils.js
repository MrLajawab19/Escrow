const walletService = require('../services/walletService');

/**
 * Wallet Utilities - Helper functions for wallet initialization and management
 */

/**
 * Initialize wallet for a new user on signup
 */
async function initializeWalletForUser(userId, userRole, currency = 'USD') {
  try {
    const wallet = await walletService.getOrCreateWallet(userId, userRole, currency);
    return wallet;
  } catch (error) {
    console.error(`Failed to initialize wallet for user ${userId}:`, error);
    // Don't throw - let signup continue even if wallet init fails
    return null;
  }
}

/**
 * Get wallet summary for user profile/settings display
 */
async function getWalletSummaryForUser(userId) {
  try {
    const summary = await walletService.getWalletSummary(userId);
    return summary;
  } catch (error) {
    console.error(`Failed to get wallet summary for user ${userId}:`, error);
    return null;
  }
}

/**
 * Lock funds when order is funded by buyer
 */
async function handleOrderFunding(buyerId, orderId, amount, currency) {
  try {
    const transaction = await walletService.lockEscrowFunds(buyerId, orderId, amount, currency);
    return transaction;
  } catch (error) {
    console.error(`Failed to lock escrow funds for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Release funds when order is completed
 */
async function handleOrderCompletion(sellerId, orderId, amount, currency) {
  try {
    const transaction = await walletService.releaseEscrowFunds(sellerId, orderId, amount, currency);
    return transaction;
  } catch (error) {
    console.error(`Failed to release escrow funds for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Refund buyer when order is cancelled/refunded
 */
async function handleOrderRefund(buyerId, orderId, amount, currency, reason) {
  try {
    const transaction = await walletService.refundBuyer(buyerId, orderId, amount, currency, reason);
    return transaction;
  } catch (error) {
    console.error(`Failed to refund buyer for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Get user wallet with all necessary details
 */
async function getUserWallet(userId) {
  try {
    const wallet = await walletService.getWalletWithBalance(userId);
    return wallet;
  } catch (error) {
    console.error(`Failed to get wallet for user ${userId}:`, error);
    return null;
  }
}

module.exports = {
  initializeWalletForUser,
  getWalletSummaryForUser,
  handleOrderFunding,
  handleOrderCompletion,
  handleOrderRefund,
  getUserWallet,
};

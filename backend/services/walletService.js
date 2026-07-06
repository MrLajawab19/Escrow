const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
/**
 * Wallet Service - Handles all wallet operations
 * Implements double-entry ledger pattern for transactions
 */

class WalletService {
  /**
   * Initialize or get wallet for a user
   * @param {string} userId - Sequelize user UUID
   * @param {string} userRole - "buyer" or "seller"
   * @param {string} currency - Currency code (default: USD)
   */
  async getOrCreateWallet(userId, userRole, currency = 'USD') {
    try {
      let wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: { transactions: { take: 5, orderBy: { createdAt: 'desc' } } },
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId,
            userRole,
            currency,
          },
          include: { transactions: { take: 5, orderBy: { createdAt: 'desc' } } },
        });
      }

      return wallet;
    } catch (error) {
      throw new Error(`Failed to get/create wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet with balance calculation
   */
  async getWalletWithBalance(userId, userRole = 'unknown') {
    try {
      let wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: {
          transactions: {
            where: { status: 'SUCCESS' },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId,
            userRole,
            currency: 'USD',
            balance: 0,
          },
          include: {
            transactions: true,
          }
        });
      }

      // Calculate balance from transactions
      const calculatedBalance = this.calculateBalanceFromTransactions(wallet.transactions);
      const pendingBalance = this.calculatePendingBalance(wallet.transactions);

      return {
        ...wallet,
        calculatedBalance,
        pendingBalance,
      };
    } catch (error) {
      throw new Error(`Failed to get wallet with balance: ${error.message}`);
    }
  }

  /**
   * Create a transaction (double-entry ledger)
   */
  async createTransaction(walletId, type, category, amount, description, reference = null, metadata = null) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Calculate net amount (amount minus fees)
      let fee = 0;
      let netAmount = amount;

      // Apply fees for certain transaction types
      if (category === 'WITHDRAWAL') {
        fee = amount * 0.02; // 2% withdrawal fee
        netAmount = amount - fee;
      } else if (category === 'TOP_UP') {
        fee = amount * 0.01; // 1% payment processing fee
        netAmount = amount - fee;
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          walletId,
          type, // CREDIT or DEBIT
          category,
          amount,
          currency: wallet.currency,
          status: 'PENDING',
          description,
          reference,
          fee,
          netAmount,
          metadata: metadata || {},
        },
      });

      return transaction;
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  /**
   * Process a pending transaction to SUCCESS
   */
  async processTransaction(transactionId) {
    try {
      const transaction = await prisma.walletTransaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const updatedTransaction = await prisma.walletTransaction.update({
        where: { id: transactionId },
        data: { status: 'SUCCESS' },
      });

      // Update wallet balance based on transaction type
      await this.updateWalletBalance(transaction.walletId);

      return updatedTransaction;
    } catch (error) {
      throw new Error(`Failed to process transaction: ${error.message}`);
    }
  }

  /**
   * Fail a pending transaction
   */
  async failTransaction(transactionId, reason = null) {
    try {
      const transaction = await prisma.walletTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          metadata: {
            ...transaction.metadata,
            failureReason: reason,
            failedAt: new Date(),
          },
        },
      });

      return transaction;
    } catch (error) {
      throw new Error(`Failed to fail transaction: ${error.message}`);
    }
  }

  /**
   * Lock funds for escrow
   */
  async lockEscrowFunds(buyerId, orderId, amount, currency = 'USD') {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: buyerId },
      });

      if (!wallet) {
        throw new Error('Buyer wallet not found');
      }

      const transaction = await this.createTransaction(
        wallet.id,
        'DEBIT',
        'ESCROW_LOCK',
        amount,
        `Escrow locked for order ${orderId}`,
        orderId,
        { orderStatus: 'ESCROW_FUNDED' }
      );

      // Process the transaction immediately
      await this.processTransaction(transaction.id);

      return transaction;
    } catch (error) {
      throw new Error(`Failed to lock escrow funds: ${error.message}`);
    }
  }

  /**
   * Release escrow funds to seller
   */
  async releaseEscrowFunds(sellerId, orderId, amount, currency = 'USD') {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: sellerId },
      });

      if (!wallet) {
        throw new Error('Seller wallet not found');
      }

      const transaction = await this.createTransaction(
        wallet.id,
        'CREDIT',
        'ESCROW_RELEASE',
        amount,
        `Escrow released for order ${orderId}`,
        orderId,
        { orderStatus: 'RELEASED' }
      );

      // Process the transaction immediately
      await this.processTransaction(transaction.id);

      return transaction;
    } catch (error) {
      throw new Error(`Failed to release escrow funds: ${error.message}`);
    }
  }

  /**
   * Refund buyer
   */
  async refundBuyer(buyerId, orderId, amount, currency = 'USD', reason = 'Order refunded') {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: buyerId },
      });

      if (!wallet) {
        throw new Error('Buyer wallet not found');
      }

      const transaction = await this.createTransaction(
        wallet.id,
        'CREDIT',
        'REFUND',
        amount,
        `${reason} for order ${orderId}`,
        orderId,
        { orderStatus: 'REFUNDED' }
      );

      // Process the transaction immediately
      await this.processTransaction(transaction.id);

      return transaction;
    } catch (error) {
      throw new Error(`Failed to refund buyer: ${error.message}`);
    }
  }

  /**
   * Top up wallet (add funds)
   */
  async topUpWallet(userId, amount, paymentMethod = 'card', reference = null) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const transaction = await this.createTransaction(
        wallet.id,
        'CREDIT',
        'TOP_UP',
        amount,
        `Top-up via ${paymentMethod}`,
        reference,
        { paymentMethod, topUpDate: new Date() }
      );

      // Process the transaction immediately
      await this.processTransaction(transaction.id);

      return transaction;
    } catch (error) {
      throw new Error(`Failed to top up wallet: ${error.message}`);
    }
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(userId, amount, bankDetails) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check if sufficient balance
      const balance = await this.getCalculatedBalance(wallet.id);
      if (balance < amount) {
        throw new Error('Insufficient balance for withdrawal');
      }

      const transaction = await this.createTransaction(
        wallet.id,
        'DEBIT',
        'WITHDRAWAL',
        amount,
        'Withdrawal requested',
        null,
        { bankDetails, withdrawalStatus: 'PENDING', requestedAt: new Date() }
      );

      return transaction;
    } catch (error) {
      throw new Error(`Failed to request withdrawal: ${error.message}`);
    }
  }

  /**
   * Complete withdrawal (after verification)
   */
  async completeWithdrawal(transactionId) {
    try {
      const transaction = await this.processTransaction(transactionId);
      return transaction;
    } catch (error) {
      throw new Error(`Failed to complete withdrawal: ${error.message}`);
    }
  }

  /**
   * Get transaction history for a wallet
   */
  async getTransactionHistory(userId, limit = 50, offset = 0, filter = null) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const whereClause = { walletId: wallet.id };

      // Apply filters
      if (filter?.category) {
        whereClause.category = filter.category;
      }
      if (filter?.type) {
        whereClause.type = filter.type;
      }
      if (filter?.status) {
        whereClause.status = filter.status;
      }
      if (filter?.startDate || filter?.endDate) {
        whereClause.createdAt = {};
        if (filter.startDate) {
          whereClause.createdAt.gte = new Date(filter.startDate);
        }
        if (filter.endDate) {
          whereClause.createdAt.lte = new Date(filter.endDate);
        }
      }

      const transactions = await prisma.walletTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await prisma.walletTransaction.count({
        where: whereClause,
      });

      return {
        transactions,
        total,
        limit,
        offset,
      };
    } catch (error) {
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  /**
   * Get wallet summary
   */
  async getWalletSummary(userId, userRole = 'unknown') {
    try {
      let wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId,
            userRole,
            currency: 'USD',
            balance: 0,
          },
          include: {
            transactions: true,
          }
        });
      }

      const balance = this.calculateBalanceFromTransactions(wallet.transactions);
      const pendingBalance = this.calculatePendingBalance(wallet.transactions);

      const successfulTransactions = wallet.transactions.filter(t => t.status === 'SUCCESS');
      const creditTransactions = successfulTransactions.filter(t => t.type === 'CREDIT');
      const debitTransactions = successfulTransactions.filter(t => t.type === 'DEBIT');

      const totalCredit = creditTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalDebit = debitTransactions.reduce((sum, t) => sum + t.amount, 0);

      const monthlyStats = this.calculateMonthlyStats(successfulTransactions);

      // Calculate role-specific states using Sequelize Order model
      let lockedEscrowBalance = 0;
      let pendingRefundBalance = 0;
      let pendingEarnings = 0;
      let underDisputeAmount = 0;
      let withdrawnAmount = 0;

      const activeStatuses = ['ESCROW_FUNDED', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'DISPUTED', 'CHANGES_REQUESTED'];

      if (wallet.userRole === 'buyer') {
        const activeBuyerOrders = await prisma.order.findMany({
          where: { buyerId: userId, status: { in: activeStatuses } },
        });
        activeBuyerOrders.forEach(order => {
          const scopeBox = order.scopeBox && typeof order.scopeBox === 'object' ? order.scopeBox : {};
          if (order.status === 'DISPUTED') {
            pendingRefundBalance += parseFloat(scopeBox.price || 0);
          } else {
            lockedEscrowBalance += parseFloat(scopeBox.price || 0);
          }
        });
      } else if (wallet.userRole === 'seller') {
        const activeSellerOrders = await prisma.order.findMany({
          where: { sellerId: userId, status: { in: activeStatuses } },
        });
        activeSellerOrders.forEach(order => {
          const scopeBox = order.scopeBox && typeof order.scopeBox === 'object' ? order.scopeBox : {};
          if (order.status === 'DISPUTED') {
            underDisputeAmount += parseFloat(scopeBox.price || 0);
          } else {
            pendingEarnings += parseFloat(scopeBox.price || 0);
          }
        });

        withdrawnAmount = debitTransactions
          .filter(t => t.category === 'WITHDRAWAL')
          .reduce((sum, t) => sum + t.amount, 0);
      }

      return {
        balance,
        pendingBalance,
        lockedEscrowBalance,
        pendingRefundBalance,
        pendingEarnings,
        underDisputeAmount,
        withdrawnAmount,
        userRole: wallet.userRole,
        currency: wallet.currency,
        totalCredit,
        totalDebit,
        totalTransactions: wallet.transactions.length,
        monthlyStats,
        lastTransaction: wallet.transactions[0] || null,
      };
    } catch (error) {
      throw new Error(`Failed to get wallet summary: ${error.message}`);
    }
  }

  /**
   * Helper: Calculate balance from transactions
   */
  calculateBalanceFromTransactions(transactions) {
    return transactions.reduce((balance, transaction) => {
      if (transaction.status !== 'SUCCESS') return balance;
      if (transaction.type === 'CREDIT') {
        return balance + transaction.netAmount;
      } else if (transaction.type === 'DEBIT') {
        return balance - transaction.netAmount;
      }
      return balance;
    }, 0);
  }

  /**
   * Helper: Calculate pending balance
   */
  calculatePendingBalance(transactions) {
    return transactions
      .filter(t => t.status === 'PENDING' && t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.netAmount, 0);
  }

  /**
   * Helper: Get calculated balance for a wallet
   */
  async getCalculatedBalance(walletId) {
    try {
      const transactions = await prisma.walletTransaction.findMany({
        where: {
          walletId,
          status: 'SUCCESS',
        },
      });

      return this.calculateBalanceFromTransactions(transactions);
    } catch (error) {
      throw new Error(`Failed to calculate balance: ${error.message}`);
    }
  }

  /**
   * Helper: Calculate monthly statistics
   */
  calculateMonthlyStats(transactions) {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const monthlyTransactions = transactions.filter(t => t.createdAt >= oneMonthAgo);
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.netAmount, 0);
    const monthlyExpense = monthlyTransactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + t.netAmount, 0);

    return {
      monthlyIncome,
      monthlyExpense,
      monthlyNet: monthlyIncome - monthlyExpense,
    };
  }
}

module.exports = new WalletService();

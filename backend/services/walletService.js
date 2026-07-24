const { validateAmount } = require('../utils/validationUtils');
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

      // Apply fees for certain transaction types
      // Phase 1: Zero-fee top-up and withdrawal. 
      // Fees are now handled manually at the deed resolution stage.
      let fee = 0;
      let netAmount = amount;

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
   * Fail a pending transaction
   */
  async failTransaction(transactionId, reason = null) {
    try {
      return await prisma.$transaction(async (tx) => {
        const transaction = await tx.walletTransaction.findUnique({
          where: { id: transactionId },
          include: { wallet: true }
        });

        if (!transaction) {
          throw new Error('Transaction not found');
        }

        if (transaction.status === 'FAILED') {
          return transaction; // Already failed (Idempotency)
        }

        // 1. Mark as failed
        const updatedTransaction = await tx.walletTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'FAILED',
            metadata: {
              ...(transaction.metadata || {}),
              failureReason: reason,
              failedAt: new Date(),
            },
          },
        });

        // 2. Refund the balance atomically if it was a withdrawal
        if (transaction.type === 'DEBIT' && transaction.category === 'WITHDRAWAL') {
          await tx.wallet.update({
            where: { id: transaction.walletId },
            data: { balance: { increment: transaction.amount } }
          });
        }

        return updatedTransaction;
      });
    } catch (error) {
      throw new Error(`Failed to fail transaction: ${error.message}`);
    }
  }

  /**
   * Top up wallet (add funds)
   */
  async topUpWallet(userId, amount, paymentMethod = 'card', reference = null, razorpayOrderId = null) {
    try {
      validateAmount(amount);
      return await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new Error('Wallet not found');
        
        // 1. Acquire row-level lock on the wallet
        await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${wallet.id} FOR UPDATE`;

        // 2. Check for existing successful transaction
        if (razorpayOrderId) {
          const existingSuccess = await tx.walletTransaction.findFirst({
            where: { walletId: wallet.id, razorpayOrderId, status: 'SUCCESS' }
          });
          if (existingSuccess) return existingSuccess;
        }

        // 3. Handle INITIATED -> SUCCESS upgrade or create new
        let transaction;
        if (razorpayOrderId) {
          const existingInitiated = await tx.walletTransaction.findFirst({
            where: { walletId: wallet.id, category: 'TOP_UP', status: 'INITIATED', razorpayOrderId }
          });

          if (existingInitiated) {
            transaction = await tx.walletTransaction.update({
              where: { id: existingInitiated.id },
              data: { status: 'SUCCESS', metadata: { paymentMethod, topUpDate: new Date() } }
            });
          }
        }

        if (!transaction) {
          transaction = await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'CREDIT',
              category: 'TOP_UP',
              amount,
              currency: wallet.currency,
              description: `Top-up via ${paymentMethod}`,
              reference,
              razorpayOrderId,
              fee: 0,
              netAmount: amount,
              status: 'SUCCESS',
              metadata: { paymentMethod, topUpDate: new Date() }
            }
          });
        }

        // 4. Update balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amount } }
        });

        return transaction;
      });
    } catch (error) {
      throw new Error(`Failed to top up wallet: ${error.message}`);
    }
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(userId, amount, bankDetails) {
    try {
      validateAmount(amount);
      return await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new Error('Wallet not found');
        
        // 1. Acquire row-level lock on the user's wallet to prevent concurrent overdrafts
        await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${wallet.id} FOR UPDATE`;

        // 2. Compute canonical ledger balance
        const transactions = await tx.walletTransaction.findMany({
          where: {
            walletId: wallet.id,
            status: 'SUCCESS',
          },
        });
        
        // We use the shared logic for ledger sums
        const ledgerBalance = transactions.reduce((acc, t) => {
          if (t.type === 'CREDIT') return acc + t.netAmount;
          if (t.type === 'DEBIT') return acc - t.netAmount;
          return acc;
        }, 0);
        
        if (ledgerBalance < amount) {
          throw new Error('Insufficient balance for withdrawal');
        }

        // 3. Keep the cache column updated, and auto-correct any prior drift
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: ledgerBalance - amount }
        });

        // Phase 1: Zero-fee withdrawals (flat pass-through fee to be added later)
        const fee = 0;
        const netAmount = amount;

        let transaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'DEBIT',
            category: 'WITHDRAWAL',
            amount,
            currency: wallet.currency,
            description: 'Withdrawal requested',
            reference: null,
            fee,
            netAmount,
            status: 'PENDING', // MUST BE PENDING initially!
            metadata: { bankDetails, withdrawalStatus: 'REQUESTED', requestedAt: new Date(), payoutMethod: 'simulated_or_razorpay' }
          }
        });

        return transaction;
      });
    } catch (error) {
      throw new Error(`Failed to request withdrawal: ${error.message}`);
    }
  }

  /**
   * Complete withdrawal (after verification)
   */
  async completeWithdrawal(transactionId) {
    try {
      return await prisma.$transaction(async (tx) => {
        const transaction = await tx.walletTransaction.findUnique({
          where: { id: transactionId },
        });

        if (!transaction) throw new Error('Transaction not found');
        if (transaction.status === 'SUCCESS') return transaction; // Idempotency

        const updatedTx = await tx.walletTransaction.update({
          where: { id: transactionId },
          data: { 
            status: 'SUCCESS',
            metadata: {
               ...(transaction.metadata || {}),
               withdrawalStatus: 'PROCESSED',
               processedAt: new Date()
            }
          },
        });

        return updatedTx;
      });
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
        where: { userId }
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId,
            userRole,
            currency: 'INR',
            balance: 0,
            lockedBalance: 0
          }
        });
      }

      // Aggregate: Lifetime Earnings
      const lifetimeEarningsAgg = await prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { 
          walletId: wallet.id, 
          type: 'CREDIT', 
          category: 'ESCROW_RELEASE', 
          status: 'SUCCESS' 
        }
      });

      // Aggregate: Total Withdrawn
      const totalWithdrawnAgg = await prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { 
          walletId: wallet.id, 
          category: 'WITHDRAWAL', 
          status: 'SUCCESS' 
        }
      });

      // Aggregate: Pending Withdrawals
      const pendingWithdrawalsAgg = await prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { 
          walletId: wallet.id, 
          category: 'WITHDRAWAL', 
          status: 'PENDING' 
        }
      });

      // Aggregate: Order counts
      let activeOrders = 0;
      let completedOrders = 0;

      if (wallet.userRole === 'buyer') {
        activeOrders = await prisma.deed.count({
          where: { 
            buyerId: userId, 
            status: { in: ['PENDING_SELLER', 'PENDING_SIGNATURES', 'ACTIVE', 'SUBMITTED', 'CHANGES_REQUESTED', 'DISPUTED'] } 
          }
        });
        completedOrders = await prisma.deed.count({
          where: { buyerId: userId, status: 'CLOSED' }
        });
      } else if (wallet.userRole === 'seller') {
        activeOrders = await prisma.deed.count({
          where: { 
            sellerId: userId, 
            status: { in: ['ACTIVE', 'SUBMITTED', 'CHANGES_REQUESTED', 'DISPUTED'] } 
          }
        });
        completedOrders = await prisma.deed.count({
          where: { sellerId: userId, status: 'CLOSED' }
        });
      }

      return {
        balance: wallet.balance || 0,
        lockedBalance: wallet.lockedBalance || 0,
        lifetimeEarnings: lifetimeEarningsAgg._sum.amount || 0,
        totalWithdrawn: totalWithdrawnAgg._sum.amount || 0,
        pendingWithdrawalAmount: pendingWithdrawalsAgg._sum.amount || 0,
        activeOrders,
        completedOrders,
        userRole: wallet.userRole,
        currency: wallet.currency
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

  /**
   * Read-only reconciliation of locked balance against active Deeds.
   * 
   * ARCHITECTURE NOTE:
   * Do not reconstruct a buyer's locked balance purely from WalletTransaction history
   * (e.g. by summing ESCROW_LOCKs). When a deed is closed (via releasePayment or refundBuyer), 
   * the buyer's `wallet.lockedBalance` is decremented directly, but no offsetting 
   * WalletTransaction is created on the buyer's wallet (the ESCROW_RELEASE goes to the seller).
   * Therefore, a simple sum of ESCROW_LOCK transactions will always overshoot the true 
   * locked balance by the sum of all closed deeds. Always derive the true locked balance 
   * by summing active Deeds, as done below.
   */
  async verifyLockedBalance(userId) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found');

    const activeDeedStatuses = [
      'PENDING_SELLER', 'PENDING_SIGNATURES', 'ACTIVE', 'ESCROW_LOCKED', 
      'IN_PROGRESS', 'SUBMITTED', 'CONFIRMED', 'DISPUTED', 'ARBITRATING', 
      'ARBITRATED', 'ESCALATED', 'CHANGES_REQUESTED'
    ];

    const aggregate = await prisma.deed.aggregate({
      _sum: { amount: true },
      where: {
        buyerId: userId,
        status: { in: activeDeedStatuses }
      }
    });

    const derivedLockedBalance = aggregate._sum.amount || 0;
    const storedLockedBalance = wallet.lockedBalance;
    const mismatch = storedLockedBalance !== derivedLockedBalance;

    return {
      userId,
      storedLockedBalance,
      derivedLockedBalance,
      difference: storedLockedBalance - derivedLockedBalance,
      isMatch: !mismatch
    };
  }

}

module.exports = new WalletService();

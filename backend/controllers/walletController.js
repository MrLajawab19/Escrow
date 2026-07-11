const walletService = require('../services/walletService');

/**
 * Wallet Controller - Handles all wallet API endpoints
 */

// Get or create wallet
exports.getOrCreateWallet = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const { userRole, currency } = req.body;

    if (!userId || !userRole) {
      return res.status(400).json({
        success: false,
        message: 'User ID and role are required',
      });
    }

    const wallet = await walletService.getOrCreateWallet(userId, userRole, currency);

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get wallet with balance
exports.getWallet = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const userRole = req.user?.role;
    const wallet = await walletService.getWalletWithBalance(userId, userRole);

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get wallet summary
exports.getWalletSummary = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const userRole = req.user?.role;
    const summary = await walletService.getWalletSummary(userId, userRole);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 50, offset = 0, category, type, status, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const filter = {};
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;

    const result = await walletService.getTransactionHistory(
      userId,
      parseInt(limit),
      parseInt(offset),
      Object.keys(filter).length > 0 ? filter : null
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Top up wallet
exports.topUpWallet = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { amount, paymentMethod = 'card', reference } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    // In a real scenario, you would integrate with a payment gateway here (Stripe, PayPal, etc.)
    // For now, we'll simulate the transaction

    const transaction = await walletService.topUpWallet(userId, amount, paymentMethod, reference);

    res.json({
      success: true,
      message: 'Top-up successful',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Request withdrawal
exports.requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { amount, bankDetails } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    if (!bankDetails) {
      return res.status(400).json({
        success: false,
        message: 'Bank details are required',
      });
    }

    const transaction = await walletService.requestWithdrawal(userId, amount, bankDetails);

    res.json({
      success: true,
      message: 'Withdrawal request submitted',
      data: transaction,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Complete withdrawal (Admin only)
exports.completeWithdrawal = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
      });
    }

    const transaction = await walletService.completeWithdrawal(transactionId);

    res.json({
      success: true,
      message: 'Withdrawal completed',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



    });
  }
};

// Fail transaction (Admin only)
exports.failTransaction = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { transactionId } = req.params;
    const { reason } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
      });
    }

    const transaction = await walletService.failTransaction(transactionId, reason);

    res.json({
      success: true,
      message: 'Transaction marked as failed',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get pending withdrawals (Admin only)
exports.getPendingWithdrawals = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const pendingWithdrawals = await prisma.walletTransaction.findMany({
      where: {
        category: 'WITHDRAWAL',
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: true
      }
    });

    res.json({
      success: true,
      data: pendingWithdrawals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

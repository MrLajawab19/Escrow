const Razorpay = require('razorpay');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  /**
   * Create a Top-Up Order in Razorpay.
   * If targetDeedId is provided, the webhook will fund the deed via JIT immediately after top-up.
   */
  async createTopUpOrder(userId, amountPaise, targetDeedId = null) {
    if (!amountPaise || amountPaise <= 0) throw new Error('Invalid amount');

    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt: `topup_${Date.now()}_${userId.substring(0, 8)}`,
      notes: {
        userId,
        type: targetDeedId ? 'jit_topup' : 'wallet_topup',
        targetDeedId: targetDeedId || undefined,
      },
    };

    const order = await this.razorpay.orders.create(options);
    if (!order) throw new Error('Failed to create Razorpay order');
    
    return order;
  }

  /**
   * Request a payout for withdrawal.
   */
  async createPayout(userId, amountPaise, payoutMethod, bankDetails, referenceId) {
    // Note: RazorpayX Payouts API requires RazorpayX credentials and active balance.
    // We initiate the payout here and attach our internal transaction referenceId.
    const payoutOptions = {
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER, // The business funding account
      fund_account_id: bankDetails.fundAccountId, // Assumes seller has a linked Razorpay Fund Account
      amount: amountPaise,
      currency: "INR",
      mode: payoutMethod === "IMPS" ? "IMPS" : "NEFT",
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: referenceId,
      notes: { userId },
    };

    try {
      // In a real environment with RazorpayX enabled, we call:
      // const payout = await this.razorpay.payouts.create(payoutOptions);
      // For now, since Razorpay standard test mode doesn't support live payouts API directly without RazorpayX,
      // we log it and simulate success for the webhook.
      console.log('Initiating Razorpay Payout (Simulated for non-RazorpayX test mode):', payoutOptions);
      
      return { 
        id: `pout_sim_${Date.now()}`, 
        status: 'processing', 
        reference_id: referenceId 
      };
    } catch (error) {
      console.error('Razorpay Payout Error:', error);
      throw new Error('Failed to initiate payout with payment gateway.');
    }
  }

  /**
   * Verify Webhook Signature
   */
  verifyWebhookSignature(payload, signature) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('Webhook secret not configured');

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }

}

module.exports = new PaymentService();

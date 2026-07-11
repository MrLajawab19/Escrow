const deedService = require("../services/deedService");
exports.createDeed = async (req, res) => {
  try {
    const deed = await deedService.createDeed(req.user.id, req.body);
    res.status(201).json({ success: true, data: deed });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.fundDeed = async (req, res) => {
  try {
    const deedId = req.params.id;
    const buyerId = req.user.id;
    
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    
    if (!deed || deed.buyerId !== buyerId) {
       return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
       return res.status(400).json({ success: false, message: 'Payments not yet configured.' });
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    const options = {
      amount: deed.amount, // already paise
      currency: deed.currency || "INR",
      receipt: `deed_${deed.id.substring(0, 8)}`,
      notes: { orderId: deed.id, buyerId, type: 'deed' }
    };
    
    const razorpayOrder = await razorpay.orders.create(options);
    
    res.status(200).json({ 
      success: true, 
      data: {
         razorpayOrderId: razorpayOrder.id,
         amount: razorpayOrder.amount,
         currency: razorpayOrder.currency,
         orderId: deed.id
      },
      message: "Razorpay order created successfully." 
    });
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(400).json({ success: false, message: error.message || error.description || "Unknown error" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const deedId = req.params.id;
    const buyerId = req.user.id;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    
    const crypto = require("crypto");
    console.log("Verify Payment Body:", req.body);
    console.log("Secret:", process.env.RAZORPAY_KEY_SECRET);

    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed || deed.buyerId !== buyerId) {
       return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment verification failed: Invalid signature",
        debug: { generated_signature, razorpay_signature, razorpay_order_id, razorpay_payment_id }
      });
    }

    if (deed.status === "DRAFT") {
      await deedService.fundDeed(deedId, buyerId);
    }

    res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

exports.acceptDeed = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Invite token is required." });
    
    // req.user.id is the seller
    const result = await deedService.sellerJoin(token, req.user.id);
    res.status(200).json({ success: true, data: result, message: "Deed accepted. Order created." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getBuyerDeeds = async (req, res) => {
  try {
    // In a real implementation we would fetch these from prisma using the deedService
    // For MVP, we can directly fetch from prisma here or add it to deedService.
    
    const deeds = await prisma.deed.findMany({
      where: { buyerId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: deeds });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSellerDeeds = async (req, res) => {
  try {
    
    const deeds = await prisma.deed.findMany({
      where: { sellerId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: deeds });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getDeedByInvite = async (req, res) => {
  try {
    const deed = await deedService.getDeedByInviteToken(req.params.token);
    if (!deed) return res.status(404).json({ success: false, message: 'Deed not found or invite expired' });
    res.json({ success: true, data: deed });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getDeedById = async (req, res) => {
  try {
    
    const deed = await prisma.deed.findUnique({
      where: { id: req.params.id },
      include: {
        milestones: { orderBy: { milestoneNumber: 'asc' } },
        ledgerEntries: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!deed) {
      return res.status(404).json({ success: false, message: 'Deed not found' });
    }

    if (deed.buyerId !== req.user.id && deed.sellerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.status(200).json({ success: true, data: deed });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.signDeedBuyer = async (req, res) => {
  try {
    const updated = await deedService.signDeed(req.params.id, req.user.id, 'buyer');
    res.status(200).json({ success: true, data: updated, message: 'Deed signed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.signDeedSeller = async (req, res) => {
  try {
    const updated = await deedService.signDeed(req.params.id, req.user.id, 'seller');
    res.status(200).json({ success: true, data: updated, message: 'Deed signed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Money Moving Actions ────────────────────────────────────────────────────────

exports.releasePayment = async (req, res) => {
  try {
    const deedId = req.params.id;
    const buyerId = req.user.id;
    
    
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) return res.status(404).json({ success: false, message: "Deed not found" });
    if (deed.buyerId !== buyerId) return res.status(403).json({ success: false, message: "Unauthorized" });

    // If it's SUBMITTED, auto-confirm it since the frontend merged 'Approve' and 'Release'
    const deedService = require('../services/deedService');
    if (deed.status === "SUBMITTED") {
      await deedService.confirmDelivery(deedId, buyerId);
      deed.status = "CONFIRMED";
    }

    // Explicit Status Check
    if (!["CONFIRMED", "ARBITRATED"].includes(deed.status)) {
      return res.status(400).json({ success: false, message: "Deed is not in a releasable state" });
    }

    const updated = await deedService.releasePayment(deedId, 'buyer');
    
    // For legacy frontend compatibility, return the updated deed as 'data'
    res.status(200).json({ success: true, data: updated, message: "Funds released to seller" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.cancelDeed = async (req, res) => {
  try {
    const deedId = req.params.id;
    const buyerId = req.user.id;
    
    
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) return res.status(404).json({ success: false, message: "Deed not found" });
    if (deed.buyerId !== buyerId) return res.status(403).json({ success: false, message: "Unauthorized" });

    // Explicit Status Check
    if (!["PENDING_SELLER", "PENDING_SIGNATURES"].includes(deed.status)) {
      return res.status(400).json({ success: false, message: "Deed cannot be cancelled in its current state" });
    }

    const updated = await deedService.refundBuyer(deedId, 'buyer');
    
    res.status(200).json({ success: true, data: updated, message: "Deed cancelled and refunded" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.rejectDeed = async (req, res) => {
  try {
    const deedId = req.params.id;
    const sellerId = req.user.id;
    
    
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) return res.status(404).json({ success: false, message: "Deed not found" });
    if (deed.sellerId !== sellerId) return res.status(403).json({ success: false, message: "Unauthorized" });

    // Explicit Status Check
    if (!["PENDING_SIGNATURES"].includes(deed.status)) {
      return res.status(400).json({ success: false, message: "Deed cannot be rejected in its current state" });
    }

    const updated = await deedService.refundBuyer(deedId, 'seller');
    
    res.status(200).json({ success: true, data: updated, message: "Deed rejected and refunded to buyer" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.adminRefund = async (req, res) => {
  try {
    const deedId = req.params.id;
    // Middleware authenticateAdmin guarantees req.user is admin
    
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    if (!deed) return res.status(404).json({ success: false, message: "Deed not found" });
    
    // Explicit Status Check (Admin can refund anything that isn't already closed/refunded)
    if (deed.status === "CLOSED") {
      return res.status(400).json({ success: false, message: "Deed is already closed or refunded" });
    }

    const updated = await deedService.refundBuyer(deedId, 'admin');
    
    res.status(200).json({ success: true, data: updated, message: "Deed refunded by admin" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};




exports.submitDelivery = async (req, res) => {
  try {
    const deedId = req.params.id;
    const sellerId = req.user.id;
    const updated = await deedService.submitDelivery(deedId, sellerId, req.body);
    res.status(200).json({ success: true, data: updated, message: "Delivery submitted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.confirmDelivery = async (req, res) => {
  try {
    const deedId = req.params.id;
    const buyerId = req.user.id;
    const updated = await deedService.confirmDelivery(deedId, buyerId);
    res.status(200).json({ success: true, data: updated, message: "Delivery confirmed" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.raiseDispute = async (req, res) => {
  try {
    const deedId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role; // Needs to be 'buyer' or 'seller' depending on auth
    const updated = await deedService.raiseDispute(deedId, userId, role, req.body);
    res.status(200).json({ success: true, data: updated, message: "Dispute raised successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.requestChanges = async (req, res) => {
  try {
    const deedId = req.params.id;
    const buyerId = req.user.id;
    const updated = await deedService.requestChanges(deedId, buyerId, req.body);
    res.status(200).json({ success: true, data: updated, message: "Changes requested" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.acceptChanges = async (req, res) => {
  try {
    const deedId = req.params.id;
    const sellerId = req.user.id;
    const updated = await deedService.acceptChanges(deedId, sellerId);
    res.status(200).json({ success: true, data: updated, message: "Changes accepted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.rejectChanges = async (req, res) => {
  try {
    const deedId = req.params.id;
    const sellerId = req.user.id;
    const updated = await deedService.rejectChanges(deedId, sellerId);
    res.status(200).json({ success: true, data: updated, message: "Changes rejected and dispute raised" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

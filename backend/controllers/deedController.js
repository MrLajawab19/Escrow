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
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    const deed = await prisma.deed.findUnique({ where: { id: deedId } });
    
    if (!deed || deed.buyerId !== buyerId) {
       return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    const options = {
      amount: deed.amount * 100, // paise
      currency: deed.currency || "INR",
      receipt: `receipt_deed_${deed.id}`,
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
    res.status(400).json({ success: false, message: error.message });
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
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
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
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
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
    const deedService = require('../services/deedService');
    const deed = await deedService.getDeedByInviteToken(req.params.token);
    if (!deed) return res.status(404).json({ success: false, message: 'Deed not found or invite expired' });
    res.json({ success: true, data: deed });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getDeedById = async (req, res) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
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
    const deedService = require('../services/deedService');
    const updated = await deedService.signDeed(req.params.id, req.user.id, 'buyer');
    res.status(200).json({ success: true, data: updated, message: 'Deed signed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.signDeedSeller = async (req, res) => {
  try {
    const deedService = require('../services/deedService');
    const updated = await deedService.signDeed(req.params.id, req.user.id, 'seller');
    res.status(200).json({ success: true, data: updated, message: 'Deed signed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


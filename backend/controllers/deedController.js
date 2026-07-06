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
    const deed = await deedService.fundDeed(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: deed, message: "Deed funded successfully." });
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


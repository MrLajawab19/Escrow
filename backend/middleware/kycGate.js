const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const requireKYC = async (req, res, next) => {
  try {
    const amount = req.body.amount;
    
    // If amount is <= 10000, KYC is not strictly required to proceed
    if (!amount || amount <= 10000) {
      return next();
    }

    const userId = req.user.id;
    const kyc = await prisma.kYC.findUnique({ where: { userId } });

    if (!kyc || !kyc.kycComplete) {
      return res.status(403).json({
        success: false,
        message: 'KYC Verification Required. You must complete identity verification to create deeds above ₹10,000.',
        requiresKYC: true
      });
    }

    next();
  } catch (error) {
    console.error("KYC Gate Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error checking KYC status' });
  }
};

module.exports = { requireKYC };

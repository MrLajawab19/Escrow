const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const smsService = require('./smsService');

class KYCService {
  async getOrCreateKYCRecord(userId, userRole) {
    let kyc = await prisma.kYC.findUnique({ where: { userId } });
    if (!kyc) {
      // Create a default placeholder record. 
      // The user will fill details later.
      kyc = await prisma.kYC.create({
        data: {
          userId,
          userRole,
          phone: '',
          fullLegalName: '',
          dateOfBirth: '',
        }
      });
    }
    return kyc;
  }

  async getStatus(userId) {
    const kyc = await prisma.kYC.findUnique({ where: { userId } });
    if (!kyc) {
      return { phoneVerified: false, kycComplete: false, reviewStatus: 'PENDING' };
    }
    // reviewStatus is not in the schema yet for Subphase 3.1, so we mock it for now.
    // We will add it in Subphase 3.2.
    return {
      phoneVerified: kyc.phoneVerified,
      kycComplete: kyc.kycComplete,
      reviewStatus: kyc.kycComplete ? 'APPROVED' : 'PENDING'
    };
  }

  async sendOTP(userId, userRole, phone) {
    // Basic rate limit check: count OTPs sent in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await prisma.oTPRecord.count({
      where: {
        phone,
        purpose: 'PHONE_VERIFICATION',
        createdAt: { gte: oneHourAgo }
      }
    });

    if (recentOTPs >= 3) {
      throw new Error("Maximum OTP attempts reached. Try again in an hour.");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB
    await prisma.oTPRecord.create({
      data: {
        phone,
        otpHash,
        purpose: 'PHONE_VERIFICATION',
        expiresAt
      }
    });

    // We also make sure the user has a KYC record to tie this phone to eventually.
    let kyc = await this.getOrCreateKYCRecord(userId, userRole);
    // Update the phone number on KYC (unverified)
    await prisma.kYC.update({
      where: { id: kyc.id },
      data: { phone }
    });

    // Send SMS
    await smsService.sendOTP(phone, otp);

    return { success: true, message: "OTP sent successfully" };
  }

  async verifyOTP(userId, userRole, phone, otp) {
    // Find the latest unused OTP for this phone
    const record = await prisma.oTPRecord.findFirst({
      where: {
        phone,
        purpose: 'PHONE_VERIFICATION',
        used: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      throw new Error("Invalid or expired OTP");
    }

    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
      throw new Error("Incorrect OTP");
    }

    // Mark used
    await prisma.oTPRecord.update({
      where: { id: record.id },
      data: { used: true }
    });

    // Update KYC
    await prisma.kYC.update({
      where: { userId },
      data: { phoneVerified: true, phone }
    });

    // Sync phone to Buyer/Seller record
    if (userRole.toLowerCase() === 'buyer') {
      await prisma.buyer.update({ where: { id: userId }, data: { phone } });
    } else {
      await prisma.seller.update({ where: { id: userId }, data: { phone } });
    }

    return { success: true, message: "Phone verified successfully" };
  async submitID(userId, data) {
    const kyc = await prisma.kYC.findUnique({ where: { userId } });
    if (!kyc) throw new Error('KYC record not found');
    if (!kyc.phoneVerified) throw new Error('Please verify your phone number first');

    await prisma.kYC.update({
      where: { userId },
      data: {
        idDocType: data.idDocType,
        fullLegalName: data.fullLegalName,
        dateOfBirth: data.dateOfBirth,
        idDocUrls: data.idDocUrls,
        submittedAt: new Date(),
        reviewStatus: 'PENDING'
      }
    });

    return { success: true, message: 'ID documents submitted successfully. Waiting for admin approval.' };
  }
}

module.exports = new KYCService();


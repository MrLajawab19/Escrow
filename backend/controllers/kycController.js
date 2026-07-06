const kycService = require('../services/kycService');

exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const result = await kycService.sendOTP(req.user.id, req.user.role, phone);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
    }

    const result = await kycService.verifyOTP(req.user.id, req.user.role, phone, otp);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const status = await kycService.getStatus(req.user.id);
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

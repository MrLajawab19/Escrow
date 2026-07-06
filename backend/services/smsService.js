const axios = require('axios');

class SMSService {
  constructor() {
    this.apiKey = process.env.FAST2SMS_API_KEY;
  }

  /**
   * Send an OTP via Fast2SMS
   * @param {string} phone - 10 digit Indian phone number
   * @param {string} otp - 6 digit OTP
   */
  async sendOTP(phone, otp) {
    if (!this.apiKey || this.apiKey === 'mock_key') {
      console.log(`[Mock SMS] Sending OTP ${otp} to ${phone}`);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, message: 'Mock OTP sent successfully' };
    }

    try {
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'v3',
          sender_id: 'TXTIND', // Default testing sender ID
          message: `Your ScrowX verification code is ${otp}. Valid for 10 minutes.`,
          language: 'english',
          flash: 0,
          numbers: phone,
        },
        {
          headers: {
            'authorization': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Fast2SMS Error:', error.response?.data || error.message);
      throw new Error('Failed to send OTP via SMS provider.');
    }
  }
}

module.exports = new SMSService();

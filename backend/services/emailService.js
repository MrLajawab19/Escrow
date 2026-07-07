const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');
const FROM_EMAIL = 'notifications@scrowx.com'; // Change to verified domain when live

/**
 * Helper to generate HTML email templates
 */
const generateTemplate = (title, content, actionLink, actionText) => `
<!DOCTYPE html>
<html>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f6f9fc; padding: 40px 0; margin: 0;">
  <div style="max-w-2xl; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">ScrowX</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 600; margin-top: 0;">${title}</h2>
      <div style="color: #475569; font-size: 16px; line-height: 1.6;">
        ${content}
      </div>
      ${actionLink ? `
      <div style="margin-top: 32px; text-align: center;">
        <a href="${actionLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          ${actionText}
        </a>
      </div>
      ` : ''}
    </div>
    <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ScrowX. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

class EmailService {
  /**
   * Send generic email
   */
  static async sendEmail({ to, subject, title, content, actionLink, actionText }) {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[Mock Email] To: ${to} | Subject: ${subject}`);
      return true;
    }

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html: generateTemplate(title || subject, content, actionLink, actionText),
      });

      if (error) {
        console.error('Resend email error:', error);
        return false;
      }

      return data;
    } catch (err) {
      console.error('Email service exception:', err);
      return false;
    }
  }

  // --- Specific Email Triggers ---

  static async sendOrderFundedEmail(user, order) {
    return this.sendEmail({
      to: user.email,
      subject: `Order Funded: ${order.scopeBox?.title || 'Your Order'}`,
      title: 'Funds Secured in Escrow! 🎉',
      content: `
        <p>Great news! The buyer has funded the escrow for the order <strong>#${order.id}</strong>.</p>
        <p>The funds are now securely locked in our vault. You can now begin working on the project with peace of mind.</p>
      `,
      actionLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/seller-dashboard`,
      actionText: 'View Order'
    });
  }

  static async sendDeliverySubmittedEmail(user, order) {
    return this.sendEmail({
      to: user.email,
      subject: `Delivery Received: ${order.scopeBox?.title || 'Your Order'}`,
      title: 'Your Delivery is Ready! 📦',
      content: `
        <p>The seller has submitted the final deliverables for order <strong>#${order.id}</strong>.</p>
        <p>Please review the submission. If you are satisfied, approve the delivery to release the funds from escrow.</p>
      `,
      actionLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/buyer-dashboard`,
      actionText: 'Review Delivery'
    });
  }

  static async sendDisputeRaisedEmail(user, dispute) {
    return this.sendEmail({
      to: user.email,
      subject: `Action Required: Dispute Raised for Order #${dispute.orderId || dispute.deedId}`,
      title: 'A Dispute Has Been Raised ⚠️',
      content: `
        <p>A dispute has been initiated for your recent transaction.</p>
        <p><strong>Reason:</strong> ${dispute.reason}</p>
        <p>Please log in to the platform immediately to review the claims and provide your counter-evidence. Our AI Dispute Engine will begin analyzing the case.</p>
      `,
      actionLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
      actionText: 'Go to Dashboard'
    });
  }
}

module.exports = EmailService;

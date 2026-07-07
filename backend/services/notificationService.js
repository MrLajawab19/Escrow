const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('./emailService');

class NotificationService {
  /**
   * Create an in-app notification and optionally trigger an email.
   * @param {Object} params
   * @param {String} params.userId
   * @param {String} params.userRole
   * @param {String} params.type
   * @param {String} params.title
   * @param {String} params.message
   * @param {String} params.link
   * @param {Object} [params.emailOptions] - If provided, triggers an email
   */
  static async createNotification({ userId, userRole, type, title, message, link, emailOptions }) {
    try {
      // 1. Save to Database
      const notification = await prisma.notification.create({
        data: {
          userId,
          userRole,
          type,
          title,
          message,
          link
        }
      });

      // 2. Send Email if requested
      if (emailOptions) {
        // Fetch user email if not provided in emailOptions
        if (!emailOptions.to) {
          const user = userRole === 'buyer' 
            ? await prisma.buyer.findUnique({ where: { id: userId } })
            : await prisma.seller.findUnique({ where: { id: userId } });
            
          if (user && user.email) {
            emailOptions.to = user.email;
          }
        }

        if (emailOptions.to) {
          // If a specific template method was requested (e.g. orderFunded)
          if (emailOptions.templateName && emailOptions.context) {
            switch(emailOptions.templateName) {
              case 'orderFunded':
                await emailService.sendOrderFundedEmail({ email: emailOptions.to }, emailOptions.context.order);
                break;
              case 'deliverySubmitted':
                await emailService.sendDeliverySubmittedEmail({ email: emailOptions.to }, emailOptions.context.order);
                break;
              case 'disputeRaised':
                await emailService.sendDisputeRaisedEmail({ email: emailOptions.to }, emailOptions.context.dispute);
                break;
              default:
                await emailService.sendEmail(emailOptions);
            }
          } else {
            // Default generic email
            await emailService.sendEmail({
              to: emailOptions.to,
              subject: emailOptions.subject || title,
              title: title,
              content: message,
              actionLink: link,
              actionText: emailOptions.actionText || 'View Details'
            });
          }
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      // We don't throw to prevent interrupting the main transaction flow
      return null;
    }
  }

  /**
   * Fetch unread notifications for a user
   */
  static async getUnreadNotifications(userId, userRole) {
    return prisma.notification.findMany({
      where: {
        userId,
        userRole,
        isRead: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });
  }

  /**
   * Fetch all notifications (read and unread)
   */
  static async getAllNotifications(userId, userRole) {
    return prisma.notification.findMany({
      where: {
        userId,
        userRole
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId, userId) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId // Security check
      },
      data: {
        isRead: true
      }
    });
  }
}

module.exports = NotificationService;

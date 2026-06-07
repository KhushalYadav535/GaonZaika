const UserNotification = require('../models/UserNotification');
const Customer = require('../models/Customer');
const pushNotificationService = require('./pushNotificationService');

class UserNotificationService {
  /**
   * Create an in-app notification and optionally send a push notification
   */
  async notifyCustomer(customerId, title, message, type, data = {}) {
    try {
      // 1. Save in-app notification
      const notification = new UserNotification({
        userId: customerId,
        title,
        message,
        type,
        data
      });
      await notification.save();

      // 2. Try to send push notification
      const customer = await Customer.findById(customerId);
      if (customer && customer.pushToken) {
        await pushNotificationService.sendPushNotification(
          customer.pushToken,
          title,
          message,
          { ...data, type }
        );
      }
      return notification;
    } catch (error) {
      console.error('Error in notifyCustomer:', error);
      return null;
    }
  }

  /**
   * Special wrapper for order updates
   */
  async notifyCustomerOrderUpdate(customerId, orderId, status, title, message, data = {}) {
    return this.notifyCustomer(customerId, title, message, 'order_update', { orderId, status, ...data });
  }
}

module.exports = new UserNotificationService();

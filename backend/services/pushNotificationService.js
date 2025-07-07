const axios = require('axios');

class PushNotificationService {
  constructor() {
    this.expoPushUrl = 'https://exp.host/--/api/v2/push/send';
  }

  // Send push notification to a single device
  async sendPushNotification(pushToken, title, body, data = {}) {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        priority: 'high',
      };

      const response = await axios.post(this.expoPushUrl, message, {
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });

      console.log('Push notification sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending push notification:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send push notification to multiple devices
  async sendPushNotificationToMultiple(pushTokens, title, body, data = {}) {
    try {
      const messages = pushTokens.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        priority: 'high',
      }));

      const response = await axios.post(this.expoPushUrl, messages, {
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });

      console.log('Push notifications sent to multiple devices:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending push notifications to multiple devices:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send order status update notification
  async sendOrderStatusUpdate(pushToken, orderId, status, restaurantName) {
    const title = 'Order Status Update';
    const body = `Your order from ${restaurantName} is now ${status}`;
    const data = {
      type: 'order_update',
      orderId: orderId,
      status: status,
      restaurantName: restaurantName,
    };

    return await this.sendPushNotification(pushToken, title, body, data);
  }

  // Send new order notification to vendor
  async sendNewOrderToVendor(pushToken, orderId, customerName, totalAmount) {
    const title = 'New Order Received';
    const body = `New order #${orderId} from ${customerName} - ₹${totalAmount}`;
    const data = {
      type: 'new_order',
      orderId: orderId,
      customerName: customerName,
      totalAmount: totalAmount,
    };

    return await this.sendPushNotification(pushToken, title, body, data);
  }

  // Send delivery update notification
  async sendDeliveryUpdate(pushToken, orderId, status, estimatedTime) {
    const title = 'Delivery Update';
    const body = `Your order #${orderId} is ${status}${estimatedTime ? ` - ETA: ${estimatedTime}` : ''}`;
    const data = {
      type: 'delivery_update',
      orderId: orderId,
      status: status,
      estimatedTime: estimatedTime,
    };

    return await this.sendPushNotification(pushToken, title, body, data);
  }

  // Send order ready for pickup notification
  async sendOrderReadyNotification(pushToken, orderId, restaurantName) {
    const title = 'Order Ready for Pickup';
    const body = `Your order from ${restaurantName} is ready for pickup!`;
    const data = {
      type: 'order_ready',
      orderId: orderId,
      restaurantName: restaurantName,
    };

    return await this.sendPushNotification(pushToken, title, body, data);
  }

  // Send payment confirmation notification
  async sendPaymentConfirmation(pushToken, orderId, amount) {
    const title = 'Payment Confirmed';
    const body = `Payment of ₹${amount} for order #${orderId} has been confirmed`;
    const data = {
      type: 'payment_confirmation',
      orderId: orderId,
      amount: amount,
    };

    return await this.sendPushNotification(pushToken, title, body, data);
  }

  // Send promotional notification
  async sendPromotionalNotification(pushToken, title, body, promoCode = null) {
    const data = {
      type: 'promotional',
      promoCode: promoCode,
    };

    return await this.sendPushNotification(pushToken, title, body, data);
  }

  // Validate push token format
  validatePushToken(token) {
    // Expo push tokens start with ExponentPushToken[ or ExpoPushToken[
    return token && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));
  }

  // Handle push notification errors
  handlePushError(error, token) {
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors;
      errors.forEach(err => {
        if (err.code === 'DeviceNotRegistered') {
          console.log(`Device with token ${token} is not registered`);
          // You should remove this token from your database
          this.removeInvalidToken(token);
        } else if (err.code === 'MessageTooBig') {
          console.log('Message too big for push notification');
        } else if (err.code === 'MessageRateExceeded') {
          console.log('Message rate exceeded');
        }
      });
    }
  }

  // Remove invalid token from database (implement based on your database)
  async removeInvalidToken(token) {
    // This is a placeholder - implement based on your database structure
    console.log(`Should remove invalid token: ${token}`);
    // Example: await User.updateMany({ pushToken: token }, { $unset: { pushToken: 1 } });
  }
}

module.exports = new PushNotificationService(); 
const axios = require('axios');

class PushNotificationService {
  constructor() {
    this.expoPushUrl = 'https://exp.host/--/api/v2/push/send';
  }

  // Send push notification to a single device
  async sendPushNotification(pushToken, title, body, data = {}, options = {}) {
    try {
      if (!this.validatePushToken(pushToken)) {
        console.warn('Invalid push token format:', pushToken);
        return { success: false, message: 'Invalid token format' };
      }

      const message = {
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        priority: options.priority || 'high',
        vibrate: options.vibrate || [0, 250, 250, 250],
        badge: options.badge || 1,
        channelId: options.channelId || 'order-notifications',
        ttl: options.ttl || 3600,
      };

      const response = await axios.post(this.expoPushUrl, message, {
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });

      console.log(`✉️ Push notification sent: "${title}" to token ending with ...${pushToken.substring(pushToken.length - 10)}`);
      return response.data;
    } catch (error) {
      console.error('Error sending push notification:', error.response?.data || error.message);
      return { success: false, error: error.message };
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
        vibrate: [0, 250, 250, 250],
        badge: 1,
        channelId: 'order-notifications',
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
  async sendNewOrderToVendor(pushToken, orderId, customerName, totalAmount, itemCount) {
    const title = '📲 New Order!';
    const body = `Order #${orderId} from ${customerName} • ₹${totalAmount}`;
    const data = {
      type: 'new_order',
      orderId: orderId,
      customerName: customerName,
      totalAmount: totalAmount,
      itemCount: itemCount,
    };

    return await this.sendPushNotification(pushToken, title, body, data, { priority: 'high' });
  }

  // Vendor accepted order - notify customer
  async sendOrderAcceptedToCustomer(pushToken, orderId, restaurantName, estimatedTime) {
    const title = '✅ Order Accepted';
    const body = `${restaurantName} accepted your order • ${estimatedTime} mins`;
    const data = {
      type: 'order_accepted',
      orderId: orderId,
      restaurantName: restaurantName,
      estimatedTime: estimatedTime,
    };

    return await this.sendPushNotification(pushToken, title, body, data);
  }

  // Order preparing - notify customer
  async sendOrderPreparingNotification(pushToken, orderId, restaurantName) {
    const title = '👨‍🍳 Preparing Your Order';
    const body = `${restaurantName} is preparing your food`;
    const data = {
      type: 'order_preparing',
      orderId: orderId,
      restaurantName: restaurantName,
    };

    return await this.sendPushNotification(pushToken, title, body, data);
  }

  // Order ready - notify delivery boys
  async sendOrderReadyForDeliveryBoys(pushTokens, orderId, restaurantName, customerName, deliveryDistance, totalAmount) {
    const title = '🚗 Order Ready for Delivery';
    const body = `Order from ${restaurantName} to ${customerName} • ${deliveryDistance} km • ₹${totalAmount}`;
    const data = {
      type: 'order_ready_for_pickup',
      orderId: orderId,
      restaurantName: restaurantName,
      customerName: customerName,
      deliveryDistance: deliveryDistance,
      totalAmount: totalAmount,
    };

    return await this.sendPushNotificationToMultiple(pushTokens, title, body, data, { priority: 'high' });
  }

  // Delivery boy accepted - notify customer
  async sendDeliveryAssignedToCustomer(pushToken, orderId, deliveryBoyName, deliveryBoyPhone, estimatedTime) {
    const title = '🎉 Delivery Assigned';
    const body = `${deliveryBoyName} will deliver • ${estimatedTime} mins`;
    const data = {
      type: 'delivery_assigned',
      orderId: orderId,
      deliveryBoyName: deliveryBoyName,
      deliveryBoyPhone: deliveryBoyPhone,
      estimatedTime: estimatedTime,
    };

    return await this.sendPushNotification(pushToken, title, body, data);
  }

  // Out for delivery - notify customer
  async sendOutForDeliveryNotification(pushToken, orderId, deliveryBoyName, deliveryBoyPhone, estimatedTime) {
    const title = '📍 Out for Delivery';
    const body = `${deliveryBoyName} is on the way • ETA ${estimatedTime} mins`;
    const data = {
      type: 'out_for_delivery',
      orderId: orderId,
      deliveryBoyName: deliveryBoyName,
      deliveryBoyPhone: deliveryBoyPhone,
      estimatedTime: estimatedTime,
    };

    return await this.sendPushNotification(pushToken, title, body, data);
  }

  // Order delivered - notify customer
  async sendOrderDeliveredNotification(pushToken, orderId, restaurantName) {
    const title = '✨ Order Delivered';
    const body = `Your order from ${restaurantName} has been delivered. Rate & review!`;
    const data = {
      type: 'order_delivered',
      orderId: orderId,
      restaurantName: restaurantName,
    };

    return await this.sendPushNotification(pushToken, title, body, data);
  }

  // Order cancelled - notify both customer and vendor
  async sendOrderCancelledNotification(pushToken, orderId, reason) {
    const title = '❌ Order Cancelled';
    const body = `Your order #${orderId} has been cancelled${reason ? ` • ${reason}` : ''}`;
    const data = {
      type: 'order_cancelled',
      orderId: orderId,
      reason: reason,
    };

    return await this.sendPushNotification(pushToken, title, body, data);
  }

  // Delivery boy arrived - notify customer
  async sendDeliveryArrivedNotification(pushToken, orderId, deliveryBoyName) {
    const title = '👨‍💼 Delivery Partner Arrived';
    const body = `${deliveryBoyName} is here with your order`;
    const data = {
      type: 'delivery_arrived',
      orderId: orderId,
      deliveryBoyName: deliveryBoyName,
    };

    return await this.sendPushNotification(pushToken, title, body, data, { priority: 'high' });
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
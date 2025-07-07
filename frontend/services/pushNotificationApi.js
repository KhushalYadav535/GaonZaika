import apiService from './apiService';
import pushNotificationService from './pushNotificationService';

class PushNotificationApiService {
  // Save push token to backend
  async savePushToken() {
    try {
      const pushToken = await pushNotificationService.getPushToken();
      if (!pushToken) {
        console.log('No push token available');
        return false;
      }

      const response = await apiService.post('/push-notifications/save-token', {
        pushToken: pushToken
      });

      console.log('Push token saved to backend:', response.data);
      return true;
    } catch (error) {
      console.error('Error saving push token to backend:', error);
      return false;
    }
  }

  // Remove push token from backend
  async removePushToken() {
    try {
      const response = await apiService.delete('/push-notifications/remove-token');
      console.log('Push token removed from backend:', response.data);
      return true;
    } catch (error) {
      console.error('Error removing push token from backend:', error);
      return false;
    }
  }

  // Send test notification
  async sendTestNotification(title = 'Test Notification', body = 'This is a test notification') {
    try {
      const response = await apiService.post('/push-notifications/send-test', {
        title: title,
        body: body
      });

      console.log('Test notification sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  // Request order status update notification
  async requestOrderStatusUpdate(orderId, status, customerId, restaurantName) {
    try {
      const response = await apiService.post('/push-notifications/order-status-update', {
        orderId: orderId,
        status: status,
        customerId: customerId,
        restaurantName: restaurantName
      });

      console.log('Order status update notification requested:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error requesting order status update notification:', error);
      throw error;
    }
  }

  // Request new order notification to vendor
  async requestNewOrderToVendor(orderId, vendorId, customerName, totalAmount) {
    try {
      const response = await apiService.post('/push-notifications/new-order-vendor', {
        orderId: orderId,
        vendorId: vendorId,
        customerName: customerName,
        totalAmount: totalAmount
      });

      console.log('New order notification to vendor requested:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error requesting new order notification to vendor:', error);
      throw error;
    }
  }

  // Request delivery update notification
  async requestDeliveryUpdate(orderId, status, customerId, estimatedTime) {
    try {
      const response = await apiService.post('/push-notifications/delivery-update', {
        orderId: orderId,
        status: status,
        customerId: customerId,
        estimatedTime: estimatedTime
      });

      console.log('Delivery update notification requested:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error requesting delivery update notification:', error);
      throw error;
    }
  }

  // Send promotional notification (admin only)
  async sendPromotionalNotification(title, body, promoCode = null) {
    try {
      const response = await apiService.post('/push-notifications/promotional', {
        title: title,
        body: body,
        promoCode: promoCode
      });

      console.log('Promotional notification sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending promotional notification:', error);
      throw error;
    }
  }
}

export default new PushNotificationApiService(); 
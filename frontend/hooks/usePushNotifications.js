import { useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import pushNotificationService from '../services/pushNotificationService';
import pushNotificationApi from '../services/pushNotificationApi';

export const usePushNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [pushToken, setPushToken] = useState(null);
  const appState = useRef(AppState.currentState);

  // Initialize push notifications
  const initialize = async () => {
    try {
      console.log('Initializing push notifications...');
      const success = await pushNotificationService.initialize();
      
      if (success) {
        const token = await pushNotificationService.getPushToken();
        setPushToken(token);
        setHasPermission(true);
        
        // Save token to backend
        await pushNotificationApi.savePushToken();
        
        console.log('Push notifications initialized successfully');
      } else {
        console.log('Failed to initialize push notifications');
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      setIsInitialized(true);
    }
  };

  // Send local test notification
  const sendLocalNotification = async (title, body, data = {}) => {
    try {
      await pushNotificationService.sendLocalNotification(title, body, data);
      console.log('Local notification sent successfully');
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  // Send test notification via backend
  const sendTestNotification = async (title, body) => {
    try {
      await pushNotificationApi.sendTestNotification(title, body);
      console.log('Test notification sent via backend');
    } catch (error) {
      console.error('Error sending test notification via backend:', error);
    }
  };

  // Request order status update notification
  const requestOrderStatusUpdate = async (orderId, status, customerId, restaurantName) => {
    try {
      await pushNotificationApi.requestOrderStatusUpdate(orderId, status, customerId, restaurantName);
      console.log('Order status update notification requested');
    } catch (error) {
      console.error('Error requesting order status update notification:', error);
    }
  };

  // Request new order notification to vendor
  const requestNewOrderToVendor = async (orderId, vendorId, customerName, totalAmount) => {
    try {
      await pushNotificationApi.requestNewOrderToVendor(orderId, vendorId, customerName, totalAmount);
      console.log('New order notification to vendor requested');
    } catch (error) {
      console.error('Error requesting new order notification to vendor:', error);
    }
  };

  // Request delivery update notification
  const requestDeliveryUpdate = async (orderId, status, customerId, estimatedTime) => {
    try {
      await pushNotificationApi.requestDeliveryUpdate(orderId, status, customerId, estimatedTime);
      console.log('Delivery update notification requested');
    } catch (error) {
      console.error('Error requesting delivery update notification:', error);
    }
  };

  // Send promotional notification (admin only)
  const sendPromotionalNotification = async (title, body, promoCode = null) => {
    try {
      const result = await pushNotificationApi.sendPromotionalNotification(title, body, promoCode);
      console.log('Promotional notification sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending promotional notification:', error);
      throw error;
    }
  };

  // Clean up push notifications
  const cleanup = () => {
    pushNotificationService.cleanup();
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
        // Re-initialize push notifications when app comes to foreground
        initialize();
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('App has gone to the background!');
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, []);

  return {
    isInitialized,
    hasPermission,
    pushToken,
    initialize,
    sendLocalNotification,
    sendTestNotification,
    requestOrderStatusUpdate,
    requestNewOrderToVendor,
    requestDeliveryUpdate,
    sendPromotionalNotification,
    cleanup
  };
}; 
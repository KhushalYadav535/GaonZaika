import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import pushNotificationService from '../services/pushNotificationService';
import usePremiumNotifications from './usePremiumNotifications';

// Hook to integrate push notifications with premium notification UI
export const useNotificationHandler = () => {
  const premiumNotif = usePremiumNotifications();

  useEffect(() => {
    // Handle notification when app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      notification => {
        const { title, body, data } = notification.request.content;
        
        console.log('📨 Notification received (foreground):', {
          title,
          body,
          type: data?.type,
        });

        // Show premium notification
        premiumNotif.addNotification({
          type: data?.type || 'order_update',
          title: title || 'New Notification',
          body: body || '',
          ...data,
        }, 5000);
      }
    );

    // Handle notification when user taps on it
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        const { notification } = response;
        const { data } = notification.request.content;
        
        console.log('👆 Notification tapped:', {
          type: data?.type,
          orderId: data?.orderId,
        });

        // Handle notification tap based on type
        handleNotificationTap(data);
      }
    );

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const handleNotificationTap = (data) => {
    // This can be extended to navigate to specific screens based on notification type
    switch(data?.type) {
      case 'new_order':
        // Navigate to vendor orders screen
        console.log('Navigate to orders for order:', data?.orderId);
        break;
      case 'order_ready_for_pickup':
        // Navigate to delivery available orders
        console.log('Navigate to pickup orders:', data?.orderId);
        break;
      case 'out_for_delivery':
        // Navigate to order tracking
        console.log('Navigate to track order:', data?.orderId);
        break;
      default:
        console.log('Default notification tap action');
    }
  };

  return {
    notifications: premiumNotif.notifications,
    addNotification: premiumNotif.addNotification,
    removeNotification: premiumNotif.removeNotification,
    dismissAll: premiumNotif.dismissAll,
    showSuccess: premiumNotif.showSuccess,
    showError: premiumNotif.showError,
    showInfo: premiumNotif.showInfo,
    showNewOrder: premiumNotif.showNewOrder,
    showOrderReady: premiumNotif.showOrderReady,
    showOutForDelivery: premiumNotif.showOutForDelivery,
  };
};

export default useNotificationHandler;

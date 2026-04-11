import { useState, useCallback, useRef } from 'react';

export const usePremiumNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const notificationIdRef = useRef(0);

  const addNotification = useCallback((notification, duration = 5000) => {
    const id = ++notificationIdRef.current;
    const newNotification = {
      id,
      duration,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration + animation time
    setTimeout(() => {
      removeNotification(id);
    }, duration + 400);

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const showSuccess = useCallback((body, title = '✅ Success') => {
    return addNotification({
      type: 'order_delivered',
      title,
      body,
    });
  }, [addNotification]);

  const showError = useCallback((body, title = '❌ Error') => {
    return addNotification({
      type: 'order_cancelled',
      title,
      body,
    });
  }, [addNotification]);

  const showInfo = useCallback((body, title = 'ℹ️ Info') => {
    return addNotification({
      type: 'order_accepted',
      title,
      body,
    });
  }, [addNotification]);

  const showNewOrder = useCallback((body, customerName = '') => {
    return addNotification({
      type: 'new_order',
      body: `${customerName}: ${body}`,
    }, 7000);
  }, [addNotification]);

  const showOrderReady = useCallback((body) => {
    return addNotification({
      type: 'order_ready_for_pickup',
      body,
    }, 6000);
  }, [addNotification]);

  const showOutForDelivery = useCallback((deliveryBoyName, estimatedTime) => {
    return addNotification({
      type: 'out_for_delivery',
      body: `${deliveryBoyName} is on the way • ETA ${estimatedTime} mins`,
    }, 6000);
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    dismissAll,
    showSuccess,
    showError,
    showInfo,
    showNewOrder,
    showOrderReady,
    showOutForDelivery,
  };
};

export default usePremiumNotifications;

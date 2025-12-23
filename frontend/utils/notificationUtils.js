import pushNotificationApi from '../services/pushNotificationApi';
import pushNotificationService from '../services/pushNotificationService';

// Initialize and register push token after successful login
export const initializeNotificationsAfterLogin = async () => {
  try {
    console.log('🔔 Initializing notifications after login...');
    
    // Initialize push notifications
    const success = await pushNotificationService.initialize();
    
    if (success) {
      // Get the push token
      const pushToken = await pushNotificationService.getPushToken();
      
      if (pushToken) {
        console.log('📱 Push token obtained:', pushToken);
        
        // Save token to backend
        const saved = await pushNotificationApi.savePushToken();
        
        if (saved) {
          console.log('✅ Push token registered successfully!');
          return true;
        } else {
          console.log('❌ Failed to save push token to backend');
          return false;
        }
      } else {
        console.log('❌ No push token available');
        return false;
      }
    } else {
      console.log('❌ Failed to initialize push notifications');
      return false;
    }
  } catch (error) {
    console.error('Error initializing notifications after login:', error);
    return false;
  }
};

// Send test notification to verify setup
export const sendTestNotification = async () => {
  try {
    await pushNotificationApi.sendTestNotification(
      'Gaon Zaika Test',
      'Notifications are working! 🎉'
    );
    console.log('✅ Test notification sent successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
    return false;
  }
};

// Check if notifications are properly set up
export const checkNotificationSetup = async () => {
  try {
    const pushToken = await pushNotificationService.getPushToken();
    return {
      hasToken: !!pushToken,
      token: pushToken,
      isInitialized: true
    };
  } catch (error) {
    console.error('Error checking notification setup:', error);
    return {
      hasToken: false,
      token: null,
      isInitialized: false
    };
  }
};

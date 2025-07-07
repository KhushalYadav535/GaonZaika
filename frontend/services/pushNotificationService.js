import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Initialize push notifications
  async initialize() {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Get the token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // You'll need to set this
      });

      this.expoPushToken = token.data;
      console.log('Expo push token:', this.expoPushToken);

      // Save token to AsyncStorage
      await AsyncStorage.setItem('expoPushToken', this.expoPushToken);

      // Set up notification listeners
      this.setupNotificationListeners();

      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    // Listen for incoming notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Handle notification received while app is in foreground
    });

    // Listen for notification responses (when user taps notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap
      this.handleNotificationTap(response);
    });
  }

  // Handle notification tap
  handleNotificationTap(response) {
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data.type === 'order_update') {
      // Navigate to order status screen
      // You'll need to implement navigation logic here
      console.log('Navigate to order status:', data.orderId);
    } else if (data.type === 'new_order') {
      // Navigate to orders screen
      console.log('Navigate to orders screen');
    } else if (data.type === 'delivery_update') {
      // Navigate to delivery screen
      console.log('Navigate to delivery screen');
    }
  }

  // Get the push token
  async getPushToken() {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }
    
    // Try to get from AsyncStorage
    const storedToken = await AsyncStorage.getItem('expoPushToken');
    if (storedToken) {
      this.expoPushToken = storedToken;
      return storedToken;
    }
    
    return null;
  }

  // Send local notification (for testing)
  async sendLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: { seconds: 1 },
    });
  }

  // Clean up listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default new PushNotificationService(); 
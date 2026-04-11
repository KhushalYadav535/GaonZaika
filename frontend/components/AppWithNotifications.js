import React, { useEffect } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNotificationHandler } from '../hooks/useNotificationHandler';
import { PremiumNotificationStack } from '../components/PremiumNotification';
import { usePushNotifications } from '../hooks/usePushNotifications';

const { width, height } = Dimensions.get('window');

/**
 * EXAMPLE APP WRAPPER
 * 
 * This example shows how to integrate the premium notification system
 * into your main app. Place this at the root level of your app navigation.
 * 
 * Usage:
 * import AppWithNotifications from '../components/AppWithNotifications';
 * 
 * Then in your main App.js:
 * <AppWithNotifications>
 *   <YourAppNavigator />
 * </AppWithNotifications>
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function AppWithNotifications({ children }) {
  const notificationHandler = useNotificationHandler();
  const { initialize } = usePushNotifications();

  useEffect(() => {
    // Initialize push notifications on startup
    const initializeNotifications = async () => {
      try {
        console.log('🔔 Initializing notification system...');
        
        // Initialize push notifications
        await initialize();
        
        console.log('✅ Notification system initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize push notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Your app content */}
      {children}

      {/* Premium Notification Stack - Always at top level */}
      <PremiumNotificationStack
        notifications={notificationHandler.notifications}
        onDismiss={notificationHandler.removeNotification}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

/**
 * ALTERNATIVE: Using hooks directly in your main navigation
 * 
 * If you prefer to keep notification logic in your main navigator:
 * 
 * import { useNotificationHandler } from '../hooks/useNotificationHandler';
 * import { PremiumNotificationStack } from '../components/PremiumNotification';
 * 
 * export default function RootNavigator() {
 *   const notificationHandler = useNotificationHandler();
 *   
 *   return (
 *     <>
 *       <NavigationContainer>
 *         <YourAppNavigator />
 *       </NavigationContainer>
 *       
 *       <PremiumNotificationStack
 *         notifications={notificationHandler.notifications}
 *         onDismiss={notificationHandler.removeNotification}
 *       />
 *     </>
 *   );
 * }
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { usePushNotifications } from '../hooks/usePushNotifications';

const TestPushNotificationScreen = () => {
  const {
    isInitialized,
    hasPermission,
    pushToken,
    sendLocalNotification,
    sendTestNotification,
    requestOrderStatusUpdate,
    requestNewOrderToVendor,
    requestDeliveryUpdate,
    sendPromotionalNotification
  } = usePushNotifications();

  const [loading, setLoading] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('Test Notification');
  const [notificationBody, setNotificationBody] = useState('This is a test notification');

  const handleSendLocalNotification = async () => {
    try {
      await sendLocalNotification(notificationTitle, notificationBody, {
        type: 'test',
        timestamp: new Date().toISOString()
      });
      Alert.alert('Success', 'Local notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send local notification');
    }
  };

  const handleSendTestNotification = async () => {
    setLoading(true);
    try {
      await sendTestNotification(notificationTitle, notificationBody);
      Alert.alert('Success', 'Test notification sent via backend!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification via backend');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusUpdate = async () => {
    setLoading(true);
    try {
      await requestOrderStatusUpdate('ORDER123', 'Preparing', 'CUSTOMER123', 'Test Restaurant');
      Alert.alert('Success', 'Order status update notification requested!');
    } catch (error) {
      Alert.alert('Error', 'Failed to request order status update notification');
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrderToVendor = async () => {
    setLoading(true);
    try {
      await requestNewOrderToVendor('ORDER123', 'VENDOR123', 'John Doe', 500);
      Alert.alert('Success', 'New order notification to vendor requested!');
    } catch (error) {
      Alert.alert('Error', 'Failed to request new order notification to vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryUpdate = async () => {
    setLoading(true);
    try {
      await requestDeliveryUpdate('ORDER123', 'On the way', 'CUSTOMER123', '15 minutes');
      Alert.alert('Success', 'Delivery update notification requested!');
    } catch (error) {
      Alert.alert('Error', 'Failed to request delivery update notification');
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionalNotification = async () => {
    setLoading(true);
    try {
      const result = await sendPromotionalNotification(
        'Special Offer!',
        'Get 20% off on your next order with code SAVE20',
        'SAVE20'
      );
      Alert.alert('Success', `Promotional notification sent to ${result.recipients} recipients!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send promotional notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Push Notification Test</Text>
        <Text style={styles.subtitle}>Test push notification functionality</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status:</Text>
        <Text style={[styles.statusText, { color: isInitialized ? '#4CAF50' : '#FF9800' }]}>
          {isInitialized ? 'Initialized' : 'Initializing...'}
        </Text>
        <Text style={[styles.statusText, { color: hasPermission ? '#4CAF50' : '#F44336' }]}>
          Permission: {hasPermission ? 'Granted' : 'Denied'}
        </Text>
        {pushToken && (
          <Text style={styles.tokenText} numberOfLines={2}>
            Token: {pushToken}
          </Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Notification Title:</Text>
        <TextInput
          style={styles.input}
          value={notificationTitle}
          onChangeText={setNotificationTitle}
          placeholder="Enter notification title"
        />
        
        <Text style={styles.inputLabel}>Notification Body:</Text>
        <TextInput
          style={styles.input}
          value={notificationBody}
          onChangeText={setNotificationBody}
          placeholder="Enter notification body"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.localButton]}
          onPress={handleSendLocalNotification}
          disabled={!hasPermission}
        >
          <Text style={styles.buttonText}>Send Local Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.backendButton]}
          onPress={handleSendTestNotification}
          disabled={!hasPermission || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send Test via Backend</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.orderButton]}
          onPress={handleOrderStatusUpdate}
          disabled={!hasPermission || loading}
        >
          <Text style={styles.buttonText}>Order Status Update</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.vendorButton]}
          onPress={handleNewOrderToVendor}
          disabled={!hasPermission || loading}
        >
          <Text style={styles.buttonText}>New Order to Vendor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deliveryButton]}
          onPress={handleDeliveryUpdate}
          disabled={!hasPermission || loading}
        >
          <Text style={styles.buttonText}>Delivery Update</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.promoButton]}
          onPress={handlePromotionalNotification}
          disabled={!hasPermission || loading}
        >
          <Text style={styles.buttonText}>Send Promotional (Admin)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How to test:</Text>
        <Text style={styles.infoText}>1. Make sure you're logged in</Text>
        <Text style={styles.infoText}>2. Grant notification permissions</Text>
        <Text style={styles.infoText}>3. Try different notification types</Text>
        <Text style={styles.infoText}>4. Check both foreground and background notifications</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statusContainer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 10,
  },
  inputContainer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    padding: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
  },
  localButton: {
    backgroundColor: '#2196F3',
  },
  backendButton: {
    backgroundColor: '#4CAF50',
  },
  orderButton: {
    backgroundColor: '#FF9800',
  },
  vendorButton: {
    backgroundColor: '#9C27B0',
  },
  deliveryButton: {
    backgroundColor: '#607D8B',
  },
  promoButton: {
    backgroundColor: '#E91E63',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default TestPushNotificationScreen; 
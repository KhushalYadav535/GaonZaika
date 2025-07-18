import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';
import usePushNotifications from '../../hooks/usePushNotifications';

const OrderStatusScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { addNotificationListener } = usePushNotifications ? usePushNotifications() : { addNotificationListener: null };
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true); // Enable auto-refresh by default

  useEffect(() => {
    loadOrders();
    
    // Push notification listener
    let removeListener;
    if (addNotificationListener) {
      removeListener = addNotificationListener((notification) => {
        if (notification?.data?.type === 'order_status_update') {
          loadOrders();
        }
      });
    }
    return () => {
      if (removeListener) removeListener();
    };
  }, []);
  
  // Auto-refresh effect - always refresh when enabled, regardless of order status
  useEffect(() => {
    if (!autoRefresh) return;
    
    // Polling every 15 seconds for real-time updates
    const interval = setInterval(() => {
      loadOrders();
    }, 15000); // 15 seconds for better real-time experience
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Get customer ID from AsyncStorage or context
      const customerData = await AsyncStorage.getItem('customerData');
      const customerId = customerData ? JSON.parse(customerData).id : null;
      
      console.log('Loading orders for customer ID:', customerId);
      
      if (!customerId) {
        console.log('No customer ID available');
        setOrders([]);
        return;
      }
      
      const response = await apiService.getOrders('customer', customerId);
      console.log('Orders API response:', response.data);
      console.log('Orders data:', response.data?.data);
      console.log('Orders array length:', response.data?.data?.length);
      
      if (response.data && response.data.success) {
        const ordersData = response.data.data || [];
        console.log('Setting orders:', ordersData);
        setOrders(ordersData);
        setLastUpdated(new Date());
      } else {
        console.log('API response not successful:', response.data);
        setOrders([]);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      console.error('Error details:', error.response?.data);
      setOrders([]);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = (orderId) => {
    setCancelOrderId(orderId);
    setCancelReason('');
    setCancelModalVisible(true);
  };
  const confirmCancelOrder = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Reason required', 'Please enter a reason for cancellation.');
      return;
    }
    try {
      setLoading(true);
      console.log('Cancelling order:', { orderId: cancelOrderId, reason: cancelReason });
      
      const response = await apiService.cancelOrder(cancelOrderId, cancelReason);
      console.log('Cancel order response:', response.data);
      
      setCancelModalVisible(false);
      setCancelOrderId(null);
      setCancelReason('');
      loadOrders();
      Alert.alert('Order Cancelled', 'Your order has been cancelled.');
    } catch (error) {
      console.error('Error cancelling order:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to cancel order.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed':
        return '#FF9800';
      case 'Accepted':
        return '#2196F3';
      case 'Preparing':
        return '#9C27B0';
      case 'Out for Delivery':
        return '#FF5722';
      case 'Delivered':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Order Placed':
        return 'receipt';
      case 'Accepted':
        return 'check-circle';
      case 'Preparing':
        return 'restaurant';
      case 'Out for Delivery':
        return 'local-shipping';
      case 'Delivered':
        return 'done-all';
      default:
        return 'receipt';
    }
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity style={styles.orderCard} activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{item.orderId || 'N/A'}</Text>
          <Text style={styles.restaurantName}>{item.restaurantName || 'Restaurant'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <MaterialIcons name={getStatusIcon(item.status)} size={16} color="white" />
          <Text style={styles.statusText}>{item.status || 'Unknown'}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items && item.items.length > 0 ? (
          item.items.map((orderItem, index) => (
            <Text key={index} style={styles.orderItem}>
              {orderItem.name || 'Item'} x{orderItem.quantity || 1}
            </Text>
          ))
        ) : (
          <Text style={styles.orderItem}>No items found</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.orderDetails}>
          <Text style={styles.orderDate}>
            {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}
          </Text>
          <Text style={styles.orderTime}>
            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'N/A'}
          </Text>
        </View>
        <Text style={styles.orderTotal}>₹{item.totalAmount || 0}</Text>
      </View>
      {/* Cancel button for eligible orders */}
      {['Order Placed', 'Accepted', 'Preparing'].includes(item.status) && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelOrder(item.id)}
        >
          <MaterialIcons name="cancel" size={20} color="#fff" />
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
      {/* Show cancellation reason if cancelled */}
      {item.status === 'Cancelled' && item.cancellationReason && (
        <Text style={styles.cancelReasonText}>
          Cancelled: {item.cancellationReason}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>My Orders</Text>
          <Text style={styles.headerSubtitle}>Track your food delivery</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.headerButton, autoRefresh && styles.activeButton]} 
            onPress={() => setAutoRefresh(!autoRefresh)}
          >
            <MaterialIcons 
              name={autoRefresh ? "wifi" : "wifi-off"} 
              size={20} 
              color={autoRefresh ? "#4CAF50" : "white"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={loadOrders}
            disabled={loading}
          >
            <MaterialIcons name="refresh" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      {lastUpdated && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 4 }}>
          <Text style={{ color: '#888', fontSize: 12 }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
          {autoRefresh && (
            <View style={{ marginLeft: 8, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 4 }} />
              <Text style={{ color: '#4CAF50', fontSize: 10, fontWeight: 'bold' }}>LIVE</Text>
            </View>
          )}
        </View>
      )}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="receipt" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start ordering delicious food from local restaurants
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
        />
      )}
      {/* Cancel Order Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Order</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter cancellation reason"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={confirmCancelOrder}>
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ccc' }]} onPress={() => setCancelModalVisible(false)}>
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  orderDetails: {
    flex: 1,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  cancelReasonText: {
    color: '#E53935',
    fontStyle: 'italic',
    marginTop: 6,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#E53935',
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    fontSize: 16,
    marginBottom: 18,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: '#E53935',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OrderStatusScreen; 
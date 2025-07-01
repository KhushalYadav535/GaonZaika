import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';

const DeliveryOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryId, setDeliveryId] = useState(null);

  useEffect(() => {
    loadDeliveryPersonData();
  }, []);

  useEffect(() => {
    if (deliveryId) {
      loadOrders();
    }
  }, [deliveryId]);

  const loadDeliveryPersonData = async () => {
    try {
      const deliveryData = await AsyncStorage.getItem('deliveryData');
      if (deliveryData) {
        const parsedData = JSON.parse(deliveryData);
        setDeliveryId(parsedData.id);
        console.log('Delivery person ID:', parsedData.id);
      }
    } catch (error) {
      console.error('Error loading delivery person data:', error);
    }
  };

  const loadOrders = async () => {
    if (!deliveryId) {
      console.log('No delivery person ID available');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.getDeliveryOrders(deliveryId);
      console.log('Delivery orders response:', response.data);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (orderId) => {
    Alert.alert(
      'Accept Order',
      'Do you want to accept this order for delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const response = await apiService.updateOrderStatus(orderId, 'Out for Delivery');
              console.log('Order acceptance response:', response.data);
              
              if (response.data && response.data.success) {
                Alert.alert('Success', 'Order accepted for delivery!');
                loadOrders(); // Refresh orders
              } else {
                Alert.alert('Error', 'Failed to accept order');
              }
            } catch (error) {
              console.error('Error accepting order:', error);
              Alert.alert('Error', 'Failed to accept order');
            }
          }
        }
      ]
    );
  };

  const handleOTP = (orderId) => {
    navigation.navigate('DeliveryOTP', { orderId });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Out for Delivery': return '#FF5722';
      case 'Delivered': return '#4CAF50';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Out for Delivery': return 'delivery-dining';
      case 'Delivered': return 'done-all';
      default: return 'receipt';
    }
  };

  if (loading && !deliveryId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!deliveryId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Delivery person not authenticated</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderOrder = ({ item }) => {
    console.log('Render order:', item);
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>#{item.orderId || item._id || 'N/A'}</Text>
            <Text style={styles.orderTime}>
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}> 
            <MaterialIcons name={getStatusIcon(item.status)} size={16} color="white" />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.restaurantInfo}>
          <MaterialIcons name="restaurant" size={16} color="#666" />
          <Text style={styles.restaurantName}>
            {item.restaurantId && item.restaurantId.name ? item.restaurantId.name : 'Restaurant'}
          </Text>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>Customer: {item.customerInfo?.name || 'N/A'}</Text>
          <Text style={styles.customerPhone}>Phone: {item.customerInfo?.phone || 'N/A'}</Text>
          <Text style={styles.customerAddress}>Address: {item.customerInfo?.address || 'N/A'}</Text>
        </View>

        <View style={styles.itemsContainer}>
          <Text style={styles.itemsTitle}>Order Items:</Text>
          {Array.isArray(item.items) && item.items.length > 0 ? (
            item.items.map((orderItem, index) => (
              <Text key={index} style={styles.orderItem}>
                • {orderItem.name} x{orderItem.quantity}
              </Text>
            ))
          ) : (
            <Text style={styles.orderItem}>No items</Text>
          )}
        </View>

        <View style={styles.orderTotal}>
          <Text style={styles.totalText}>Total: ₹{item.totalAmount || 0}</Text>
        </View>

        <View style={styles.actions}>
          {item.status === 'Out for Delivery' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]} 
              onPress={() => handleAcceptOrder(item._id)}
            >
              <MaterialIcons name="local-shipping" size={16} color="white" />
              <Text style={styles.actionText}>Accept Delivery</Text>
            </TouchableOpacity>
          )}
          
          {item.status === 'Out for Delivery' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.otpBtn]} 
              onPress={() => handleOTP(item._id)}
            >
              <MaterialIcons name="verified" size={16} color="white" />
              <Text style={styles.actionText}>Verify OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Orders</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} disabled={refreshing}>
          <MaterialIcons name="refresh" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={item => item.orderId || item._id || item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No orders yet</Text>
              <Text style={styles.emptySubtext}>New orders will appear here</Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#2196F3' 
  },
  refreshBtn: {
    padding: 8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10
  },
  listContainer: {
    padding: 16
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
    shadowRadius: 2
  },
  orderHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 12
  },
  orderInfo: {
    flex: 1
  },
  orderId: { 
    fontWeight: 'bold', 
    color: '#333',
    fontSize: 16,
    marginBottom: 4
  },
  orderTime: {
    fontSize: 12,
    color: '#666'
  },
  statusBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: { 
    color: 'white', 
    fontSize: 12, 
    fontWeight: 'bold',
    marginLeft: 4
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  restaurantName: {
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 8
  },
  customerInfo: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  customerName: { 
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 4
  },
  customerPhone: { 
    color: '#333',
    marginBottom: 4
  },
  customerAddress: { 
    color: '#333',
    fontSize: 12
  },
  itemsContainer: {
    marginBottom: 12
  },
  itemsTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  orderItem: { 
    color: '#666', 
    fontSize: 14,
    marginBottom: 4
  },
  orderTotal: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  totalText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16
  },
  actions: { 
    flexDirection: 'row', 
    gap: 8
  },
  actionBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8, 
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  acceptBtn: {
    backgroundColor: '#4CAF50'
  },
  otpBtn: {
    backgroundColor: '#2196F3'
  },
  actionText: { 
    color: 'white', 
    fontWeight: 'bold',
    marginLeft: 4
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyText: { 
    color: '#888', 
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8
  }
});

export default DeliveryOrdersScreen; 
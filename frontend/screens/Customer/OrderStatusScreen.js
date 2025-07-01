import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';

const OrderStatusScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

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
      } else {
        console.log('API response not successful:', response.data);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      console.error('Error details:', error.response?.data);
      setOrders([]);
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
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>Track your food delivery</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={loadOrders}
          disabled={loading}
        >
          <MaterialIcons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

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
  refreshButton: {
    marginLeft: 'auto',
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
});

export default OrderStatusScreen; 
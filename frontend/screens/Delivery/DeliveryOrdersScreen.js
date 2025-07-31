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
import { formatDeliveryAddress, getLocationSummary, getDeliveryInstructions } from '../../utils/addressUtils';
import { useFocusEffect } from '@react-navigation/native';

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

  // Refresh orders when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (deliveryId) {
        loadOrders();
      }
    }, [deliveryId])
  );

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
    // Find the order to check its current status
    const order = orders.find(o => o._id === orderId);
    
    if (!order) {
      Alert.alert('Error', 'Order not found');
      return;
    }
    
    // Check if order is already assigned
    if (order.assignedTo) {
      Alert.alert('Order Already Assigned', 'This order has already been assigned to another delivery person.');
      return;
    }
    
    Alert.alert(
      'Accept Order',
      'Do you want to accept this order for delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const response = await apiService.acceptOrder(orderId);
              console.log('Order acceptance response:', response.data);
              
              if (response.data && response.data.success) {
                Alert.alert('Success', 'Order accepted for delivery!');
                // Refresh orders to show updated status
                loadOrders();
              } else {
                Alert.alert('Error', response.data?.message || 'Failed to accept order');
              }
            } catch (error) {
              console.error('Error accepting order:', error);
              const errorMessage = error.response?.data?.message || 'Failed to accept order. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const handleCompleteOrder = async (orderId) => {
    Alert.alert(
      'Complete Order',
      'Are you sure you want to mark this order as delivered?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const response = await apiService.completeOrder(orderId);
              console.log('Order completion response:', response.data);
              
              if (response.data && response.data.success) {
                Alert.alert('Success', 'Order marked as delivered!');
                // Refresh orders to show updated status
                loadOrders();
              } else {
                Alert.alert('Error', response.data?.message || 'Failed to complete order');
              }
            } catch (error) {
              console.error('Error completing order:', error);
              const errorMessage = error.response?.data?.message || 'Failed to complete order. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const handleOTP = (orderId) => {
    // Find the order to check its current status
    const order = orders.find(o => o._id === orderId);
    
    if (!order) {
      Alert.alert('Error', 'Order not found');
      return;
    }
    
    // Check if order is already delivered
    if (order.status === 'Delivered') {
      Alert.alert('Order Already Delivered', 'This order has already been delivered and OTP verified.');
      return;
    }
    
    // Check if order is not yet accepted for delivery
    if (order.status !== 'Out for Delivery') {
      Alert.alert('Order Not Accepted', 'Please accept the order for delivery before verifying OTP.');
      return;
    }
    
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

        {/* Assignment Status */}
        {item.assignedTo && (
          <View style={styles.assignmentInfo}>
            <MaterialIcons name="person" size={16} color="#2196F3" />
            <Text style={styles.assignmentText}>
              {item.assignedTo === deliveryId ? 'Assigned to you' : 'Assigned to another delivery person'}
            </Text>
          </View>
        )}

        <View style={styles.restaurantInfo}>
          <MaterialIcons name="restaurant" size={16} color="#666" />
          <Text style={styles.restaurantName}>
            {item.restaurantId && item.restaurantId.name ? item.restaurantId.name : 'Restaurant'}
          </Text>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>Customer: {item.customerInfo?.name || 'N/A'}</Text>
          <Text style={styles.customerPhone}>Phone: {item.customerInfo?.phone || 'N/A'}</Text>
          
          {/* Enhanced Address Display */}
          <View style={styles.addressSection}>
            <Text style={styles.addressTitle}>Delivery Address:</Text>
            <Text style={styles.customerAddress}>{item.customerInfo?.address || 'N/A'}</Text>
            
            {item.customerInfo?.deliveryDetails && (
              <View style={styles.detailedAddress}>
                {item.customerInfo.deliveryDetails.houseNumber && (
                  <Text style={styles.addressDetail}>🏠 {item.customerInfo.deliveryDetails.houseNumber}</Text>
                )}
                {item.customerInfo.deliveryDetails.apartment && (
                  <Text style={styles.addressDetail}>🏢 {item.customerInfo.deliveryDetails.apartment}</Text>
                )}
                {item.customerInfo.deliveryDetails.floor && (
                  <Text style={styles.addressDetail}>🏢 Floor: {item.customerInfo.deliveryDetails.floor}</Text>
                )}
                {item.customerInfo.deliveryDetails.landmark && (
                  <Text style={styles.addressDetail}>📍 Near: {item.customerInfo.deliveryDetails.landmark}</Text>
                )}
                {item.customerInfo.deliveryDetails.area && (
                  <Text style={styles.addressDetail}>🏘️ Area: {item.customerInfo.deliveryDetails.area}</Text>
                )}
                {item.customerInfo.deliveryDetails.city && item.customerInfo.deliveryDetails.pincode && (
                  <Text style={styles.addressDetail}>🏙️ {item.customerInfo.deliveryDetails.city} - {item.customerInfo.deliveryDetails.pincode}</Text>
                )}
                {item.customerInfo.deliveryDetails.additionalInstructions && (
                  <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsTitle}>📝 Special Instructions:</Text>
                    <Text style={styles.instructionsText}>{item.customerInfo.deliveryDetails.additionalInstructions}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
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
          <TouchableOpacity 
            style={[styles.actionBtn, styles.detailsBtn]} 
            onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
          >
            <MaterialIcons name="visibility" size={14} color="white" />
            <Text style={styles.actionText}>View Details</Text>
          </TouchableOpacity>
          
          {/* Accept Order Button - Only show for unassigned orders */}
          {!item.assignedTo && item.status === 'Order Placed' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]} 
              onPress={() => handleAcceptOrder(item._id)}
            >
              <MaterialIcons name="local-shipping" size={14} color="white" />
              <Text style={styles.actionText}>Accept Delivery</Text>
            </TouchableOpacity>
          )}
          
          {/* Complete Order Button - Only show for orders assigned to current delivery person */}
          {item.assignedTo === deliveryId && item.status === 'Out for Delivery' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.completeBtn]} 
              onPress={() => handleCompleteOrder(item._id)}
            >
              <MaterialIcons name="check-circle" size={14} color="white" />
              <Text style={styles.actionText}>Complete Delivery</Text>
            </TouchableOpacity>
          )}
          
          {item.status === 'Out for Delivery' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.otpBtn]} 
              onPress={() => handleOTP(item._id)}
            >
              <MaterialIcons name="verified" size={14} color="white" />
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
  assignmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  assignmentText: {
    color: '#333',
    fontSize: 12,
    marginLeft: 8
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
  addressSection: {
    marginTop: 8
  },
  addressTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  detailedAddress: {
    marginTop: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#2196F3'
  },
  addressDetail: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2
  },
  instructionsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 6
  },
  instructionsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 4
  },
  instructionsText: {
    fontSize: 12,
    color: '#424242',
    fontStyle: 'italic'
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
    flexWrap: 'wrap',
    gap: 8
  },
  actionBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8, 
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 100,
    justifyContent: 'center'
  },
  detailsBtn: {
    backgroundColor: '#9C27B0'
  },
  acceptBtn: {
    backgroundColor: '#4CAF50'
  },
  completeBtn: {
    backgroundColor: '#FF9800'
  },
  otpBtn: {
    backgroundColor: '#2196F3'
  },
  actionText: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 12,
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
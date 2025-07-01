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
import apiService from '../../services/apiService';
import { useVendor } from '../../hooks/useVendor';

const VendorOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { vendorId, loading: vendorLoading } = useVendor();

  useEffect(() => {
    if (vendorId && !vendorLoading) {
      console.log('Vendor data loaded:', vendorId);
      loadOrders();
    }
  }, [vendorId, vendorLoading]);

  const loadOrders = async () => {
    if (!vendorId) {
      console.log('No vendor ID available');
      return;
    }

    console.log('Loading orders for vendor ID:', vendorId);
    setLoading(true);
    try {
      // First, let's test if the vendor has any restaurants
      console.log('Testing vendor restaurants...');
      
      const response = await apiService.getVendorOrders(vendorId);
      console.log('Vendor orders API response:', response);
      console.log('Vendor orders data:', response.data);
      console.log('Orders array:', response.data?.data);
      console.log('Orders count:', response.data?.data?.length);
      
      if (response.data && response.data.success) {
        setOrders(response.data.data || []);
      } else {
        console.log('API response not successful:', response.data);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading vendor orders:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
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

  const handleStatusChange = async (orderId, newStatus) => {
    Alert.alert(
      'Update Order Status',
      `Change order status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              console.log('Updating order status:', { orderId, newStatus });
              const response = await apiService.updateOrderStatus(orderId, newStatus);
              console.log('Status update response:', response.data);
              
              if (response.data && response.data.success) {
                Alert.alert('Success', `Order status updated to ${newStatus}`);
                loadOrders(); // Refresh orders
              } else {
                Alert.alert('Error', 'Failed to update order status');
              }
            } catch (error) {
              console.error('Error updating order status:', error);
              console.error('Error response:', error.response?.data);
              console.error('Error status:', error.response?.status);
              console.error('Error message:', error.response?.data?.message);
              
              const errorMessage = error.response?.data?.message || 
                                 error.response?.data?.errors?.[0]?.msg || 
                                 'Failed to update order status';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed': return '#FF9800';
      case 'Accepted': return '#2196F3';
      case 'Preparing': return '#9C27B0';
      case 'Out for Delivery': return '#FF5722';
      case 'Delivered': return '#4CAF50';
      case 'Cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Order Placed': return 'receipt';
      case 'Accepted': return 'check-circle';
      case 'Preparing': return 'restaurant';
      case 'Out for Delivery': return 'delivery-dining';
      case 'Delivered': return 'done-all';
      case 'Cancelled': return 'cancel';
      default: return 'receipt';
    }
  };

  const canUpdateStatus = (currentStatus, newStatus) => {
    const statusFlow = {
      'Order Placed': ['Accepted', 'Cancelled'],
      'Accepted': ['Preparing', 'Cancelled'],
      'Preparing': ['Out for Delivery', 'Cancelled'],
      'Out for Delivery': [], // Can't change once out for delivery
      'Delivered': [], // Final status
      'Cancelled': [] // Final status
    };
    return statusFlow[currentStatus]?.includes(newStatus) || false;
  };

  if (vendorLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vendorId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Vendor not authenticated</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderOrder = ({ item }) => {
    console.log('Order object for Accept:', item);
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>#{item.orderId}</Text>
            <Text style={styles.orderTime}>
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <MaterialIcons name={getStatusIcon(item.status)} size={16} color="white" />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>Customer: {item.customerInfo?.name || 'N/A'}</Text>
          <Text style={styles.customerPhone}>Phone: {item.customerInfo?.phone || 'N/A'}</Text>
          <Text style={styles.customerAddress}>Address: {item.customerInfo?.address || 'N/A'}</Text>
        </View>

        <View style={styles.itemsContainer}>
          <Text style={styles.itemsTitle}>Order Items:</Text>
          {item.items && item.items.map((orderItem, index) => (
            <Text key={index} style={styles.orderItem}>
              • {orderItem.name} x{orderItem.quantity} - ₹{orderItem.price * orderItem.quantity}
            </Text>
          ))}
        </View>

        <View style={styles.orderTotal}>
          <Text style={styles.totalText}>Total: ₹{item.totalAmount || 0}</Text>
        </View>

        <View style={styles.actions}>
          {canUpdateStatus(item.status, 'Accepted') && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]} 
              onPress={() => handleStatusChange(item._id, 'Accepted')}
            >
              <MaterialIcons name="check-circle" size={16} color="white" />
              <Text style={styles.actionText}>Accept</Text>
            </TouchableOpacity>
          )}
          
          {canUpdateStatus(item.status, 'Preparing') && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.preparingBtn]} 
              onPress={() => handleStatusChange(item._id, 'Preparing')}
            >
              <MaterialIcons name="restaurant" size={16} color="white" />
              <Text style={styles.actionText}>Preparing</Text>
            </TouchableOpacity>
          )}
          
                  {canUpdateStatus(item.status, 'Out for Delivery') && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.readyBtn]} 
            onPress={() => handleStatusChange(item._id, 'Out for Delivery')}
          >
            <MaterialIcons name="local-shipping" size={16} color="white" />
            <Text style={styles.actionText}>Ready</Text>
          </TouchableOpacity>
        )}
          
          {canUpdateStatus(item.status, 'Cancelled') && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.cancelBtn]} 
              onPress={() => handleStatusChange(item._id, 'Cancelled')}
            >
              <MaterialIcons name="cancel" size={16} color="white" />
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} disabled={refreshing}>
          <MaterialIcons name="refresh" size={24} color="#FF9800" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item, index) => item.orderId ? item.orderId : `${item.id}_${index}`}
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
    color: '#FF9800' 
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
  customerInfo: {
    marginBottom: 12,
    paddingBottom: 12,
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
    flexWrap: 'wrap',
    gap: 8
  },
  actionBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8, 
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8
  },
  acceptBtn: {
    backgroundColor: '#4CAF50'
  },
  preparingBtn: {
    backgroundColor: '#9C27B0'
  },
  readyBtn: {
    backgroundColor: '#2196F3'
  },
  cancelBtn: {
    backgroundColor: '#F44336'
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

export default VendorOrdersScreen; 
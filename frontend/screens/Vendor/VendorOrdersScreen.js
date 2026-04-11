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
  RefreshControl,
  Modal,
  TextInput,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import apiService from '../../services/apiService';
import { useVendor } from '../../hooks/useVendor';
import { theme } from '../../utils/theme';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';



const VendorOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOrderId, setCancelOrderId] = useState(null);
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
      await apiService.cancelOrder(cancelOrderId, cancelReason);
      setCancelModalVisible(false);
      setCancelOrderId(null);
      setCancelReason('');
      loadOrders();
      Alert.alert('Order Cancelled', 'Order has been cancelled.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed': return '#B38E22'; // Champagne
      case 'Accepted': return theme.colors.primary; // Gold
      case 'Preparing': return '#673AB7'; // Deep Purple glow
      case 'Out for Delivery': return '#FF5722'; // Orange
      case 'Delivered': return theme.colors.success; // Emerald
      case 'Cancelled': return theme.colors.error; // Crimson
      default: return theme.colors.textSecondary;
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
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading Intelligence...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vendorId) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Vendor authentication failed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderOrder = ({ item, index }) => {
    return (
      <MotiView 
        from={{ opacity: 0, scale: 0.95, translateY: 20 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: index * 100 }}
      >
        <LinearGradient 
          colors={[theme.colors.surface, 'rgba(30, 30, 30, 0.9)']}
          style={styles.orderCard}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderId}>ORDER #{item.orderId?.toUpperCase()}</Text>
              <Text style={styles.orderTime}>
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20`, borderColor: getStatusColor(item.status), borderWidth: 1 }]}>
              <MaterialIcons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.customerInfo?.name || 'N/A'}</Text>
            <Text style={styles.customerPhone}><MaterialIcons name="phone" size={12} color={theme.colors.primary} /> {item.customerInfo?.phone || 'N/A'}</Text>
            <Text style={styles.customerAddress} numberOfLines={2}><MaterialIcons name="location-on" size={12} color={theme.colors.primary} /> {item.customerInfo?.address || 'N/A'}</Text>
          </View>

          <View style={styles.itemsContainer}>
            <Text style={styles.itemsTitle}>ORDER DETAILS</Text>
            {item.items && item.items.map((orderItem, index) => (
              <View key={index} style={styles.orderItemRow}>
                <Text style={styles.orderItemQuantity}>{orderItem.quantity}x</Text>
                <Text style={styles.orderItemName}>{orderItem.name}</Text>
                <Text style={styles.orderItemPrice}>₹{orderItem.price * orderItem.quantity}</Text>
              </View>
            ))}
          </View>

          <View style={styles.orderTotal}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalText}>₹{item.totalAmount || 0}</Text>
          </View>

          <View style={styles.actions}>
            {canUpdateStatus(item.status, 'Accepted') && (
              <TouchableOpacity 
                style={[styles.actionBtn, { borderColor: theme.colors.primary, borderWidth: 1, backgroundColor: 'rgba(212,175,55,0.1)' }]} 
                onPress={() => handleStatusChange(item._id, 'Accepted')}
              >
                <MaterialIcons name="check-circle" size={16} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.primary }]}>ACCEPT</Text>
              </TouchableOpacity>
            )}
            
            {canUpdateStatus(item.status, 'Preparing') && (
              <TouchableOpacity 
                style={[styles.actionBtn, { borderColor: '#9C27B0', borderWidth: 1, backgroundColor: 'rgba(156,39,176,0.1)' }]} 
                onPress={() => handleStatusChange(item._id, 'Preparing')}
              >
                <MaterialIcons name="restaurant" size={16} color="#9C27B0" />
                <Text style={[styles.actionText, { color: '#9C27B0' }]}>PREPARING</Text>
              </TouchableOpacity>
            )}
            
            {canUpdateStatus(item.status, 'Out for Delivery') && (
              <TouchableOpacity 
                style={[styles.actionBtn, { borderColor: '#2196F3', borderWidth: 1, backgroundColor: 'rgba(33,150,243,0.1)' }]} 
                onPress={() => handleStatusChange(item._id, 'Out for Delivery')}
              >
                <MaterialIcons name="local-shipping" size={16} color="#2196F3" />
                <Text style={[styles.actionText, { color: '#2196F3' }]}>READY</Text>
              </TouchableOpacity>
            )}
            
            {['Order Placed', 'Accepted', 'Preparing'].includes(item.status) && (
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: theme.colors.error, borderWidth: 1, backgroundColor: 'rgba(244,67,54,0.1)' }]}
                onPress={() => handleCancelOrder(item._id || item.id)}
              >
                <MaterialIcons name="cancel" size={16} color={theme.colors.error} />
                <Text style={[styles.actionText, { color: theme.colors.error }]}>CANCEL</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {item.status === 'Cancelled' && item.cancellationReason && (
            <Text style={styles.cancelReasonText}>
              CANCELLED: {item.cancellationReason}
            </Text>
          )}
        </LinearGradient>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Orders</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} disabled={refreshing}>
          <MaterialIcons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Fetching luxury orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item, index) => item.orderId ? item.orderId : `${item.id}_${index}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>Standing By</Text>
              <Text style={styles.emptySubtext}>New gourmet orders will appear here</Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Cancel Order Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <BlurView intensity={30} tint="dark" style={styles.modalOverlay}>
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            style={styles.modalContent}
          >
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.surface, borderRadius: 16 }]} />
            <Text style={styles.modalTitle}>Cancel Order</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="State your reason for cancellation"
              placeholderTextColor={theme.colors.textSecondary}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={confirmCancelOrder}>
                <LinearGradient colors={[theme.colors.error, '#B71C1C']} style={StyleSheet.absoluteFillObject} />
                <Text style={styles.modalButtonText}>CONFIRM ABORT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.textSecondary }]} onPress={() => setCancelModalVisible(false)}>
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>DISMISS</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingTop: 60,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: theme.colors.text,
    letterSpacing: 1,
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: { 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 20, 
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    overflow: 'hidden'
  },
  orderHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  orderInfo: {
    flex: 1
  },
  orderId: { 
    fontWeight: '900', 
    color: theme.colors.text,
    fontSize: 18,
    marginBottom: 6,
    letterSpacing: 1,
  },
  orderTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600'
  },
  statusBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { 
    fontSize: 10, 
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 1,
  },
  customerInfo: {
    marginBottom: 20,
  },
  customerName: { 
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6
  },
  customerPhone: { 
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 4
  },
  customerAddress: { 
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  itemsContainer: {
    marginBottom: 20,
    backgroundColor: theme.colors.surfaceVariant,
    padding: 16,
    borderRadius: 8,
  },
  itemsTitle: {
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 12,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemQuantity: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    width: 30,
    fontSize: 14,
  },
  orderItemName: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
  },
  orderItemPrice: {
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 15,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  totalLabel: {
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
  },
  totalText: {
    fontWeight: '900',
    color: theme.colors.primary,
    fontSize: 22,
  },
  actions: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: 12
  },
  actionBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8, 
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 0,
    flex: 1,
    justifyContent: 'center'
  },
  actionText: { 
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 12,
    letterSpacing: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: { 
    color: theme.colors.text, 
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    letterSpacing: 1,
  },
  emptySubtext: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 8
  },
  cancelReasonText: {
    color: theme.colors.error,
    fontWeight: '600',
    marginTop: 16,
    fontSize: 13,
    padding: 12,
    backgroundColor: 'rgba(244,67,54,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.3)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
    color: theme.colors.error,
    textAlign: 'center',
    letterSpacing: 1,
  },
  modalInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
});

export default VendorOrdersScreen; 
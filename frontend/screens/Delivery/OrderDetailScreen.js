import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';
import { formatDeliveryAddress, getLocationSummary, getDeliveryInstructions } from '../../utils/addressUtils';

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrderDetails(orderId);
      if (response.data && response.data.success) {
        setOrder(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load order details');
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCallCustomer = () => {
    if (order?.customerInfo?.phone) {
      Linking.openURL(`tel:${order.customerInfo.phone}`);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await apiService.updateOrderStatus(orderId, newStatus);
      if (response.data && response.data.success) {
        Alert.alert('Success', `Order status updated to ${newStatus}`);
        loadOrderDetails(); // Refresh order details
      } else {
        Alert.alert('Error', 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleNavigateToDelivery = () => {
    // This will be used when maps are integrated
    Alert.alert('Navigation', 'Navigation feature will be available soon!');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color="#F44336" />
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderId}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MaterialIcons name="receipt" size={24} color="#2196F3" />
            <Text style={styles.statusTitle}>Order Status</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>

        {/* Restaurant Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="restaurant" size={20} color="#4CAF50" />
            {' '}Restaurant Details
          </Text>
          <Text style={styles.restaurantName}>{order.restaurantId?.name || 'Restaurant'}</Text>
          <Text style={styles.restaurantInfo}>{order.restaurantId?.address?.fullAddress || 'Address not available'}</Text>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="person" size={20} color="#FF9800" />
            {' '}Customer Details
          </Text>
          
          <View style={styles.customerCard}>
            <Text style={styles.customerName}>{order.customerInfo?.name || 'N/A'}</Text>
            
            <TouchableOpacity style={styles.phoneButton} onPress={handleCallCustomer}>
              <MaterialIcons name="phone" size={16} color="#2196F3" />
              <Text style={styles.phoneText}>{order.customerInfo?.phone || 'N/A'}</Text>
              <MaterialIcons name="call" size={16} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="location-on" size={20} color="#F44336" />
            {' '}Delivery Address
          </Text>
          
          <View style={styles.addressCard}>
            <Text style={styles.addressText}>{order.customerInfo?.address || 'N/A'}</Text>
            
            {order.customerInfo?.deliveryDetails && (
              <View style={styles.detailedAddress}>
                {order.customerInfo.deliveryDetails.houseNumber && (
                  <View style={styles.addressDetail}>
                    <MaterialIcons name="home" size={16} color="#666" />
                    <Text style={styles.detailText}>{order.customerInfo.deliveryDetails.houseNumber}</Text>
                  </View>
                )}
                
                {order.customerInfo.deliveryDetails.apartment && (
                  <View style={styles.addressDetail}>
                    <MaterialIcons name="apartment" size={16} color="#666" />
                    <Text style={styles.detailText}>{order.customerInfo.deliveryDetails.apartment}</Text>
                  </View>
                )}
                
                {order.customerInfo.deliveryDetails.floor && (
                  <View style={styles.addressDetail}>
                    <MaterialIcons name="layers" size={16} color="#666" />
                    <Text style={styles.detailText}>Floor: {order.customerInfo.deliveryDetails.floor}</Text>
                  </View>
                )}
                
                {order.customerInfo.deliveryDetails.landmark && (
                  <View style={styles.addressDetail}>
                    <MaterialIcons name="place" size={16} color="#666" />
                    <Text style={styles.detailText}>Near: {order.customerInfo.deliveryDetails.landmark}</Text>
                  </View>
                )}
                
                {order.customerInfo.deliveryDetails.area && (
                  <View style={styles.addressDetail}>
                    <MaterialIcons name="location-city" size={16} color="#666" />
                    <Text style={styles.detailText}>{order.customerInfo.deliveryDetails.area}</Text>
                  </View>
                )}
                
                {order.customerInfo.deliveryDetails.city && order.customerInfo.deliveryDetails.pincode && (
                  <View style={styles.addressDetail}>
                    <MaterialIcons name="location-on" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {order.customerInfo.deliveryDetails.city} - {order.customerInfo.deliveryDetails.pincode}
                    </Text>
                  </View>
                )}
                
                {order.customerInfo.deliveryDetails.additionalInstructions && (
                  <View style={styles.instructionsContainer}>
                    <MaterialIcons name="info" size={16} color="#FF9800" />
                    <Text style={styles.instructionsTitle}>Special Instructions:</Text>
                    <Text style={styles.instructionsText}>{order.customerInfo.deliveryDetails.additionalInstructions}</Text>
                  </View>
                )}
              </View>
            )}
            
            <TouchableOpacity style={styles.navigateButton} onPress={handleNavigateToDelivery}>
              <MaterialIcons name="directions" size={20} color="white" />
              <Text style={styles.navigateButtonText}>Navigate to Delivery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="shopping-cart" size={20} color="#9C27B0" />
            {' '}Order Items
          </Text>
          
          <View style={styles.itemsContainer}>
            {Array.isArray(order.items) && order.items.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>₹{order.subtotal}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery Fee:</Text>
              <Text style={styles.totalValue}>₹{order.deliveryFee}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>₹{order.totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {order.status === 'Out for Delivery' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deliveredButton]}
              onPress={() => handleUpdateStatus('Delivered')}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Mark as Delivered</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {order.status === 'Ready for Delivery' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleUpdateStatus('Out for Delivery')}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons name="local-shipping" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Accept Delivery</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Out for Delivery': return '#FF5722';
    case 'Delivered': return '#4CAF50';
    case 'Ready for Delivery': return '#2196F3';
    default: return '#666';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  placeholder: {
    width: 32
  },
  content: {
    flex: 1,
    padding: 16
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  restaurantInfo: {
    fontSize: 14,
    color: '#666'
  },
  customerCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 6
  },
  phoneText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold'
  },
  addressCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12
  },
  detailedAddress: {
    marginBottom: 12
  },
  addressDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8
  },
  instructionsContainer: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginTop: 8
  },
  instructionsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E65100',
    marginLeft: 8,
    marginBottom: 4
  },
  instructionsText: {
    fontSize: 12,
    color: '#424242',
    fontStyle: 'italic',
    marginLeft: 24
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  navigateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8
  },
  itemsContainer: {
    marginBottom: 16
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold'
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666'
  },
  itemPrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold'
  },
  totalSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  totalLabel: {
    fontSize: 14,
    color: '#666'
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold'
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 8
  },
  grandTotalLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold'
  },
  grandTotalValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold'
  },
  actionsSection: {
    marginBottom: 20
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  acceptButton: {
    backgroundColor: '#2196F3'
  },
  deliveredButton: {
    backgroundColor: '#4CAF50'
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  }
});

export default OrderDetailScreen; 
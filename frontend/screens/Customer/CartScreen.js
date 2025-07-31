import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';

const CartScreen = ({ route, navigation }) => {
  const { restaurant, cart, deliveryInfo } = route.params;
  const [customerInfo, setCustomerInfo] = useState({
    name: deliveryInfo?.name || '',
    phone: deliveryInfo?.phone || '',
    address: deliveryInfo?.address || '',
  });
  const [loading, setLoading] = useState(false);

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const isMinimumOrderMet = () => {
    if (!restaurant?.minOrder) return true;
    return getTotalAmount() >= restaurant.minOrder;
  };

  const getShortfallAmount = () => {
    if (!restaurant?.minOrder) return 0;
    return Math.max(0, restaurant.minOrder - getTotalAmount());
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemPrice}>₹{item.price} x {item.quantity}</Text>
      </View>
      <View style={styles.itemTotal}>
        <Text style={styles.itemTotalText}>₹{item.price * item.quantity}</Text>
      </View>
    </View>
  );

  const handlePlaceOrder = async () => {
    if (!customerInfo.name.trim() || !customerInfo.phone.trim() || !customerInfo.address.trim()) {
      Alert.alert('Missing Information', 'Please fill in all the required fields.');
      return;
    }

    if (customerInfo.phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      // Get customer ID from AsyncStorage
      const customerData = await AsyncStorage.getItem('customerData');
      const customerId = customerData ? JSON.parse(customerData).id : null;
      
      if (!customerId) {
        Alert.alert('Error', 'Customer not authenticated. Please login again.');
        return;
      }

      const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

      // Prepare enhanced customer info with delivery details
      const enhancedCustomerInfo = {
        ...customerInfo,
        deliveryDetails: {
          houseNumber: deliveryInfo?.houseNumber || '',
          apartment: deliveryInfo?.apartment || '',
          floor: deliveryInfo?.floor || '',
          landmark: deliveryInfo?.landmark || '',
          area: deliveryInfo?.area || '',
          city: deliveryInfo?.city || '',
          pincode: deliveryInfo?.pincode || '',
          state: deliveryInfo?.state || '',
          additionalInstructions: deliveryInfo?.additionalInstructions || ''
        }
      };

      const orderData = {
        restaurantId: restaurant._id || restaurant.id, // Use _id if available
        customerId: customerId,
        items: cart.map(item => ({
          menuItemId: item._id || item.id, // Use _id if available
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        customerInfo: enhancedCustomerInfo,
        subtotal,
        totalAmount: subtotal + 20, // Including delivery fee
        deliveryFee: 20,
        paymentMethod: 'Cash on Delivery'
        // status: 'Order Placed' // REMOVE this field
      };

      console.log('Placing order:', orderData);
      const response = await apiService.placeOrder(orderData);
      console.log('Order placement response:', response.data);
      
      if (response.data && response.data.success) {
        navigation.navigate('OrderConfirmation', { order: response.data.data });
      } else {
        // Handle specific error types
        if (response.data?.errorType === 'MIN_ORDER_NOT_MET') {
          const errorData = response.data.data;
          Alert.alert(
            'Minimum Order Not Met',
            `Your current order is ₹${errorData.currentAmount}, but ${errorData.restaurantName} requires a minimum order of ₹${errorData.minimumAmount}.\n\nPlease add ₹${errorData.shortfall} more to your cart to proceed.`,
            [
              { text: 'Continue Shopping', onPress: () => navigation.goBack() },
              { text: 'OK' }
            ]
          );
        } else {
          Alert.alert('Error', response.data?.message || 'Failed to place order');
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <Text style={styles.headerSubtitle}>{restaurant.name}</Text>
      </View>

      <FlatList
        data={cart}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cartList}
        ListHeaderComponent={
          <View style={styles.cartHeader}>
            <Text style={styles.cartHeaderText}>Order Items ({getTotalItems()})</Text>
          </View>
        }
      />

      <View style={styles.customerInfoSection}>
        <Text style={styles.sectionTitle}>Delivery Information</Text>
        
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={customerInfo.name}
            onChangeText={(text) => setCustomerInfo({ ...customerInfo, name: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="phone" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={customerInfo.phone}
            onChangeText={(text) => setCustomerInfo({ ...customerInfo, phone: text })}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="location-on" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Delivery Address"
            value={customerInfo.address}
            onChangeText={(text) => setCustomerInfo({ ...customerInfo, address: text })}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={styles.orderSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{getTotalAmount()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>₹20</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{getTotalAmount() + 20}</Text>
        </View>
        
        {/* Minimum Order Warning */}
        {restaurant?.minOrder && !isMinimumOrderMet() && (
          <View style={styles.minOrderWarning}>
            <MaterialIcons name="warning" size={16} color="#F39C12" />
            <Text style={styles.minOrderText}>
              Minimum order: ₹{restaurant.minOrder} • Add ₹{getShortfallAmount()} more
            </Text>
          </View>
        )}
      </View>

      <View style={styles.paymentSection}>
        <Text style={styles.paymentTitle}>Payment Method</Text>
        <View style={styles.paymentOption}>
          <MaterialIcons name="money" size={24} color="#4CAF50" />
          <Text style={styles.paymentText}>Cash on Delivery</Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton, 
            (loading || !isMinimumOrderMet()) && styles.disabledButton
          ]}
          onPress={handlePlaceOrder}
          disabled={loading || !isMinimumOrderMet()}
        >
          <Text style={styles.placeOrderText}>
            {loading ? 'Placing Order...' : 
             !isMinimumOrderMet() 
               ? `Add ₹${getShortfallAmount()} more` 
               : `Place Order - ₹${getTotalAmount() + 20}`
            }
          </Text>
        </TouchableOpacity>
      </View>
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
  cartList: {
    padding: 16,
  },
  cartHeader: {
    marginBottom: 16,
  },
  cartHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cartItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#4CAF50',
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  customerInfoSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
    paddingBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  orderSummary: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  minOrderWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  minOrderText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    fontWeight: '500',
  },
  paymentSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  bottomSection: {
    padding: 16,
    paddingBottom: 32,
  },
  placeOrderButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  placeOrderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CartScreen; 
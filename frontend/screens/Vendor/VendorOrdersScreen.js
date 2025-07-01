import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import apiService from '../../services/apiService';
import { useVendor } from '../../hooks/useVendor';

const VendorOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { vendorId, loading: vendorLoading } = useVendor();

  useEffect(() => {
    if (vendorId && !vendorLoading) {
      loadOrders();
    }
  }, [vendorId, vendorLoading]);

  const loadOrders = async () => {
    if (!vendorId) {
      console.log('No vendor ID available');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.getVendorOrders(vendorId);
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (orderId, status) => {
    Alert.alert('Order Status', `Change order ${orderId} to ${status}?`);
    // Call API to update order status
  };

  if (vendorLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!vendorId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Vendor not authenticated</Text>
      </SafeAreaView>
    );
  }

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.orderId}</Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>
      <Text style={styles.customerName}>Customer: {item.customerInfo?.name}</Text>
      <Text style={styles.customerPhone}>Phone: {item.customerInfo?.phone}</Text>
      <Text style={styles.customerAddress}>Address: {item.customerInfo?.address}</Text>
      <FlatList
        data={item.items}
        keyExtractor={(i, idx) => `${i.menuItemId || i.id || idx}_${idx}`}
        renderItem={({ item, index }) => (
          <Text style={styles.orderItem}>{item.name} x{item.quantity}</Text>
        )}
      />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange(item.id, 'Accepted')}>
          <Text style={styles.actionText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange(item.id, 'Rejected')}>
          <Text style={styles.actionText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Orders</Text>
      {orders.length === 0 ? (
        <Text style={styles.empty}>No orders yet.</Text>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item, index) => item.orderId ? item.orderId : `${item.id}_${index}`}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },
  header: { fontSize: 22, fontWeight: 'bold', marginVertical: 10, color: '#FF9800' },
  orderCard: { backgroundColor: 'white', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontWeight: 'bold', color: '#333' },
  status: { color: '#2196F3', fontWeight: 'bold' },
  customerName: { color: '#333' },
  customerPhone: { color: '#333' },
  customerAddress: { color: '#333', marginBottom: 8 },
  orderItem: { color: '#666', fontSize: 14 },
  actions: { flexDirection: 'row', marginTop: 10 },
  actionBtn: { backgroundColor: '#FF9800', borderRadius: 8, padding: 8, marginRight: 10 },
  actionText: { color: 'white', fontWeight: 'bold' },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
});

export default VendorOrdersScreen; 
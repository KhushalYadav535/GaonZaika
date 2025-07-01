import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import apiService from '../../services/apiService';

const AdminOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllOrders();
      setOrders(response.data || []);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.orderId}</Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>
      <Text style={styles.restaurantName}>Restaurant: {item.restaurantName}</Text>
      <Text style={styles.customerName}>Customer: {item.customerInfo?.name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>All Orders</Text>
      {orders.length === 0 ? (
        <Text style={styles.empty}>No orders found.</Text>
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
  header: { fontSize: 22, fontWeight: 'bold', marginVertical: 10, color: '#9C27B0' },
  orderCard: { backgroundColor: 'white', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontWeight: 'bold', color: '#333' },
  status: { color: '#FF9800', fontWeight: 'bold' },
  restaurantName: { color: '#333' },
  customerName: { color: '#333', marginBottom: 8 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
});

export default AdminOrdersScreen; 
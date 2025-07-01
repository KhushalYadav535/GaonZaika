import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import apiService from '../../services/apiService';

const DeliveryOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Replace 'deliveryId' with actual delivery person ID from auth/session
      const response = await apiService.getDeliveryOrders('deliveryId');
      setOrders(response.data || []);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOTP = (orderId) => {
    navigation.navigate('DeliveryOTP', { orderId });
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.orderId}</Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>
      <Text style={styles.customerName}>Customer: {item.customerInfo?.name}</Text>
      <Text style={styles.customerPhone}>Phone: {item.customerInfo?.phone}</Text>
      <Text style={styles.customerAddress}>Address: {item.customerInfo?.address}</Text>
      <TouchableOpacity style={styles.otpBtn} onPress={() => handleOTP(item.id)}>
        <MaterialIcons name="verified" size={18} color="#fff" />
        <Text style={styles.otpText}>Verify OTP</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Assigned Orders</Text>
      {orders.length === 0 ? (
        <Text style={styles.empty}>No assigned orders.</Text>
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
  header: { fontSize: 22, fontWeight: 'bold', marginVertical: 10, color: '#2196F3' },
  orderCard: { backgroundColor: 'white', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontWeight: 'bold', color: '#333' },
  status: { color: '#FF9800', fontWeight: 'bold' },
  customerName: { color: '#333' },
  customerPhone: { color: '#333' },
  customerAddress: { color: '#333', marginBottom: 8 },
  otpBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2196F3', borderRadius: 8, padding: 10, marginTop: 10, alignSelf: 'flex-start' },
  otpText: { color: 'white', fontWeight: 'bold', marginLeft: 6 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
});

export default DeliveryOrdersScreen; 
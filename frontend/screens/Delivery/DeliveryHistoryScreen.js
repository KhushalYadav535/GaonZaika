import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';

const DeliveryHistoryScreen = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliveryId, setDeliveryId] = useState(null);

  useEffect(() => {
    loadDeliveryPersonData();
  }, []);

  useEffect(() => {
    if (deliveryId) {
      loadDeliveryHistory();
    }
  }, [deliveryId]);

  const loadDeliveryPersonData = async () => {
    try {
      const deliveryData = await AsyncStorage.getItem('deliveryData');
      if (deliveryData) {
        const parsedData = JSON.parse(deliveryData);
        setDeliveryId(parsedData.id);
      }
    } catch (error) {
      console.error('Error loading delivery person data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryHistory = async () => {
    try {
      const response = await apiService.getDeliveryOrders(deliveryId);
      const orders = response.data?.data || [];
      
      // Filter completed deliveries
      const completedDeliveries = orders
        .filter(order => order.status === 'Delivered')
        .map(order => ({
          id: order._id,
          date: new Date(order.actualDeliveryTime || order.updatedAt).toLocaleDateString(),
          order: order.orderId,
          status: 'Completed',
          amount: order.totalAmount,
          customerName: order.customerInfo?.name
        }));
      
      setDeliveries(completedDeliveries);
    } catch (error) {
      console.error('Error loading delivery history:', error);
      setDeliveries([]);
    }
  };

  if (loading) {
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Delivery History</Text>
      <FlatList
        data={deliveries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <MaterialIcons name="local-shipping" size={28} color="#2196F3" />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.order}>{item.order}</Text>
              <Text style={styles.customer}>Customer: {item.customerName}</Text>
              <Text style={styles.amount}>₹{item.amount}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="local-shipping" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No delivery history yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa', 
    padding: 20 
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
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 20 
  },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    elevation: 2 
  },
  date: { 
    fontSize: 16, 
    color: '#2196F3', 
    fontWeight: 'bold' 
  },
  order: { 
    fontSize: 15, 
    color: '#333' 
  },
  customer: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  status: { 
    fontSize: 14, 
    color: '#4CAF50', 
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default DeliveryHistoryScreen; 
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';

const EarningsHistoryScreen = () => {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliveryId, setDeliveryId] = useState(null);

  useEffect(() => {
    loadDeliveryPersonData();
  }, []);

  useEffect(() => {
    if (deliveryId) {
      loadEarningsHistory();
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

  const loadEarningsHistory = async () => {
    try {
      const response = await apiService.getDeliveryOrders(deliveryId);
      const orders = response.data?.data || [];
      
      // Filter delivered orders and calculate earnings
      const deliveredOrders = orders.filter(order => order.status === 'Delivered');
      
      // Group by date and calculate daily earnings
      const earningsByDate = deliveredOrders.reduce((acc, order) => {
        const date = new Date(order.actualDeliveryTime || order.updatedAt).toLocaleDateString();
        const commission = order.totalAmount * 0.1; // 10% commission
        
        if (acc[date]) {
          acc[date].amount += commission;
          acc[date].deliveries += 1;
        } else {
          acc[date] = {
            id: date,
            date: date,
            amount: commission,
            deliveries: 1
          };
        }
        
        return acc;
      }, {});
      
      const earningsList = Object.values(earningsByDate)
        .map(earning => ({
          ...earning,
          amount: Math.round(earning.amount)
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setEarnings(earningsList);
    } catch (error) {
      console.error('Error loading earnings history:', error);
      setEarnings([]);
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
      <Text style={styles.title}>Earnings History</Text>
      <FlatList
        data={earnings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <MaterialIcons name="account-balance-wallet" size={28} color="#388E3C" />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.amount}>₹{item.amount}</Text>
              <Text style={styles.deliveries}>{item.deliveries} delivery{item.deliveries > 1 ? 'ies' : 'y'}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="account-balance-wallet" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No earnings history yet</Text>
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
  amount: { 
    fontSize: 18, 
    color: '#388E3C', 
    fontWeight: 'bold',
    marginTop: 2,
  },
  deliveries: {
    fontSize: 14,
    color: '#666',
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

export default EarningsHistoryScreen; 
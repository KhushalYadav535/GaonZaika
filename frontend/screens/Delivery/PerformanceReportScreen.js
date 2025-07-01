import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';

const PerformanceReportScreen = () => {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    avgRating: 0,
    bestDay: 'N/A',
    bestEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deliveryId, setDeliveryId] = useState(null);

  useEffect(() => {
    loadDeliveryPersonData();
  }, []);

  useEffect(() => {
    if (deliveryId) {
      loadPerformanceStats();
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

  const loadPerformanceStats = async () => {
    try {
      const response = await apiService.getDeliveryOrders(deliveryId);
      const orders = response.data?.data || [];
      
      // Filter delivered orders
      const deliveredOrders = orders.filter(order => order.status === 'Delivered');
      
      // Calculate total deliveries
      const totalDeliveries = deliveredOrders.length;
      
      // Calculate average rating (if available)
      const ratedOrders = deliveredOrders.filter(order => order.rating);
      const avgRating = ratedOrders.length > 0 
        ? (ratedOrders.reduce((sum, order) => sum + order.rating, 0) / ratedOrders.length).toFixed(1)
        : 0;
      
      // Find best day (highest earnings in a single day)
      const earningsByDate = deliveredOrders.reduce((acc, order) => {
        const date = new Date(order.actualDeliveryTime || order.updatedAt).toLocaleDateString();
        const commission = order.totalAmount * 0.1; // 10% commission
        
        if (acc[date]) {
          acc[date] += commission;
        } else {
          acc[date] = commission;
        }
        
        return acc;
      }, {});
      
      let bestDay = 'N/A';
      let bestEarnings = 0;
      
      Object.entries(earningsByDate).forEach(([date, earnings]) => {
        if (earnings > bestEarnings) {
          bestEarnings = earnings;
          bestDay = date;
        }
      });
      
      setStats({
        totalDeliveries,
        avgRating: parseFloat(avgRating),
        bestDay,
        bestEarnings: Math.round(bestEarnings),
      });
    } catch (error) {
      console.error('Error loading performance stats:', error);
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
      <Text style={styles.title}>Performance Report</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <MaterialIcons name="local-shipping" size={28} color="#2196F3" />
          <Text style={styles.label}>Total Deliveries:</Text>
          <Text style={styles.value}>{stats.totalDeliveries}</Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="star" size={28} color="#FFD600" />
          <Text style={styles.label}>Average Rating:</Text>
          <Text style={styles.value}>{stats.avgRating}</Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="event" size={28} color="#4CAF50" />
          <Text style={styles.label}>Best Day:</Text>
          <Text style={styles.value}>{stats.bestDay}</Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="account-balance-wallet" size={28} color="#388E3C" />
          <Text style={styles.label}>Best Earnings:</Text>
          <Text style={styles.value}>₹{stats.bestEarnings}</Text>
        </View>
      </View>
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
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 20, 
    elevation: 2 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  label: { 
    fontSize: 16, 
    color: '#888', 
    marginLeft: 8, 
    flex: 1 
  },
  value: { 
    fontSize: 16, 
    color: '#333', 
    fontWeight: 'bold' 
  },
});

export default PerformanceReportScreen; 
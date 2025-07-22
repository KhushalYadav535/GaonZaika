import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';

const SalesAnalyticsScreen = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const vendorData = await AsyncStorage.getItem('vendorData');
        const vendor = vendorData ? JSON.parse(vendorData) : null;
        if (!vendor?.id) {
          setError('Vendor ID not found');
          setLoading(false);
          return;
        }
        const response = await apiService.getVendorDashboard(vendor.id);
        if (response.data && response.data.success) {
          setStats(response.data.data);
        } else {
          setError('Failed to fetch analytics');
        }
      } catch (err) {
        setError('Error fetching analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{error}</Text>
      </View>
    );
  }
  if (!stats) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sales Analytics</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Today</Text>
        <View style={styles.row}>
          <MaterialIcons name="receipt" size={28} color="#FF9800" />
          <Text style={styles.value}>{stats.todayRevenue ? `${stats.todayRevenue} ₹` : '₹0'} Revenue</Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="analytics" size={28} color="#388E3C" />
          <Text style={styles.value}>{stats.totalOrders || 0} Orders</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>This Week</Text>
        <View style={styles.row}>
          <MaterialIcons name="account-balance-wallet" size={28} color="#2196F3" />
          <Text style={styles.value}>{stats.thisWeekRevenue ? `${stats.thisWeekRevenue} ₹` : '₹0'} Revenue</Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="receipt" size={28} color="#388E3C" />
          <Text style={styles.value}>{stats.completedOrders || 0} Completed Orders</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>This Month</Text>
        <View style={styles.row}>
          <MaterialIcons name="account-balance-wallet" size={28} color="#FF9800" />
          <Text style={styles.value}>{stats.thisMonthRevenue ? `${stats.thisMonthRevenue} ₹` : '₹0'} Revenue</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Ratings</Text>
        <View style={styles.row}>
          <MaterialIcons name="star" size={28} color="#FFD600" />
          <Text style={styles.value}>{stats.averageRating || 0} / 5 ({stats.totalRatings || 0} ratings)</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#f8f9fa' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 24, textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 2 },
  label: { fontSize: 16, color: '#888', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  value: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
});

export default SalesAnalyticsScreen; 
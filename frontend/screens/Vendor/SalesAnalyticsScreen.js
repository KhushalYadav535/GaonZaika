import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SalesAnalyticsScreen = () => {
  // Mock data
  const stats = {
    todayOrders: 12,
    todayRevenue: 1450,
    weekOrders: 80,
    weekRevenue: 9000,
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sales Analytics</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Today</Text>
        <View style={styles.row}>
          <MaterialIcons name="receipt" size={28} color="#FF9800" />
          <Text style={styles.value}>{stats.todayOrders} Orders</Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="account-balance-wallet" size={28} color="#388E3C" />
          <Text style={styles.value}>₹{stats.todayRevenue}</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>This Week</Text>
        <View style={styles.row}>
          <MaterialIcons name="receipt" size={28} color="#2196F3" />
          <Text style={styles.value}>{stats.weekOrders} Orders</Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="account-balance-wallet" size={28} color="#388E3C" />
          <Text style={styles.value}>₹{stats.weekRevenue}</Text>
        </View>
      </View>
      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartText}>[Chart Coming Soon]</Text>
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
  chartPlaceholder: { height: 180, backgroundColor: '#FFF3E0', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  chartText: { color: '#FF9800', fontSize: 16 },
});

export default SalesAnalyticsScreen; 
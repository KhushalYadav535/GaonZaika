import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const stats = {
  totalDeliveries: 320,
  avgRating: 4.7,
  bestDay: '2024-05-25',
  bestEarnings: 500,
};

const PerformanceReportScreen = () => (
  <View style={styles.container}>
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
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 16, color: '#888', marginLeft: 8, flex: 1 },
  value: { fontSize: 16, color: '#333', fontWeight: 'bold' },
});

export default PerformanceReportScreen; 
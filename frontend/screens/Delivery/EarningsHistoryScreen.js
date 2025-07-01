import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const mockEarnings = [
  { id: '1', date: '2024-06-01', amount: 250 },
  { id: '2', date: '2024-05-31', amount: 180 },
  { id: '3', date: '2024-05-30', amount: 210 },
];

const EarningsHistoryScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Earnings History</Text>
    <FlatList
      data={mockEarnings}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <MaterialIcons name="account-balance-wallet" size={28} color="#388E3C" />
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.amount}>₹{item.amount}</Text>
          </View>
        </View>
      )}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  date: { fontSize: 16, color: '#2196F3', fontWeight: 'bold' },
  amount: { fontSize: 16, color: '#388E3C', fontWeight: 'bold' },
});

export default EarningsHistoryScreen; 
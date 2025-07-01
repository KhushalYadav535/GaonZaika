import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const mockDeliveries = [
  { id: '1', date: '2024-06-01', order: '#1234', status: 'Completed' },
  { id: '2', date: '2024-05-31', order: '#1228', status: 'Completed' },
  { id: '3', date: '2024-05-30', order: '#1219', status: 'Completed' },
];

const DeliveryHistoryScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Delivery History</Text>
    <FlatList
      data={mockDeliveries}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <MaterialIcons name="local-shipping" size={28} color="#2196F3" />
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.order}>{item.order}</Text>
            <Text style={styles.status}>{item.status}</Text>
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
  order: { fontSize: 15, color: '#333' },
  status: { fontSize: 14, color: '#4CAF50', fontWeight: 'bold' },
});

export default DeliveryHistoryScreen; 
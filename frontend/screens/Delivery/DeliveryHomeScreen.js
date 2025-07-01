import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const DeliveryHomeScreen = ({ navigation }) => {
  // Mock data for initial version
  const [status, setStatus] = useState('Online');
  const deliveryPartner = {
    name: 'Amit Kumar',
    vehicle: 'DL-01-AB-1234',
    todayDeliveries: 8,
    pendingDeliveries: 2,
    completedDeliveries: 6,
    earningsToday: 650,
  };

  const toggleStatus = () => {
    setStatus((prev) => (prev === 'Online' ? 'Offline' : 'Online'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Partner Info */}
        <View style={styles.partnerCard}>
          <View style={styles.partnerIcon}>
            <MaterialIcons name="delivery-dining" size={40} color="#2196F3" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.partnerName}>{deliveryPartner.name}</Text>
            <Text style={styles.partnerVehicle}>Vehicle: {deliveryPartner.vehicle}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: status === 'Online' ? '#4CAF50' : '#f44336' }]} />
              <Text style={[styles.statusText, { color: status === 'Online' ? '#4CAF50' : '#f44336' }]}>{status}</Text>
            </View>
          </View>
        </View>

        {/* Today's Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="local-shipping" size={28} color="#2196F3" />
              <Text style={styles.summaryNumber}>{deliveryPartner.todayDeliveries}</Text>
              <Text style={styles.summaryLabel}>Total Deliveries</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="pending-actions" size={28} color="#FF9800" />
              <Text style={styles.summaryNumber}>{deliveryPartner.pendingDeliveries}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="check-circle" size={28} color="#4CAF50" />
              <Text style={styles.summaryNumber}>{deliveryPartner.completedDeliveries}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.earningsCard}>
          <MaterialIcons name="account-balance-wallet" size={32} color="#388E3C" />
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.earningsLabel}>Earnings Today</Text>
            <Text style={styles.earningsValue}>₹{deliveryPartner.earningsToday}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Orders')}
          >
            <MaterialIcons name="list-alt" size={24} color="#fff" />
            <Text style={styles.actionText}>View Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: status === 'Online' ? '#f44336' : '#4CAF50' }]}
            onPress={toggleStatus}
          >
            <MaterialIcons name={status === 'Online' ? 'toggle-off' : 'toggle-on'} size={24} color="#fff" />
            <Text style={styles.actionText}>{status === 'Online' ? 'Go Offline' : 'Go Online'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  partnerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  partnerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  partnerVehicle: {
    fontSize: 15,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  earningsLabel: {
    fontSize: 15,
    color: '#666',
  },
  earningsValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#388E3C',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 6,
    elevation: 2,
  },
  actionText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default DeliveryHomeScreen;

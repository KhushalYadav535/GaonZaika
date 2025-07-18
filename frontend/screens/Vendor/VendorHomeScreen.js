import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVendor } from '../../hooks/useVendor';
import apiService from '../../services/apiService';

const VendorHomeScreen = ({ navigation }) => {
  const { vendorId, vendorName, restaurant, loading: vendorLoading } = useVendor();
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    thisWeekRevenue: 0,
    thisMonthRevenue: 0,
    averageRating: 0,
    totalRatings: 0
  });
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    if (vendorId && !vendorLoading) {
      loadDashboardData();
      loadLiveStatus();
    }
  }, [vendorId, vendorLoading]);

  const loadDashboardData = async () => {
    if (!vendorId) return;

    setLoading(true);
    try {
      const response = await apiService.getVendorDashboard(vendorId);
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveStatus = async () => {
    if (!vendorId) return;

    try {
      const response = await apiService.getVendorLiveStatus(vendorId);
      if (response.data.success) {
        setIsLive(response.data.data.isLive);
      }
    } catch (error) {
      console.error('Error loading live status:', error);
    }
  };

  const toggleLiveStatus = async () => {
    if (!vendorId) return;

    setLiveLoading(true);
    try {
      const response = await apiService.toggleVendorLive(vendorId);
      if (response.data.success) {
        setIsLive(response.data.data.isLive);
        // Show success message
        Alert.alert(
          'Success',
          response.data.message,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error toggling live status:', error);
      Alert.alert(
        'Error',
        'Failed to update live status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLiveLoading(false);
    }
  };

  if (vendorLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vendorId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Vendor not authenticated</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Restaurant Info */}
        <View style={styles.restaurantCard}>
          <View style={styles.restaurantIcon}>
            <MaterialIcons name="restaurant" size={40} color="#FF9800" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.restaurantName}>{restaurant?.name || 'Restaurant'}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isLive ? '#4CAF50' : '#f44336' }]} />
              <Text style={[styles.statusText, { color: isLive ? '#4CAF50' : '#f44336' }]}>
                {isLive ? 'LIVE' : 'OFFLINE'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.liveButton,
              { backgroundColor: isLive ? '#f44336' : '#4CAF50' }
            ]}
            onPress={toggleLiveStatus}
            disabled={liveLoading}
          >
            <MaterialIcons 
              name={isLive ? "stop" : "play-arrow"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.liveButtonText}>
              {liveLoading ? '...' : (isLive ? 'Go Offline' : 'Go Live')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Status Card */}
        <View style={styles.liveStatusCard}>
          <View style={styles.liveStatusHeader}>
            <MaterialIcons 
              name={isLive ? "wifi" : "wifi-off"} 
              size={24} 
              color={isLive ? '#4CAF50' : '#f44336'} 
            />
            <Text style={styles.liveStatusTitle}>
              {isLive ? 'Restaurant is LIVE' : 'Restaurant is OFFLINE'}
            </Text>
          </View>
          <Text style={styles.liveStatusDescription}>
            {isLive 
              ? 'Customers can see your restaurant and place orders. You will receive order notifications.'
              : 'Restaurant is closed. Customers cannot place orders. Go live to start accepting orders.'
            }
          </Text>
          {isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.livePulse} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Today's Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="receipt" size={28} color="#FF9800" />
              <Text style={styles.summaryNumber}>{dashboardData.totalOrders}</Text>
              <Text style={styles.summaryLabel}>Total Orders</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="pending-actions" size={28} color="#2196F3" />
              <Text style={styles.summaryNumber}>{dashboardData.pendingOrders}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="check-circle" size={28} color="#4CAF50" />
              <Text style={styles.summaryNumber}>{dashboardData.completedOrders}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.earningsCard}>
          <MaterialIcons name="account-balance-wallet" size={32} color="#388E3C" />
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.earningsLabel}>Earnings Today</Text>
            <Text style={styles.earningsValue}>₹{dashboardData.todayRevenue}</Text>
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
            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
            onPress={() => navigation.navigate('Menu')}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
            <Text style={styles.actionText}>Add Menu Item</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  restaurantCard: {
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
  restaurantIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
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
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  liveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  liveStatusCard: {
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
  liveStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  liveStatusDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  liveIndicatorText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
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
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default VendorHomeScreen; 
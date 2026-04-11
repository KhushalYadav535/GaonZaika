import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVendor } from '../../hooks/useVendor';
import apiService from '../../services/apiService';
import { theme } from '../../utils/theme';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Restaurant Info Header */}
        <MotiView 
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.restaurantCard}
        >
          <LinearGradient
            colors={['rgba(200,150,30,0.06)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.restaurantIcon}>
            <MaterialIcons name="restaurant-menu" size={30} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.restaurantName}>{restaurant?.name || 'Restaurant'}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isLive ? theme.colors.success : theme.colors.error }]} />
              <Text style={[styles.statusText, { color: isLive ? theme.colors.success : theme.colors.error }]}>
                {isLive ? 'LIVE' : 'OFFLINE'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.liveButton,
              { backgroundColor: isLive ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)' },
              { borderColor: isLive ? theme.colors.error : theme.colors.success, borderWidth: 1 }
            ]}
            onPress={toggleLiveStatus}
            disabled={liveLoading}
          >
            <MaterialIcons 
              name={isLive ? "stop" : "power-settings-new"} 
              size={18} 
              color={isLive ? theme.colors.error : theme.colors.success} 
            />
            <Text style={[styles.liveButtonText, { color: isLive ? theme.colors.error : theme.colors.success }]}>
              {liveLoading ? '...' : (isLive ? 'Go Offline' : 'Go Live')}
            </Text>
          </TouchableOpacity>
        </MotiView>

        {/* Live Status Description */}
        <AnimatePresence>
          {!isLive && (
            <MotiView 
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 100 }}
              exit={{ opacity: 0, height: 0 }}
              style={[styles.liveStatusCard, { backgroundColor: 'rgba(244, 67, 54, 0.05)' }]}
            >
              <View style={styles.liveStatusHeader}>
                <MaterialIcons name="wifi-off" size={20} color={theme.colors.error} />
                <Text style={[styles.liveStatusTitle, { color: theme.colors.error }]}>Currently Offline</Text>
              </View>
              <Text style={styles.liveStatusDescription}>
                Customers cannot place orders. Go live to start accepting deliveries.
              </Text>
            </MotiView>
          )}
        </AnimatePresence>

        <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 100 }}>
          <LinearGradient
            colors={[theme.colors.surface, theme.colors.surfaceVariant]}
            style={styles.earningsCard}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 12, borderRadius: 16 }}>
                <MaterialIcons name="account-balance-wallet" size={28} color={theme.colors.primary} />
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.earningsLabel}>Today's Earnings</Text>
                <Text style={styles.earningsValue}>₹{dashboardData.todayRevenue}</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </LinearGradient>
        </MotiView>

        {/* Today's Analytics Grid */}
        <Text style={styles.sectionTitle}>Analytics</Text>
        <View style={styles.summaryRow}>
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200 }} style={styles.summaryItemWrapper}>
            <LinearGradient colors={[theme.colors.surface, theme.colors.surfaceVariant]} style={styles.summaryItem}>
              <MaterialIcons name="receipt" size={28} color={theme.colors.primary} />
              <Text style={styles.summaryNumber}>{dashboardData.totalOrders}</Text>
              <Text style={styles.summaryLabel}>Orders</Text>
            </LinearGradient>
          </MotiView>
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 300 }} style={styles.summaryItemWrapper}>
            <LinearGradient colors={[theme.colors.surface, theme.colors.surfaceVariant]} style={styles.summaryItem}>
              <MaterialIcons name="pending-actions" size={28} color="#2196F3" />
              <Text style={styles.summaryNumber}>{dashboardData.pendingOrders}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </LinearGradient>
          </MotiView>
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 400 }} style={styles.summaryItemWrapper}>
            <LinearGradient colors={[theme.colors.surface, theme.colors.surfaceVariant]} style={styles.summaryItem}>
              <MaterialIcons name="check-circle" size={28} color={theme.colors.success} />
              <Text style={styles.summaryNumber}>{dashboardData.completedOrders}</Text>
              <Text style={styles.summaryLabel}>Done</Text>
            </LinearGradient>
          </MotiView>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 500 }} style={styles.actionsRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')} style={{ flex: 1, marginRight: 8 }} activeOpacity={0.8}>
            <LinearGradient colors={[theme.colors.goldLight, theme.colors.surface]} style={styles.actionButton}>
              <MaterialIcons name="list-alt" size={24} color={theme.colors.primary} />
              <Text style={styles.actionText}>View Orders</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')} style={{ flex: 1, marginLeft: 8 }} activeOpacity={0.8}>
            <LinearGradient colors={[theme.colors.primary, '#A07818']} style={styles.actionButton}>
              <MaterialIcons name="add" size={24} color={theme.colors.background} />
              <Text style={[styles.actionText, { color: theme.colors.background }]}>Add Item</Text>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
        
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden'
  },
  restaurantIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  liveButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  liveStatusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.2)',
  },
  liveStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveStatusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  liveStatusDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  earningsLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  summaryItemWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  summaryItem: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.goldBorder,
  },
  actionText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
});

export default VendorHomeScreen; 
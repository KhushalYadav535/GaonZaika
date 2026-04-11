import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';
import pushNotificationService from '../../services/pushNotificationService';
import { theme } from '../../utils/theme';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const DeliveryHomeScreen = ({ navigation }) => {
  const [status, setStatus] = useState('Online');
  const [deliveryPerson, setDeliveryPerson] = useState(null);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    earningsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [hasNewOrders, setHasNewOrders] = useState(false);

  useEffect(() => {
    loadDeliveryPersonData();
    initializePushNotifications();
    
    // Cleanup function
    return () => {
      pushNotificationService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (deliveryPerson?.id) {
      loadStats();
    }
  }, [deliveryPerson]);

  const loadDeliveryPersonData = async () => {
    try {
      const deliveryData = await AsyncStorage.getItem('deliveryData');
      if (deliveryData) {
        const parsedData = JSON.parse(deliveryData);
        setDeliveryPerson(parsedData);
        console.log('Delivery person data loaded:', parsedData);
      }
    } catch (error) {
      console.error('Error loading delivery person data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // For now, we'll use basic stats calculation
      // In a real app, you'd have a dedicated API endpoint for delivery stats
      const response = await apiService.getDeliveryOrders(deliveryPerson.id);
      const orders = response.data?.data || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(order => 
        new Date(order.createdAt) >= today
      );
      
      const pendingOrders = orders.filter(order => 
        order.status === 'Out for Delivery'
      );
      
      const completedOrders = orders.filter(order => 
        order.status === 'Delivered'
      );
      
      const todayCompleted = todayOrders.filter(order => 
        order.status === 'Delivered'
      );
      
      // Calculate earnings (assuming 10% commission per delivery)
      const earningsToday = todayCompleted.reduce((sum, order) => 
        sum + (order.totalAmount * 0.1), 0
      );
      
      setStats({
        todayDeliveries: todayOrders.length,
        pendingDeliveries: pendingOrders.length,
        completedDeliveries: completedOrders.length,
        earningsToday: Math.round(earningsToday),
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const toggleStatus = async () => {
    setStatusLoading(true);
    try {
      let response;
      if (status === 'Online') {
        response = await apiService.goOffline();
      } else {
        response = await apiService.goOnline();
      }
      
      if (response.data?.success) {
        setStatus(status === 'Online' ? 'Offline' : 'Online');
        console.log('Status updated successfully:', response.data.message);
      } else {
        console.error('Failed to update status:', response.data?.message || response.data?.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const initializePushNotifications = async () => {
    try {
      await pushNotificationService.initialize();
      
      // Set up custom notification handler for new orders
      pushNotificationService.setupNotificationListeners();
      
      // Override the notification tap handler for delivery-specific logic
      pushNotificationService.handleNotificationTap = (response) => {
        const data = response.notification.request.content.data;
        
        if (data.type === 'new_order') {
          // Set new order indicator
          setHasNewOrders(true);
          
          // Show alert for new order and navigate to orders screen
          Alert.alert(
            'New Order Available!',
            'A new delivery order is available. Would you like to view it?',
            [
              { text: 'Later', style: 'cancel' },
              { 
                text: 'View Orders', 
                onPress: () => {
                  setHasNewOrders(false);
                  navigation.navigate('Orders');
                }
              }
            ]
          );
        }
      };
    } catch (error) {
      console.error('Error initializing push notifications:', error);
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

  if (!deliveryPerson) {
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Partner Info */}
        <MotiView 
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.partnerCard}
        >
          <LinearGradient
            colors={['rgba(200,150,30,0.06)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.partnerIcon}>
            <MaterialIcons name="two-wheeler" size={30} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.partnerName}>{deliveryPerson.name}</Text>
            <Text style={styles.partnerVehicle}>
              <MaterialIcons name="directions-car" size={12} color={theme.colors.primary} /> {deliveryPerson.vehicleDetails?.number || 'N/A'}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: status === 'Online' ? theme.colors.success : theme.colors.error }]} />
              <Text style={[styles.statusText, { color: status === 'Online' ? theme.colors.success : theme.colors.error }]}>{status.toUpperCase()}</Text>
            </View>
          </View>
        </MotiView>

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
                <Text style={styles.earningsLabel}>Your Daily Earnings</Text>
                <Text style={styles.earningsValue}>₹{stats.earningsToday}</Text>
              </View>
            </View>
          </LinearGradient>
        </MotiView>

        {/* Today's Analytics */}
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.summaryRow}>
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200 }} style={styles.summaryItemWrapper}>
            <LinearGradient colors={[theme.colors.surface, theme.colors.surfaceVariant]} style={styles.summaryItem}>
              <MaterialIcons name="local-shipping" size={28} color={theme.colors.primary} />
              <Text style={styles.summaryNumber}>{stats.todayDeliveries}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </LinearGradient>
          </MotiView>
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 300 }} style={styles.summaryItemWrapper}>
            <LinearGradient colors={[theme.colors.surface, theme.colors.surfaceVariant]} style={styles.summaryItem}>
              <MaterialIcons name="pending-actions" size={28} color="#2196F3" />
              <Text style={styles.summaryNumber}>{stats.pendingDeliveries}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </LinearGradient>
          </MotiView>
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 400 }} style={styles.summaryItemWrapper}>
            <LinearGradient colors={[theme.colors.surface, theme.colors.surfaceVariant]} style={styles.summaryItem}>
              <MaterialIcons name="check-circle" size={28} color={theme.colors.success} />
              <Text style={styles.summaryNumber}>{stats.completedDeliveries}</Text>
              <Text style={styles.summaryLabel}>Done</Text>
            </LinearGradient>
          </MotiView>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Action Center</Text>
        <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 500 }} style={styles.actionsRow}>
          <TouchableOpacity
            style={{ flex: 1, marginRight: 8 }}
            activeOpacity={0.8}
            onPress={() => {
              setHasNewOrders(false);
              navigation.navigate('Orders');
            }}
          >
            <LinearGradient colors={['rgba(212,175,55,0.2)', 'rgba(212,175,55,0.05)']} style={styles.actionButton}>
              <MaterialIcons name="list-alt" size={24} color={theme.colors.primary} />
              <Text style={styles.actionText}>Active Tasks</Text>
              {hasNewOrders && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>!</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1, marginLeft: 8 }}
            activeOpacity={0.8}
            onPress={toggleStatus}
            disabled={statusLoading}
          >
            <LinearGradient 
              colors={status === 'Online' ? ['rgba(244,67,54,0.3)', 'rgba(244,67,54,0.1)'] : [theme.colors.primary, '#B38E22']} 
              style={[styles.actionButton, { borderColor: status === 'Online' ? theme.colors.error : theme.colors.primary }]}
            >
              {statusLoading ? (
                <ActivityIndicator size="small" color={status === 'Online' ? theme.colors.error : theme.colors.background} />
              ) : (
                <MaterialIcons name={status === 'Online' ? 'power-settings-new' : 'power-settings-new'} size={24} color={status === 'Online' ? theme.colors.error : theme.colors.background} />
              )}
              <Text style={[styles.actionText, { color: status === 'Online' ? theme.colors.error : theme.colors.background }]}>
                {status === 'Online' ? 'GO OFFLINE' : 'GO ONLINE'}
              </Text>
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
    marginTop: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    overflow: 'hidden'
  },
  partnerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  partnerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  partnerVehicle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
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
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 5,
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
    borderColor: theme.colors.border,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  actionText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
    elevation: 4,
  },
  notificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
  },
});

export default DeliveryHomeScreen;

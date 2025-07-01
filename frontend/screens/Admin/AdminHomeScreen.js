import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const AdminHomeScreen = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState({
    totalRestaurants: 24,
    totalVendors: 18,
    totalDeliveryPersons: 45,
    totalOrders: 1256,
    totalRevenue: 125000,
    todayRevenue: 8500,
    thisMonthRevenue: 45000,
    orderStatusCounts: {
      'Pending': 12,
      'Confirmed': 8,
      'Preparing': 15,
      'Out for Delivery': 6,
      'Delivered': 1200,
      'Cancelled': 15,
    },
  });
  const [recentOrders, setRecentOrders] = useState([
    {
      id: '1',
      orderId: 'ORD123456789',
      restaurantName: 'Village Dhaba',
      status: 'Out for Delivery',
      totalAmount: 460,
      createdAt: new Date().toISOString(),
      customerInfo: { name: 'Rahul Kumar' },
    },
    {
      id: '2',
      orderId: 'ORD123456788',
      restaurantName: 'Spice Garden',
      status: 'Preparing',
      totalAmount: 270,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      customerInfo: { name: 'Priya Singh' },
    },
    {
      id: '3',
      orderId: 'ORD123456787',
      restaurantName: 'Tandoor House',
      status: 'Delivered',
      totalAmount: 580,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      customerInfo: { name: 'Amit Patel' },
    },
    {
      id: '4',
      orderId: 'ORD123456786',
      restaurantName: 'Sweet Corner',
      status: 'Pending',
      totalAmount: 320,
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      customerInfo: { name: 'Neha Sharma' },
    },
    {
      id: '5',
      orderId: 'ORD123456785',
      restaurantName: 'Village Dhaba',
      status: 'Confirmed',
      totalAmount: 420,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      customerInfo: { name: 'Rajesh Kumar' },
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    // Only mock data, so just simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => `₹${amount.toLocaleString()}`;

  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#FF9800',
      'Confirmed': '#2196F3',
      'Preparing': '#9C27B0',
      'Out for Delivery': '#FF5722',
      'Delivered': '#4CAF50',
      'Cancelled': '#F44336',
    };
    return colors[status] || '#666';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Pending': 'schedule',
      'Confirmed': 'check-circle',
      'Preparing': 'restaurant',
      'Out for Delivery': 'local-shipping',
      'Delivered': 'done-all',
      'Cancelled': 'cancel',
    };
    return icons[status] || 'help';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const StatCard = ({ title, value, subtitle, icon, color, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[color + '10', color + '05']}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statContent}>
          <View style={styles.statInfo}>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={styles.statValue}>{value}</Text>
            {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
          </View>
          <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
            <MaterialIcons name={icon} size={28} color={color} />
          </View>
        </View>
        <View style={[styles.statBorder, { backgroundColor: color }]} />
      </LinearGradient>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, subtitle, icon, color, onPress }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[color + '15', color + '05']}
        style={styles.quickActionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.quickActionIcon}>
          <MaterialIcons name={icon} size={32} color={color} />
        </View>
        <View style={styles.quickActionContent}>
          <Text style={styles.quickActionTitle}>{title}</Text>
          <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.quickActionArrow}>
          <MaterialIcons name="chevron-right" size={24} color={color} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.greeting}>Welcome back, Admin! 👋</Text>
                <Text style={styles.subtitle}>Here's what's happening today</Text>
                <View style={styles.dateContainer}>
                  <MaterialIcons name="today" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.notificationButton}>
                <View style={styles.notificationIconContainer}>
                  <MaterialIcons name="notifications" size={24} color="white" />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationCount}>3</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9C27B0" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={24} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dashboard Content */}
        {!loading && !error && (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(dashboardData.totalRevenue)}
                subtitle="All time"
                icon="account-balance-wallet"
                color="#4CAF50"
                onPress={() => navigation.navigate('Orders')}
              />
              <StatCard
                title="Today's Revenue"
                value={formatCurrency(dashboardData.todayRevenue)}
                subtitle="Today"
                icon="trending-up"
                color="#2196F3"
                onPress={() => navigation.navigate('Orders')}
              />
              <StatCard
                title="Restaurants"
                value={dashboardData.totalRestaurants.toString()}
                subtitle="Active"
                icon="restaurant"
                color="#9C27B0"
                onPress={() => navigation.navigate('Restaurants')}
              />
              <StatCard
                title="Orders Today"
                value={dashboardData.totalOrders.toString()}
                subtitle="Total"
                icon="receipt"
                color="#FF9800"
                onPress={() => navigation.navigate('Orders')}
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <QuickActionCard
                  title="Add Restaurant"
                  subtitle="Register new restaurant"
                  icon="add-business"
                  color="#4CAF50"
                  onPress={() => navigation.navigate('Restaurants')}
                />
                <QuickActionCard
                  title="Manage Orders"
                  subtitle="View and manage orders"
                  icon="receipt-long"
                  color="#2196F3"
                  onPress={() => navigation.navigate('Orders')}
                />
                <QuickActionCard
                  title="User Management"
                  subtitle="Manage vendors & delivery"
                  icon="people"
                  color="#9C27B0"
                  onPress={() => navigation.navigate('Users')}
                />
                <QuickActionCard
                  title="Analytics"
                  subtitle="View platform stats"
                  icon="analytics"
                  color="#FF9800"
                  onPress={() => Alert.alert('Analytics', 'Analytics feature coming soon!')}
                />
              </View>
            </View>

            {/* Recent Orders */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Orders</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              {recentOrders.map((order, index) => (
                <TouchableOpacity
                  key={`${order.id}_${index}`}
                  style={styles.orderCard}
                  onPress={() => navigation.navigate('Orders')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#ffffff', '#fafafa']}
                    style={styles.orderGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.orderHeader}>
                      <View style={styles.orderIdContainer}>
                        <MaterialIcons name="receipt" size={16} color="#666" />
                        <Text style={styles.orderId}>{order.orderId}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                        <MaterialIcons name={getStatusIcon(order.status)} size={16} color={getStatusColor(order.status)} />
                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                          {order.status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.orderDetails}>
                      <View style={styles.orderInfo}>
                        <Text style={styles.restaurantName}>{order.restaurantName}</Text>
                        <View style={styles.customerInfo}>
                          <MaterialIcons name="person" size={14} color="#666" />
                          <Text style={styles.customerName}>{order.customerInfo?.name}</Text>
                        </View>
                        <View style={styles.timeInfo}>
                          <MaterialIcons name="access-time" size={14} color="#999" />
                          <Text style={styles.orderTime}>{formatDate(order.createdAt)}</Text>
                        </View>
                      </View>
                      <View style={styles.orderAmount}>
                        <Text style={styles.amountText}>{formatCurrency(order.totalAmount)}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Order Status Overview */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Order Status Overview</Text>
                <View style={styles.sectionIcon}>
                  <MaterialIcons name="pie-chart" size={20} color="#9C27B0" />
                </View>
              </View>
              <View style={styles.statusGrid}>
                {Object.entries(dashboardData.orderStatusCounts).map(([status, count]) => (
                  <TouchableOpacity key={status} style={styles.statusItem} activeOpacity={0.8}>
                    <LinearGradient
                      colors={[getStatusColor(status) + '15', getStatusColor(status) + '05']}
                      style={styles.statusGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={[styles.statusIcon, { backgroundColor: getStatusColor(status) + '20' }]}>
                        <MaterialIcons name={getStatusIcon(status)} size={24} color={getStatusColor(status)} />
                      </View>
                      <Text style={styles.statusCount}>{count}</Text>
                      <Text style={styles.statusLabel}>{status}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerGradient: {
    borderRadius: 16,
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dateText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 6,
    fontWeight: '500',
  },
  notificationButton: {
    padding: 8,
  },
  notificationIconContainer: {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    borderRadius: 16,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBorder: {
    height: 3,
    borderRadius: 2,
    marginTop: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#9C27B0',
    fontWeight: '600',
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionCard: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  quickActionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCard: {
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  orderGradient: {
    padding: 20,
    borderRadius: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
    fontWeight: '500',
  },
  orderAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {
    width: (width - 56) / 3,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminHomeScreen; 
import React, { useEffect, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Easing,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const NotificationType = {
  new_order: {
    icon: 'shopping-cart',
    colors: ['#FF6B35', '#FF8C42'],
    bg: '#FFF3E0',
    title: 'New Order',
  },
  order_accepted: {
    icon: 'check-circle',
    colors: ['#4CAF50', '#45a049'],
    bg: '#E8F5E9',
    title: 'Order Accepted',
  },
  order_preparing: {
    icon: 'local-dining',
    colors: ['#FF9800', '#F57C00'],
    bg: '#FFF3E0',
    title: 'Preparing Order',
  },
  order_ready_for_pickup: {
    icon: 'local-shipping',
    colors: ['#2196F3', '#1976D2'],
    bg: '#E3F2FD',
    title: 'Ready for Delivery',
  },
  delivery_assigned: {
    icon: 'person',
    colors: ['#9C27B0', '#7B1FA2'],
    bg: '#F3E5F5',
    title: 'Delivery Assigned',
  },
  out_for_delivery: {
    icon: 'two-wheeler',
    colors: ['#00BCD4', '#0097A7'],
    bg: '#E0F2F1',
    title: 'Out for Delivery',
  },
  order_delivered: {
    icon: 'done-all',
    colors: ['#4CAF50', '#388E3C'],
    bg: '#E8F5E9',
    title: 'Order Delivered',
  },
  order_cancelled: {
    icon: 'cancel',
    colors: ['#F44336', '#D32F2F'],
    bg: '#FFEBEE',
    title: 'Order Cancelled',
  },
  delivery_arrived: {
    icon: 'location-on',
    colors: ['#FF6B35', '#FF8C42'],
    bg: '#FFF3E0',
    title: 'Delivery Arrived',
  },
};

export const PremiumNotification = ({ 
  notification, 
  onDismiss = () => {},
  duration = 5000 
}) => {
  const [slideAnim] = useState(new Animated.Value(-200));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [rotateAnim] = useState(new Animated.Value(0));

  const notifConfig = NotificationType[notification?.type] || {
    icon: 'notifications',
    colors: ['#2196F3', '#1976D2'],
    bg: '#E3F2FD',
    title: 'Notification',
  };

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 360,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      dismissNotification();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismissNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const rotationInterpolate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <BlurView intensity={95} tint="light" style={styles.blurContainer}>
        <LinearGradient
          colors={notifConfig.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Background shimmer effect */}
          <View style={styles.shimmerBg} />

          {/* Icon with animation */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [
                  { rotate: rotationInterpolate },
                ],
              },
            ]}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons 
                name={notifConfig.icon} 
                size={32} 
                color="white" 
              />
            </View>
          </Animated.View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {notifConfig.title}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {notification?.body}
            </Text>
          </View>

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={dismissNotification}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={20} color="white" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: slideAnim.interpolate({
                  inputRange: [-200, 0],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </BlurView>
    </Animated.View>
  );
};

// Premium notification stack - displays multiple notifications
export const PremiumNotificationStack = ({
  notifications = [],
  onDismiss = () => {},
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState(notifications);

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  const handleDismiss = (index) => {
    const dismissed = visibleNotifications[index];
    setVisibleNotifications(prev => prev.filter((_, i) => i !== index));
    onDismiss(dismissed);
  };

  return (
    <View style={styles.stack}>
      {visibleNotifications.map((notif, index) => (
        <PremiumNotification
          key={notif.id || index}
          notification={notif}
          onDismiss={() => handleDismiss(index)}
          duration={notif.duration || 5000}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    zIndex: 9999,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingRight: 12,
    minHeight: 80,
    position: 'relative',
  },
  shimmerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconContainer: {
    marginRight: 12,
    zIndex: 1,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  content: {
    flex: 1,
    marginHorizontal: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
    lineHeight: 18,
  },
  closeButton: {
    padding: 8,
    zIndex: 1,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  stack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});

export default PremiumNotification;

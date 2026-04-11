import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../utils/theme';
import { MotiView, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const RoleSelectionScreen = ({ navigation }) => {
  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      icon: 'restaurant-menu',
      description: 'Order premium food from top restaurants',
      color: theme.colors.primary,
    },
    {
      id: 'vendor',
      title: 'Vendor',
      icon: 'storefront',
      description: 'Manage your restaurant operations in real-time',
      color: theme.colors.primary,
    },
    {
      id: 'delivery',
      title: 'Delivery',
      icon: 'delivery-dining',
      description: 'Lightning fast deliveries around the city',
      color: theme.colors.primary,
    },
  ];

  const handleRoleSelect = async (roleId) => {
    // Clear all previous user data when switching roles
    try {
      await AsyncStorage.multiRemove([
        'customerData',
        'customerToken',
        'vendorData', 
        'vendorToken',
        'deliveryData',
        'deliveryToken'
      ]);
      console.log('Cleared previous user data for role switch');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
    
    navigation.navigate(roleId.charAt(0).toUpperCase() + roleId.slice(1));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <MotiView 
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 1000 }}
        style={styles.header}
      >
        <LinearGradient
          colors={[theme.colors.primary, '#B38E22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 16 }}
        >
          <Text style={{ color: theme.colors.background, fontWeight: 'bold', fontSize: 14, letterSpacing: 2 }}>EST. 2026</Text>
        </LinearGradient>
        <Text style={styles.title}>Gaon Zaika</Text>
        <Text style={styles.subtitle}>Premium Village Dining</Text>
      </MotiView>

      <View style={styles.rolesContainer}>
        {roles.map((role, index) => (
          <MotiView
            key={role.id}
            from={{ opacity: 0, translateX: -50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'spring', damping: 15, delay: index * 200 }}
          >
            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => handleRoleSelect(role.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'transparent']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
              />
              <View style={styles.iconContainer}>
                <MaterialIcons name={role.icon} size={30} color={theme.colors.primary} />
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>

      <MotiView 
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1000, duration: 1000 }}
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          Exclusive culinary experience awaits.
        </Text>
      </MotiView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rolesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 24,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  roleDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default RoleSelectionScreen; 
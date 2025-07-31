import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RoleSelectionScreen = ({ navigation }) => {
  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      icon: 'person',
      description: 'Order food from restaurants',
      color: '#4CAF50',
    },
    {
      id: 'vendor',
      title: 'Vendor',
      icon: 'restaurant',
      description: 'Manage your restaurant',
      color: '#FF9800',
    },
    {
      id: 'delivery',
      title: 'Delivery',
      icon: 'delivery-dining',
      description: 'Deliver orders to customers',
      color: '#2196F3',
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
      <View style={styles.header}>
        <Text style={styles.title}>Gaon Zaika</Text>
        <Text style={styles.subtitle}>Village Food Delivery</Text>
        <Text style={styles.description}>
          Select your role to continue
        </Text>
      </View>

      <View style={styles.rolesContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[styles.roleCard, { borderColor: role.color }]}
            onPress={() => handleRoleSelect(role.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: role.color }]}>
              <MaterialIcons name={role.icon} size={32} color="white" />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Choose your role to access the app
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#888',
  },
  rolesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

export default RoleSelectionScreen; 
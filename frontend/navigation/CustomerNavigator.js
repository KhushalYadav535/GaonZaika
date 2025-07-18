import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import CustomerAuthScreen from '../screens/Customer/CustomerAuthScreen';
import CustomerHomeScreen from '../screens/Customer/CustomerHomeScreen';
import RestaurantMenuScreen from '../screens/Customer/RestaurantMenuScreen';
import CartScreen from '../screens/Customer/CartScreen';
import OrderConfirmationScreen from '../screens/Customer/OrderConfirmationScreen';
import OrderStatusScreen from '../screens/Customer/OrderStatusScreen';
import CustomerProfileScreen from '../screens/Customer/CustomerProfileScreen';
import AddressesScreen from '../screens/Customer/AddressesScreen';
import PaymentMethodsScreen from '../screens/Customer/PaymentMethodsScreen';
import HelpScreen from '../screens/HelpScreen';
import ForgotPasswordScreen from '../screens/Customer/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/Customer/ResetPasswordScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const CustomerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Orders') {
            iconName = 'receipt';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={CustomerHomeScreen} />
      <Tab.Screen name="Orders" component={OrderStatusScreen} />
      <Tab.Screen name="Profile" component={CustomerProfileScreen} />
    </Tab.Navigator>
  );
};

const CustomerNavigator = ({ route }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const customerToken = await AsyncStorage.getItem('customerToken');
      if (customerToken && customerToken.trim()) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking customer authentication:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // If loading, show a simple loading screen
  if (isLoading) {
    return null; // This will show the splash screen from App.js
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={isAuthenticated ? 'CustomerTabs' : 'CustomerAuth'}
    >
      <Stack.Screen name="CustomerAuth" component={CustomerAuthScreen} />
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
      <Stack.Screen name="RestaurantMenu" component={RestaurantMenuScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
    </Stack.Navigator>
  );
};

export default CustomerNavigator; 
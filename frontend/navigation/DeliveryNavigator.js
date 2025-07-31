import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import DeliveryAuthScreen from '../screens/Delivery/DeliveryAuthScreen';
import DeliveryHomeScreen from '../screens/Delivery/DeliveryHomeScreen';
import DeliveryOrdersScreen from '../screens/Delivery/DeliveryOrdersScreen';
import DeliveryOTPScreen from '../screens/Delivery/DeliveryOTPScreen';
import DeliveryProfileScreen from '../screens/Delivery/DeliveryProfileScreen';
import OrderDetailScreen from '../screens/Delivery/OrderDetailScreen';
import EarningsHistoryScreen from '../screens/Delivery/EarningsHistoryScreen';
import DeliveryHistoryScreen from '../screens/Delivery/DeliveryHistoryScreen';
import PerformanceReportScreen from '../screens/Delivery/PerformanceReportScreen';
import HelpScreen from '../screens/HelpScreen';
import ForgotPasswordScreen from '../screens/Delivery/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/Delivery/ResetPasswordScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import RegistrationOTPScreen from '../screens/RegistrationOTPScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const DeliveryTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Orders') {
            iconName = 'local-shipping';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={DeliveryHomeScreen} />
      <Tab.Screen name="Orders" component={DeliveryOrdersScreen} />
      <Tab.Screen name="Profile" component={DeliveryProfileScreen} />
    </Tab.Navigator>
  );
};

const DeliveryNavigator = ({ route }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const deliveryToken = await AsyncStorage.getItem('deliveryToken');
      if (deliveryToken && deliveryToken.trim()) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking delivery authentication:', error);
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
      initialRouteName={isAuthenticated ? 'DeliveryTabs' : 'DeliveryAuth'}
    >
      <Stack.Screen name="DeliveryAuth" component={DeliveryAuthScreen} />
      <Stack.Screen name="DeliveryTabs" component={DeliveryTabs} />
      <Stack.Screen name="DeliveryOTP" component={DeliveryOTPScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="EarningsHistory" component={EarningsHistoryScreen} />
      <Stack.Screen name="DeliveryHistory" component={DeliveryHistoryScreen} />
      <Stack.Screen name="PerformanceReport" component={PerformanceReportScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="RegistrationOTP" component={RegistrationOTPScreen} />
    </Stack.Navigator>
  );
};

export default DeliveryNavigator; 
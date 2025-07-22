import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import VendorAuthScreen from '../screens/Vendor/VendorAuthScreen';
import VendorHomeScreen from '../screens/Vendor/VendorHomeScreen';
import VendorOrdersScreen from '../screens/Vendor/VendorOrdersScreen';
import VendorMenuScreen from '../screens/Vendor/VendorMenuScreen';
import VendorMenuManagementScreen from '../screens/Vendor/VendorMenuManagementScreen';
import VendorProfileScreen from '../screens/Vendor/VendorProfileScreen';
import SalesAnalyticsScreen from '../screens/Vendor/SalesAnalyticsScreen';
import ReviewsRatingsScreen from '../screens/Vendor/ReviewsRatingsScreen';
import HelpScreen from '../screens/HelpScreen';
import ForgotPasswordScreen from '../screens/Vendor/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/Vendor/ResetPasswordScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const VendorTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Orders') {
            iconName = 'receipt';
          } else if (route.name === 'Menu') {
            iconName = 'restaurant-menu';
          } else if (route.name === 'ManageMenu') {
            iconName = 'edit';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF9800',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={VendorHomeScreen} />
      <Tab.Screen name="Orders" component={VendorOrdersScreen} />
      <Tab.Screen name="Menu" component={VendorMenuScreen} />
      <Tab.Screen name="ManageMenu" component={VendorMenuManagementScreen} options={{ title: 'Manage Menu' }} />
      <Tab.Screen name="Profile" component={VendorProfileScreen} />
    </Tab.Navigator>
  );
};

const VendorNavigator = ({ route }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const vendorToken = await AsyncStorage.getItem('vendorToken');
      if (vendorToken && vendorToken.trim()) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking vendor authentication:', error);
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
      initialRouteName={isAuthenticated ? 'VendorTabs' : 'VendorAuth'}
    >
      <Stack.Screen name="VendorAuth" component={VendorAuthScreen} />
      <Stack.Screen name="VendorTabs" component={VendorTabs} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="SalesAnalytics" component={SalesAnalyticsScreen} />
      <Stack.Screen name="ReviewsRatings" component={ReviewsRatingsScreen} />
    </Stack.Navigator>
  );
};

export default VendorNavigator; 
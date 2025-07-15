import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// Import screens
import VendorAuthScreen from '../screens/Vendor/VendorAuthScreen';
import VendorHomeScreen from '../screens/Vendor/VendorHomeScreen';
import VendorOrdersScreen from '../screens/Vendor/VendorOrdersScreen';
import VendorMenuScreen from '../screens/Vendor/VendorMenuScreen';
import VendorMenuManagementScreen from '../screens/Vendor/VendorMenuManagementScreen';
import VendorProfileScreen from '../screens/Vendor/VendorProfileScreen';
import SalesAnalyticsScreen from '../screens/Vendor/SalesAnalyticsScreen';
import ReviewsRatingsScreen from '../screens/Vendor/ReviewsRatingsScreen';

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

const VendorNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="VendorAuth" component={VendorAuthScreen} />
      <Stack.Screen name="VendorTabs" component={VendorTabs} />
    </Stack.Navigator>
  );
};

export default VendorNavigator; 
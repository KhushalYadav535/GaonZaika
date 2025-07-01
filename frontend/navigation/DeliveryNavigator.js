import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// Import screens
import DeliveryAuthScreen from '../screens/Delivery/DeliveryAuthScreen';
import DeliveryHomeScreen from '../screens/Delivery/DeliveryHomeScreen';
import DeliveryOrdersScreen from '../screens/Delivery/DeliveryOrdersScreen';
import DeliveryOTPScreen from '../screens/Delivery/DeliveryOTPScreen';
import DeliveryProfileScreen from '../screens/Delivery/DeliveryProfileScreen';
import EarningsHistoryScreen from '../screens/Delivery/EarningsHistoryScreen';
import DeliveryHistoryScreen from '../screens/Delivery/DeliveryHistoryScreen';
import PerformanceReportScreen from '../screens/Delivery/PerformanceReportScreen';

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

const DeliveryNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DeliveryAuth" component={DeliveryAuthScreen} />
      <Stack.Screen name="DeliveryTabs" component={DeliveryTabs} />
      <Stack.Screen name="DeliveryOTP" component={DeliveryOTPScreen} />
      <Stack.Screen name="EarningsHistory" component={EarningsHistoryScreen} />
      <Stack.Screen name="DeliveryHistory" component={DeliveryHistoryScreen} />
      <Stack.Screen name="PerformanceReport" component={PerformanceReportScreen} />
    </Stack.Navigator>
  );
};

export default DeliveryNavigator; 
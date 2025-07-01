import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// Import screens
import AdminAuthScreen from '../screens/Admin/AdminAuthScreen';
import AdminHomeScreen from '../screens/Admin/AdminHomeScreen';
import AdminRestaurantsScreen from '../screens/Admin/AdminRestaurantsScreen';
import AdminOrdersScreen from '../screens/Admin/AdminOrdersScreen';
import AdminUsersScreen from '../screens/Admin/AdminUsersScreen';
import AdminProfileScreen from '../screens/Admin/AdminProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AdminTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Restaurants') {
            iconName = 'restaurant';
          } else if (route.name === 'Orders') {
            iconName = 'receipt';
          } else if (route.name === 'Users') {
            iconName = 'people';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#9C27B0',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={AdminHomeScreen} />
      <Tab.Screen name="Restaurants" component={AdminRestaurantsScreen} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} />
      <Tab.Screen name="Users" component={AdminUsersScreen} />
      <Tab.Screen name="Profile" component={AdminProfileScreen} />
    </Tab.Navigator>
  );
};

const AdminNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminAuth" component={AdminAuthScreen} />
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
    </Stack.Navigator>
  );
};

export default AdminNavigator; 
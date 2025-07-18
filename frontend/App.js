import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import SplashScreen from './screens/SplashScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';

// Import navigators
import CustomerNavigator from './navigation/CustomerNavigator';
import VendorNavigator from './navigation/VendorNavigator';
import DeliveryNavigator from './navigation/DeliveryNavigator';
import AdminNavigator from './navigation/AdminNavigator';

// Import components
import NetworkStatus from './components/NetworkStatus';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('RoleSelection');
  const [initialParams, setInitialParams] = useState({});

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      // Check for existing tokens
      const customerToken = await AsyncStorage.getItem('customerToken');
      const vendorToken = await AsyncStorage.getItem('vendorToken');
      const deliveryToken = await AsyncStorage.getItem('deliveryToken');
      const adminToken = await AsyncStorage.getItem('adminToken');

      // Determine which role is authenticated
      if (customerToken && customerToken.trim()) {
        setInitialRoute('Customer');
        setInitialParams({ screen: 'CustomerTabs' });
      } else if (vendorToken && vendorToken.trim()) {
        setInitialRoute('Vendor');
        setInitialParams({ screen: 'VendorTabs' });
      } else if (deliveryToken && deliveryToken.trim()) {
        setInitialRoute('Delivery');
        setInitialParams({ screen: 'DeliveryTabs' });
      } else if (adminToken && adminToken.trim()) {
        setInitialRoute('Admin');
        setInitialParams({ screen: 'AdminTabs' });
      } else {
        // No valid token found, show role selection
        setInitialRoute('RoleSelection');
        setInitialParams({});
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      // On error, default to role selection
      setInitialRoute('RoleSelection');
      setInitialParams({});
    } finally {
      // Add a small delay for smooth transition
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  if (isLoading) {
    return <SplashScreen navigation={null} />;
  }

  return (
    <PaperProvider>
      <NetworkStatus>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
            initialRouteName={initialRoute}
          >
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen 
              name="Customer" 
              component={CustomerNavigator}
              initialParams={initialRoute === 'Customer' ? initialParams : {}}
            />
            <Stack.Screen 
              name="Vendor" 
              component={VendorNavigator}
              initialParams={initialRoute === 'Vendor' ? initialParams : {}}
            />
            <Stack.Screen 
              name="Delivery" 
              component={DeliveryNavigator}
              initialParams={initialRoute === 'Delivery' ? initialParams : {}}
            />
            <Stack.Screen 
              name="Admin" 
              component={AdminNavigator}
              initialParams={initialRoute === 'Admin' ? initialParams : {}}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </NetworkStatus>
    </PaperProvider>
  );
} 
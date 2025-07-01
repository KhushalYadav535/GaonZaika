import React, { useState } from 'react';
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

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Simulate splash screen delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
          <Stack.Screen name="Customer" component={CustomerNavigator} />
          <Stack.Screen name="Vendor" component={VendorNavigator} />
          <Stack.Screen name="Delivery" component={DeliveryNavigator} />
          <Stack.Screen name="Admin" component={AdminNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
} 
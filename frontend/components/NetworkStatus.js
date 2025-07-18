import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { MaterialIcons } from '@expo/vector-icons';

const NetworkStatus = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    // Initial network check
    checkNetworkStatus();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
      
      // Show alert when network is lost
      if (!state.isConnected) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    });

    return () => unsubscribe();
  }, []);

  const checkNetworkStatus = async () => {
    try {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    } catch (error) {
      console.error('Error checking network status:', error);
    }
  };

  if (!isConnected || !isInternetReachable) {
    return (
      <View style={styles.container}>
        <View style={styles.networkBanner}>
          <MaterialIcons name="wifi-off" size={24} color="#fff" />
          <Text style={styles.networkText}>
            No internet connection. Please check your network settings.
          </Text>
        </View>
        {children}
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  networkBanner: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  networkText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
});

export default NetworkStatus; 
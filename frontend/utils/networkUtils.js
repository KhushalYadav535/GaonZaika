import NetInfo from '@react-native-community/netinfo';
import { apiService } from '../services/apiService';

// Test API connectivity
export const testApiConnectivity = async () => {
  try {
    // First check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      throw new Error('No internet connection');
    }

    // Test API health endpoint
    const response = await apiService.testConnection();
    return {
      success: true,
      message: 'API connection successful',
      data: response.data
    };
  } catch (error) {
    console.error('API connectivity test failed:', error);
    return {
      success: false,
      message: error.message || 'API connection failed',
      error: error
    };
  }
};

// Initialize app with network check
export const initializeApp = async () => {
  try {
    console.log('Initializing app...');
    
    // Test network connectivity
    const connectivityResult = await testApiConnectivity();
    
    if (!connectivityResult.success) {
      console.log('Network connectivity issue:', connectivityResult.message);
      return {
        success: false,
        message: connectivityResult.message,
        retry: true
      };
    }

    console.log('App initialization successful');
    return {
      success: true,
      message: 'App initialized successfully'
    };
  } catch (error) {
    console.error('App initialization error:', error);
    return {
      success: false,
      message: 'Failed to initialize app',
      error: error
    };
  }
};

// Check if device is online
export const isOnline = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected && netInfo.isInternetReachable;
  } catch (error) {
    console.error('Error checking online status:', error);
    return false;
  }
};

// Subscribe to network changes
export const subscribeToNetworkChanges = (callback) => {
  return NetInfo.addEventListener(callback);
}; 
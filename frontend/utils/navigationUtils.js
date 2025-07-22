import { Alert } from 'react-native';

// Safe navigation utility for production builds
export const safeNavigate = (navigation, routeName, params = {}) => {
  try {
    console.log(`Attempting to navigate to: ${routeName}`);
    
    // For production builds, use the simplest navigation method
    if (navigation && navigation.navigate) {
      navigation.navigate(routeName, params);
      console.log(`Successfully navigated to ${routeName} using navigate`);
      return true;
    }
    
    console.error('Navigation object is not available');
    return false;
    
  } catch (error) {
    console.error(`Navigation error to ${routeName}:`, error);
    
    // Show user-friendly error
    Alert.alert(
      'Navigation Error',
      'Unable to navigate. Please try again.',
      [{ text: 'OK' }]
    );
    
    return false;
  }
};

// Simple navigation after successful login
export const navigateAfterLogin = (navigation, routeName) => {
  console.log(`Login successful, navigating to: ${routeName}`);
  
  try {
    // Use simple navigate for production builds
    if (navigation && navigation.navigate) {
      navigation.navigate(routeName);
      console.log(`Successfully navigated to ${routeName}`);
      return true;
    }
    
    console.error('Navigation object not available');
    return false;
    
  } catch (error) {
    console.error(`Login navigation error:`, error);
    return false;
  }
};

// Simple navigation after logout
export const navigateAfterLogout = (navigation) => {
  try {
    console.log('Logout successful, navigating to RoleSelection');
    
    if (navigation && navigation.navigate) {
      navigation.navigate('RoleSelection');
      console.log('Successfully navigated to RoleSelection');
      return true;
    }
    
    console.error('Navigation object not available for logout');
    return false;
    
  } catch (error) {
    console.error('Logout navigation error:', error);
    return false;
  }
};

// Check if navigation is available
export const isNavigationAvailable = (navigation) => {
  return navigation && typeof navigation.navigate === 'function';
};

// Debug navigation state
export const debugNavigation = (navigation) => {
  if (!navigation) {
    console.log('Navigation object is null or undefined');
    return;
  }
  
  console.log('Navigation object available:', !!navigation);
  console.log('Navigation methods:', Object.keys(navigation));
  
  if (navigation.getState) {
    try {
      const state = navigation.getState();
      console.log('Current navigation state:', state);
      if (state.routes) {
        console.log('Available routes:', state.routes.map(route => route.name));
      }
    } catch (error) {
      console.error('Error getting navigation state:', error);
    }
  }
}; 
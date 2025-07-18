import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGoogleMapsApiKey } from '../config/constants';

class LocationService {
  constructor() {
    this.currentLocation = null;
    this.locationPermission = null;
  }

  /**
   * Request location permissions and get current location
   * @returns {Promise<Object|null>} Location object with latitude and longitude
   */
  async getCurrentLocation() {
    try {
      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services to find restaurants near you.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return null;
      }

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.locationPermission = status;

      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show you nearby restaurants. Please grant location permission.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return null;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp
      };

      return this.currentLocation;

    } catch (error) {
      console.error('Error getting location:', error);
      
      if (error.code === 'LOCATION_TIMEOUT') {
        Alert.alert(
          'Location Timeout',
          'Unable to get your location. Please check your GPS settings and try again.'
        );
      } else {
        Alert.alert(
          'Location Error',
          'Unable to get your location. Please try again or use manual location selection.'
        );
      }
      
      return null;
    }
  }

  /**
   * Get cached location if available
   * @returns {Object|null} Cached location or null
   */
  getCachedLocation() {
    return this.currentLocation;
  }

  /**
   * Get location permission status
   * @returns {string|null} Permission status
   */
  getPermissionStatus() {
    return this.locationPermission;
  }

  /**
   * Check if location permission is granted
   * @returns {boolean} True if permission is granted
   */
  hasPermission() {
    return this.locationPermission === 'granted';
  }

  /**
   * Get location from address using reverse geocoding
   * @param {string} address - Address to geocode
   * @returns {Promise<Object|null>} Location coordinates
   */
  async getLocationFromAddress(address) {
    try {
      const results = await Location.geocodeAsync(address);
      if (results.length > 0) {
        const location = results[0];
        return {
          latitude: location.latitude,
          longitude: location.longitude
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Get address from coordinates using reverse geocoding
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<string|null>} Formatted address
   */
  async getAddressFromLocation(latitude, longitude) {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (results.length > 0) {
        const address = results[0];
        return [
          address.street,
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ');
      }
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points
   * @param {number} lat1 - First latitude
   * @param {number} lon1 - First longitude
   * @param {number} lat2 - Second latitude
   * @param {number} lon2 - Second longitude
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format distance for display
   * @param {number} distanceKm - Distance in kilometers
   * @returns {string} Formatted distance string
   */
  formatDistance(distanceKm) {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km`;
    } else {
      return `${Math.round(distanceKm)}km`;
    }
  }

  /**
   * Watch location changes
   * @param {Function} callback - Callback function for location updates
   * @returns {Object} Location subscription
   */
  watchLocation(callback) {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 100 // Update every 100 meters
      },
      (location) => {
        this.currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp
        };
        callback(this.currentLocation);
      }
    );
  }

  /**
   * Save current location as delivery address
   * @param {string} label - Address label (e.g., 'Current Location', 'Home')
   * @returns {Promise<Object|null>} Saved address object or null
   */
  async saveCurrentLocationAsAddress(label = 'Current Location') {
    try {
      const location = await this.getCurrentLocation();
      if (!location) {
        return null;
      }

      const address = await this.getAddressFromLocation(location.latitude, location.longitude);
      
      const addressData = {
        id: Date.now().toString(),
        label: label,
        address: address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
        lat: location.latitude,
        lng: location.longitude,
        isDefault: false,
        timestamp: new Date().toISOString()
      };

      // Save to AsyncStorage
      await this.saveAddressToStorage(addressData);
      
      return addressData;
    } catch (error) {
      console.error('Error saving current location as address:', error);
      return null;
    }
  }

  /**
   * Save address to AsyncStorage
   * @param {Object} addressData - Address object to save
   */
  async saveAddressToStorage(addressData) {
    try {
      const existingAddresses = await this.getAddressesFromStorage();
      const updatedAddresses = [...existingAddresses, addressData];
      await AsyncStorage.setItem('customerAddresses', JSON.stringify(updatedAddresses));
      console.log('Address saved to storage:', addressData);
    } catch (error) {
      console.error('Error saving address to storage:', error);
    }
  }

  /**
   * Get addresses from AsyncStorage
   * @returns {Promise<Array>} Array of saved addresses
   */
  async getAddressesFromStorage() {
    try {
      const addresses = await AsyncStorage.getItem('customerAddresses');
      return addresses ? JSON.parse(addresses) : [];
    } catch (error) {
      console.error('Error getting addresses from storage:', error);
      return [];
    }
  }

  /**
   * Update addresses in AsyncStorage
   * @param {Array} addresses - Updated addresses array
   */
  async updateAddressesInStorage(addresses) {
    try {
      await AsyncStorage.setItem('customerAddresses', JSON.stringify(addresses));
      console.log('Addresses updated in storage');
    } catch (error) {
      console.error('Error updating addresses in storage:', error);
    }
  }

  /**
   * Get current location coordinates as address object
   * @returns {Promise<Object|null>} Address object with coordinates
   */
  async getCurrentLocationAsAddress() {
    try {
      const location = await this.getCurrentLocation();
      if (!location) {
        return null;
      }

      const address = await this.getAddressFromLocation(location.latitude, location.longitude);
      
      return {
        id: 'current-location',
        label: 'Current Location',
        address: address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
        lat: location.latitude,
        lng: location.longitude,
        isCurrent: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting current location as address:', error);
      return null;
    }
  }
}

/**
 * Vendor-specific location methods
 */

/**
 * Get current location for vendor restaurant setup
 * @returns {Promise<Object|null>} Location object with coordinates and address
 */
export const getVendorLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'This app needs location access to set your restaurant location. Please grant location permission.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10
    });

    // Get address from coordinates
    const address = await getAddressFromCoordinates(
      location.coords.latitude,
      location.coords.longitude
    );

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address: address,
      accuracy: location.coords.accuracy
    };
  } catch (error) {
    console.error('Error getting vendor location:', error);
    return null;
  }
};

/**
 * Get address from coordinates using reverse geocoding
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>} Formatted address
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    // Check if Google Maps API key is available
    const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found. Returning coordinates as address.');
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    
    return `${latitude}, ${longitude}`;
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

/**
 * Get coordinates from address using geocoding
 * @param {string} address 
 * @returns {Promise<Object|null>} Location object with coordinates
 */
export const getCoordinatesFromAddress = async (address) => {
  try {
    // Check if Google Maps API key is available
    const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found. Cannot geocode address.');
      return null;
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        address: data.results[0].formatted_address
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting coordinates from address:', error);
    return null;
  }
};

/**
 * Validate coordinates
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {boolean} True if coordinates are valid
 */
export const validateCoordinates = (latitude, longitude) => {
  return (
    typeof latitude === 'number' && 
    typeof longitude === 'number' &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  );
};

/**
 * Format coordinates for display
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {string} Formatted coordinates
 */
export const formatCoordinates = (latitude, longitude) => {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

export default new LocationService(); 
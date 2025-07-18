// Frontend Configuration Constants
// For production, these should be set via environment variables or secure storage

export const CONFIG = {
  // Google Maps API Key - Set this in your environment or replace with your actual key
  GOOGLE_MAPS_API_KEY: null, // Replace with your actual Google Maps API key
  
  // API Base URL
  API_BASE_URL: 'https://gaonzaika.onrender.com', // Production backend URL
  
  // App Configuration
  APP_NAME: 'Gaon Zaika',
  APP_VERSION: '1.0.0',
  
  // Location Configuration
  DEFAULT_LOCATION: {
    latitude: 28.6139, // Delhi coordinates as default
    longitude: 77.2090,
  },
  
  // Distance Configuration
  MAX_DELIVERY_DISTANCE: 10, // km
  NEARBY_RESTAURANT_RADIUS: 5, // km
  SUPPORT_PHONE: '8182838680',
  SUPPORT_WHATSAPP: '8182838680',
  SUPPORT_EMAIL: 'gaonzaika@gmail.com',
};

// Helper function to get Google Maps API key
export const getGoogleMapsApiKey = () => {
  return CONFIG.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || null;
};

// Helper function to check if Google Maps is available
export const isGoogleMapsAvailable = () => {
  return !!getGoogleMapsApiKey();
};

export default CONFIG; 
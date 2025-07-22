import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/constants';
import NetInfo from '@react-native-community/netinfo';

// Determine BASE_URL based on environment
let BASE_URL = CONFIG.API_BASE_URL;

// If running in development (Expo Go, localhost), use local IP
if (__DEV__) {
  // Try to use the local IP if available (for mobile dev)
  BASE_URL = 'http://192.168.1.4:3000/api';
}

// Create axios instance for API calls
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for health check (without /api prefix)
const healthApi = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Network connectivity check function
const checkNetworkConnectivity = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected && netInfo.isInternetReachable;
  } catch (error) {
    console.error('Network check error:', error);
    return false;
  }
};

// Retry logic for failed requests
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check network connectivity before each attempt
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        throw new Error('No internet connection');
      }
      
      return await requestFn();
    } catch (error) {
      console.log(`API attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// Request interceptor for API calls
api.interceptors.request.use(
  async (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    
    // Add authentication token if available
    try {
      const vendorToken = await AsyncStorage.getItem('vendorToken');
      const customerToken = await AsyncStorage.getItem('customerToken');
      const deliveryToken = await AsyncStorage.getItem('deliveryToken');
      const adminToken = await AsyncStorage.getItem('adminToken');
      
      console.log('Available tokens:', { vendorToken: !!vendorToken, customerToken: !!customerToken, deliveryToken: !!deliveryToken, adminToken: !!adminToken });
      
      if (vendorToken && vendorToken.trim()) {
        config.headers.Authorization = `Bearer ${vendorToken.trim()}`;
        console.log('Using vendor token for:', config.url);
      } else if (customerToken && customerToken.trim()) {
        config.headers.Authorization = `Bearer ${customerToken.trim()}`;
        console.log('Using customer token for:', config.url);
      } else if (deliveryToken && deliveryToken.trim()) {
        config.headers.Authorization = `Bearer ${deliveryToken.trim()}`;
        console.log('Using delivery token for:', config.url);
      } else if (adminToken && adminToken.trim()) {
        config.headers.Authorization = `Bearer ${adminToken.trim()}`;
        console.log('Using admin token for:', config.url);
      } else {
        console.log('No valid auth token found for:', config.url);
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('API Response Error:', error.response?.status, error.message);
    
    // Handle 401 errors - token might be expired or invalid
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - Token might be expired or invalid');
      
      // Clear all tokens on 401 error
      try {
        await AsyncStorage.multiRemove(['vendorToken', 'customerToken', 'deliveryToken', 'adminToken']);
        console.log('Cleared all auth tokens due to 401 error');
      } catch (clearError) {
        console.error('Error clearing tokens:', clearError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Request interceptor for health check
healthApi.interceptors.request.use(
  (config) => {
    console.log('Health Check Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Health Check Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for health check
healthApi.interceptors.response.use(
  (response) => {
    console.log('Health Check Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Health Check Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Connection test
  testConnection: () => retryRequest(() => healthApi.get('/health')),
  
  // Auth APIs with retry logic
  customerRegister: (userData) => retryRequest(() => api.post('/auth/customer/register', userData)),
  customerLogin: (credentials) => retryRequest(() => api.post('/auth/customer/login', credentials)),
  vendorRegister: (userData) => retryRequest(() => api.post('/auth/vendor/register', userData)),
  vendorLogin: (credentials) => retryRequest(() => api.post('/auth/vendor/login', credentials)),
  deliveryRegister: (userData) => retryRequest(() => api.post('/auth/delivery/register', userData)),
  deliveryLogin: (credentials) => retryRequest(() => api.post('/auth/delivery/login', credentials)),
  adminLogin: (credentials) => retryRequest(() => api.post('/auth/admin/login', credentials)),
  
  // Token validation
  validateToken: () => api.get('/auth/validate-token'),
  
  // Forgot/Reset Password APIs
  forgotPassword: (email, role) => retryRequest(() => api.post('/auth/forgot-password', { email, role })),
  resetPassword: (email, role, otp, newPassword) => retryRequest(() => api.post('/auth/reset-password', { email, role, otp, newPassword })),
  
  // Restaurant APIs
  getRestaurants: () => api.get('/restaurants'),
  getNearbyRestaurants: (latitude, longitude, radius = 10, filters = {}) => {
    const params = { latitude, longitude, radius, ...filters };
    console.log('getNearbyRestaurants called with params:', params);
    return api.get('/restaurants/nearby', { params });
  },
  getRestaurantMenu: (restaurantId) => api.get(`/restaurants/${restaurantId}/menu`),
  
  // Order APIs
  placeOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (role, userId = null) => {
    const params = { role };
    if (userId) params.userId = userId;
    return api.get('/orders', { params });
  },
  updateOrderStatus: (orderId, status) => api.patch(`/orders/${orderId}/status`, { status: status }),
  cancelOrder: (orderId, reason) => retryRequest(() => api.patch(`/orders/${orderId}/cancel`, { reason })),
  
  // Vendor APIs
  getVendorOrders: (vendorId) => api.get(`/vendor/${vendorId}/orders`),
  getVendorMenu: (vendorId) => api.get(`/vendor/${vendorId}/menu`),
  getVendorDashboard: (vendorId) => api.get(`/vendor/${vendorId}/dashboard`),
  
  // Vendor Live Status APIs
  getVendorLiveStatus: (vendorId) => retryRequest(() => api.get(`/vendor/${vendorId}/live-status`)),
  toggleVendorLive: (vendorId) => retryRequest(() => api.patch(`/vendor/${vendorId}/toggle-live`)),
  goLive: (vendorId) => retryRequest(() => api.patch(`/vendor/${vendorId}/go-live`)),
  goOffline: (vendorId) => retryRequest(() => api.patch(`/vendor/${vendorId}/go-offline`)),
  
  // Vendor Restaurant Image APIs
  uploadRestaurantImage: (vendorId, imageFile) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageFile.uri,
      type: imageFile.type || 'image/jpeg',
      name: imageFile.name || 'restaurant-image.jpg'
    });
    
    return retryRequest(() => api.post(`/vendor/${vendorId}/restaurant-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }));
  },
  deleteRestaurantImage: (vendorId) => retryRequest(() => api.delete(`/vendor/${vendorId}/restaurant-image`)),
  getVendorProfile: (vendorId) => api.get(`/vendor/${vendorId}/profile`),
  updateVendorProfile: (vendorId, profileData) => api.put(`/vendor/${vendorId}/profile`, profileData),
  addVendorMenuItem: (vendorId, menuItemData, imageFile = null) => {
    const formData = new FormData();
    
    // Add image if provided
    if (imageFile) {
      formData.append('image', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'menu-item.jpg'
      });
    }
    
    // Add other menu item data
    Object.keys(menuItemData).forEach(key => {
      formData.append(key, menuItemData[key]);
    });
    
    return api.post(`/vendor/${vendorId}/menu`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateVendorMenuItem: (vendorId, menuItemId, menuItemData, imageFile = null) => {
    const formData = new FormData();
    
    // Add image if provided
    if (imageFile) {
      formData.append('image', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'menu-item.jpg'
      });
    }
    
    // Add other menu item data
    Object.keys(menuItemData).forEach(key => {
      formData.append(key, menuItemData[key]);
    });
    
    return api.put(`/vendor/${vendorId}/menu/${menuItemId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteVendorMenuItem: (vendorId, menuItemId) => api.delete(`/vendor/${vendorId}/menu/${menuItemId}`),
  
  // Vendor Restaurant Location APIs
  getVendorRestaurantLocation: (vendorId) => api.get(`/vendor/${vendorId}/restaurant/location`),
  updateVendorRestaurantLocation: (vendorId, locationData) => api.put(`/vendor/${vendorId}/restaurant/location`, locationData),
  
  // Delivery APIs
  getDeliveryOrders: (deliveryId) => api.get(`/delivery/${deliveryId}/orders`),
  verifyOTP: (orderId, otp) => api.post(`/orders/${orderId}/verify-otp`, { otp }),
  updateDeliveryLocation: (deliveryId, latitude, longitude) =>
    retryRequest(() => api.patch(`/delivery/${deliveryId}/location`, { latitude, longitude })),
  
  // Delivery OTP APIs
  generateDeliveryOTP: (orderId) => api.post(`/delivery/${orderId}/generate-otp`),
  verifyDeliveryOTP: (orderId, otp) => api.post(`/delivery/${orderId}/verify-otp`, { otp }),
  resendDeliveryOTP: (orderId) => api.post(`/delivery/${orderId}/resend-otp`),
  
  // Admin APIs
  getAllRestaurants: () => api.get('/admin/restaurants'),
  getAllOrders: () => api.get('/admin/orders'),
  getAllUsers: () => api.get('/admin/users'),
  addRestaurant: (restaurantData) => api.post('/admin/restaurants', restaurantData),
  updateRestaurant: (restaurantId, restaurantData) => api.put(`/admin/restaurants/${restaurantId}`, restaurantData),
  deleteRestaurant: (restaurantId) => api.delete(`/admin/restaurants/${restaurantId}`),
  addMenuItem: (restaurantId, menuItemData) => api.post(`/admin/restaurants/${restaurantId}/menu`, menuItemData),
  updateMenuItem: (restaurantId, menuItemId, menuItemData) => api.put(`/admin/restaurants/${restaurantId}/menu/${menuItemId}`, menuItemData),
  deleteMenuItem: (restaurantId, menuItemId) => api.delete(`/admin/restaurants/${restaurantId}/menu/${menuItemId}`),
  
  // Email Verification APIs
  sendVerificationOTP: (email, role) => api.post('/auth/send-verification-otp', { email, role }),
  verifyEmailOTP: (email, role, otp) => api.post('/auth/verify-email-otp', { email, role, otp }),
};

// Export the real apiService
export default apiService; 
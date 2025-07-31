import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';
import { safeNavigate, debugNavigation, navigateAfterLogin } from '../../utils/navigationUtils';

const { width } = Dimensions.get('window');

const VendorAuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!isLogin && (!name || !phone || !restaurantName)) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        // Login logic
        const response = await apiService.vendorLogin({ email, password });
        
        if (response.data.success) {
          const vendorData = response.data.data;
          
          // Store vendor data in AsyncStorage
          console.log('Login - Storing vendor token:', vendorData.token);
          await AsyncStorage.setItem('vendorToken', vendorData.token);
          await AsyncStorage.setItem('vendorData', JSON.stringify({
            id: vendorData.vendor.id,
            name: vendorData.vendor.name,
            email: vendorData.vendor.email,
            phone: vendorData.vendor.phone,
            restaurant: vendorData.vendor.restaurant
          }));
          
          Alert.alert('Success', 'Login successful!');
          
          // Use simple navigation for production builds
          const success = navigateAfterLogin(navigation, 'VendorTabs');
          if (!success) {
            console.error('Failed to navigate to VendorTabs');
          }
        } else {
          Alert.alert('Error', response.data.message || 'Login failed');
        }
      } else {
        // Register logic
        const userData = {
          name,
          email,
          phone,
          password,
          restaurantName,
          restaurantAddress
        };
        
        const response = await apiService.vendorRegister(userData);
        
        if (response.data.success) {
          // Navigate to OTP verification screen
          navigation.navigate('RegistrationOTP', { 
            email, 
            role: 'vendor',
            registrationData: userData
          });
        } else {
          Alert.alert('Error', response.data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      
      // Handle different types of errors
      if (error.message === 'No internet connection') {
        Alert.alert(
          'Network Error', 
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        Alert.alert(
          'Connection Timeout', 
          'The request took too long. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      } else if (error.response?.status === 500) {
        Alert.alert(
          'Server Error', 
          'Server is temporarily unavailable. Please try again in a few moments.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Authentication Error', 
          error.response?.data?.message || 'Authentication failed. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setRestaurantName('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="restaurant" size={60} color="#FF9800" />
        <Text style={styles.appName}>Gaon Zaika</Text>
        <Text style={styles.slogan}>Swad Gaon Ka</Text>
        <Text style={styles.roleTitle}>Vendor Portal</Text>
      </View>

      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>
          {isLogin ? 'Welcome Back!' : 'Join as Vendor'}
        </Text>
        <Text style={styles.authSubtitle}>
          {isLogin 
            ? 'Sign in to manage your restaurant' 
            : 'Start your restaurant journey with us'
          }
        </Text>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Vendor Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          {!isLogin && (
            <View style={styles.inputContainer}>
              <MaterialIcons name="restaurant" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Restaurant Name"
                value={restaurantName}
                onChangeText={setRestaurantName}
                autoCapitalize="words"
              />
            </View>
          )}

          {!isLogin && (
            <View style={styles.inputContainer}>
              <MaterialIcons name="restaurant" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Restaurant Address"
                value={restaurantAddress}
                onChangeText={setRestaurantAddress}
                autoCapitalize="words"
              />
            </View>
          )}

          {!isLogin && (
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons 
                name={showPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.authButton, loading && styles.disabledButton]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Register Restaurant')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <TouchableOpacity onPress={toggleAuthMode}>
            <Text style={styles.switchButton}>
              {isLogin ? 'Register' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 16,
    marginBottom: 4,
  },
  slogan: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 18,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  authContainer: {
    flex: 1,
    paddingHorizontal: 30,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  authButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#666',
  },
  switchButton: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
  },
});

export default VendorAuthScreen; 
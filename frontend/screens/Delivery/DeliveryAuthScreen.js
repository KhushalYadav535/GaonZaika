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
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';
import { safeNavigate, debugNavigation, navigateAfterLogin } from '../../utils/navigationUtils';
import { initializeNotificationsAfterLogin } from '../../utils/notificationUtils';
import { theme } from '../../utils/theme';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const DeliveryAuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!isLogin && (!name || !phone || !vehicleNumber)) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        // Login logic
        const response = await apiService.deliveryLogin({ email, password });
        
        if (response.data.success) {
          // Store delivery person data and token
          const { token, deliveryPerson } = response.data.data;
          
          await AsyncStorage.setItem('deliveryToken', token);
          await AsyncStorage.setItem('deliveryData', JSON.stringify(deliveryPerson));
          
          console.log('Delivery login successful:', deliveryPerson);
          Alert.alert('Success', 'Login successful!');
          
          // Initialize notifications after successful login
          await initializeNotificationsAfterLogin();
          
          // Use simple navigation for production builds
          const success = navigateAfterLogin(navigation, 'DeliveryTabs');
          if (!success) {
            console.error('Failed to navigate to DeliveryTabs');
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
          vehicleNumber
        };
        
        const response = await apiService.deliveryRegister(userData);
        
        if (response.data.success) {
          // Navigate to OTP verification screen
          navigation.navigate('RegistrationOTP', { 
            email, 
            role: 'delivery',
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
    setVehicleNumber('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <MotiView 
        from={{ opacity: 0, translateY: -30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 1000 }}
        style={styles.header}
      >
        <LinearGradient
          colors={[theme.colors.primary, '#B38E22']}
          style={{ width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}
        >
          <MaterialIcons name="delivery-dining" size={40} color={theme.colors.background} />
        </LinearGradient>
        <Text style={styles.appName}>Gaon Zaika</Text>
        <Text style={styles.slogan}>Premium Logistics Team</Text>
      </MotiView>

      <MotiView 
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 300, type: 'timing', duration: 800 }}
        style={styles.authContainer}
      >
        <Text style={styles.authTitle}>
          {isLogin ? 'Welcome Back.' : 'Join the Fleet.'}
        </Text>
        <Text style={styles.authSubtitle}>
          {isLogin 
            ? 'Sign in to access your delivery dashboard' 
            : 'Register to become an elite delivery partner'
          }
        </Text>

        <View style={styles.form}>
          {!isLogin && (
            <BlurView intensity={20} tint="dark" style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </BlurView>
          )}

          {!isLogin && (
            <BlurView intensity={20} tint="dark" style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={theme.colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </BlurView>
          )}

          {!isLogin && (
            <BlurView intensity={20} tint="dark" style={styles.inputContainer}>
              <MaterialIcons name="directions-bike" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Vehicle Number"
                placeholderTextColor={theme.colors.textSecondary}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                autoCapitalize="characters"
              />
            </BlurView>
          )}

          <BlurView intensity={20} tint="dark" style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color={theme.colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </BlurView>

          <BlurView intensity={20} tint="dark" style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color={theme.colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={theme.colors.textSecondary}
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
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          </BlurView>

          <TouchableOpacity
            style={[styles.authButton, loading && styles.disabledButton]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? ['#333', '#444'] : [theme.colors.primary, '#B38E22']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
            />
            <Text style={styles.authButtonText}>
              {loading ? 'Processing...' : (isLogin ? 'AUTHORIZE' : 'JOIN THE FLEET')}
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
      </MotiView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 20,
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: 1.5,
  },
  slogan: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  authContainer: {
    flex: 1,
    paddingHorizontal: 30,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 65,
    overflow: 'hidden'
  },
  inputIcon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
  },
  authButton: {
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#333',
    elevation: 0,
    shadowOpacity: 0,
  },
  authButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    zIndex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  switchText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  switchButton: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});

export default DeliveryAuthScreen; 
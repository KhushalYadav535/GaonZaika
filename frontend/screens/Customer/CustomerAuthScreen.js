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

const { width } = Dimensions.get('window');

const CustomerAuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!isLogin && (!name || !phone)) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        // Login logic
        const response = await apiService.customerLogin({ email, password });
        console.log('Customer login response:', response.data);
        
        if (response.data && response.data.success) {
          // Store customer data and token
          const customerData = {
            id: response.data.data.customer.id,
            name: response.data.data.customer.name,
            email: response.data.data.customer.email,
            phone: response.data.data.customer.phone,
            token: response.data.data.token
          };
          
          await AsyncStorage.setItem('customerData', JSON.stringify(customerData));
          await AsyncStorage.setItem('customerToken', response.data.data.token);
          
          console.log('Customer data stored:', customerData);
          Alert.alert('Success', 'Login successful!');
          navigation.replace('CustomerTabs');
        } else {
          Alert.alert('Error', response.data?.message || 'Login failed');
        }
      } else {
        // Register logic
        const userData = {
          name,
          email,
          phone,
          password
        };
        
        const response = await apiService.customerRegister(userData);
        console.log('Customer register response:', response.data);
        
        if (response.data && response.data.success) {
          // Store customer data and token
          const customerData = {
            id: response.data.data.customer.id,
            name: response.data.data.customer.name,
            email: response.data.data.customer.email,
            phone: response.data.data.customer.phone,
            token: response.data.data.token
          };
          
          await AsyncStorage.setItem('customerData', JSON.stringify(customerData));
          await AsyncStorage.setItem('customerToken', response.data.data.token);
          
          console.log('Customer data stored:', customerData);
          Alert.alert('Success', 'Registration successful!');
          navigation.replace('CustomerTabs');
        } else {
          Alert.alert('Error', response.data?.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Authentication failed. Please try again.');
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="restaurant" size={60} color="#4CAF50" />
        <Text style={styles.appName}>Gaon Zaika</Text>
        <Text style={styles.slogan}>Swad Gaon Ka</Text>
      </View>

      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </Text>
        <Text style={styles.authSubtitle}>
          {isLogin 
            ? 'Sign in to continue ordering delicious food' 
            : 'Join us to start your food journey'
          }
        </Text>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
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
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <TouchableOpacity onPress={toggleAuthMode}>
            <Text style={styles.switchButton}>
              {isLogin ? 'Sign Up' : 'Sign In'}
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
    backgroundColor: '#4CAF50',
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
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default CustomerAuthScreen; 
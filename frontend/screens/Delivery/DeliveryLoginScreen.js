import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';

const DeliveryLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    try {
      setLoading(true);
      const response = await apiService.deliveryLogin({ email, password });
      
      if (response.data.success) {
        // Store delivery person data and token
        const { token, deliveryPerson } = response.data.data;
        
        await AsyncStorage.setItem('deliveryToken', token);
        await AsyncStorage.setItem('deliveryData', JSON.stringify(deliveryPerson));
        
        console.log('Delivery login successful:', deliveryPerson);
        navigation.replace('DeliveryTabs');
      } else {
        Alert.alert('Error', 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="delivery-dining" size={80} color="#2196F3" />
        <Text style={styles.title}>Delivery Login</Text>
        <Text style={styles.subtitle}>Enter your credentials to access delivery dashboard</Text>
      </View>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={24} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={24} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <TouchableOpacity style={[styles.loginButton, loading && styles.disabledButton]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.loginText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ alignSelf: 'center', marginTop: 12 }} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={{ color: '#2196F3', fontWeight: 'bold' }}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Demo: delivery@test.com / test123</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', paddingHorizontal: 40 },
  form: { paddingHorizontal: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 18, paddingVertical: 16, color: '#333' },
  loginButton: { backgroundColor: '#2196F3', borderRadius: 12, paddingVertical: 16, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  disabledButton: { backgroundColor: '#ccc' },
  loginText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  footerText: { fontSize: 14, color: '#888' },
});

export default DeliveryLoginScreen; 
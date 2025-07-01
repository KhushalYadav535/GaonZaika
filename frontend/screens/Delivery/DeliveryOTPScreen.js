import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import apiService from '../../services/apiService';

const DeliveryOTPScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length !== 4) {
      Alert.alert('Error', 'Please enter the 4-digit OTP');
      return;
    }
    try {
      setLoading(true);
      const response = await apiService.verifyOTP(orderId, otp);
      if (response.data.success) {
        Alert.alert('Success', 'Delivery marked as complete!');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="verified" size={60} color="#2196F3" />
        <Text style={styles.title}>OTP Verification</Text>
        <Text style={styles.subtitle}>Enter the OTP provided by the customer</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter 4-digit OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={4}
        />
        <TouchableOpacity style={[styles.verifyButton, loading && styles.disabledButton]} onPress={handleVerify} disabled={loading}>
          <Text style={styles.verifyText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', paddingHorizontal: 40 },
  form: { paddingHorizontal: 30, marginTop: 40 },
  input: { backgroundColor: 'white', borderRadius: 12, fontSize: 20, padding: 16, marginBottom: 24, textAlign: 'center', elevation: 2 },
  verifyButton: { backgroundColor: '#2196F3', borderRadius: 12, paddingVertical: 16, alignItems: 'center', elevation: 3 },
  disabledButton: { backgroundColor: '#ccc' },
  verifyText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default DeliveryOTPScreen; 
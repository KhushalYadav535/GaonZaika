import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import apiService from '../services/apiService';

const EmailVerificationScreen = ({ route, navigation }) => {
  const { email, role, onVerified, redirectScreen } = route.params || {};
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  const handleVerify = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP.');
      return;
    }
    setLoading(true);
    try {
      await apiService.verifyEmailOTP(email, role, otp);
      setMessage('Email verified successfully!');
      if (onVerified) onVerified();
      if (redirectScreen) navigation.replace(redirectScreen);
      else navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await apiService.sendVerificationOTP(email, role);
      setMessage('OTP resent to your email.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>Enter the OTP sent to {email}</Text>
      <TextInput
        style={styles.input}
        placeholder="OTP"
        value={otp}
        onChangeText={setOTP}
        keyboardType="numeric"
        editable={!loading}
      />
      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify Email'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={resending}>
        <Text style={styles.resendButtonText}>{resending ? 'Resending...' : 'Resend OTP'}</Text>
      </TouchableOpacity>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 18,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendButton: {
    marginBottom: 16,
  },
  resendButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 15,
  },
  message: {
    color: '#4CAF50',
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default EmailVerificationScreen; 
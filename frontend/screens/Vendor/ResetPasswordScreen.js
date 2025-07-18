import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import apiService from '../../services/apiService';

const ResetPasswordScreen = ({ route, navigation }) => {
  const { email, role } = route.params || {};
  const [otp, setOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email || !otp.trim() || !newPassword.trim()) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    setLoading(true);
    try {
      await apiService.resetPassword(email, role || 'vendor', otp, newPassword);
      Alert.alert('Success', 'Password reset successful. Please login with your new password.');
      navigation.navigate('VendorAuth');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter the OTP sent to your email and set a new password.</Text>
      <TextInput
        style={styles.input}
        placeholder="OTP"
        value={otp}
        onChangeText={setOTP}
        keyboardType="numeric"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        editable={!loading}
      />
      <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
      </TouchableOpacity>
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
    color: '#FF9800',
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
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ResetPasswordScreen; 
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService } from '../../services/apiService';

const DeliveryOTPScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, orderDetails } = route.params;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingOTP, setGeneratingOTP] = useState(false);
  const [resendingOTP, setResendingOTP] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Timer for OTP expiration
  useEffect(() => {
    let interval;
    if (otpExpiresAt && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpExpiresAt, timeLeft]);

  // Generate OTP when screen loads
  useEffect(() => {
    generateOTP();
  }, []);

  const generateOTP = async () => {
    setGeneratingOTP(true);
    try {
      const response = await apiService.generateDeliveryOTP(orderId);
      
      if (response.data.success) {
        Alert.alert(
          'OTP Sent',
          'OTP has been sent to the customer\'s email address.',
          [{ text: 'OK' }]
        );
        
        // Set expiration time (10 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);
        setOtpExpiresAt(expiresAt);
        setTimeLeft(600); // 10 minutes in seconds
      }
    } catch (error) {
      console.error('Error generating OTP:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to generate OTP. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingOTP(false);
    }
  };

  const resendOTP = async () => {
    setResendingOTP(true);
    try {
      const response = await apiService.resendDeliveryOTP(orderId);
      
      if (response.data.success) {
        Alert.alert(
          'OTP Resent',
          'New OTP has been sent to the customer\'s email address.',
          [{ text: 'OK' }]
        );
        
        // Reset timer
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);
        setOtpExpiresAt(expiresAt);
        setTimeLeft(600);
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to resend OTP. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setResendingOTP(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.verifyDeliveryOTP(orderId, otp);

      if (response.data.success) {
        Alert.alert(
          'Success',
          'OTP verified successfully! Order has been marked as delivered.',
          [
            {
              text: 'Go Back',
              onPress: () => {
                // Go back to previous screen
                navigation.goBack();
              }
            },
            {
              text: 'View Orders',
              onPress: () => {
                // Navigate to delivery tabs and focus on Orders tab
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'DeliveryTabs' }],
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to verify OTP. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Delivery OTP Verification</Text>
          <Text style={styles.subtitle}>Verify customer OTP to complete delivery</Text>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.orderTitle}>Order Details</Text>
          <Text style={styles.orderText}>Order ID: {orderId}</Text>
          {orderDetails && (
            <>
              <Text style={styles.orderText}>
                Customer: {orderDetails.customerInfo?.name}
              </Text>
              <Text style={styles.orderText}>
                Amount: ₹{orderDetails.totalAmount}
              </Text>
            </>
          )}
        </View>

        <View style={styles.otpSection}>
          <Text style={styles.otpTitle}>Enter Customer OTP</Text>
          <Text style={styles.otpSubtitle}>
            Ask the customer for the 4-digit OTP sent to their email
          </Text>

          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter 4-digit OTP"
            keyboardType="numeric"
            maxLength={4}
            autoFocus
          />

          {timeLeft > 0 && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                OTP expires in: {formatTime(timeLeft)}
              </Text>
            </View>
          )}

          {timeLeft === 0 && otpExpiresAt && (
            <View style={styles.expiredContainer}>
              <Text style={styles.expiredText}>OTP has expired</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.disabledButton]}
            onPress={verifyOTP}
            disabled={loading || !otp || otp.length !== 4}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify OTP & Complete Delivery</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendButton, resendingOTP && styles.disabledButton]}
            onPress={resendOTP}
            disabled={resendingOTP || timeLeft > 300} // Disable if OTP is still valid (more than 5 minutes left)
          >
            {resendingOTP ? (
              <ActivityIndicator color="#4CAF50" />
            ) : (
              <Text style={styles.resendButtonText}>
                {timeLeft > 300 ? 'OTP Still Valid' : 'Resend OTP'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateOTP}
            disabled={generatingOTP}
          >
            {generatingOTP ? (
              <ActivityIndicator color="#2196F3" />
            ) : (
              <Text style={styles.generateButtonText}>Generate New OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Instructions:</Text>
          <Text style={styles.infoText}>1. Ask customer for the 4-digit OTP from their email</Text>
          <Text style={styles.infoText}>2. Enter the OTP in the field above</Text>
          <Text style={styles.infoText}>3. Tap "Verify OTP" to complete delivery</Text>
          <Text style={styles.infoText}>4. If OTP expires, you can resend it</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  orderInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  orderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  otpSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 15,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  timerText: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  expiredContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  expiredText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  resendButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  generateButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default DeliveryOTPScreen; 
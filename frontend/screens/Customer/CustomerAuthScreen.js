import React, { useState, useRef, useEffect } from 'react';
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
import { navigateAfterLogin } from '../../utils/navigationUtils';
import { initializeNotificationsAfterLogin } from '../../utils/notificationUtils';
import { theme } from '../../utils/theme';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const CustomerAuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef([]);

  // Auto-add country code
  useEffect(() => {
    if (phone && !phone.startsWith('+91') && !otpSent) {
      // Don't auto-add if user is typing
      if (phone.length === 0 || phone.length === 1) {
        return;
      }
    }
  }, [phone]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const formatPhoneNumber = (text) => {
    // Remove all non-digits
    let cleaned = text.replace(/\D/g, '');
    
    // If starts with 91, add +
    if (cleaned.startsWith('91')) {
      return '+' + cleaned;
    }
    
    // If starts with 0, remove it and add +91
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Add +91 if not present
    if (!text.startsWith('+')) {
      return '+91' + cleaned;
    }
    
    return text;
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (!isLogin && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    
    try {
      let response;
      if (isLogin) {
        // Send login OTP
        const formattedPhone = formatPhoneNumber(phone);
        console.log('Sending login OTP to:', formattedPhone);
        response = await apiService.sendCustomerLoginOTP(formattedPhone);
      } else {
        // Send registration OTP
        const formattedPhone = formatPhoneNumber(phone);
        console.log('Sending registration OTP to:', formattedPhone);
        response = await apiService.sendCustomerRegistrationOTP(name.trim(), formattedPhone);
      }
      
      console.log('OTP send response:', response.data);
      
      if (response.data && response.data.success) {
        setOtpSent(true);
        setResendTimer(60); // 60 seconds timer
        Alert.alert('Success', 'OTP sent to your phone number');
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to send OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus last filled input
      const lastFilledIndex = Math.min(index + pastedOtp.length - 1, 5);
      if (otpInputRefs.current[lastFilledIndex]) {
        otpInputRefs.current[lastFilledIndex].focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    setLoading(true);
    
    try {
      const formattedPhone = formatPhoneNumber(phone);
      let response;
      
      if (isLogin) {
        // Verify login OTP
        console.log('Verifying login OTP for:', formattedPhone);
        response = await apiService.verifyCustomerLoginOTP(formattedPhone, otpString);
      } else {
        // Verify registration OTP
        console.log('Verifying registration OTP for:', formattedPhone);
        response = await apiService.verifyCustomerRegistrationOTP(formattedPhone, otpString);
      }
      
      console.log('OTP verify response:', response.data);
      
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
        Alert.alert('Success', isLogin ? 'Login successful!' : 'Registration successful!');
        
        // Initialize notifications after successful login
        await initializeNotificationsAfterLogin();
        
        // Navigate to customer tabs
        const success = navigateAfterLogin(navigation, 'CustomerTabs');
        if (!success) {
          console.error('Failed to navigate to CustomerTabs');
        }
      } else {
        Alert.alert('Error', response.data?.message || 'Invalid OTP');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Invalid OTP. Please try again.';
      Alert.alert('Error', errorMessage);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) {
      return;
    }
    setOtpSent(false);
    setOtp(['', '', '', '', '', '']);
    await handleSendOTP();
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setName('');
    setPhone('');
    setOtp(['', '', '', '', '', '']);
    setOtpSent(false);
    setResendTimer(0);
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
          <MaterialIcons name="restaurant" size={40} color={theme.colors.background} />
        </LinearGradient>
        <Text style={styles.appName}>Gaon Zaika</Text>
        <Text style={styles.slogan}>Premium Dining Experience</Text>
      </MotiView>

      <MotiView 
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 300, type: 'timing', duration: 800 }}
        style={styles.authContainer}
      >
        <Text style={styles.authTitle}>
          {isLogin ? 'Welcome Back.' : 'Join the Elite.'}
        </Text>
        <Text style={styles.authSubtitle}>
          {isLogin 
            ? 'Sign in to access your luxury dining profile' 
            : 'Register to unlock exclusive gourmet access'
          }
        </Text>

        <View style={styles.form}>
          {!isLogin && !otpSent && (
            <BlurView intensity={20} tint="dark" style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading}
              />
            </BlurView>
          )}

          {!otpSent && (
            <BlurView intensity={20} tint="dark" style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.colors.textSecondary}
                value={phone.startsWith('+91') ? phone.substring(3) : phone}
                onChangeText={(text) => {
                  const cleaned = text.replace(/^\+91/, '').replace(/\D/g, '');
                  setPhone('+91' + cleaned);
                }}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading}
              />
            </BlurView>
          )}

          {otpSent && (
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.otpContainer}>
              <Text style={styles.otpLabel}>Enter Secure Code sent to {phone}</Text>
              <View style={styles.otpInputs}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputRefs.current[index] = ref)}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>
              
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={resendTimer > 0 || loading}
                style={styles.resendButton}
              >
                <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                  {resendTimer > 0 
                    ? `Resend Code in ${resendTimer}s` 
                    : 'Resend Code'
                  }
                </Text>
              </TouchableOpacity>
            </MotiView>
          )}

          <TouchableOpacity
            style={[styles.authButton, loading && styles.disabledButton]}
            onPress={otpSent ? handleVerifyOTP : handleSendOTP}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? ['#333', '#444'] : [theme.colors.primary, '#B38E22']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
            />
            <Text style={styles.authButtonText}>
              {loading 
                ? 'Processing...' 
                : otpSent 
                  ? 'VERIFY ACCESS' 
                  : isLogin 
                    ? 'PROCEED' 
                    : 'JOIN NOW'
              }
            </Text>
          </TouchableOpacity>

          {otpSent && (
            <TouchableOpacity
              onPress={() => {
                setOtpSent(false);
                setOtp(['', '', '', '', '', '']);
                setResendTimer(0);
              }}
              style={styles.changeNumberButton}
            >
              <Text style={styles.changeNumberText}>Change Phone Number</Text>
            </TouchableOpacity>
          )}
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
  countryCode: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: '700',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: '500',
  },
  otpContainer: {
    marginBottom: 30,
  },
  otpLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  otpInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 45,
    height: 60,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    fontSize: 24,
    textAlign: 'center',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  resendText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: theme.colors.textSecondary,
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
  changeNumberButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  changeNumberText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.textSecondary,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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

export default CustomerAuthScreen;

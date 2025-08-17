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
  Platform,
  SafeAreaView,
  Animated,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/apiService';

const { width } = Dimensions.get('window');

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
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
          '✅ OTP Sent Successfully',
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
        '❌ Error',
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
          '✅ OTP Resent Successfully',
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
        '❌ Error',
        error.response?.data?.message || 'Failed to resend OTP. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setResendingOTP(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 4) {
      Alert.alert('❌ Invalid OTP', 'Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.verifyDeliveryOTP(orderId, otp);

      if (response.data.success) {
        Alert.alert(
          '🎉 Delivery Completed!',
          'OTP verified successfully! Order has been marked as delivered.',
          [
            {
              text: 'Go Back',
              onPress: () => {
                navigation.navigate('DeliveryOrders', { refresh: true });
              }
            },
            {
              text: 'View Orders',
              onPress: () => {
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
        '❌ Verification Failed',
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

  const getTimerColor = () => {
    if (timeLeft > 300) return '#4CAF50'; // Green
    if (timeLeft > 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="verified" size={60} color="white" />
              </View>
              <Text style={styles.title}>OTP Verification</Text>
              <Text style={styles.subtitle}>Complete delivery by verifying customer OTP</Text>
            </Animated.View>

            {/* Order Info Card */}
            <Animated.View 
              style={[
                styles.orderCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <MaterialIcons name="receipt" size={24} color="#667eea" />
                <Text style={styles.cardTitle}>Order Information</Text>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.orderRow}>
                  <MaterialIcons name="confirmation-number" size={20} color="#666" />
                  <Text style={styles.orderLabel}>Order ID:</Text>
                  <Text style={styles.orderValue}>{orderId}</Text>
                </View>
                
                {orderDetails && (
                  <>
                    <View style={styles.orderRow}>
                      <MaterialIcons name="person" size={20} color="#666" />
                      <Text style={styles.orderLabel}>Customer:</Text>
                      <Text style={styles.orderValue}>{orderDetails.customerInfo?.name || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.orderRow}>
                      <MaterialIcons name="attach-money" size={20} color="#666" />
                      <Text style={styles.orderLabel}>Amount:</Text>
                      <Text style={styles.orderValue}>₹{orderDetails.totalAmount}</Text>
                    </View>
                  </>
                )}
              </View>
            </Animated.View>

            {/* OTP Input Section */}
            <Animated.View 
              style={[
                styles.otpCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <MaterialIcons name="lock" size={24} color="#667eea" />
                <Text style={styles.cardTitle}>Enter Customer OTP</Text>
              </View>
              
              <Text style={styles.otpDescription}>
                Ask the customer for the 4-digit OTP sent to their email
              </Text>

              <View style={styles.otpInputContainer}>
                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="0000"
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  maxLength={4}
                  autoFocus
                  selectionColor="#667eea"
                />
                <MaterialIcons name="keyboard" size={24} color="#667eea" style={styles.inputIcon} />
              </View>

              {/* Timer */}
              {timeLeft > 0 && (
                <View style={styles.timerContainer}>
                  <MaterialIcons name="timer" size={20} color={getTimerColor()} />
                  <Text style={[styles.timerText, { color: getTimerColor() }]}>
                    Expires in: {formatTime(timeLeft)}
                  </Text>
                </View>
              )}

              {timeLeft === 0 && otpExpiresAt && (
                <View style={styles.expiredContainer}>
                  <MaterialIcons name="error" size={20} color="#F44336" />
                  <Text style={styles.expiredText}>OTP has expired</Text>
                </View>
              )}
            </Animated.View>

            {/* Action Buttons */}
            <Animated.View 
              style={[
                styles.buttonContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (!otp || otp.length !== 4) && styles.disabledButton
                ]}
                onPress={verifyOTP}
                disabled={loading || !otp || otp.length !== 4}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="check-circle" size={24} color="white" />
                      <Text style={styles.verifyButtonText}>Verify & Complete Delivery</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Resend Button */}
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  (resendingOTP || timeLeft > 300) && styles.disabledButton
                ]}
                onPress={resendOTP}
                disabled={resendingOTP || timeLeft > 300}
                activeOpacity={0.8}
              >
                {resendingOTP ? (
                  <ActivityIndicator color="#667eea" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="refresh" size={20} color="#667eea" />
                    <Text style={styles.resendButtonText}>
                      {timeLeft > 300 ? 'OTP Still Valid' : 'Resend OTP'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Generate New Button */}
              <TouchableOpacity
                style={[
                  styles.generateButton,
                  generatingOTP && styles.disabledButton
                ]}
                onPress={generateOTP}
                disabled={generatingOTP}
                activeOpacity={0.8}
              >
                {generatingOTP ? (
                  <ActivityIndicator color="#2196F3" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="add-circle" size={20} color="#2196F3" />
                    <Text style={styles.generateButtonText}>Generate New OTP</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Instructions Card */}
            <Animated.View 
              style={[
                styles.instructionsCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <MaterialIcons name="info" size={24} color="#667eea" />
                <Text style={styles.cardTitle}>Instructions</Text>
              </View>
              
              <View style={styles.instructionsList}>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.numberText}>1</Text>
                  </View>
                  <Text style={styles.instructionText}>Ask customer for the 4-digit OTP from their email</Text>
                </View>
                
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.numberText}>2</Text>
                  </View>
                  <Text style={styles.instructionText}>Enter the OTP in the field above</Text>
                </View>
                
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.numberText}>3</Text>
                  </View>
                  <Text style={styles.instructionText}>Tap "Verify & Complete Delivery" to finish</Text>
                </View>
                
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.numberText}>4</Text>
                  </View>
                  <Text style={styles.instructionText}>If OTP expires, you can resend it</Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  orderDetails: {
    gap: 12,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    marginRight: 10,
    fontWeight: '500',
  },
  orderValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
  },
  otpCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  otpDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  otpInputContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 15,
    padding: 20,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  inputIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    marginTop: -12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  expiredText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonContainer: {
    marginBottom: 20,
    gap: 12,
  },
  verifyButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resendButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
  generateButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  generateButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  instructionsList: {
    gap: 15,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 2,
  },
  numberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    lineHeight: 22,
  },
});

export default DeliveryOTPScreen; 
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
import { theme } from '../../utils/theme';

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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <LinearGradient
        colors={[theme.colors.background, '#1A1A1A']}
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
                <MaterialIcons name="verified-user" size={50} color={theme.colors.primary} />
              </View>
              <Text style={styles.title}>Secure Transfer</Text>
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
                <MaterialIcons name="receipt" size={24} color={theme.colors.textSecondary} />
                <Text style={styles.cardTitle}>Order Information</Text>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.orderRow}>
                  <Text style={styles.orderLabel}>ORDER ID:</Text>
                  <Text style={styles.orderValue}>#{orderId}</Text>
                </View>
                
                {orderDetails && (
                  <>
                    <View style={styles.orderRow}>
                      <Text style={styles.orderLabel}>CUSTOMER:</Text>
                      <Text style={styles.orderValue}>{orderDetails.customerInfo?.name || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.orderRow}>
                      <Text style={styles.orderLabel}>AMOUNT:</Text>
                      <Text style={[styles.orderValue, { color: theme.colors.primary }]}>₹{orderDetails.totalAmount}</Text>
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
                <MaterialIcons name="lock-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Enter Handover PIN</Text>
              </View>
              
              <Text style={styles.otpDescription}>
                Request the 4-digit verification code from the recipient to finalize the delivery.
              </Text>

              <View style={styles.otpInputContainer}>
                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="0000"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={4}
                  autoFocus
                  selectionColor={theme.colors.primary}
                />
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
                  colors={[theme.colors.success, '#1B5E20']}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="check-circle" size={20} color="white" />
                      <Text style={styles.verifyButtonText}>VERIFY & TRANSFER</Text>
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
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                ) : (
                  <>
                    <MaterialIcons name="refresh" size={20} color={timeLeft > 300 ? theme.colors.textSecondary : theme.colors.primary} />
                    <Text style={[styles.resendButtonText, { color: timeLeft > 300 ? theme.colors.textSecondary : theme.colors.primary }]}>
                      {timeLeft > 300 ? 'CODE STILL VALID' : 'RESEND CODE'}
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
                  <ActivityIndicator color={theme.colors.textSecondary} size="small" />
                ) : (
                  <>
                    <MaterialIcons name="fiber-new" size={20} color={theme.colors.textSecondary} />
                    <Text style={styles.generateButtonText}>GENERATE NEW PIN</Text>
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
                <MaterialIcons name="info-outline" size={24} color={theme.colors.textSecondary} />
                <Text style={styles.cardTitle}>Procedure</Text>
              </View>
              
              <View style={styles.instructionsList}>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.numberText}>1</Text>
                  </View>
                  <Text style={styles.instructionText}>Ask recipient for the 4-digit code from email inbox.</Text>
                </View>
                
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.numberText}>2</Text>
                  </View>
                  <Text style={styles.instructionText}>Authorize the transfer by verifying the code.</Text>
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
    backgroundColor: theme.colors.background,
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212,175,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.textSecondary,
    marginLeft: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  orderDetails: {
    gap: 16,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  orderValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '900',
    textAlign: 'right',
  },
  otpCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  otpDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
    textAlign: 'center',
  },
  otpInputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: theme.colors.goldBorder,
    borderRadius: 16,
    padding: 20,
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 16,
    fontWeight: '900',
    color: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(244,67,54,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.3)',
  },
  expiredText: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonContainer: {
    marginBottom: 24,
    gap: 16,
  },
  verifyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
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
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resendButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resendButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  generateButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.4,
  },
  instructionsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  numberText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});

export default DeliveryOTPScreen; 
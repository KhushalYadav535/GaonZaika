import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, SafeAreaView } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import CONFIG from '../config/constants';

const HelpScreen = () => {
  const handleCall = () => {
    Linking.openURL(`tel:${CONFIG.SUPPORT_PHONE}`).catch(() => {
      Alert.alert('Error', 'Unable to open dialer.');
    });
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/91${CONFIG.SUPPORT_WHATSAPP}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp.');
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${CONFIG.SUPPORT_EMAIL}?subject=Support%20Request`).catch(() => {
      Alert.alert('Error', 'Unable to open email app.');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Customer Support</Text>
      <Text style={styles.subtitle}>Need help? Contact us via any method below:</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleCall}>
          <MaterialIcons name="call" size={28} color="#4CAF50" />
          <Text style={styles.buttonText}>Call: {CONFIG.SUPPORT_PHONE}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleWhatsApp}>
          <FontAwesome name="whatsapp" size={28} color="#25D366" />
          <Text style={styles.buttonText}>WhatsApp: {CONFIG.SUPPORT_WHATSAPP}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleEmail}>
          <MaterialIcons name="email" size={28} color="#2196F3" />
          <Text style={styles.buttonText}>Email: {CONFIG.SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.faqContainer}>
        <Text style={styles.faqTitle}>Quick Help / FAQ</Text>
        <Text style={styles.faqText}>• Order status updates are available in the 'My Orders' section.</Text>
        <Text style={styles.faqText}>• For payment or refund issues, contact us directly.</Text>
        <Text style={styles.faqText}>• Delivery delays may occur due to weather or local conditions.</Text>
        <Text style={styles.faqText}>• For any other help, reach out via call, WhatsApp, or email.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
  },
  buttonText: {
    fontSize: 18,
    marginLeft: 16,
    color: '#222',
    fontWeight: '500',
  },
  faqContainer: {
    backgroundColor: '#F0F8E8',
    borderRadius: 10,
    padding: 16,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  faqText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
});

export default HelpScreen; 
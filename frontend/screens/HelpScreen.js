import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import CONFIG from '../config/constants';

const SUPPORT_NUMBERS = [
  '8182838680',
  '9569038600',
  '9005754137',
  '6392204505',
  '8423415436',
  '9918766793',
];
const SUPPORT_EMAIL = 'gaonzaika@gmail.com';

const HelpScreen = () => {
  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert('Error', 'Unable to open dialer.');
    });
  };

  const handleWhatsApp = (number) => {
    const url = `https://wa.me/91${number}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp.');
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support%20Request`).catch(() => {
      Alert.alert('Error', 'Unable to open email app.');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Customer Support</Text>
        <Text style={styles.subtitle}>Need help? Contact us via any method below:</Text>
        <View style={styles.buttonContainer}>
          {SUPPORT_NUMBERS.map((number) => (
            <View key={number} style={{ marginBottom: 8 }}>
              <TouchableOpacity style={styles.button} onPress={() => handleCall(number)}>
                <MaterialIcons name="call" size={28} color="#4CAF50" />
                <Text style={styles.buttonText}>Call: {number}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => handleWhatsApp(number)}>
                <FontAwesome name="whatsapp" size={28} color="#25D366" />
                <Text style={styles.buttonText}>WhatsApp: {number}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.button} onPress={handleEmail}>
            <MaterialIcons name="email" size={28} color="#2196F3" />
            <Text style={styles.buttonText}>Email: {SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.faqContainer}>
          <Text style={styles.faqTitle}>Quick Help / FAQ</Text>
          <Text style={styles.faqText}>• Order status updates are available in the 'My Orders' section.</Text>
          <Text style={styles.faqText}>• For payment or refund issues, contact us directly.</Text>
          <Text style={styles.faqText}>• Delivery delays may occur due to weather or local conditions.</Text>
          <Text style={styles.faqText}>• For any other help, reach out via call, WhatsApp, or email.</Text>
        </View>
      </ScrollView>
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
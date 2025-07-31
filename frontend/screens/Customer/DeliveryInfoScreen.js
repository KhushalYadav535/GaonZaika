import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const DeliveryInfoScreen = ({ route, navigation }) => {
  const { restaurant, cart } = route.params;
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    address: '',
    houseNumber: '',
    apartment: '',
    floor: '',
    landmark: '',
    area: '',
    city: '',
    pincode: '',
    state: '',
    additionalInstructions: ''
  });

  useEffect(() => {
    loadSavedDeliveryInfo();
  }, []);

  const loadSavedDeliveryInfo = async () => {
    try {
      const savedInfo = await AsyncStorage.getItem('lastDeliveryInfo');
      if (savedInfo) {
        const parsedInfo = JSON.parse(savedInfo);
        setDeliveryInfo(prev => ({ ...prev, ...parsedInfo }));
      }
    } catch (error) {
      console.error('Error loading saved delivery info:', error);
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get your current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        setDeliveryInfo(prev => ({
          ...prev,
          area: address.district || '',
          city: address.city || '',
          state: address.region || '',
          pincode: address.postalCode || '',
          address: `${address.street || ''} ${address.name || ''}`.trim()
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location. Please enter address manually.');
    } finally {
      setGettingLocation(false);
    }
  };

  const validateForm = () => {
    if (!deliveryInfo.name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name.');
      return false;
    }
    if (!deliveryInfo.phone.trim()) {
      Alert.alert('Missing Information', 'Please enter your phone number.');
      return false;
    }
    if (deliveryInfo.phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return false;
    }
    if (!deliveryInfo.address.trim()) {
      Alert.alert('Missing Information', 'Please enter your address.');
      return false;
    }
    if (!deliveryInfo.area.trim()) {
      Alert.alert('Missing Information', 'Please enter your area/locality.');
      return false;
    }
    if (!deliveryInfo.city.trim()) {
      Alert.alert('Missing Information', 'Please enter your city.');
      return false;
    }
    if (!deliveryInfo.pincode.trim()) {
      Alert.alert('Missing Information', 'Please enter your pincode.');
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Save delivery info for future use
      await AsyncStorage.setItem('lastDeliveryInfo', JSON.stringify(deliveryInfo));
      
      // Navigate to cart screen with enhanced delivery info
      navigation.navigate('Cart', {
        restaurant,
        cart,
        deliveryInfo
      });
    } catch (error) {
      console.error('Error saving delivery info:', error);
      Alert.alert('Error', 'Failed to save delivery information.');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryInfo = (field, value) => {
    setDeliveryInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Information</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>
            <MaterialIcons name="location-on" size={20} color="#2196F3" />
            {' '}Help delivery personnel find you easily
          </Text>
          <Text style={styles.cardSubtitle}>
            Provide detailed information to ensure smooth delivery
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={deliveryInfo.name}
              onChangeText={(text) => updateDeliveryInfo('name', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={deliveryInfo.phone}
              onChangeText={(text) => updateDeliveryInfo('phone', text)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>
          
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={getCurrentLocation}
            disabled={gettingLocation}
          >
            <MaterialIcons name="my-location" size={20} color="#2196F3" />
            <Text style={styles.locationButtonText}>
              {gettingLocation ? 'Getting location...' : 'Use Current Location'}
            </Text>
            {gettingLocation && <ActivityIndicator size="small" color="#2196F3" />}
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Complete Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your complete address"
              value={deliveryInfo.address}
              onChangeText={(text) => updateDeliveryInfo('address', text)}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>House/Flat Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 123, A-101"
                value={deliveryInfo.houseNumber}
                onChangeText={(text) => updateDeliveryInfo('houseNumber', text)}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Apartment/Building</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sunshine Apartments"
                value={deliveryInfo.apartment}
                onChangeText={(text) => updateDeliveryInfo('apartment', text)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Floor</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2nd Floor"
                value={deliveryInfo.floor}
                onChangeText={(text) => updateDeliveryInfo('floor', text)}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Landmark</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Near Metro Station"
                value={deliveryInfo.landmark}
                onChangeText={(text) => updateDeliveryInfo('landmark', text)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Area/Locality *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your area or locality"
              value={deliveryInfo.area}
              onChangeText={(text) => updateDeliveryInfo('area', text)}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your city"
                value={deliveryInfo.city}
                onChangeText={(text) => updateDeliveryInfo('city', text)}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter pincode"
                value={deliveryInfo.pincode}
                onChangeText={(text) => updateDeliveryInfo('pincode', text)}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your state"
              value={deliveryInfo.state}
              onChangeText={(text) => updateDeliveryInfo('state', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any special instructions for delivery (optional)"
              value={deliveryInfo.additionalInstructions}
              onChangeText={(text) => updateDeliveryInfo('additionalInstructions', text)}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>
            <MaterialIcons name="lightbulb" size={20} color="#FF9800" />
            {' '}Tips for accurate delivery
          </Text>
          <Text style={styles.tipText}>• Include nearby landmarks for easy identification</Text>
          <Text style={styles.tipText}>• Mention floor number and apartment details</Text>
          <Text style={styles.tipText}>• Provide clear directions if needed</Text>
          <Text style={styles.tipText}>• Ensure phone number is correct for contact</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.disabledButton]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue to Cart</Text>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  placeholder: {
    width: 32
  },
  content: {
    flex: 1,
    padding: 16
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#424242'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2196F3'
  },
  locationButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 8
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  halfWidth: {
    width: '48%'
  },
  tipsCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 12
  },
  tipText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 6
  },
  bottomSection: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    elevation: 2
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8
  }
});

export default DeliveryInfoScreen; 
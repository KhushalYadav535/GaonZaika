import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { 
  getVendorLocation, 
  getCoordinatesFromAddress, 
  validateCoordinates, 
  formatCoordinates 
} from '../../services/locationService';

const { width } = Dimensions.get('window');

const RestaurantLocationModal = ({ visible, onClose, onSave, vendorId }) => {
  const [loading, setLoading] = useState(false);
  const [locationMethod, setLocationMethod] = useState('gps'); // 'gps', 'manual', 'search'
  
  // Location data
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  
  // Search
  const [searchAddress, setSearchAddress] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setLatitude('');
    setLongitude('');
    setAddress('');
    setStreet('');
    setCity('');
    setState('');
    setPincode('');
    setSearchAddress('');
    setLocationMethod('gps');
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setLocationMethod('gps');
      
      const location = await getVendorLocation();
      
      if (location) {
        setLatitude(location.latitude.toString());
        setLongitude(location.longitude.toString());
        setAddress(location.address);
        
        // Try to parse address components
        parseAddress(location.address);
        
        Alert.alert('Success', 'Location captured successfully!');
      } else {
        Alert.alert('Error', 'Failed to get current location. Please try again or use manual input.');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location. Please check your GPS settings.');
    } finally {
      setLoading(false);
    }
  };

  const searchByAddress = async () => {
    if (!searchAddress.trim()) {
      Alert.alert('Error', 'Please enter an address to search');
      return;
    }

    try {
      setSearching(true);
      setLocationMethod('search');
      
      const location = await getCoordinatesFromAddress(searchAddress);
      
      if (location) {
        setLatitude(location.latitude.toString());
        setLongitude(location.longitude.toString());
        setAddress(location.address);
        setSearchAddress(location.address);
        
        // Try to parse address components
        parseAddress(location.address);
        
        Alert.alert('Success', 'Address found and coordinates set!');
      } else {
        Alert.alert('Error', 'Address not found. Please try a different address.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      Alert.alert('Error', 'Failed to find address. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const parseAddress = (fullAddress) => {
    // Simple address parsing - in production, you might want to use a more sophisticated parser
    const parts = fullAddress.split(',').map(part => part.trim());
    
    if (parts.length >= 3) {
      setStreet(parts[0] || '');
      setCity(parts[1] || '');
      setState(parts[2] || '');
      
      // Try to find pincode (usually last part with numbers)
      const pincodePart = parts.find(part => /^\d{6}$/.test(part));
      if (pincodePart) {
        setPincode(pincodePart);
      }
    }
  };

  const validateForm = () => {
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Please set location coordinates');
      return false;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (!validateCoordinates(lat, lng)) {
      Alert.alert('Error', 'Please enter valid coordinates');
      return false;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter restaurant address');
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim()
    };

    onSave(locationData);
    onClose();
  };

  const renderGPSMethod = () => (
    <View style={styles.methodContainer}>
      <View style={styles.methodHeader}>
        <MaterialIcons name="gps-fixed" size={24} color="#FF9800" />
        <Text style={styles.methodTitle}>Use Current Location</Text>
      </View>
      <Text style={styles.methodDescription}>
        Automatically capture your restaurant's current GPS location
      </Text>
      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={getCurrentLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <MaterialIcons name="my-location" size={20} color="white" />
            <Text style={styles.actionButtonText}>Get Current Location</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSearchMethod = () => (
    <View style={styles.methodContainer}>
      <View style={styles.methodHeader}>
        <MaterialIcons name="search" size={24} color="#FF9800" />
        <Text style={styles.methodTitle}>Search by Address</Text>
      </View>
      <Text style={styles.methodDescription}>
        Search for your restaurant address and get coordinates automatically
      </Text>
      <TextInput
        style={styles.searchInput}
        value={searchAddress}
        onChangeText={setSearchAddress}
        placeholder="Enter restaurant address..."
        multiline
      />
      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={searchByAddress}
        disabled={searching}
      >
        {searching ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <MaterialIcons name="search" size={20} color="white" />
            <Text style={styles.actionButtonText}>Search Address</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderManualMethod = () => (
    <View style={styles.methodContainer}>
      <View style={styles.methodHeader}>
        <MaterialIcons name="edit-location" size={24} color="#FF9800" />
        <Text style={styles.methodTitle}>Manual Input</Text>
      </View>
      <Text style={styles.methodDescription}>
        Manually enter coordinates and address details
      </Text>
      
      <View style={styles.coordinatesContainer}>
        <View style={styles.coordinateInput}>
          <Text style={styles.inputLabel}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={latitude}
            onChangeText={setLatitude}
            placeholder="e.g., 19.0760"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.coordinateInput}>
          <Text style={styles.inputLabel}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={longitude}
            onChangeText={setLongitude}
            placeholder="e.g., 72.8777"
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Set Restaurant Location</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Method Selection */}
            <View style={styles.methodSelection}>
              <TouchableOpacity 
                style={[styles.methodTab, locationMethod === 'gps' && styles.activeTab]}
                onPress={() => setLocationMethod('gps')}
              >
                <MaterialIcons name="gps-fixed" size={20} color={locationMethod === 'gps' ? '#FF9800' : '#666'} />
                <Text style={[styles.methodTabText, locationMethod === 'gps' && styles.activeTabText]}>GPS</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.methodTab, locationMethod === 'search' && styles.activeTab]}
                onPress={() => setLocationMethod('search')}
              >
                <MaterialIcons name="search" size={20} color={locationMethod === 'search' ? '#FF9800' : '#666'} />
                <Text style={[styles.methodTabText, locationMethod === 'search' && styles.activeTabText]}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.methodTab, locationMethod === 'manual' && styles.activeTab]}
                onPress={() => setLocationMethod('manual')}
              >
                <MaterialIcons name="edit-location" size={20} color={locationMethod === 'manual' ? '#FF9800' : '#666'} />
                <Text style={[styles.methodTabText, locationMethod === 'manual' && styles.activeTabText]}>Manual</Text>
              </TouchableOpacity>
            </View>

            {/* Method Content */}
            {locationMethod === 'gps' && renderGPSMethod()}
            {locationMethod === 'search' && renderSearchMethod()}
            {locationMethod === 'manual' && renderManualMethod()}

            {/* Address Details */}
            <View style={styles.addressSection}>
              <Text style={styles.sectionTitle}>Restaurant Address</Text>
              
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Full restaurant address"
                multiline
              />
              
              <View style={styles.addressGrid}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={street}
                  onChangeText={setStreet}
                  placeholder="Street address"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="Pincode"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Current Coordinates Display */}
            {(latitude || longitude) && (
              <View style={styles.coordinatesDisplay}>
                <Text style={styles.sectionTitle}>Current Coordinates</Text>
                <View style={styles.coordinatesBox}>
                  <MaterialIcons name="location-on" size={20} color="#FF9800" />
                  <Text style={styles.coordinatesText}>
                    {formatCoordinates(parseFloat(latitude) || 0, parseFloat(longitude) || 0)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.button, styles.saveButton]}>
              <Text style={styles.saveButtonText}>Save Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: '90%',
    padding: 0
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    padding: 5
  },
  scrollContent: {
    padding: 20
  },
  methodSelection: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 5
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  methodTabText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666'
  },
  activeTabText: {
    color: '#FF9800',
    fontWeight: '600'
  },
  methodContainer: {
    marginBottom: 20
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333'
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top'
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  coordinateInput: {
    flex: 1,
    marginHorizontal: 5
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  addressSection: {
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 14
  },
  addressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  halfInput: {
    width: '48%'
  },
  coordinatesDisplay: {
    marginTop: 20
  },
  coordinatesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  coordinatesText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#495057'
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6'
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: '600'
  },
  saveButton: {
    backgroundColor: '#FF9800'
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600'
  }
});

export default RestaurantLocationModal; 
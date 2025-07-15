import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import locationService from '../services/locationService';

const LocationSettingsModal = ({ visible, onClose, onLocationSet }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState('10');

  useEffect(() => {
    if (visible) {
      loadCurrentLocation();
    }
  }, [visible]);

  const loadCurrentLocation = async () => {
    try {
      const location = locationService.getCachedLocation();
      if (location) {
        setCurrentLocation(location);
        const address = await locationService.getAddressFromLocation(
          location.latitude,
          location.longitude
        );
        if (address) {
          setAddress(address);
        }
      }
    } catch (error) {
      console.error('Error loading current location:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await locationService.getCurrentLocation();
      
      if (location) {
        setCurrentLocation(location);
        const address = await locationService.getAddressFromLocation(
          location.latitude,
          location.longitude
        );
        if (address) {
          setAddress(address);
        }
        Alert.alert('Success', 'Location updated successfully!');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchByAddress = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }

    try {
      setLoading(true);
      const location = await locationService.getLocationFromAddress(address);
      
      if (location) {
        setCurrentLocation(location);
        Alert.alert('Success', 'Location found!');
      } else {
        Alert.alert('Error', 'Address not found. Please try a different address.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      Alert.alert('Error', 'Failed to find address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveLocation = () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Please set a location first');
      return;
    }

    const radius = parseFloat(searchRadius);
    if (isNaN(radius) || radius < 1 || radius > 50) {
      Alert.alert('Error', 'Please enter a valid search radius (1-50 km)');
      return;
    }

    onLocationSet({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      address: address,
      searchRadius: radius
    });
    onClose();
  };

  const presetLocations = [
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  ];

  const selectPresetLocation = (preset) => {
    setCurrentLocation({ latitude: preset.lat, longitude: preset.lng });
    setAddress(preset.name);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Location Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Current Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Location</Text>
              <TouchableOpacity 
                onPress={getCurrentLocation} 
                style={styles.locationButton}
                disabled={loading}
              >
                <MaterialIcons name="my-location" size={20} color="#4CAF50" />
                <Text style={styles.locationButtonText}>
                  {loading ? 'Getting location...' : 'Use Current Location'}
                </Text>
                {loading && <ActivityIndicator size="small" color="#4CAF50" />}
              </TouchableOpacity>
            </View>

            {/* Address Search Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search by Address</Text>
              <View style={styles.addressContainer}>
                <TextInput
                  style={styles.addressInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter address or landmark..."
                  multiline
                />
                <TouchableOpacity 
                  onPress={searchByAddress} 
                  style={styles.searchButton}
                  disabled={loading}
                >
                  <MaterialIcons name="search" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Preset Locations Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Select Cities</Text>
              <View style={styles.presetGrid}>
                {presetLocations.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.presetButton}
                    onPress={() => selectPresetLocation(preset)}
                  >
                    <Text style={styles.presetText}>{preset.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Search Radius Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search Radius</Text>
              <View style={styles.radiusContainer}>
                <TextInput
                  style={styles.radiusInput}
                  value={searchRadius}
                  onChangeText={setSearchRadius}
                  placeholder="10"
                  keyboardType="numeric"
                />
                <Text style={styles.radiusLabel}>kilometers</Text>
              </View>
              <Text style={styles.radiusHint}>
                Restaurants within this distance will be shown
              </Text>
            </View>

            {/* Current Location Display */}
            {currentLocation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Selected Location</Text>
                <View style={styles.locationDisplay}>
                  <MaterialIcons name="location-on" size={16} color="#4CAF50" />
                  <Text style={styles.locationText}>
                    {address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
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
            <TouchableOpacity onPress={saveLocation} style={[styles.button, styles.saveButton]}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  addressInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 48,
    alignItems: 'center',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  presetText: {
    fontSize: 14,
    color: '#333',
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  radiusLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  radiusHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});

export default LocationSettingsModal; 
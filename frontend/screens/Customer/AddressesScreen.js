import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import locationService from '../../services/locationService';

const AddressesScreen = () => {
  const [addresses, setAddresses] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);

  // Load addresses from storage
  useEffect(() => {
    loadAddresses();
    loadCurrentLocation();
  }, []);

  const loadAddresses = async () => {
    try {
      const savedAddresses = await locationService.getAddressesFromStorage();
      setAddresses(savedAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentLocation = async () => {
    try {
      const currentLocationAddress = await locationService.getCurrentLocationAsAddress();
      setCurrentLocation(currentLocationAddress);
    } catch (error) {
      console.error('Error loading current location:', error);
    }
  };

  const openAdd = () => {
    setEditId(null);
    setLabel('');
    setAddress('');
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setLabel(item.label);
    setAddress(item.address);
    setModalVisible(true);
  };

  const save = async () => {
    if (!label.trim() || !address.trim()) {
      Alert.alert('Error', 'Please fill in both label and address');
      return;
    }

    try {
      let updatedAddresses;
      
      if (editId) {
        // Update existing address
        updatedAddresses = addresses.map(a => 
          a.id === editId ? { ...a, label, address } : a
        );
      } else {
        // Add new address
        const newAddress = {
          id: Date.now().toString(),
          label,
          address,
          timestamp: new Date().toISOString()
        };
        updatedAddresses = [...addresses, newAddress];
      }

      setAddresses(updatedAddresses);
      await locationService.updateAddressesInStorage(updatedAddresses);
      setModalVisible(false);
      
      Alert.alert('Success', editId ? 'Address updated successfully' : 'Address added successfully');
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address');
    }
  };

  const remove = async (id) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedAddresses = addresses.filter(a => a.id !== id);
              setAddresses(updatedAddresses);
              await locationService.updateAddressesInStorage(updatedAddresses);
              Alert.alert('Success', 'Address deleted successfully');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          }
        }
      ]
    );
  };

  const saveCurrentLocation = async () => {
    try {
      const savedAddress = await locationService.saveCurrentLocationAsAddress('Current Location');
      if (savedAddress) {
        await loadAddresses(); // Reload addresses
        Alert.alert('Success', 'Current location saved as delivery address');
      } else {
        Alert.alert('Error', 'Failed to get current location');
      }
    } catch (error) {
      console.error('Error saving current location:', error);
      Alert.alert('Error', 'Failed to save current location');
    }
  };

  const renderAddress = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <View style={styles.addressHeader}>
          <Text style={styles.label}>{item.label}</Text>
          {item.isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current</Text>
            </View>
          )}
        </View>
        <Text style={styles.address}>{item.address}</Text>
        {item.lat && item.lng && (
          <Text style={styles.coordinates}>
            📍 {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
          </Text>
        )}
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionButton}>
          <MaterialIcons name="edit" size={22} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => remove(item.id)} style={styles.actionButton}>
          <MaterialIcons name="delete" size={22} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentLocation = () => {
    if (!currentLocation) return null;

    return (
      <View style={[styles.card, styles.currentLocationCard]}>
        <View style={{ flex: 1 }}>
          <View style={styles.addressHeader}>
            <Text style={styles.label}>{currentLocation.label}</Text>
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Live</Text>
            </View>
          </View>
          <Text style={styles.address}>{currentLocation.address}</Text>
          <Text style={styles.coordinates}>
            📍 {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </Text>
        </View>
        <TouchableOpacity onPress={saveCurrentLocation} style={styles.saveButton}>
          <MaterialIcons name="save" size={22} color="#4CAF50" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Addresses</Text>
      
      <FlatList
        data={addresses}
        keyExtractor={item => item.id}
        renderItem={renderAddress}
        ListHeaderComponent={renderCurrentLocation}
        ListFooterComponent={
          <TouchableOpacity style={styles.addButton} onPress={openAdd}>
            <MaterialIcons name="add" size={22} color="#fff" />
            <Text style={styles.addText}>Add New Address</Text>
          </TouchableOpacity>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit' : 'Add'} Address</Text>
            <TextInput 
              style={styles.input} 
              value={label} 
              onChangeText={setLabel} 
              placeholder="Label (e.g. Home, Work)" 
            />
            <TextInput 
              style={styles.input} 
              value={address} 
              onChangeText={setAddress} 
              placeholder="Full Address" 
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={save} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, { backgroundColor: '#ccc' }]}> 
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currentLocationCard: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#4CAF50',
    flex: 1,
  },
  address: { 
    fontSize: 14, 
    color: '#666',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    marginLeft: 12,
    padding: 4,
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8f0',
  },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#4CAF50', 
    borderRadius: 8, 
    padding: 12, 
    marginTop: 16, 
    justifyContent: 'center' 
  },
  addText: { 
    color: 'white', 
    fontWeight: 'bold', 
    marginLeft: 8 
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 20, 
    width: '80%', 
    alignItems: 'center' 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 16 
  },
  input: { 
    width: '100%', 
    borderColor: '#ddd', 
    borderWidth: 1, 
    borderRadius: 8,
    marginBottom: 12, 
    padding: 12,
    fontSize: 16,
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  modalButton: { 
    backgroundColor: '#4CAF50', 
    padding: 12, 
    borderRadius: 8, 
    marginHorizontal: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  modalButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: 'white' 
  },
});

export default AddressesScreen; 
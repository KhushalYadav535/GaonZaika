import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const RestaurantLocationModal = ({ visible, onClose, location, onSave }) => {
  const [address, setAddress] = useState(location || 'Village Main Road');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Edit Restaurant Location</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Restaurant Address"
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => { onSave(address); onClose(); }} style={styles.button}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: '#ccc' }]}> 
              <Text style={[styles.buttonText, { color: '#333' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: 'white', padding: 20, borderRadius: 20, width: '80%', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { width: '100%', height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  button: { backgroundColor: '#FF9800', padding: 12, borderRadius: 8, marginHorizontal: 4 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
});

export default RestaurantLocationModal; 
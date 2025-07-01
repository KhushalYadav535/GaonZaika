import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const initialAddresses = [
  { id: '1', label: 'Home', address: '123 Main Street, Village' },
  { id: '2', label: 'Work', address: 'Office Road, City Center' },
];

const AddressesScreen = () => {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');

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
  const save = () => {
    if (editId) {
      setAddresses(addresses.map(a => a.id === editId ? { ...a, label, address } : a));
    } else {
      setAddresses([...addresses, { id: Date.now().toString(), label, address }]);
    }
    setModalVisible(false);
  };
  const remove = (id) => setAddresses(addresses.filter(a => a.id !== id));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Addresses</Text>
      <FlatList
        data={addresses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.address}>{item.address}</Text>
            </View>
            <TouchableOpacity onPress={() => openEdit(item)}>
              <MaterialIcons name="edit" size={22} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => remove(item.id)}>
              <MaterialIcons name="delete" size={22} color="#f44336" />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addButton} onPress={openAdd}>
            <MaterialIcons name="add" size={22} color="#fff" />
            <Text style={styles.addText}>Add Address</Text>
          </TouchableOpacity>
        }
      />
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit' : 'Add'} Address</Text>
            <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="Label (e.g. Home)" />
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address" />
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  address: { fontSize: 14, color: '#666' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', borderRadius: 8, padding: 12, marginTop: 16, justifyContent: 'center' },
  addText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 20, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { width: '100%', height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, marginHorizontal: 4 },
  modalButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
});

export default AddressesScreen; 
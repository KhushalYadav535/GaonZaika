import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const initialMethods = [
  { id: '1', type: 'Card', details: '**** 1234' },
  { id: '2', type: 'UPI', details: 'user@upi' },
];

const PaymentMethodsScreen = () => {
  const [methods, setMethods] = useState(initialMethods);
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState('');
  const [details, setDetails] = useState('');

  const openAdd = () => {
    setType('');
    setDetails('');
    setModalVisible(true);
  };
  const save = () => {
    setMethods([...methods, { id: Date.now().toString(), type, details }]);
    setModalVisible(false);
  };
  const remove = (id) => setMethods(methods.filter(m => m.id !== id));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Methods</Text>
      <FlatList
        data={methods}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.type}>{item.type}</Text>
              <Text style={styles.details}>{item.details}</Text>
            </View>
            <TouchableOpacity onPress={() => remove(item.id)}>
              <MaterialIcons name="delete" size={22} color="#f44336" />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addButton} onPress={openAdd}>
            <MaterialIcons name="add" size={22} color="#fff" />
            <Text style={styles.addText}>Add Payment Method</Text>
          </TouchableOpacity>
        }
      />
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Payment Method</Text>
            <TextInput style={styles.input} value={type} onChangeText={setType} placeholder="Type (e.g. Card, UPI)" />
            <TextInput style={styles.input} value={details} onChangeText={setDetails} placeholder="Details (e.g. **** 1234, user@upi)" />
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
  type: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  details: { fontSize: 14, color: '#666' },
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

export default PaymentMethodsScreen; 
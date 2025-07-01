import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const BusinessHoursModal = ({ visible, onClose, hours, onSave }) => {
  const [open, setOpen] = useState(hours?.open || '10:00 AM');
  const [close, setClose] = useState(hours?.close || '10:00 PM');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Edit Business Hours</Text>
          <TextInput
            style={styles.input}
            value={open}
            onChangeText={setOpen}
            placeholder="Open Time (e.g. 10:00 AM)"
          />
          <TextInput
            style={styles.input}
            value={close}
            onChangeText={setClose}
            placeholder="Close Time (e.g. 10:00 PM)"
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => { onSave({ open, close }); onClose(); }} style={styles.button}>
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

export default BusinessHoursModal; 
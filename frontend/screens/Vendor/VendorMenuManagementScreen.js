import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert, Modal, Button, ActivityIndicator, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import apiService from '../../services/apiService';
import { useVendor } from '../../hooks/useVendor';
import { useNavigation } from '@react-navigation/native';

const VendorMenuManagementScreen = ({ route }) => {
  const { vendorId, loading: vendorLoading } = useVendor();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Starters',
    isVeg: true,
    isAvailable: true,
    preparationTime: '15'
  });
  
  // Valid categories from the backend model
  const validCategories = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Breads'];
  
  const navigation = useNavigation();

  useEffect(() => {
    if (vendorId && !vendorLoading) {
      fetchMenu();
    }
  }, [vendorId, vendorLoading]);

  // Debug: Log menu state changes
  useEffect(() => {
    console.log('Menu state changed:', menu);
    console.log('Menu items count:', menu.length);
  }, [menu]);

  const fetchMenu = async () => {
    if (!vendorId) {
      console.log('No vendor ID available');
      return;
    }

    console.log('Fetching menu for vendorId:', vendorId);
    setLoading(true);
    try {
      const res = await apiService.getVendorMenu(vendorId);
      console.log('Menu API response:', res.data);
      console.log('Menu data:', res.data.data.menu);
      console.log('Menu array length:', res.data.data.menu ? res.data.data.menu.length : 0);
      if (res.data.data.menu && res.data.data.menu.length > 0) {
        console.log('Menu items:', res.data.data.menu.map(item => ({ name: item.name, price: item.price, category: item.category })));
      }
      setMenu(res.data.data.menu || []);
      console.log('Menu state updated with:', res.data.data.menu || []);
    } catch (err) {
      console.error('Error fetching menu:', err);
      Alert.alert('Error', 'Failed to fetch menu');
    }
    setLoading(false);
  };

  const handleInputChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to select images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        setImageFile({
          uri: selectedImage.uri,
          type: 'image/jpeg',
          name: `menu-item-${Date.now()}.jpg`
        });
        console.log('Image selected:', selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = () => {
    setImageFile(null);
  };

  const openAddModal = () => {
    setEditItem(null);
    setImageFile(null);
    setForm({ 
      name: '', 
      description: '', 
      price: '', 
      category: 'Starters', 
      isVeg: true, 
      isAvailable: true,
      preparationTime: '15'
    });
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setImageFile(null); // Don't pre-load image for edit
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      preparationTime: String(item.preparationTime || 15)
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!vendorId) {
      Alert.alert('Error', 'Vendor not authenticated');
      return;
    }

    // Validate required fields
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter a menu item name');
      return;
    }
    if (!form.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    if (!form.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    console.log('Submitting menu item with vendorId:', vendorId);

    try {
      const menuItemData = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        isVeg: form.isVeg,
        isAvailable: form.isAvailable,
        preparationTime: Number(form.preparationTime)
      };

      if (editItem) {
        console.log('Updating menu item:', editItem._id);
        await apiService.updateVendorMenuItem(vendorId, editItem._id, menuItemData, imageFile);
        Alert.alert('Success', 'Menu item updated');
      } else {
        console.log('Adding new menu item');
        await apiService.addVendorMenuItem(vendorId, menuItemData, imageFile);
        Alert.alert('Success', 'Menu item added');
      }
      setModalVisible(false);
      setImageFile(null);
      console.log('Menu item saved successfully, refreshing menu...');
      fetchMenu();
    } catch (error) {
      console.error('Error saving menu item:', error);
      let errorMessage = 'Failed to save menu item';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid data provided';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDelete = async (itemId) => {
    if (!vendorId) {
      Alert.alert('Error', 'Vendor not authenticated');
      return;
    }

    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this menu item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteVendorMenuItem(vendorId, itemId);
              Alert.alert('Success', 'Menu item deleted');
              fetchMenu();
            } catch (error) {
              console.error('Error deleting menu item:', error);
              Alert.alert('Error', 'Failed to delete menu item');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemHeader}>
        <Text style={styles.menuName}>{item.name} {item.isVeg ? '🟢' : '🔴'}</Text>
        <Text style={styles.menuPrice}>₹{item.price}</Text>
      </View>
      <Text style={styles.menuCategory}>{item.category}</Text>
      <Text style={styles.menuDescription}>{item.description}</Text>
      {item.image && item.image.url && (
        <Image source={{ uri: item.image.url }} style={styles.menuImage} />
      )}
      <View style={styles.menuActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={[styles.actionBtn, styles.deleteBtn]}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (vendorLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Loading...</Text>
      </View>
    );
  }

  if (!vendorId) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Vendor not authenticated</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Menu</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchMenu}>
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>
      
      {loading && <ActivityIndicator size="large" color="#000" />}
      
      <Text style={styles.menuCount}>Menu Items: {menu.length}</Text>
      
      <FlatList
        data={menu}
        keyExtractor={item => item._id || item.id}
        renderItem={renderItem}
        ListEmptyComponent={!loading && <Text style={styles.emptyText}>No menu items found. Add your first menu item!</Text>}
      />
      
      <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
        <Text style={styles.addBtnText}>+ Add Menu Item</Text>
      </TouchableOpacity>
      
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editItem ? 'Edit' : 'Add'} Menu Item</Text>
            
            <TextInput 
              placeholder="Name" 
              value={form.name} 
              onChangeText={t => handleInputChange('name', t)} 
              style={styles.input} 
            />
            
            <TextInput 
              placeholder="Description" 
              value={form.description} 
              onChangeText={t => handleInputChange('description', t)} 
              style={styles.input} 
              multiline
              numberOfLines={3}
            />
            
            <TextInput 
              placeholder="Price" 
              value={form.price} 
              onChangeText={t => handleInputChange('price', t)} 
              style={styles.input} 
              keyboardType="numeric" 
            />
            
            <TextInput 
              placeholder="Preparation Time (minutes)" 
              value={form.preparationTime} 
              onChangeText={t => handleInputChange('preparationTime', t)} 
              style={styles.input} 
              keyboardType="numeric" 
            />
            
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Category:</Text>
              <Picker
                selectedValue={form.category}
                style={styles.picker}
                onValueChange={(itemValue) => handleInputChange('category', itemValue)}
              >
                {validCategories.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>
            
            {/* Image Upload Section */}
            <View style={styles.imageSection}>
              <Text style={styles.imageLabel}>Item Image:</Text>
              {imageFile ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageFile.uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                    <Text style={styles.removeImageBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                  <Text style={styles.imagePickerBtnText}>📷 Select Image</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Veg?</Text>
              <Button 
                title={form.isVeg ? 'Yes' : 'No'} 
                onPress={() => handleInputChange('isVeg', !form.isVeg)} 
              />
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Available?</Text>
              <Button 
                title={form.isAvailable ? 'Yes' : 'No'} 
                onPress={() => handleInputChange('isAvailable', !form.isAvailable)} 
              />
            </View>
            
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title={editItem ? 'Update' : 'Add'} onPress={handleSubmit} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 'bold' },
  refreshBtn: { backgroundColor: '#28a745', padding: 8, borderRadius: 6 },
  refreshBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  menuCount: { fontSize: 16, color: '#666', marginBottom: 10, textAlign: 'center' },
  addBtn: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  menuItem: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 10 },
  menuItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  menuName: { fontWeight: 'bold', fontSize: 16 },
  menuPrice: { fontWeight: 'bold', fontSize: 16, color: '#28a745' },
  menuCategory: { fontSize: 14, color: '#666', marginBottom: 4 },
  menuDescription: { fontSize: 14, color: '#333', marginBottom: 8 },
  menuImage: { width: '100%', height: 100, borderRadius: 8, marginTop: 8 },
  menuActions: { flexDirection: 'row', marginTop: 8 },
  actionBtn: { marginRight: 16, padding: 6, backgroundColor: '#eee', borderRadius: 6 },
  actionBtnText: { color: '#333', fontSize: 14 },
  deleteBtn: { backgroundColor: '#dc3545' },
  deleteBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#666', marginTop: 20 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 10 },
  pickerContainer: { marginBottom: 10 },
  pickerLabel: { fontSize: 16, marginBottom: 5, fontWeight: '500' },
  picker: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6 },
  imageSection: { marginTop: 10, marginBottom: 10 },
  imageLabel: { fontSize: 16, marginBottom: 5, fontWeight: '500' },
  imagePickerBtn: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, alignItems: 'center' },
  imagePickerBtnText: { color: '#fff', fontWeight: 'bold' },
  imagePreviewContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  imagePreview: { width: 50, height: 50, borderRadius: 6, marginRight: 10 },
  removeImageBtn: { backgroundColor: '#dc3545', padding: 8, borderRadius: 6 },
  removeImageBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 16, marginRight: 10, fontWeight: '500' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }
});

export default VendorMenuManagementScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import apiService from '../../services/apiService';
import { useVendor } from '../../hooks/useVendor';
import { useNavigation } from '@react-navigation/native';

const VendorMenuScreen = ({ route }) => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { vendorId, loading: vendorLoading } = useVendor();

  useEffect(() => {
    if (vendorId && !vendorLoading) {
      loadMenu();
    }
  }, [vendorId, vendorLoading]);

  const loadMenu = async () => {
    if (!vendorId) {
      console.log('No vendor ID available');
      return;
    }

    console.log('VendorMenuScreen - Loading menu for vendorId:', vendorId);
    setLoading(true);
    try {
      const res = await apiService.getVendorMenu(vendorId);
      console.log('VendorMenuScreen - Menu API response:', res.data);
      console.log('VendorMenuScreen - Menu data:', res.data.data.menu);
      setMenu(res.data.data.menu || []);
      console.log('VendorMenuScreen - Menu state updated with:', res.data.data.menu || []);
    } catch (error) {
      console.error('Error loading menu:', error);
      setMenu([]);
    } finally {
      setLoading(false);
    }
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <Text style={styles.menuName}>{item.name}</Text>
      <Text style={styles.menuPrice}>₹{item.price}</Text>
      <Text style={styles.menuDesc}>{item.description}</Text>
    </View>
  );

  if (vendorLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!vendorId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Vendor not authenticated</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Menu</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadMenu}>
          <MaterialIcons name="refresh" size={24} color="#FF9800" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.menuCount}>Menu Items: {menu.length}</Text>
      
      {loading ? (
        <Text style={styles.loading}>Loading menu...</Text>
      ) : menu.length === 0 ? (
        <Text style={styles.empty}>No menu items yet. Add some items in Manage Menu!</Text>
      ) : (
        <FlatList
          data={menu}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item._id || item.id}
        />
      )}
      
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('ManageMenu', { vendorId })}>
        <Text style={styles.addBtnText}>Manage Menu</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#FF9800' },
  refreshBtn: { padding: 8 },
  menuCount: { fontSize: 16, color: '#666', marginBottom: 10, textAlign: 'center' },
  loading: { color: '#888', textAlign: 'center', marginTop: 40 },
  menuItem: { backgroundColor: 'white', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2 },
  menuName: { fontWeight: 'bold', color: '#333', fontSize: 16 },
  menuPrice: { color: '#4CAF50', fontWeight: 'bold', marginBottom: 4 },
  menuDesc: { color: '#666', marginBottom: 8 },
  menuActions: { flexDirection: 'row' },
  actionBtn: { backgroundColor: '#FF9800', borderRadius: 8, padding: 6, marginRight: 10 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  addBtn: { backgroundColor: '#FF9800', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  addBtnText: { color: 'white', fontWeight: 'bold' },
});

export default VendorMenuScreen; 
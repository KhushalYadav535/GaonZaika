import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import apiService from '../../services/apiService';

const AdminRestaurantsScreen = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllRestaurants();
      setRestaurants(response.data || []);
    } catch (error) {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const renderRestaurant = ({ item }) => (
    <View style={styles.restaurantCard}>
      <Text style={styles.restaurantName}>{item.name}</Text>
      <Text style={styles.restaurantCuisine}>{item.cuisine}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialIcons name="edit" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialIcons name="delete" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Restaurants</Text>
      {restaurants.length === 0 ? (
        <Text style={styles.empty}>No restaurants found.</Text>
      ) : (
        <FlatList
          data={restaurants}
          renderItem={renderRestaurant}
          keyExtractor={(item, index) => `${item.id}_${index}`}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },
  header: { fontSize: 22, fontWeight: 'bold', marginVertical: 10, color: '#9C27B0' },
  restaurantCard: { backgroundColor: 'white', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2 },
  restaurantName: { fontWeight: 'bold', color: '#333', fontSize: 16 },
  restaurantCuisine: { color: '#666', marginBottom: 8 },
  actions: { flexDirection: 'row' },
  actionBtn: { backgroundColor: '#9C27B0', borderRadius: 8, padding: 6, marginRight: 10 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
});

export default AdminRestaurantsScreen;

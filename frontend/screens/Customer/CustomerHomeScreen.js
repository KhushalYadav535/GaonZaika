import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../../services/apiService';
import locationService from '../../services/locationService';
import LocationSettingsModal from '../../components/LocationSettingsModal';
import { getRestaurantImageUrl } from '../../utils/imageUtils';

const CustomerHomeScreen = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10); // Default 10km radius
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    initializeLocationAndLoadRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [searchQuery, restaurants]);

  const initializeLocationAndLoadRestaurants = async () => {
    try {
      setLocationLoading(true);
      
      // Try to get user's current location
      const location = await locationService.getCurrentLocation();
      
      if (location) {
        console.log('Location service returned:', location);
        setUserLocation(location);
        await loadNearbyRestaurants(location.latitude, location.longitude);
      } else {
        console.log('Location service failed, using fallback coordinates');
        // Fallback to Delhi coordinates for testing (where restaurants are located)
        const fallbackLocation = { latitude: 28.6139, longitude: 77.2090 };
        setUserLocation(fallbackLocation);
        await loadNearbyRestaurants(fallbackLocation.latitude, fallbackLocation.longitude);
      }
    } catch (error) {
      console.error('Error initializing location:', error);
      // Fallback to Delhi coordinates for testing (where restaurants are located)
      const fallbackLocation = { latitude: 28.6139, longitude: 77.2090 };
      setUserLocation(fallbackLocation);
      await loadNearbyRestaurants(fallbackLocation.latitude, fallbackLocation.longitude);
    } finally {
      setLocationLoading(false);
      setLoading(false);
    }
  };

  const loadNearbyRestaurants = async (latitude, longitude) => {
    try {
      setLoading(true);
      console.log('Loading nearby restaurants with coordinates:', { latitude, longitude, searchRadius });
      
      const response = await apiService.getNearbyRestaurants(
        latitude, 
        longitude, 
        searchRadius,
        {} // Remove isOpen filter to show all restaurants
      );
      
      console.log('Nearby restaurants API response:', response.data);
      
      if (response.data && response.data.success) {
        const transformedRestaurants = response.data.data.map(restaurant => ({
          id: restaurant.id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          rating: restaurant.rating || 0,
          deliveryTime: restaurant.deliveryTime,
          estimatedDeliveryTime: restaurant.estimatedDeliveryTime,
          minOrder: restaurant.minOrder || 100,
          deliveryFee: restaurant.deliveryFee,
          image: getRestaurantImageUrl(restaurant.image),
          isOpen: restaurant.isOpen || false,
          distance: restaurant.distance,
          distanceKm: restaurant.distanceKm,
          address: restaurant.address,
          totalRatings: restaurant.totalRatings || 0
        }));
        
        console.log('Transformed nearby restaurants:', transformedRestaurants);
        setRestaurants(transformedRestaurants);
      } else {
        setRestaurants([]);
        Alert.alert('Error', 'Failed to load nearby restaurants');
      }
    } catch (error) {
      console.error('Error loading nearby restaurants:', error);
      console.error('Error details:', error.response?.data);
      setRestaurants([]);
      Alert.alert('Error', 'Failed to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadAllRestaurants = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRestaurants();
      console.log('All restaurants API response:', response.data);
      
      if (response.data && response.data.success) {
        // Transform backend data to match frontend format
        const transformedRestaurants = response.data.data.map(restaurant => ({
          id: restaurant._id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          rating: restaurant.rating || 0,
          deliveryTime: `${restaurant.deliveryTime?.min || 30}-${restaurant.deliveryTime?.max || 45} min`,
          estimatedDeliveryTime: `${restaurant.deliveryTime?.min || 30} min`,
          minOrder: restaurant.minOrder || 100,
          deliveryFee: restaurant.deliveryFee || 20,
          image: getRestaurantImageUrl(restaurant.image),
          isOpen: restaurant.isOpen || false,
          distance: 'Unknown',
          distanceKm: null,
          address: 'Address not available',
          totalRatings: restaurant.totalRatings || 0
        }));
        console.log('Transformed restaurants:', transformedRestaurants);
        setRestaurants(transformedRestaurants);
      } else {
        setRestaurants([]);
        Alert.alert('Error', 'Failed to load restaurants');
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setRestaurants([]);
      Alert.alert('Error', 'Failed to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const filterRestaurants = () => {
    if (!searchQuery.trim()) {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeLocationAndLoadRestaurants();
    setRefreshing(false);
  };

  const handleLocationRefresh = async () => {
    try {
      setLocationLoading(true);
      const location = await locationService.getCurrentLocation();
      
      if (location) {
        setUserLocation(location);
        await loadNearbyRestaurants(location.latitude, location.longitude);
      } else {
        Alert.alert('Location Error', 'Unable to get your location. Please check your GPS settings.');
      }
    } catch (error) {
      console.error('Error refreshing location:', error);
      Alert.alert('Location Error', 'Failed to refresh location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationSet = async (locationData) => {
    setUserLocation({
      latitude: locationData.latitude,
      longitude: locationData.longitude
    });
    setSearchRadius(locationData.searchRadius);
    await loadNearbyRestaurants(locationData.latitude, locationData.longitude);
    
    // Automatically save current location as delivery address
    try {
      const savedAddress = await locationService.saveCurrentLocationAsAddress('Current Location');
      if (savedAddress) {
        console.log('Current location saved as delivery address:', savedAddress);
        // Show success message
        Alert.alert(
          'Location Saved',
          'Your current location has been saved as a delivery address. You can view it in your profile.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving location as address:', error);
    }
  };

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.restaurantCard,
        !item.isOpen && styles.closedRestaurantCard
      ]}
      onPress={() => {
        if (!item.isOpen) {
          Alert.alert(
            'Restaurant Closed',
            'This restaurant is currently closed. Please try again later.',
            [{ text: 'OK' }]
          );
          return;
        }
        console.log('Navigating to restaurant menu with data:', item);
        navigation.navigate('RestaurantMenu', { restaurant: item });
      }}
      activeOpacity={item.isOpen ? 0.7 : 1}
      disabled={!item.isOpen}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.restaurantImage}
        onError={(error) => console.log('Restaurant image loading error:', error)}
        defaultSource={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400' }}
      />
      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.cuisine}>{item.cuisine}</Text>
        
        {/* Distance and Address */}
        <View style={styles.locationInfo}>
          <View style={styles.detailItem}>
            <MaterialIcons name="location-on" size={14} color="#666" />
            <Text style={styles.detailText}>{item.distance}</Text>
          </View>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.address}
          </Text>
        </View>

        <View style={styles.restaurantDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="access-time" size={14} color="#666" />
            <Text style={styles.detailText}>{item.estimatedDeliveryTime}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="attach-money" size={14} color="#666" />
            <Text style={styles.detailText}>Min ₹{item.minOrder}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="local-shipping" size={14} color="#666" />
            <Text style={styles.detailText}>₹{item.deliveryFee}</Text>
          </View>
        </View>
        
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: item.isOpen ? '#4CAF50' : '#F44336',
            borderWidth: item.isOpen ? 0 : 2,
            borderColor: item.isOpen ? 'transparent' : '#F44336'
          }
        ]}>
          <MaterialIcons 
            name={item.isOpen ? "check-circle" : "cancel"} 
            size={16} 
            color="white" 
            style={{ marginRight: 4 }}
          />
          <Text style={styles.statusText}>
            {item.isOpen ? 'OPEN' : 'CLOSED'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restaurants</Text>
        <Text style={styles.headerSubtitle}>
          {userLocation ? `Restaurants within ${searchRadius}km of your location` : 'All available restaurants'}
        </Text>
        
        {/* Location Status */}
        <View style={styles.locationStatus}>
          <MaterialIcons 
            name={userLocation ? "location-on" : "location-off"} 
            size={16} 
            color={userLocation ? "#4CAF50" : "#F44336"} 
          />
          <Text style={[styles.locationText, { color: userLocation ? "#4CAF50" : "#F44336" }]}>
            {userLocation ? 'Location enabled' : 'Location disabled'}
          </Text>
          <TouchableOpacity onPress={() => setShowLocationModal(true)} style={styles.settingsButton}>
            <MaterialIcons name="settings" size={16} color="#4CAF50" />
          </TouchableOpacity>
          {userLocation && (
            <TouchableOpacity onPress={handleLocationRefresh} disabled={locationLoading}>
              <MaterialIcons 
                name="refresh" 
                size={16} 
                color="#4CAF50" 
                style={locationLoading ? styles.rotating : null}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants or cuisines..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredRestaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="restaurant" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No restaurants found</Text>
            <Text style={styles.emptySubtext}>
              {userLocation 
                ? 'Try increasing the search radius or check your location settings'
                : 'Enable location services to find restaurants near you'
              }
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setShowLocationModal(true)}
            >
              <Text style={styles.emptyButtonText}>Set Location</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Location Settings Modal */}
      <LocationSettingsModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={handleLocationSet}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 12,
    marginLeft: 4,
    marginRight: 8,
  },
  settingsButton: {
    marginRight: 8,
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  restaurantCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  closedRestaurantCard: {
    opacity: 0.7,
    backgroundColor: '#f8f8f8',
  },
  restaurantImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  cuisine: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationInfo: {
    marginBottom: 8,
  },
  addressText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    marginLeft: 18,
  },
  restaurantDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CustomerHomeScreen; 
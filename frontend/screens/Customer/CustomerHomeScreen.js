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
  Dimensions,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/apiService';
import locationService from '../../services/locationService';
import LocationSettingsModal from '../../components/LocationSettingsModal';
import { getRestaurantImageUrl } from '../../utils/imageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const CustomerHomeScreen = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for greeting
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const loadCustomerName = async () => {
      try {
        const customerData = await AsyncStorage.getItem('customerData');
        if (customerData) {
          const parsedData = JSON.parse(customerData);
          setCustomerName(parsedData.name || '');
        }
      } catch (error) {
        setCustomerName('');
      }
    };
    loadCustomerName();
    initializeLocationAndLoadRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [searchQuery, restaurants, selectedCategory]);

  const initializeLocationAndLoadRestaurants = async () => {
    try {
      setLocationLoading(true);
      
      const location = await locationService.getCurrentLocation();
      
      if (location) {
        console.log('Location service returned:', location);
        setUserLocation(location);
        await loadNearbyRestaurants(location.latitude, location.longitude);
      } else {
        console.log('Location service failed, using fallback coordinates');
        const fallbackLocation = { latitude: 28.6139, longitude: 77.2090 };
        setUserLocation(fallbackLocation);
        await loadNearbyRestaurants(fallbackLocation.latitude, fallbackLocation.longitude);
      }
    } catch (error) {
      console.error('Error initializing location:', error);
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
        {}
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
        const uniqueCuisines = [
          ...new Set(transformedRestaurants.map(r => r.cuisine).filter(cuisine => cuisine && cuisine.toLowerCase() !== 'mixed'))
        ];
        setCategories(uniqueCuisines);
      } else {
        setRestaurants([]);
        setCategories([]);
        Alert.alert('Error', 'Failed to load nearby restaurants');
      }
    } catch (error) {
      console.error('Error loading nearby restaurants:', error);
      console.error('Error details:', error.response?.data);
      setRestaurants([]);
      setCategories([]);
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
    let filtered = restaurants;
    
    // Filter by selected category
    if (selectedCategory) {
      filtered = filtered.filter(r => r.cuisine === selectedCategory);
    }
    
    // Enhanced search filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(restaurant => {
        // Search in restaurant name
        if (restaurant.name.toLowerCase().includes(query)) return true;
        
        // Search in cuisine type
        if (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(query)) return true;
        
        // Search in address
        if (restaurant.address && restaurant.address.toLowerCase().includes(query)) return true;
        
        // Search by rating (if user types "4 star" or "4+")
        if (query.includes('star') || query.includes('rating')) {
          const ratingMatch = query.match(/(\d+)/);
          if (ratingMatch) {
            const rating = parseInt(ratingMatch[1]);
            return restaurant.rating >= rating;
          }
        }
        
        // Search by delivery time (if user types "30 min" or "fast")
        if (query.includes('min') || query.includes('fast') || query.includes('quick')) {
          const timeMatch = query.match(/(\d+)/);
          if (timeMatch) {
            const time = parseInt(timeMatch[1]);
            const deliveryTime = parseInt(restaurant.estimatedDeliveryTime) || 45;
            return deliveryTime <= time;
          }
        }
        
        // Search by price range (if user types "cheap" or "budget")
        if (query.includes('cheap') || query.includes('budget') || query.includes('low')) {
          return restaurant.minOrder <= 200;
        }
        
        // Search by delivery fee (if user types "free delivery")
        if (query.includes('free') && query.includes('delivery')) {
          return restaurant.deliveryFee <= 0;
        }
        
        return false;
      });
    }
    
    setFilteredRestaurants(filtered);
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
    
    try {
      const savedAddress = await locationService.saveCurrentLocationAsAddress('Current Location');
      if (savedAddress) {
        console.log('Current location saved as delivery address:', savedAddress);
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

  const renderRestaurant = ({ item, index }) => {
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }}
      >
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
          activeOpacity={item.isOpen ? 0.8 : 1}
          disabled={!item.isOpen}
        >
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.image }} 
              style={styles.restaurantImage}
              onError={(error) => console.log('Restaurant image loading error:', error)}
              defaultSource={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400' }}
            />
            
            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
            />
            
            {/* Status Badge */}
            <View style={[
              styles.statusBadge, 
              { 
                backgroundColor: item.isOpen ? '#4CAF50' : '#F44336'
              }
            ]}>
              <MaterialIcons 
                name={item.isOpen ? "check-circle" : "cancel"} 
                size={14} 
                color="white" 
              />
              <Text style={styles.statusText}>
                {item.isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>

            {/* Rating Badge */}
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>

            {/* Quick Info Overlay */}
            <View style={styles.quickInfoOverlay}>
              <View style={styles.quickInfoItem}>
                <MaterialIcons name="access-time" size={12} color="white" />
                <Text style={styles.quickInfoText}>{item.estimatedDeliveryTime}</Text>
              </View>
              <View style={styles.quickInfoItem}>
                <MaterialIcons name="local-shipping" size={12} color="white" />
                <Text style={styles.quickInfoText}>₹{item.deliveryFee}</Text>
              </View>
            </View>
          </View>

          <View style={styles.restaurantInfo}>
            <View style={styles.restaurantHeader}>
              <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingValue}>{item.rating}</Text>
                <Text style={styles.ratingCount}>({item.totalRatings})</Text>
              </View>
            </View>
            
            <Text style={styles.cuisine} numberOfLines={1}>
              {item.cuisine && item.cuisine.toLowerCase() !== 'mixed' ? item.cuisine : ''}
            </Text>
            
            {/* Location Info */}
            <View style={styles.locationInfo}>
              <View style={styles.locationItem}>
                <MaterialIcons name="location-on" size={16} color="#4CAF50" />
                <Text style={styles.locationText} numberOfLines={1}>{item.distance}</Text>
              </View>
              <Text style={styles.addressText} numberOfLines={1}>
                {item.address}
              </Text>
            </View>

            {/* Restaurant Details */}
            <View style={styles.restaurantDetails}>
              <View style={styles.detailItem}>
                <MaterialIcons name="access-time" size={16} color="#FF9800" />
                <Text style={styles.detailText}>{item.estimatedDeliveryTime}</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialIcons name="attach-money" size={16} color="#4CAF50" />
                <Text style={styles.detailText}>Min ₹{item.minOrder}</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialIcons name="local-shipping" size={16} color="#2196F3" />
                <Text style={styles.detailText}>₹{item.deliveryFee}</Text>
              </View>
            </View>

            {/* Order Now Button */}
            {item.isOpen && (
              <TouchableOpacity 
                style={styles.orderNowButton}
                onPress={() => navigation.navigate('RestaurantMenu', { restaurant: item })}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049', '#388E3C']}
                  style={styles.orderNowGradient}
                >
                  <MaterialIcons name="restaurant-menu" size={18} color="white" />
                  <Text style={styles.orderNowText}>View Menu</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#4CAF50', '#45a049', '#388E3C']}
          style={styles.loadingGradient}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={styles.loadingIconContainer}>
              <MaterialIcons name="restaurant" size={60} color="white" />
            </View>
          </Animated.View>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Discovering amazing restaurants...</Text>
          <Text style={styles.loadingSubtext}>Finding the best food near you</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#4CAF50', '#45a049', '#388E3C']}
        style={styles.header}
      >
        <Animated.View 
          style={[
            styles.greetingContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.greetingIcon,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <MaterialIcons name="restaurant" size={28} color="white" />
          </Animated.View>
          <View style={styles.greetingTexts}>
            <Text style={styles.greetingText}>
              {customerName ? `Hello, ${customerName.split(' ')[0]}! 👋` : 'Welcome! 👋'}
            </Text>
            <Text style={styles.greetingSubtext}>What would you like to eat today?</Text>
          </View>
        </Animated.View>

        {/* Enhanced Search Bar */}
        <Animated.View 
          style={[
            styles.searchContainer,
            searchFocused && styles.searchContainerFocused,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <MaterialIcons name="search" size={24} color="#4CAF50" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, cuisines, or dishes..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <MaterialIcons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="tune" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </Animated.View>

        {/* Location Status */}
        <Animated.View 
          style={[
            styles.locationStatus,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <MaterialIcons 
            name={userLocation ? "location-on" : "location-off"} 
            size={20} 
            color="white" 
          />
          <Text style={styles.locationText}>
            {userLocation ? `Within ${searchRadius}km of your location` : 'Location disabled'}
          </Text>
          <TouchableOpacity onPress={() => setShowLocationModal(true)} style={styles.settingsButton}>
            <MaterialIcons name="settings" size={20} color="white" />
          </TouchableOpacity>
          {userLocation && (
            <TouchableOpacity onPress={handleLocationRefresh} disabled={locationLoading}>
              <MaterialIcons 
                name="refresh" 
                size={20} 
                color="white" 
                style={locationLoading ? styles.rotating : null}
              />
            </TouchableOpacity>
          )}
        </Animated.View>
      </LinearGradient>

      {/* Enhanced Category Chips */}
      <Animated.View 
        style={[
          styles.categoryChipsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item, index }) => (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [
                  { 
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    })
                  }
                ]
              }}
            >
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === item && styles.selectedCategoryChip
                ]}
                onPress={() => setSelectedCategory(item === selectedCategory ? null : item)}
                activeOpacity={0.7}
              >
                <MaterialIcons 
                  name="restaurant-menu" 
                  size={16} 
                  color={selectedCategory === item ? "white" : "#4CAF50"} 
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === item && styles.selectedCategoryChipText
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      </Animated.View>

      {/* Search Results Counter */}
      {searchQuery.trim() && (
        <Animated.View 
          style={[
            styles.searchResultsCounter,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.searchResultsText}>
            Found {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''}
            {searchQuery.trim() && ` for "${searchQuery}"`}
          </Text>
        </Animated.View>
      )}

      {/* Restaurants List */}
      <FlatList
        data={filteredRestaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View 
            style={[
              styles.emptyContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.emptyIconContainer}>
              <MaterialIcons name="restaurant" size={64} color="#ccc" />
            </View>
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
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049', '#388E3C']}
                style={styles.emptyButtonGradient}
              >
                <MaterialIcons name="location-on" size={20} color="white" />
                <Text style={styles.emptyButtonText}>Set Location</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        }
      />

      {/* Floating Action Button */}
      <Animated.View 
        style={[
          styles.fab,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.fabButton}
          onPress={() => setShowLocationModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4CAF50', '#45a049', '#388E3C']}
            style={styles.fabGradient}
          >
            <MaterialIcons name="my-location" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greetingIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  greetingTexts: {
    flex: 1,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  searchContainerFocused: {
    elevation: 8,
    shadowOpacity: 0.2,
    transform: [{ scale: 1.01 }],
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  clearButton: {
    padding: 2,
  },
  filterButton: {
    padding: 2,
    marginLeft: 6,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginTop: 15,
  },
  locationText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
    marginRight: 12,
    fontWeight: '500',
  },
  settingsButton: {
    marginRight: 12,
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
  categoryChipsContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCategoryChip: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  selectedCategoryChipText: {
    color: 'white',
  },
  searchResultsCounter: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchResultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  listContainer: {
    padding: 20,
  },
  restaurantCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  closedRestaurantCard: {
    opacity: 0.7,
  },
  imageContainer: {
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  statusBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  ratingBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  quickInfoOverlay: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    flexDirection: 'row',
    gap: 15,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickInfoText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  restaurantInfo: {
    padding: 15,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  cuisine: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
  },
  locationInfo: {
    marginBottom: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 22,
    fontStyle: 'italic',
  },
  restaurantDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  orderNowButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  orderNowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  orderNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
    lineHeight: 24,
  },
  emptyButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  fabButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});

export default CustomerHomeScreen; 
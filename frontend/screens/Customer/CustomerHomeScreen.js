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
import { BlurView } from 'expo-blur';
import { MotiView, MotiText, ScrollView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { apiService } from '../../services/apiService';
import locationService from '../../services/locationService';
import LocationSettingsModal from '../../components/LocationSettingsModal';
import { getRestaurantImageUrl } from '../../utils/imageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../utils/theme';

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
  const [selectedStory, setSelectedStory] = useState(null);
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
  }, [searchQuery, restaurants, selectedCategory, selectedStory]);

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
    
    // Filter by selected story (special filters)
    if (selectedStory) {
      filtered = filtered.filter(restaurant => {
        const cuisineLower = (restaurant.cuisine || '').toLowerCase();
        const nameLower = (restaurant.name || '').toLowerCase();
        
        switch(selectedStory) {
          case 'Offers':
            // Show restaurants with discounts or special offers
            return restaurant.deliveryFee <= 10 || restaurant.minOrder <= 150;
          case 'Healthy':
            // Show restaurants with healthy cuisines
            return cuisineLower.includes('healthy') || 
                   cuisineLower.includes('salad') || 
                   cuisineLower.includes('vegan') ||
                   cuisineLower.includes('organic') ||
                   nameLower.includes('healthy') ||
                   nameLower.includes('fresh');
          case 'Desserts':
            // Show restaurants with desserts
            return cuisineLower.includes('dessert') || 
                   cuisineLower.includes('bakery') || 
                   cuisineLower.includes('sweet') ||
                   cuisineLower.includes('cake') ||
                   cuisineLower.includes('ice cream') ||
                   nameLower.includes('bakery') ||
                   nameLower.includes('cake');
          case 'Fast Food':
            // Show fast food restaurants
            return cuisineLower.includes('fast food') || 
                   cuisineLower.includes('fastfood') || 
                   cuisineLower.includes('burger') || 
                   cuisineLower.includes('pizza') ||
                   cuisineLower.includes('fries') ||
                   cuisineLower.includes('chicken') ||
                   nameLower.includes('burger') ||
                   nameLower.includes('pizza') ||
                   nameLower.includes('kfc');
          case 'Premium':
            // Show premium/high-rated restaurants
            return restaurant.rating >= 4 || restaurant.totalRatings >= 100;
          default:
            return true;
        }
      });
    }
    
    // Filter by selected category (cuisine)
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

  const stories = [
    { id: 1, name: 'Offers', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=100&q=80' },
    { id: 2, name: 'Healthy', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=100&q=80' },
    { id: 3, name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&q=80' },
    { id: 4, name: 'Fast Food', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=80' },
    { id: 5, name: 'Premium', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&q=80' },
  ];

  const renderStory = ({ item }) => (
    <TouchableOpacity 
      style={{ alignItems: 'center', marginRight: 15, marginTop: 15 }}
      onPress={() => {
        // Toggle story selection
        if (selectedStory === item.name) {
          setSelectedStory(null);
          setSelectedCategory(null);
        } else {
          setSelectedStory(item.name);
          setSelectedCategory(null); // Clear category filter when selecting story
        }
      }}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={selectedStory === item.name 
          ? ['#FF5722', '#FF8C42'] 
          : [theme.colors.primary, theme.colors.secondary]
        }
        style={{ 
          width: 70, 
          height: 70, 
          borderRadius: 35, 
          padding: 3, 
          justifyContent: 'center', 
          alignItems: 'center',
          borderWidth: selectedStory === item.name ? 3 : 0,
          borderColor: selectedStory === item.name ? 'white' : 'transparent',
          elevation: selectedStory === item.name ? 8 : 2,
          shadowColor: selectedStory === item.name ? '#FF5722' : '#000',
          shadowOffset: { width: 0, height: selectedStory === item.name ? 6 : 2 },
          shadowOpacity: selectedStory === item.name ? 0.3 : 0.1,
          shadowRadius: selectedStory === item.name ? 8 : 3,
        }}
      >
        <Image 
          source={{ uri: item.image }} 
          style={{ 
            width: 60, 
            height: 60, 
            borderRadius: 30, 
            borderWidth: 2, 
            borderColor: 'white' 
          }} 
        />
      </LinearGradient>
      <Text style={{ 
        color: selectedStory === item.name ? '#FF6B35' : theme.colors.textSecondary, 
        fontSize: 13, 
        marginTop: 8, 
        fontWeight: selectedStory === item.name ? '700' : '600'
      }}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

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
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.l,
              marginBottom: theme.spacing.m,
              overflow: 'hidden',
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
            },
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
            navigation.navigate('RestaurantMenu', { restaurant: item });
          }}
          activeOpacity={item.isOpen ? 0.8 : 1}
          disabled={!item.isOpen}
        >
          <View style={{ position: 'relative' }}>
            <Image 
              source={{ uri: item.image }} 
              style={{ width: '100%', height: 180, resizeMode: 'cover' }}
              defaultSource={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400' }}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.35)']}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }}
            />
            
            <BlurView intensity={20} tint="light" style={{
              position: 'absolute',
              top: 15,
              right: 15,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: item.isOpen ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)',
              borderWidth: 1,
              borderColor: item.isOpen ? theme.colors.success : theme.colors.error,
              overflow: 'hidden'
            }}>
              <MaterialIcons name={item.isOpen ? "check-circle" : "cancel"} size={14} color={item.isOpen ? theme.colors.success : theme.colors.error} />
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: item.isOpen ? theme.colors.success : theme.colors.error, marginLeft: 4 }}>
                {item.isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </BlurView>

            <BlurView intensity={20} tint="light" style={{
              position: 'absolute',
              top: 15,
              left: 15,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 15,
              overflow: 'hidden',
              backgroundColor: 'rgba(255,255,255,0.85)'
            }}>
              <MaterialIcons name="star" size={16} color={theme.colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.colors.text, marginLeft: 4 }}>{item.rating}</Text>
            </BlurView>
          </View>

          <View style={{ padding: theme.spacing.m }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text, flex: 1 }} numberOfLines={1}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>({item.totalRatings}+ ratings)</Text>
            </View>
            
            <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600', marginBottom: 12 }} numberOfLines={1}>
              {item.cuisine && item.cuisine.toLowerCase() !== 'mixed' ? item.cuisine : 'Premium Dining'}
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="schedule" size={14} color={theme.colors.textSecondary} />
                <Text style={{ marginLeft: 6, fontSize: 13, color: theme.colors.textSecondary }}>{item.estimatedDeliveryTime}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="directions-bike" size={14} color={theme.colors.textSecondary} />
                <Text style={{ marginLeft: 6, fontSize: 13, color: theme.colors.textSecondary }}>{item.distance}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="account-balance-wallet" size={14} color={theme.colors.textSecondary} />
                <Text style={{ marginLeft: 6, fontSize: 13, color: theme.colors.textSecondary }}>₹{item.deliveryFee}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Skeleton colorMode="dark" radius="round" height={60} width={60} />
            <View style={{ marginLeft: 15, flex: 1, gap: 10 }}>
              <Skeleton colorMode="dark" width="60%" height={25} />
              <Skeleton colorMode="dark" width="40%" height={15} />
            </View>
          </View>
          <View style={{ marginHorizontal: 20 }}>
            <Skeleton colorMode="dark" width="100%" height={50} radius={16} />
          </View>
        </View>
        
        <View style={{ padding: 20, gap: 20 }}>
          {[1, 2, 3].map((key) => (
            <MotiView
              key={key}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: key * 200 }}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                overflow: 'hidden',
                height: 280
              }}
            >
              <Skeleton colorMode="dark" width="100%" height={180} />
              <View style={{ padding: 15, gap: 10 }}>
                <Skeleton colorMode="dark" width="80%" height={24} />
                <Skeleton colorMode="dark" width="50%" height={16} />
              </View>
            </MotiView>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#FF5722" translucent={false} />
      
      {/* Header with Premium Dark Gradient Background */}
      <LinearGradient
        colors={['#FF5722', '#FF6B35', '#FF8C42']}
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
            <MaterialIcons name="restaurant" size={32} color="white" />
          </Animated.View>
          <View style={styles.greetingTexts}>
            <Text style={styles.greetingText} numberOfLines={1} ellipsizeMode="tail">
              {customerName ? `Hello, ${customerName.split(' ')[0]}! 👋` : 'Welcome! 👋'}
            </Text>
            <Text style={styles.greetingSubtext} numberOfLines={1} ellipsizeMode="tail">What would you like to eat today?</Text>
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
          <MaterialIcons name="search" size={20} color="#4CAF50" style={styles.searchIcon} />
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
              <MaterialIcons name="close" size={18} color="#999" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="tune" size={18} color="#4CAF50" />
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
            size={16} 
            color="white" 
          />
          <Text style={styles.locationText}>
            {userLocation ? `Within ${searchRadius}km of your location` : 'Location disabled'}
          </Text>
          {userLocation && (
            <TouchableOpacity onPress={handleLocationRefresh} disabled={locationLoading}>
              <MaterialIcons 
                name="refresh" 
                size={16} 
                color="white" 
                style={locationLoading ? styles.rotating : null}
              />
            </TouchableOpacity>
          )}
        </Animated.View>
      </LinearGradient>

      {/* Enhanced Category Chips with Clear Filter */}
      <Animated.View 
        style={[
          styles.categoryChipsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {(selectedCategory || selectedStory) && (
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={() => {
              setSelectedCategory(null);
              setSelectedStory(null);
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={16} color="white" />
            <Text style={styles.clearFilterText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
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
                onPress={() => {
                  // Toggle category selection
                  if (selectedCategory === item) {
                    setSelectedCategory(null);
                  } else {
                    setSelectedCategory(item);
                    setSelectedStory(null); // Clear story filter when selecting category
                  }
                }}
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

      {/* Search Results Counter + Active Filter Display */}
      {(searchQuery.trim() || selectedCategory || selectedStory) && (
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
            {selectedStory && (
              <Text style={styles.activeFilterTag}>📌 {selectedStory} • </Text>
            )}
            {selectedCategory && (
              <Text style={styles.activeFilterTag}>🍽️ {selectedCategory} • </Text>
            )}
            Found {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''}
            {searchQuery.trim() && ` matching "${searchQuery}"`}
          </Text>
        </Animated.View>
      )}

      {/* Stories / Trending Horizontal Bar */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingBottom: 10 }}>
        <FlatList
          data={stories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStory}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />
      </Animated.View>

      {/* Browse by Food Button */}
      <Animated.View 
        style={[
          styles.browseFoodButtonContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.browseFoodButton}
          onPress={() => navigation.navigate('FoodBrowse')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#1565C0', '#2196F3', '#1976D2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.browseFoodGradient}
          >
            <MaterialIcons name="restaurant-menu" size={20} color="white" />
            <Text style={styles.browseFoodText}>Browse Foods</Text>
            <MaterialIcons name="arrow-forward" size={16} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

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
    paddingBottom: 28,
    elevation: 16,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greetingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    flexShrink: 0,
  },
  greetingTexts: {
    flex: 1,
    paddingTop: 2,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  greetingSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 14,
  },
  searchContainerFocused: {
    elevation: 12,
    shadowOpacity: 0.25,
    backgroundColor: '#ffffff',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  locationText: {
    fontSize: 13,
    color: 'white',
    marginLeft: 6,
    marginRight: 8,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
  categoryChipsContainer: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 0,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  selectedCategoryChip: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    elevation: 6,
    shadowOpacity: 0.2,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  selectedCategoryChipText: {
    color: 'white',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginLeft: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
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
  activeFilterTag: {
    color: '#FF6B35',
    fontWeight: '700',
    fontSize: 13,
  },
  listContainer: {
    padding: 16,
  },
  restaurantCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
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
    height: 150,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
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
    padding: 12,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
  ratingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 3,
  },
  ratingCount: {
    fontSize: 11,
    color: '#666',
    marginLeft: 3,
  },
  cuisine: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 6,
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
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 20,
    fontStyle: 'italic',
  },
  restaurantDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  orderNowText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  browseFoodButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  browseFoodButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  browseFoodGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  browseFoodText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
});

export default CustomerHomeScreen; 
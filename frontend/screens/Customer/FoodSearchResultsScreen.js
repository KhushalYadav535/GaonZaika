import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';
import foodService from '../../services/foodService';

const FoodSearchResultsScreen = ({ route, navigation }) => {
  const { dishName, category, image } = route.params;
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('rating'); // rating, delivery, price

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchRestaurantsByDish();
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchRestaurantsByDish = async () => {
    try {
      setLoading(true);
      const response = await foodService.getRestaurantsByDish(dishName);
      
      if (response.success) {
        const sorted = sortRestaurants(response.data, 'rating');
        setRestaurants(sorted);
        setFilteredRestaurants(sorted);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      Alert.alert('Error', 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const sortRestaurants = (data, sortType) => {
    const sorted = [...data];
    
    switch (sortType) {
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'delivery':
        return sorted.sort((a, b) => a.deliveryTime - b.deliveryTime);
      case 'price':
        return sorted.sort((a, b) => a.minOrder - b.minOrder);
      default:
        return sorted;
    }
  };

  const handleSort = (type) => {
    setSortBy(type);
    const sorted = sortRestaurants(restaurants, type);
    setFilteredRestaurants(sorted);
  };

  const renderRestaurantCard = ({ item }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() =>
        navigation.navigate('RestaurantMenu', {
          restaurantId: item._id,
          restaurantName: item.name,
        })
      }
      activeOpacity={0.7}
    >
      {/* Restaurant Image with Gradient Overlay */}
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.restaurantImage} />
        ) : (
          <LinearGradient
            colors={[theme.colors.primary, '#FF8C42']}
            style={styles.placeholderImage}
          >
            <MaterialIcons name="restaurant" size={50} color="white" />
          </LinearGradient>
        )}
        
        {/* Offer Badge */}
        {item.offer && (
          <LinearGradient
            colors={['#FF5252', '#FF6B6B']}
            style={styles.offerBadge}
          >
            <Text style={styles.offerText}>{item.offer}% OFF</Text>
          </LinearGradient>
        )}

        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <MaterialIcons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>

      {/* Restaurant Info */}
      <View style={styles.infoContainer}>
        {/* Name and Cuisine */}
        <View>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cuisine} numberOfLines={1}>
            {item.cuisine}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Delivery Time */}
          <View style={styles.statItem}>
            <MaterialIcons name="schedule" size={14} color="#666" />
            <Text style={styles.statText}>
              {item.deliveryTime || 30} min
            </Text>
          </View>

          {/* Delivery Fee */}
          <View style={styles.statItem}>
            <MaterialIcons name="two-wheeler" size={14} color="#666" />
            <Text style={styles.statText}>
              ₹{item.deliveryFee || 20}
            </Text>
          </View>

          {/* Min Order */}
          <View style={styles.statItem}>
            <MaterialIcons name="shopping-bag" size={14} color="#666" />
            <Text style={styles.statText}>
              ₹{item.minOrder || 150}
            </Text>
          </View>
        </View>

        {/* View Menu Button */}
        <LinearGradient
          colors={[theme.colors.primary, '#FF6B35']}
          style={styles.viewMenuButton}
        >
          <Text style={styles.buttonText}>View Menu</Text>
          <MaterialIcons name="arrow-forward" size={14} color="white" />
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  const renderSortButton = (label, value) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        sortBy === value && styles.activeSortButton,
      ]}
      onPress={() => handleSort(value)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.sortButtonText,
          sortBy === value && styles.activeSortButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Dish Info */}
      <LinearGradient
        colors={[theme.colors.primary, '#FF6B35', '#FF8C42']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.dishHeader}>
          <Text style={styles.headerTitle}>{dishName}</Text>
          <Text style={styles.headerSubtitle}>
            {category} • {restaurants.length} restaurants available
          </Text>
        </View>

        {image && (
          <Image source={{ uri: image }} style={styles.dishImage} />
        )}
      </LinearGradient>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        {renderSortButton('⭐ Ratings', 'rating')}
        {renderSortButton('🚗 Delivery', 'delivery')}
        {renderSortButton('💰 Price', 'price')}
      </View>

      {/* Restaurants List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Finding restaurants...</Text>
        </View>
      ) : filteredRestaurants.length > 0 ? (
        <Animated.View
          style={[
            styles.listContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <FlatList
            data={filteredRestaurants}
            keyExtractor={(item) => item._id}
            renderItem={renderRestaurantCard}
            scrollEventThrottle={16}
            contentContainerStyle={styles.listContent}
          />
        </Animated.View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={60} color="#ddd" />
          <Text style={styles.emptyText}>No restaurants found</Text>
          <Text style={styles.emptySubtext}>
            Try searching for a different dish
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishHeader: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  dishImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  activeSortButton: {
    backgroundColor: theme.colors.primary,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeSortButtonText: {
    color: 'white',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  restaurantCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  offerText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  infoContainer: {
    padding: 12,
    gap: 8,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  cuisine: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  viewMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default FoodSearchResultsScreen;

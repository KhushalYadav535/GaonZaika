import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';
import foodService from '../../services/foodService';

const FoodBrowseScreen = ({ navigation }) => {
  const [foodCategories, setFoodCategories] = useState([]);
  const [popularDishes, setPopularDishes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredDishes, setFilteredDishes] = useState([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchFoodCategories();
    fetchPopularDishes();
    
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

  const fetchFoodCategories = async () => {
    try {
      const response = await foodService.getCategories();
      if (response.success) {
        setFoodCategories(['All', ...response.data]);
      }
    } catch (error) {
      console.error('Error fetching food categories:', error);
      // Fallback categories
      setFoodCategories(['All', 'Starters', 'Main Course', 'Desserts', 'Beverages', 'Breads']);
    }
  };

  const fetchPopularDishes = async () => {
    try {
      setLoading(true);
      const response = await foodService.getPopularFoods();
      if (response.success) {
        setPopularDishes(response.data);
        setFilteredDishes(response.data);
      }
    } catch (error) {
      console.error('Error fetching popular dishes:', error);
      setPopularDishes([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDishes = () => {
    let filtered = popularDishes;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(dish => dish.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(dish =>
        dish.name.toLowerCase().includes(query) ||
        (dish.description && dish.description.toLowerCase().includes(query))
      );
    }

    setFilteredDishes(filtered);
  };

  useEffect(() => {
    filterDishes();
  }, [selectedCategory, searchQuery, popularDishes]);

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodCard}
      onPress={() =>
        navigation.navigate('FoodSearchResults', {
          dishName: item.name,
          category: item.category,
          image: item.image,
        })
      }
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[theme.colors.primary, '#FF8C42']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.foodImageWrapper}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.foodImage} />
        ) : (
          <MaterialIcons name="fastfood" size={50} color="white" />
        )}
      </LinearGradient>

      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.foodCategory}>{item.category}</Text>
        <View style={styles.foodStats}>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>₹{item.minPrice || 100}</Text>
          </View>
          <View style={styles.restaurantCount}>
            <MaterialIcons name="store" size={14} color="#FF5722" />
            <Text style={styles.countText}>{item.restaurantCount || 5}+ restaurants</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item && styles.selectedCategoryChip,
      ]}
      onPress={() => setSelectedCategory(item)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === item && styles.selectedCategoryChipText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.primary, '#FF6B35', '#FF8C42']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>🍽️ Browse Foods</Text>
            <Text style={styles.headerSubtitle}>Discover dishes from top restaurants</Text>
          </View>
          <MaterialIcons name="restaurant-menu" size={40} color="white" />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dishes..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color="#FF5722" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Category Chips */}
      <Animated.View
        style={[
          styles.categoryContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <FlatList
          data={foodCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={renderCategoryChip}
          scrollEventThrottle={16}
        />
      </Animated.View>

      {/* Results Counter */}
      {selectedCategory !== 'All' && (
        <Animated.View
          style={[
            styles.resultsCounter,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.resultsText}>
            📌 {selectedCategory} • Found {filteredDishes.length} dish
            {filteredDishes.length !== 1 ? 'es' : ''}
          </Text>
        </Animated.View>
      )}

      {/* Food Items Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading delicious foods...</Text>
        </View>
      ) : filteredDishes.length > 0 ? (
        <Animated.View
          style={[
            styles.gridContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <FlatList
            data={filteredDishes}
            numColumns={2}
            keyExtractor={(item) => item._id}
            renderItem={renderFoodItem}
            columnWrapperStyle={styles.columnWrapper}
            scrollEventThrottle={16}
          />
        </Animated.View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="no-food" size={60} color="#ddd" />
          <Text style={styles.emptyText}>No dishes found</Text>
          <Text style={styles.emptySubtext}>Try searching for something else</Text>
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  categoryContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
  },
  selectedCategoryChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  selectedCategoryChipText: {
    color: 'white',
  },
  resultsCounter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  resultsText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '600',
  },
  gridContainer: {
    flex: 1,
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  foodCard: {
    flex: 0.48,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  foodImageWrapper: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  foodInfo: {
    padding: 10,
  },
  foodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  foodCategory: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
    fontWeight: '500',
  },
  foodStats: {
    gap: 6,
  },
  priceTag: {
    backgroundColor: '#FFE5D1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  restaurantCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
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

export default FoodBrowseScreen;

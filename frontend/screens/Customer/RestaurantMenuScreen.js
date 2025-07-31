import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';
import { getMenuItemImageUrl } from '../../utils/imageUtils';



const RestaurantMenuScreen = ({ route, navigation }) => {
  const { restaurant } = route.params;
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('RestaurantMenuScreen mounted with restaurant:', restaurant);
    loadMenu();
    loadCart();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      console.log('Loading menu for restaurant:', restaurant);
      console.log('Restaurant ID:', restaurant.id);
      
      if (!restaurant.id) {
        console.error('No restaurant ID provided');
        Alert.alert('Error', 'Restaurant ID is missing');
        setMenuItems([]);
        return;
      }
      
      // Fetch menu from backend API
      const response = await apiService.getRestaurantMenu(restaurant.id);
      console.log('Menu API response:', response);
      console.log('Menu API response data:', response.data);
      
      if (response.data && response.data.success) {
        // Transform backend menu data to match frontend format
        const transformedMenu = response.data.data.menu.map((item, index) => ({
          id: item._id || `temp_${index}`, // Use _id if available, otherwise generate temp ID
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: getMenuItemImageUrl(item.image),
          isVeg: item.isVeg,
          isAvailable: item.isAvailable,
        }));
        
        console.log('Transformed menu items:', transformedMenu);
        setMenuItems(transformedMenu);
      } else {
        console.log('API response indicates failure:', response.data);
        setMenuItems([]);
        Alert.alert('Error', 'Failed to load menu');
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      setMenuItems([]);
      Alert.alert('Error', `Failed to load menu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem(`cart_${restaurant.id}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async (newCart) => {
    try {
      await AsyncStorage.setItem(`cart_${restaurant.id}`, JSON.stringify(newCart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    let newCart;

    if (existingItem) {
      newCart = cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      newCart = [...cart, { ...item, quantity: 1 }];
    }

    setCart(newCart);
    saveCart(newCart);
  };

  const removeFromCart = (itemId) => {
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    let newCart;

    if (existingItem && existingItem.quantity > 1) {
      newCart = cart.map(cartItem =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      );
    } else {
      newCart = cart.filter(cartItem => cartItem.id !== itemId);
    }

    setCart(newCart);
    saveCart(newCart);
  };

  const getCartItemQuantity = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const isMinimumOrderMet = () => {
    if (!restaurant?.minOrder) return true;
    return getTotalAmount() >= restaurant.minOrder;
  };

  const getShortfallAmount = () => {
    if (!restaurant?.minOrder) return 0;
    return Math.max(0, restaurant.minOrder - getTotalAmount());
  };

  const handleViewCart = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add some items to your cart first.');
      return;
    }
    navigation.navigate('DeliveryInfo', { restaurant, cart });
  };

  const renderMenuItem = ({ item }) => {
    const quantity = getCartItemQuantity(item.id);

    return (
      <View style={styles.menuItem}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.menuItemImage}
          onError={(error) => console.log('Image loading error:', error)}
          defaultSource={{ uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400' }}
        />
        <View style={styles.menuItemInfo}>
          <View style={styles.menuItemHeader}>
            <Text style={styles.menuItemName}>{item.name}</Text>
            <View style={[styles.vegBadge, { backgroundColor: item.isVeg ? '#4CAF50' : '#F44336' }]}>
              <Text style={styles.vegText}>{item.isVeg ? 'VEG' : 'NON-VEG'}</Text>
            </View>
          </View>
          <Text style={styles.menuItemDescription}>{item.description}</Text>
          <View style={styles.menuItemFooter}>
            <Text style={styles.menuItemPrice}>₹{item.price}</Text>
            <View style={styles.quantityContainer}>
              {quantity > 0 && (
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => removeFromCart(item.id)}
                >
                  <MaterialIcons name="remove" size={20} color="#4CAF50" />
                </TouchableOpacity>
              )}
              {quantity > 0 && (
                <Text style={styles.quantityText}>{quantity}</Text>
              )}
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => addToCart(item)}
              >
                <MaterialIcons name="add" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading menu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.restaurantName}>{restaurant.name}</Text>
        <Text style={styles.restaurantCuisine}>{restaurant.cuisine}</Text>
      </View>

      <FlatList
        data={menuItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.menuList}
        showsVerticalScrollIndicator={false}
      />

      {cart.length > 0 && (
        <View style={styles.cartButton}>
          <TouchableOpacity
            style={styles.viewCartButton}
            onPress={handleViewCart}
            activeOpacity={0.8}
          >
            <View style={styles.cartInfo}>
              <Text style={styles.cartItemsText}>{getTotalItems()} items</Text>
              <Text style={styles.cartTotalText}>₹{getTotalAmount()}</Text>
              {restaurant?.minOrder && !isMinimumOrderMet() && (
                <Text style={styles.minOrderText}>
                  Add ₹{getShortfallAmount()} more for minimum order
                </Text>
              )}
            </View>
            <Text style={styles.viewCartText}>View Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );n
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
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuList: {
    padding: 16,
  },
  menuItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItemImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  menuItemInfo: {
    padding: 16,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  vegBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  vegText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  cartButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  viewCartButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cartInfo: {
    flex: 1,
  },
  cartItemsText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  cartTotalText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewCartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  minOrderText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
});

export default RestaurantMenuScreen; 
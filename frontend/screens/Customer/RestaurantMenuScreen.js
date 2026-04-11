import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';
import { getMenuItemImageUrl } from '../../utils/imageUtils';
import { theme } from '../../utils/theme';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const { height, width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 300;
const HEADER_MIN_HEIGHT = 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;const RestaurantMenuScreen = ({ route, navigation }) => {
  const { restaurant, restaurantId, restaurantName } = route.params;
  const [restaurantData, setRestaurantData] = useState(restaurant || null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Parallax animation state
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('RestaurantMenuScreen mounted with params:', { restaurant, restaurantId, restaurantName });
    loadMenu();
    loadCart();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      
      // Use restaurantId from params if restaurant object not provided
      const rId = restaurant?.id || restaurantId;
      
      console.log('Loading menu for restaurant ID:', rId);
      
      if (!rId) {
        console.error('No restaurant ID provided');
        Alert.alert('Error', 'Restaurant ID is missing');
        setMenuItems([]);
        return;
      }
      
      // Fetch menu from backend API
      const response = await apiService.getRestaurantMenu(rId);
      console.log('Menu API response:', response);
      console.log('Menu API response data:', response.data);
      
      if (response.data && response.data.success) {
        // Set restaurant data if not already set
        if (!restaurantData && response.data.data.restaurant) {
          setRestaurantData(response.data.data.restaurant);
        }
        
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
      const rId = restaurant?.id || restaurantId;
      if (!rId) return; // Skip if no ID available yet
      
      const savedCart = await AsyncStorage.getItem(`cart_${rId}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async (newCart) => {
    try {
      const rId = restaurant?.id || restaurantId;
      if (!rId) return; // Skip if no ID available yet
      
      await AsyncStorage.setItem(`cart_${rId}`, JSON.stringify(newCart));
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
    if (!restaurantData?.minOrder) return true;
    return getTotalAmount() >= restaurantData.minOrder;
  };

  const getShortfallAmount = () => {
    if (!restaurantData?.minOrder) return 0;
    return Math.max(0, restaurantData.minOrder - getTotalAmount());
  };

  const handleViewCart = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add some items to your cart first.');
      return;
    }
    
    // Pass restaurant data (use restaurantData or create minimal object)
    const restaurantToPass = restaurantData || {
      _id: restaurantId,
      id: restaurantId,
      name: restaurantName,
    };
    
    navigation.navigate('DeliveryInfo', { restaurant: restaurantToPass, cart });
  };

  const renderMenuItem = ({ item }) => {
    const quantity = getCartItemQuantity(item.id);

    return (
      <View style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        marginBottom: 16,
        marginHorizontal: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }}>
        <Image 
          source={{ uri: item.image }} 
          style={{ width: '100%', height: 160, resizeMode: 'cover' }}
          defaultSource={{ uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400' }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={{ position: 'absolute', top: 60, left: 0, right: 0, height: 100 }}
        />
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text, flex: 1 }}>{item.name}</Text>
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: item.isVeg ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', borderWidth: 1, borderColor: item.isVeg ? theme.colors.success : theme.colors.error }}>
              <Text style={{ color: item.isVeg ? theme.colors.success : theme.colors.error, fontSize: 10, fontWeight: 'bold' }}>
                {item.isVeg ? 'VEG' : 'NON-VEG'}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16 }} numberOfLines={2}>{item.description}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.primary }}>₹{item.price}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceVariant, borderRadius: 20, padding: 4 }}>
              {quantity > 0 ? (
                <>
                  <TouchableOpacity
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.error, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => removeFromCart(item.id)}
                  >
                    <MaterialIcons name="remove" size={20} color="white" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text, marginHorizontal: 12, minWidth: 20, textAlign: 'center' }}>{quantity}</Text>
                  <TouchableOpacity
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.success, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => addToCart(item)}
                  >
                    <MaterialIcons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: theme.colors.primary }}
                  onPress={() => addToCart(item)}
                >
                  <Text style={{ color: theme.colors.background, fontWeight: 'bold', fontSize: 13 }}>ADD</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.text }}>Loading premium menu...</Text>
      </View>
    );
  }

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT, paddingBottom: 100 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        showsVerticalScrollIndicator={false}
      >
        <FlatList
          data={menuItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </Animated.ScrollView>

      {/* Parallax Header */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
        height: HEADER_MAX_HEIGHT,
        transform: [{ translateY: headerTranslateY }]
      }}>
        <Animated.Image
          source={{ uri: restaurantData?.image || 'https://via.placeholder.com/400' }}
          style={{ width: '100%', height: HEADER_MAX_HEIGHT, resizeMode: 'cover', opacity: imageOpacity }}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.5)']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.colors.text }}>{restaurantData?.name || restaurantName || 'Restaurant'}</Text>
          <Text style={{ fontSize: 16, color: theme.colors.primary, fontWeight: '600', marginTop: 4 }}>{restaurantData?.cuisine || 'Cuisine'}</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <BlurView intensity={20} tint="light" style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.8)' }}>
              <MaterialIcons name="star" size={16} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.text, fontWeight: 'bold', marginLeft: 4 }}>{restaurantData?.rating || 0}</Text>
            </BlurView>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.textSecondary, marginHorizontal: 12 }} />
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{restaurantData?.estimatedDeliveryTime || '45 min'}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Sticky Top Bar (shows when scrolled) */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_MIN_HEIGHT,
        paddingTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Moti Animated Cart Button */}
      {cart.length > 0 && (
        <MotiView
          from={{ translateY: 100, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={{
            position: 'absolute',
            bottom: 30,
            left: 20,
            right: 20,
          }}
        >
          <TouchableOpacity
            style={{
              padding: 16,
              borderRadius: theme.borderRadius.xl,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              elevation: 10,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
            }}
            onPress={handleViewCart}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[theme.colors.primary, '#B38E22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: theme.borderRadius.xl,
              }}
            />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                <Text style={{ color: theme.colors.background, fontWeight: 'bold', fontSize: 16 }}>{getTotalItems()} ITEM{getTotalItems() > 1 ? 'S' : ''}</Text>
              </View>
              <Text style={{ color: theme.colors.background, fontSize: 18, fontWeight: 'bold', marginLeft: 16 }}>
                ₹{getTotalAmount()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: theme.colors.background, fontSize: 16, fontWeight: 'bold', marginRight: 8 }}>Order</Text>
              <MaterialIcons name="arrow-forward-ios" size={16} color={theme.colors.background} />
            </View>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
};

export default RestaurantMenuScreen; 
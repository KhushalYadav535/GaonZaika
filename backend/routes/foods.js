const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');

/**
 * DEBUG ENDPOINT: GET /api/foods/debug
 * Check database structure and available dishes
 */
router.get('/debug', async (req, res) => {
  try {
    const restaurants = await Restaurant.find().select('name menu').limit(3);
    
    console.log('\n📊 DEBUG: First 3 Restaurants:');
    restaurants.forEach(r => {
      console.log(`  Restaurant: ${r.name}`);
      console.log(`  menu count: ${r.menu ? r.menu.length : 0}`);
      if (r.menu && r.menu.length > 0) {
        console.log(`  Sample item:`, r.menu[0]);
      }
    });

    const allRestaurants = await Restaurant.countDocuments();
    const restaurantsWithItems = await Restaurant.countDocuments({ 'menu.0': { $exists: true } });

    res.json({
      success: true,
      debug: {
        totalRestaurants: allRestaurants,
        restaurantsWithMenuItems: restaurantsWithItems,
        sampleData: restaurants,
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/foods/categories
 * Get all unique food categories from all restaurants
 */
router.get('/categories', async (req, res) => {
  try {
    // Method 1: Try aggregation with proper error handling
    let categoryList = [];
    
    try {
      const categories = await Restaurant.aggregate([
        {
          $match: { menu: { $exists: true, $ne: [] } } // Only restaurants with menu items
        },
        {
          $unwind: '$menu',
        },
        {
          $group: {
            _id: '$menu.category',
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      categoryList = categories.map(cat => cat._id).filter(Boolean);
    } catch (aggError) {
      console.warn('⚠️ Aggregation failed, trying alternative method:', aggError.message);
      
      // Fallback: Get categories by scanning restaurants directly
      const restaurants = await Restaurant.find().select('menu').lean();
      const categorySet = new Set();
      
      restaurants.forEach(r => {
        if (Array.isArray(r.menu)) {
          r.menu.forEach(item => {
            if (item.category) categorySet.add(item.category);
          });
        }
      });
      
      categoryList = Array.from(categorySet).sort();
    }

    console.log(`📂 Found ${categoryList.length} food categories: ${categoryList.join(', ')}`);

    res.json({
      success: true,
      data: categoryList,
    });
  } catch (error) {
    console.error('❌ Error fetching food categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food categories',
      error: error.message,
    });
  }
});

/**
 * GET /api/foods/popular
 * Get popular food items from all restaurants
 */
router.get('/popular', async (req, res) => {
  try {
    // Get all restaurants with their menu items
    const restaurants = await Restaurant.find().select('name menu').lean();

    console.log(`\n🔍 Checking ${restaurants.length} restaurants for dishes...`);

    // Map to track unique dishes
    const dishMap = new Map();

    restaurants.forEach((restaurant, idx) => {
      // Handle both direct menu and potentially nested structures
      const menuItems = restaurant.menu || [];
      
      if (!Array.isArray(menuItems)) {
        console.warn(`⚠️ Restaurant "${restaurant.name}" menu not an array:`, typeof menuItems);
        return;
      }

      console.log(`  [${idx + 1}] ${restaurant.name}: ${menuItems.length} items`);

      menuItems.forEach(item => {
        if (!item || !item.name) return; // Skip invalid items
        
        const dishKey = item.name.toLowerCase();

        if (!dishMap.has(dishKey)) {
          dishMap.set(dishKey, {
            _id: item._id || Math.random().toString(),
            name: item.name,
            description: item.description || '',
            category: item.category || 'Other',
            image: item.image?.url || null,
            minPrice: item.price || 0,
            restaurantCount: 1,
            restaurants: [
              {
                restaurantId: restaurant._id,
                name: restaurant.name,
                price: item.price,
              },
            ],
          });
        } else {
          const existing = dishMap.get(dishKey);
          existing.restaurantCount += 1;
          existing.minPrice = Math.min(existing.minPrice, item.price || 0);
          existing.restaurants.push({
            restaurantId: restaurant._id,
            name: restaurant.name,
            price: item.price,
          });
        }
      });
    });

    const dishesList = Array.from(dishMap.values())
      .sort((a, b) => b.restaurantCount - a.restaurantCount)
      .slice(0, 100);

    console.log(`✅ Found ${dishesList.length} unique dishes from ${restaurants.length} restaurants\n`);

    res.json({
      success: true,
      data: dishesList,
      meta: {
        totalDishes: dishesList.length,
        totalRestaurants: restaurants.length,
      }
    });
  } catch (error) {
    console.error('❌ Error fetching popular dishes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular dishes',
      error: error.message,
    });
  }
});

/**
 * GET /api/foods/restaurants/:dishName
 * Get all restaurants serving a specific dish
 */
router.get('/restaurants/:dishName', async (req, res) => {
  try {
    const { dishName } = req.params;
    const searchQuery = dishName.toLowerCase();

    console.log(`🔍 Searching for dish: "${dishName}"`);

    // Find all restaurants that have menu items matching the dish name (all restaurants, not just active)
    const restaurants = await Restaurant.find({
      'menu.name': { $regex: searchQuery, $options: 'i' },
    })
      .select('_id name cuisine rating totalRatings deliveryTime deliveryFee minOrder image offer address')
      .lean();

    // Filter and enhance restaurant data
    const restaurantList = restaurants.map(restaurant => ({
      _id: restaurant._id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating || 0,
      totalRatings: restaurant.totalRatings || 0,
      deliveryTime: restaurant.deliveryTime?.estimated || 30,
      deliveryFee: restaurant.deliveryFee || 20,
      minOrder: restaurant.minOrder || 150,
      image: restaurant.image || null,
      offer: restaurant.offer || null,
      address: restaurant.address?.fullAddress || 'Address not available',
    }));

    // Sort by rating
    restaurantList.sort((a, b) => b.rating - a.rating);

    console.log(`✅ Found ${restaurantList.length} restaurants serving "${dishName}"`);

    res.json({
      success: true,
      data: restaurantList,
      count: restaurantList.length,
    });
  } catch (error) {
    console.error('Error fetching restaurants by dish:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants',
      error: error.message,
    });
  }
});

/**
 * GET /api/foods/search
 * Search for foods and restaurants
 * Query params: q (search query), category (optional)
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const searchRegex = { $regex: q, $options: 'i' };

    // Search in menu items (all restaurants, not just active)
    let query = {
      menu: {
        $elemMatch: {
          name: searchRegex,
        },
      },
    };

    if (category) {
      query.menu.$elemMatch.category = category;
    }

    const restaurants = await Restaurant.find(query)
      .select('_id name cuisine rating totalRatings deliveryTime deliveryFee minOrder image offer')
      .lean();

    // Also search in restaurant names
    const restaurantsByName = await Restaurant.find({
      name: searchRegex,
    })
      .select('_id name cuisine rating totalRatings deliveryTime deliveryFee minOrder image offer')
      .lean();

    // Combine and deduplicate
    const combinedMap = new Map();
    [...restaurants, ...restaurantsByName].forEach(r => {
      if (!combinedMap.has(r._id.toString())) {
        combinedMap.set(r._id.toString(), {
          _id: r._id,
          name: r.name,
          cuisine: r.cuisine,
          rating: r.rating || 0,
          totalRatings: r.totalRatings || 0,
          deliveryTime: r.deliveryTime?.estimated || 30,
          deliveryFee: r.deliveryFee || 20,
          minOrder: r.minOrder || 150,
          image: r.image || null,
          offer: r.offer || null,
        });
      }
    });

    const results = Array.from(combinedMap.values()).sort((a, b) => b.rating - a.rating);

    console.log(`🔎 Search "${q}" found ${results.length} results`);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error during food search:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
    });
  }
});

/**
 * GET /api/foods/by-category/:category
 * Get all dishes in a specific category
 */
router.get('/by-category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    // Get all restaurants (active or not) to find all dishes in category
    const restaurants = await Restaurant.find().lean();

    const dishesByCategory = [];
    const dishMap = new Map();

    restaurants.forEach(restaurant => {
      if (restaurant.menu && Array.isArray(restaurant.menu)) {
        restaurant.menu
          .filter(item => item.category === category)
          .forEach(item => {
            const dishKey = item.name.toLowerCase();

            if (!dishMap.has(dishKey)) {
              dishMap.set(dishKey, {
                _id: item._id || Math.random().toString(),
                name: item.name,
                description: item.description || '',
                category: item.category,
                image: item.image?.url || null,
                minPrice: item.price,
                restaurantCount: 1,
              });
            } else {
              const existing = dishMap.get(dishKey);
              existing.restaurantCount += 1;
              existing.minPrice = Math.min(existing.minPrice, item.price);
            }
          });
      }
    });

    const dishes = Array.from(dishMap.values()).sort(
      (a, b) => b.restaurantCount - a.restaurantCount
    );

    console.log(`📋 Found ${dishes.length} dishes in category "${category}"`);

    res.json({
      success: true,
      data: dishes,
      category: category,
      count: dishes.length,
    });
  } catch (error) {
    console.error('Error fetching dishes by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dishes',
      error: error.message,
    });
  }
});

module.exports = router;

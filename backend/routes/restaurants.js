const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const { body, query, validationResult } = require('express-validator');
const { calculateDistance, formatDistance, calculateDeliveryTime, calculateDeliveryFee } = require('../utils/distanceUtils');

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    const { search, cuisine, isOpen } = req.query;
    
    let query = { isActive: true };
    
    // Search by name or cuisine
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by cuisine
    if (cuisine) {
      query.cuisine = { $regex: cuisine, $options: 'i' };
    }
    
    // Filter by open status
    if (isOpen !== undefined) {
      query.isOpen = isOpen === 'true';
    }

    // If filtering for open restaurants, also check if vendor is live
    if (isOpen === 'true') {
      const Vendor = require('../models/Vendor');
      const liveVendors = await Vendor.find({ isLive: true }).select('restaurantId');
      const liveRestaurantIds = liveVendors.map(v => v.restaurantId);
      query._id = { $in: liveRestaurantIds };
    }
    
    // If not filtering by isOpen, still check vendor live status but don't filter out
    if (isOpen === undefined) {
      const Vendor = require('../models/Vendor');
      const allVendors = await Vendor.find().select('restaurantId isLive');
      
      if (allVendors.length > 0) {
        const liveRestaurantIds = allVendors.filter(v => v.isLive && v.restaurantId).map(v => v.restaurantId);
        const offlineRestaurantIds = allVendors.filter(v => !v.isLive && v.restaurantId).map(v => v.restaurantId);
        
        // We'll handle the isOpen status in the response transformation
        if (liveRestaurantIds.length > 0 || offlineRestaurantIds.length > 0) {
          query._id = { $in: [...liveRestaurantIds, ...offlineRestaurantIds] };
        }
      }
      // If no vendors found, show all restaurants (fallback)
    }
    
    const restaurants = await Restaurant.find(query)
      .select('name cuisine rating deliveryTime minOrder image isOpen totalRatings')
      .sort({ rating: -1, totalRatings: -1 });

    // If not filtering by isOpen, update the isOpen status based on vendor's live status
    if (isOpen === undefined) {
      const Vendor = require('../models/Vendor');
      const allVendors = await Vendor.find().select('restaurantId isLive');
      const vendorMap = {};
      allVendors.forEach(v => {
        if (v.restaurantId) {
          vendorMap[v.restaurantId.toString()] = v.isLive;
        }
      });

      // Update restaurant isOpen status based on vendor's live status
      restaurants.forEach(restaurant => {
        const vendorIsLive = vendorMap[restaurant._id.toString()];
        if (vendorIsLive !== undefined) {
          restaurant.isOpen = vendorIsLive;
        }
      });
    }
    
    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants'
    });
  }
});

// Get restaurants by location (new endpoint)
router.get('/nearby', [
  query('latitude').custom((value) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error('Valid latitude is required');
    }
    return true;
  }),
  query('longitude').custom((value) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error('Valid longitude is required');
    }
    return true;
  })
], async (req, res) => {
  try {
    console.log('Nearby endpoint called with query params:', req.query);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      latitude, 
      longitude, 
      radius = 10, // Default 10km radius
      search, 
      cuisine, 
      isOpen,
      limit = 50 
    } = req.query;

    console.log('Parsed parameters:', { latitude, longitude, radius, search, cuisine, isOpen, limit });

    const filters = {};
    if (search) filters.search = search;
    if (cuisine) filters.cuisine = cuisine;
    if (isOpen !== undefined) filters.isOpen = isOpen === 'true';

    // If filtering for open restaurants, also check if vendor is live
    if (isOpen === 'true') {
      const Vendor = require('../models/Vendor');
      const liveVendors = await Vendor.find({ isLive: true }).select('restaurantId');
      const liveRestaurantIds = liveVendors.map(v => v.restaurantId);
      filters.liveRestaurantIds = liveRestaurantIds;
    }
    
    // If not filtering by isOpen, include all restaurants but mark their status
    if (isOpen === undefined) {
      const Vendor = require('../models/Vendor');
      const allVendors = await Vendor.find().select('restaurantId isLive');
      
      if (allVendors.length > 0) {
        const liveRestaurantIds = allVendors.filter(v => v.isLive && v.restaurantId).map(v => v.restaurantId);
        const offlineRestaurantIds = allVendors.filter(v => !v.isLive && v.restaurantId).map(v => v.restaurantId);
        if (liveRestaurantIds.length > 0 || offlineRestaurantIds.length > 0) {
          filters.allRestaurantIds = [...liveRestaurantIds, ...offlineRestaurantIds];
        }
        filters.vendorLiveStatus = {};
        allVendors.forEach(v => {
          if (v.restaurantId) {
            filters.vendorLiveStatus[v.restaurantId.toString()] = v.isLive;
          }
        });
      }
      // If no vendors found, show all restaurants (fallback)
    }

    // Convert radius from km to meters for MongoDB geospatial query
    const maxDistance = parseFloat(radius) * 1000;

    console.log('Calling findNearbyWithFilters with:', { 
      longitude: parseFloat(longitude), 
      latitude: parseFloat(latitude), 
      maxDistance, 
      filters 
    });

    const restaurants = await Restaurant.findNearbyWithFilters(
      parseFloat(longitude), 
      parseFloat(latitude), 
      maxDistance, 
      filters
    )
    .select('name cuisine rating deliveryTime minOrder image isOpen totalRatings location address')
    .limit(parseInt(limit))
    .sort({ rating: -1, totalRatings: -1 });

    console.log('Found restaurants:', restaurants.length);

    // Calculate distance and add delivery info for each restaurant
    const restaurantsWithDistance = restaurants.map(restaurant => {
      const [restLon, restLat] = restaurant.location.coordinates;
      const distance = calculateDistance(
        parseFloat(latitude), 
        parseFloat(longitude), 
        restLat, 
        restLon
      );

      // Calculate dynamic delivery time and fee based on distance
      const estimatedDeliveryTime = calculateDeliveryTime(distance, restaurant.deliveryTime.min);
      const deliveryFee = calculateDeliveryFee(distance, restaurant.deliveryFee);

      // Determine if restaurant is open based on vendor live status
      let isOpen = restaurant.isOpen || false;
      if (filters.vendorLiveStatus && filters.vendorLiveStatus[restaurant._id.toString()] !== undefined) {
        isOpen = filters.vendorLiveStatus[restaurant._id.toString()];
      }

      return {
        id: restaurant._id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        rating: restaurant.rating || 0,
        deliveryTime: `${restaurant.deliveryTime.min}-${restaurant.deliveryTime.max} min`,
        estimatedDeliveryTime: `${estimatedDeliveryTime} min`,
        minOrder: restaurant.minOrder || 100,
        deliveryFee: deliveryFee,
        image: restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        isOpen: isOpen,
        distance: formatDistance(distance),
        distanceKm: distance,
        address: restaurant.address.fullAddress || restaurant.address.street,
        totalRatings: restaurant.totalRatings || 0
      };
    });

    // Sort by distance first, then by rating
    restaurantsWithDistance.sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      return b.rating - a.rating;
    });

    res.json({
      success: true,
      data: restaurantsWithDistance,
      meta: {
        customerLocation: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
        searchRadius: parseFloat(radius),
        totalFound: restaurantsWithDistance.length
      }
    });
  } catch (error) {
    console.error('Error fetching nearby restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby restaurants'
    });
  }
});

// Get restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('vendorId', 'name phone email');
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant'
    });
  }
});

// Get restaurant menu
router.get('/:id/menu', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .select('menu name');
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Filter available menu items
    const availableMenu = restaurant.menu.filter(item => item.isAvailable);
    
    res.json({
      success: true,
      data: {
        restaurantName: restaurant.name,
        menu: availableMenu
      }
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu'
    });
  }
});

// Get menu item by ID
router.get('/:restaurantId/menu/:menuItemId', async (req, res) => {
  try {
    const { restaurantId, menuItemId } = req.params;
    
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    const menuItem = restaurant.menu.id(menuItemId);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    
    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item'
    });
  }
});

// Search restaurants
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;
    
    const restaurants = await Restaurant.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { cuisine: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name cuisine rating deliveryTime minOrder image isOpen')
    .limit(parseInt(limit))
    .sort({ rating: -1 });
    
    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    console.error('Error searching restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search restaurants'
    });
  }
});

// Get restaurants by cuisine
router.get('/cuisine/:cuisine', async (req, res) => {
  try {
    const { cuisine } = req.params;
    const { limit = 20 } = req.query;
    
    const restaurants = await Restaurant.find({
      cuisine: { $regex: cuisine, $options: 'i' },
      isActive: true
    })
    .select('name cuisine rating deliveryTime minOrder image isOpen')
    .limit(parseInt(limit))
    .sort({ rating: -1 });
    
    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    console.error('Error fetching restaurants by cuisine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants'
    });
  }
});

// Get open restaurants
router.get('/open/status', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      isOpen: true,
      isActive: true
    })
    .select('name cuisine rating deliveryTime minOrder image')
    .sort({ rating: -1 });
    
    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    console.error('Error fetching open restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch open restaurants'
    });
  }
});

// Get restaurant statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .select('rating totalRatings menu');
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    const stats = {
      rating: restaurant.rating,
      totalRatings: restaurant.totalRatings,
      totalMenuItems: restaurant.menu.length,
      availableMenuItems: restaurant.menu.filter(item => item.isAvailable).length,
      categories: [...new Set(restaurant.menu.map(item => item.category))]
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching restaurant stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant statistics'
    });
  }
});

module.exports = router; 
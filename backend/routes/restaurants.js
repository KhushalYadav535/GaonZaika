const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const { body, validationResult } = require('express-validator');

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
    
    const restaurants = await Restaurant.find(query)
      .select('name cuisine rating deliveryTime minOrder image isOpen totalRatings')
      .sort({ rating: -1, totalRatings: -1 });
    
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
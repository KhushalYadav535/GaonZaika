const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const { body, validationResult } = require('express-validator');
const MenuItem = require('../models/Restaurant'); // Menu is embedded in Restaurant
const { verifyToken, getUser, requireVendor } = require('../middleware/auth');
const { uploadImage } = require('../middleware/uploadMiddleware');
const { deleteImage } = require('../config/cloudinary');

// Toggle vendor live status
router.patch('/:id/toggle-live', verifyToken, getUser, requireVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Check if vendor is authorized to toggle this status
    if (vendor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to toggle this vendor status'
      });
    }
    
    await vendor.toggleLiveStatus();
    
    res.json({
      success: true,
      message: vendor.isLive ? 'Vendor is now live!' : 'Vendor is now offline',
      data: {
        isLive: vendor.isLive,
        lastLiveToggle: vendor.lastLiveToggle,
        restaurant: {
          isOpen: vendor.isLive
        }
      }
    });
    
  } catch (error) {
    console.error('Error toggling vendor live status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle live status'
    });
  }
});

// Go live endpoint
router.patch('/:id/go-live', verifyToken, getUser, requireVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    if (vendor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    await vendor.goLive();
    
    res.json({
      success: true,
      message: 'Vendor is now live! Restaurant is open for orders.',
      data: {
        isLive: vendor.isLive,
        lastLiveToggle: vendor.lastLiveToggle,
        restaurant: {
          isOpen: true
        }
      }
    });
    
  } catch (error) {
    console.error('Error going live:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to go live'
    });
  }
});

// Go offline endpoint
router.patch('/:id/go-offline', verifyToken, getUser, requireVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    if (vendor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    await vendor.goOffline();
    
    res.json({
      success: true,
      message: 'Vendor is now offline. Restaurant is closed for orders.',
      data: {
        isLive: vendor.isLive,
        lastLiveToggle: vendor.lastLiveToggle,
        restaurant: {
          isOpen: false
        }
      }
    });
    
  } catch (error) {
    console.error('Error going offline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to go offline'
    });
  }
});

// Get vendor live status
router.get('/:id/live-status', verifyToken, getUser, requireVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('restaurantId');
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    if (vendor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    res.json({
      success: true,
      data: {
        isLive: vendor.isLive,
        lastLiveToggle: vendor.lastLiveToggle,
        restaurant: {
          isOpen: vendor.restaurantId?.isOpen || false,
          name: vendor.restaurantId?.name
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting vendor live status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get live status'
    });
  }
});

// Upload restaurant image
router.post('/:id/restaurant-image', verifyToken, getUser, requireVendor, uploadImage, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('restaurantId');
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    if (vendor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!vendor.restaurantId) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (!req.imageInfo) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded'
      });
    }

    // Delete old image if exists
    if (vendor.restaurantId.image) {
      try {
        await deleteImage(vendor.restaurantId.image);
      } catch (error) {
        console.error('Error deleting old restaurant image:', error);
      }
    }

    // Update restaurant image
    vendor.restaurantId.image = req.imageInfo.url;
    await vendor.restaurantId.save();

    res.json({
      success: true,
      message: 'Restaurant image updated successfully',
      data: {
        imageUrl: req.imageInfo.url,
        restaurant: {
          id: vendor.restaurantId._id,
          name: vendor.restaurantId.name,
          image: vendor.restaurantId.image
        }
      }
    });
    
  } catch (error) {
    console.error('Error uploading restaurant image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload restaurant image'
    });
  }
});

// Delete restaurant image
router.delete('/:id/restaurant-image', verifyToken, getUser, requireVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('restaurantId');
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    if (vendor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!vendor.restaurantId) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Delete image from Cloudinary if exists
    if (vendor.restaurantId.image) {
      try {
        await deleteImage(vendor.restaurantId.image);
      } catch (error) {
        console.error('Error deleting restaurant image:', error);
      }
    }

    // Remove image from restaurant
    vendor.restaurantId.image = null;
    await vendor.restaurantId.save();

    res.json({
      success: true,
      message: 'Restaurant image removed successfully',
      data: {
        restaurant: {
          id: vendor.restaurantId._id,
          name: vendor.restaurantId.name,
          image: null
        }
      }
    });
    
  } catch (error) {
    console.error('Error deleting restaurant image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete restaurant image'
    });
  }
});

// Vendor login with PIN
router.post('/login', [
  body('pin').isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { pin } = req.body;
    
    // For demo purposes, use static PIN
    const validPIN = process.env.VENDOR_PIN || '1234';
    
    if (pin !== validPIN) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN'
      });
    }
    
    // Find vendor by PIN (in production, use hashed PIN)
    const vendor = await Vendor.findOne({ pin: pin }).populate('restaurantId');
    
    if (!vendor || !vendor.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Vendor not found or inactive'
      });
    }
    
    // Update last login
    await vendor.updateLastLogin();
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        vendorId: vendor._id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        restaurant: vendor.restaurantId
      }
    });
    
  } catch (error) {
    console.error('Error in vendor login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get vendor profile
router.get('/:id/profile', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('restaurantId')
      .select('-pin');
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    res.json({
      success: true,
      data: vendor
    });
    
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Get vendor orders
router.get('/:id/orders', async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    
    // Get restaurant IDs for this vendor
    const restaurants = await Restaurant.find({ vendorId: req.params.id }).select('_id');
    const restaurantIds = restaurants.map(r => r._id);
    
    if (restaurantIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      });
    }
    
    let query = { 
      restaurantId: { $in: restaurantIds },
      isActive: true 
    };
    
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .populate('restaurantId', 'name cuisine')
      .populate('deliveryPersonId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get vendor dashboard stats
router.get('/:id/dashboard', async (req, res) => {
  try {
    const vendorId = req.params.id;
    
    // Get restaurant IDs for this vendor
    const restaurants = await Restaurant.find({ vendorId }).select('_id');
    const restaurantIds = restaurants.map(r => r._id);
    
    if (restaurantIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          todayRevenue: 0,
          thisWeekRevenue: 0,
          thisMonthRevenue: 0,
          averageRating: 0,
          totalRatings: 0
        }
      });
    }
    
    // Get orders for this vendor
    const orders = await Order.find({ 
      restaurantId: { $in: restaurantIds },
      isActive: true 
    });
    
    // Calculate stats
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => 
      ['Order Placed', 'Accepted', 'Preparing'].includes(order.status)
    ).length;
    const completedOrders = orders.filter(order => 
      order.status === 'Delivered'
    ).length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenue = orders
      .filter(order => order.createdAt >= today)
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    // This week's revenue
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekRevenue = orders
      .filter(order => order.createdAt >= weekAgo)
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    // This month's revenue
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const thisMonthRevenue = orders
      .filter(order => order.createdAt >= monthAgo)
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Get restaurant ratings
    const restaurant = await Restaurant.findOne({ vendorId });
    const averageRating = restaurant ? restaurant.rating : 0;
    const totalRatings = restaurant ? restaurant.totalRatings : 0;
    
    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        todayRevenue,
        thisWeekRevenue,
        thisMonthRevenue,
        averageRating,
        totalRatings
      }
    });
    
  } catch (error) {
    console.error('Error fetching vendor dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Update vendor profile
router.put('/:id/profile', [
  body('name').optional().isString().trim(),
  body('email').optional().isEmail(),
  body('phone').optional().isMobilePhone('en-IN'),
  body('address').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Update fields
    const { name, email, phone, address } = req.body;
    
    if (name) vendor.name = name;
    if (email) vendor.email = email;
    if (phone) vendor.phone = phone;
    if (address) vendor.address = { ...vendor.address, ...address };
    
    await vendor.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        vendorId: vendor._id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address
      }
    });
    
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Get vendor restaurant menu
router.get('/:id/menu', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ vendorId: req.params.id });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        menu: restaurant.menu
      }
    });
    
  } catch (error) {
    console.error('Error fetching vendor menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu'
    });
  }
});





// Update restaurant location
router.put('/:id/restaurant/location', [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('street').optional().isString().withMessage('Street must be a string'),
  body('city').optional().isString().withMessage('City must be a string'),
  body('state').optional().isString().withMessage('State must be a string'),
  body('pincode').optional().isString().withMessage('Pincode must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendorId = req.params.id;
    const { latitude, longitude, address, street, city, state, pincode } = req.body;

    // Find vendor and their restaurant
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const restaurant = await Restaurant.findById(vendor.restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Update restaurant location coordinates
    restaurant.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)] // MongoDB expects [longitude, latitude]
    };

    // Update address information if provided
    if (address || street || city || state || pincode) {
      restaurant.address = {
        ...restaurant.address,
        ...(street && { street }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode }),
        fullAddress: address || `${street || ''}, ${city || ''}, ${state || ''} - ${pincode || ''}`.trim()
      };
    }

    await restaurant.save();

    console.log(`Updated restaurant ${restaurant.name} location: ${latitude}, ${longitude}`);

    res.json({
      success: true,
      message: 'Restaurant location updated successfully',
      data: {
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          location: restaurant.location,
          address: restaurant.address
        }
      }
    });

  } catch (error) {
    console.error('Error updating restaurant location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update restaurant location'
    });
  }
});

// Get restaurant location
router.get('/:id/restaurant/location', async (req, res) => {
  try {
    const vendorId = req.params.id;

    // Find vendor and their restaurant
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const restaurant = await Restaurant.findById(vendor.restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.json({
      success: true,
      data: {
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          location: restaurant.location,
          address: restaurant.address
        }
      }
    });

  } catch (error) {
    console.error('Error fetching restaurant location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant location'
    });
  }
});

// Menu Item Management with Image Upload

// Add menu item with image
router.post('/:vendorId/menu', verifyToken, getUser, requireVendor, uploadImage, async (req, res) => {
  try {
    console.log('=== ADD MENU ITEM ROUTE HIT ===');
    console.log('Vendor ID:', req.params.vendorId);
    console.log('BODY:', req.body);
    console.log('BODY TYPE:', typeof req.body);
    console.log('BODY KEYS:', Object.keys(req.body));
    console.log('IMAGE INFO:', req.imageInfo);
    console.log('FILE:', req.file);

    // Manual validation for multipart/form-data
    const validationErrors = [];
    
    if (!req.body.name || !req.body.name.trim()) {
      validationErrors.push({ field: 'name', message: 'Item name is required' });
    }
    
    if (!req.body.description || !req.body.description.trim()) {
      validationErrors.push({ field: 'description', message: 'Description is required' });
    }
    
    if (!req.body.price || isNaN(parseFloat(req.body.price)) || parseFloat(req.body.price) <= 0) {
      validationErrors.push({ field: 'price', message: 'Valid price is required' });
    }
    
    const validCategories = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Breads'];
    if (!req.body.category || !validCategories.includes(req.body.category)) {
      validationErrors.push({ field: 'category', message: 'Valid category is required' });
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    const vendorId = req.params.vendorId;
    // Convert all fields from string to correct type
    const name = req.body.name;
    const description = req.body.description;
    const price = parseFloat(req.body.price);
    const category = req.body.category;
    const isVeg = req.body.isVeg === 'true' || req.body.isVeg === true;
    const isAvailable = req.body.isAvailable === 'true' || req.body.isAvailable === true;
    const preparationTime = req.body.preparationTime ? parseInt(req.body.preparationTime) : 15;

    // Find vendor and their restaurant
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const restaurant = await Restaurant.findById(vendor.restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Create new menu item with image
    const newMenuItem = {
      name,
      description,
      price,
      category,
      isVeg,
      isAvailable,
      preparationTime,
      image: req.imageInfo ? {
        url: req.imageInfo.url,
        publicId: req.imageInfo.publicId
      } : { url: null, publicId: null }
    };

    // Add to restaurant menu
    restaurant.menu.push(newMenuItem);
    await restaurant.save();

    const addedItem = restaurant.menu[restaurant.menu.length - 1];

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      data: {
        menuItem: {
          id: addedItem._id,
          name: addedItem.name,
          description: addedItem.description,
          price: addedItem.price,
          category: addedItem.category,
          image: addedItem.image,
          isVeg: addedItem.isVeg,
          isAvailable: addedItem.isAvailable,
          preparationTime: addedItem.preparationTime
        }
      }
    });

  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add menu item'
    });
  }
});

// Update menu item with image
router.put('/:id/menu/:itemId', verifyToken, getUser, requireVendor, uploadImage, async (req, res) => {
  try {
    // Manual validation for multipart/form-data (optional fields for update)
    const validationErrors = [];
    
    if (req.body.name !== undefined && (!req.body.name || !req.body.name.trim())) {
      validationErrors.push({ field: 'name', message: 'Item name cannot be empty' });
    }
    
    if (req.body.description !== undefined && (!req.body.description || !req.body.description.trim())) {
      validationErrors.push({ field: 'description', message: 'Description cannot be empty' });
    }
    
    if (req.body.price !== undefined && (isNaN(parseFloat(req.body.price)) || parseFloat(req.body.price) <= 0)) {
      validationErrors.push({ field: 'price', message: 'Valid price is required' });
    }
    
    const validCategories = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Breads'];
    if (req.body.category !== undefined && (!req.body.category || !validCategories.includes(req.body.category))) {
      validationErrors.push({ field: 'category', message: 'Valid category is required' });
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    const vendorId = req.params.vendorId;
    const itemId = req.params.itemId;
    const updateData = req.body;

    // Find vendor and their restaurant
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const restaurant = await Restaurant.findById(vendor.restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Find the menu item
    const menuItem = restaurant.menu.id(itemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Delete old image if new image is uploaded
    if (req.imageInfo && menuItem.image && menuItem.image.publicId) {
      try {
        await deleteImage(menuItem.image.publicId);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    // Update menu item
    if (updateData.name) menuItem.name = updateData.name;
    if (updateData.description) menuItem.description = updateData.description;
    if (updateData.price) menuItem.price = parseFloat(updateData.price);
    if (updateData.category) menuItem.category = updateData.category;
    if (updateData.isVeg !== undefined) menuItem.isVeg = updateData.isVeg === 'true' || updateData.isVeg === true;
    if (updateData.isAvailable !== undefined) menuItem.isAvailable = updateData.isAvailable === 'true' || updateData.isAvailable === true;
    if (updateData.preparationTime) menuItem.preparationTime = parseInt(updateData.preparationTime);

    // Update image if new one is uploaded
    if (req.imageInfo) {
      menuItem.image = {
        url: req.imageInfo.url,
        publicId: req.imageInfo.publicId
      };
    }

    await restaurant.save();

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: {
        menuItem: {
          id: menuItem._id,
          name: menuItem.name,
          description: menuItem.description,
          price: menuItem.price,
          category: menuItem.category,
          image: menuItem.image,
          isVeg: menuItem.isVeg,
          isAvailable: menuItem.isAvailable,
          preparationTime: menuItem.preparationTime
        }
      }
    });

  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item'
    });
  }
});

// Delete menu item
router.delete('/:vendorId/menu/:itemId', verifyToken, getUser, requireVendor, async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const itemId = req.params.itemId;

    // Find vendor and their restaurant
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const restaurant = await Restaurant.findById(vendor.restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Find the menu item
    const menuItem = restaurant.menu.id(itemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Delete image from cloudinary if exists
    if (menuItem.image && menuItem.image.publicId) {
      try {
        await deleteImage(menuItem.image.publicId);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    // Remove menu item
    restaurant.menu.pull(itemId);
    await restaurant.save();

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item'
    });
  }
});

// Get vendor menu
router.get('/:id/menu', async (req, res) => {
  try {
    const vendorId = req.params.id;

    // Find vendor and their restaurant
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const restaurant = await Restaurant.findById(vendor.restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.json({
      success: true,
      data: {
        menu: restaurant.menu.map(item => ({
          id: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          isVeg: item.isVeg,
          isAvailable: item.isAvailable,
          preparationTime: item.preparationTime
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching vendor menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu'
    });
  }
});

module.exports = router; 
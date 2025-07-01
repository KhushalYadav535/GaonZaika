const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const { body, validationResult } = require('express-validator');
const MenuItem = require('../models/Restaurant'); // Menu is embedded in Restaurant
const { verifyToken, getUser, requireVendor } = require('../middleware/auth');

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

// Add menu item (Vendor)
router.post('/:vendorId/menu', verifyToken, getUser, requireVendor, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { name, description, price, category, isVeg, image } = req.body;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    const restaurant = await Restaurant.findById(vendor.restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    const menuItem = {
      name, description, price, category, isVeg, image, isAvailable: true, preparationTime: 20
    };
    restaurant.menu.push(menuItem);
    await restaurant.save();
    res.status(201).json({ success: true, message: 'Menu item added', data: menuItem });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ success: false, message: 'Failed to add menu item' });
  }
});

// Update menu item (Vendor)
router.put('/:vendorId/menu/:menuItemId', verifyToken, getUser, requireVendor, async (req, res) => {
  try {
    const { vendorId, menuItemId } = req.params;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    const restaurant = await Restaurant.findById(vendor.restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    const menuItem = restaurant.menu.id(menuItemId);
    if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item not found' });
    Object.assign(menuItem, req.body);
    await restaurant.save();
    res.json({ success: true, message: 'Menu item updated', data: menuItem });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ success: false, message: 'Failed to update menu item' });
  }
});

// Delete menu item (Vendor)
router.delete('/:vendorId/menu/:menuItemId', verifyToken, getUser, requireVendor, async (req, res) => {
  try {
    const { vendorId, menuItemId } = req.params;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    const restaurant = await Restaurant.findById(vendor.restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    restaurant.menu = restaurant.menu.filter(item => item._id.toString() !== menuItemId);
    await restaurant.save();
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete menu item' });
  }
});

module.exports = router; 
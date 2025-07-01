const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const DeliveryPerson = require('../models/DeliveryPerson');
const { body, validationResult } = require('express-validator');

// Admin login with PIN
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
    const validPIN = process.env.ADMIN_PIN || '9999';
    
    if (pin !== validPIN) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN'
      });
    }
    
    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        role: 'admin',
        permissions: ['read', 'write', 'delete']
      }
    });
    
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get admin dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts
    const totalRestaurants = await Restaurant.countDocuments({ isActive: true });
    const totalVendors = await Vendor.countDocuments({ isActive: true });
    const totalDeliveryPersons = await DeliveryPerson.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments({ isActive: true });
    
    // Get revenue stats
    const orders = await Order.find({ isActive: true });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenue = orders
      .filter(order => order.createdAt >= today)
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    // This month's revenue
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const thisMonthRevenue = orders
      .filter(order => order.createdAt >= monthAgo)
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Order status counts
    const orderStatusCounts = await Order.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const statusCounts = {};
    orderStatusCounts.forEach(item => {
      statusCounts[item._id] = item.count;
    });
    
    res.json({
      success: true,
      data: {
        totalRestaurants,
        totalVendors,
        totalDeliveryPersons,
        totalOrders,
        totalRevenue,
        todayRevenue,
        thisMonthRevenue,
        orderStatusCounts: statusCounts
      }
    });
    
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get all restaurants (admin view)
router.get('/restaurants', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const restaurants = await Restaurant.find({ isActive: true })
      .populate('vendorId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Restaurant.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      data: restaurants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants'
    });
  }
});

// Get all orders (admin view)
router.get('/orders', async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = { isActive: true };
    if (status) {
      query.status = status;
    }
    
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
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get all users (admin view)
router.get('/users', async (req, res) => {
  try {
    const { role, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = { isActive: true };
    let model;
    
    if (role === 'vendor') {
      model = Vendor;
    } else if (role === 'delivery') {
      model = DeliveryPerson;
    } else {
      // Return both vendors and delivery persons
      const vendors = await Vendor.find({ isActive: true })
        .select('-pin')
        .populate('restaurantId', 'name')
        .limit(parseInt(limit) / 2)
        .skip(skip);
      
      const deliveryPersons = await DeliveryPerson.find({ isActive: true })
        .select('-pin')
        .limit(parseInt(limit) / 2)
        .skip(skip);
      
      const totalVendors = await Vendor.countDocuments({ isActive: true });
      const totalDeliveryPersons = await DeliveryPerson.countDocuments({ isActive: true });
      
      return res.json({
        success: true,
        data: {
          vendors,
          deliveryPersons
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalVendors + totalDeliveryPersons,
          pages: Math.ceil((totalVendors + totalDeliveryPersons) / parseInt(limit))
        }
      });
    }
    
    const users = await model.find(query)
      .select('-pin')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await model.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const DeliveryPerson = require('../models/DeliveryPerson');
const Admin = require('../models/Admin');
const { body, validationResult } = require('express-validator');

// Test route to check if admin routes are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Admin login with email and password
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase(), isActive: true });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    await admin.updateLastLogin();
    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        role: admin.role,
        permissions: admin.permissions,
        name: admin.name,
        email: admin.email
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
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenue = orders
      .filter(order => order.createdAt && order.createdAt >= today)
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // This month's revenue
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const thisMonthRevenue = orders
      .filter(order => order.createdAt && order.createdAt >= monthAgo)
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Calculate admin earnings (10% commission from vendors + ₹8 delivery charge per order)
    const vendors = await Vendor.find({ isActive: true });
    const deliveryPersons = await DeliveryPerson.find({ isActive: true });
    
    // Constants for admin earnings calculation
    const VENDOR_COMMISSION_RATE = 10; // 10% commission
    const DELIVERY_CHARGE = 8; // ₹8 per order
    
    // Calculate total admin earnings from vendor commissions + delivery charges
    const totalAdminEarnings = orders.reduce((sum, order) => {
      const vendor = vendors.find(v => v.restaurantId && v.restaurantId.toString() === order.restaurantId.toString());
      if (vendor) {
        const commission = (order.totalAmount * VENDOR_COMMISSION_RATE) / 100;
        const deliveryCharge = DELIVERY_CHARGE;
        return sum + commission + deliveryCharge;
      }
      return sum;
    }, 0);
    
    // Calculate today's admin earnings
    const todayAdminEarnings = orders
      .filter(order => order.createdAt && order.createdAt >= today)
      .reduce((sum, order) => {
        const vendor = vendors.find(v => v.restaurantId && v.restaurantId.toString() === order.restaurantId.toString());
        if (vendor) {
          const commission = (order.totalAmount * VENDOR_COMMISSION_RATE) / 100;
          const deliveryCharge = DELIVERY_CHARGE;
          return sum + commission + deliveryCharge;
        }
        return sum;
      }, 0);
    
    // Calculate this month's admin earnings
    const thisMonthAdminEarnings = orders
      .filter(order => order.createdAt && order.createdAt >= monthAgo)
      .reduce((sum, order) => {
        const vendor = vendors.find(v => v.restaurantId && v.restaurantId.toString() === order.restaurantId.toString());
        if (vendor) {
          const commission = (order.totalAmount * VENDOR_COMMISSION_RATE) / 100;
          const deliveryCharge = DELIVERY_CHARGE;
          return sum + commission + deliveryCharge;
        }
        return sum;
      }, 0);
    
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
        totalAdminEarnings,
        todayAdminEarnings,
        thisMonthAdminEarnings,
        orderStatusCounts: statusCounts
      }
    });
    
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
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

// Update restaurant (admin view)
router.put('/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, cuisine } = req.body;
    
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      { name, address, cuisine },
      { new: true, runValidators: true }
    ).populate('vendorId', 'name email phone');
    
    if (!updatedRestaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: updatedRestaurant
    });
    
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update restaurant'
    });
  }
});

// Delete restaurant (admin view)
router.delete('/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!deletedRestaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete restaurant'
    });
  }
});

// Get all orders (admin view)
router.get('/orders', async (req, res) => {
  try {
    const { status: orderStatus, limit: orderLimit = 20, page: orderPage = 1, restaurantId } = req.query;
    const skip = (parseInt(orderPage) - 1) * parseInt(orderLimit);
    
    let query = { isActive: true };
    if (orderStatus) {
      query.status = orderStatus;
    }
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }
    
    const orders = await Order.find(query)
      .populate('restaurantId', 'name cuisine')
      .populate('deliveryPersonId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(orderLimit))
      .skip(skip);
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(orderPage),
        limit: parseInt(orderLimit),
        total,
        pages: Math.ceil(total / parseInt(orderLimit))
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

// Update order status (admin view)
router.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliveryPersonId } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (deliveryPersonId) updateData.deliveryPersonId = deliveryPersonId;
    
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('restaurantId', 'name cuisine')
     .populate('deliveryPersonId', 'name phone');
    
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });
    
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order'
    });
  }
});

// Delete order (admin view)
router.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedOrder = await Order.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order'
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
      // Only populate restaurantId for Vendor
      const users = await model.find(query)
        .select('-pin')
        .populate('restaurantId', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
      const total = await model.countDocuments(query);
      return res.json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } else if (role === 'delivery') {
      model = DeliveryPerson;
      // Do NOT populate restaurantId for DeliveryPerson
      const users = await model.find(query)
        .select('-pin')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
      const total = await model.countDocuments(query);
      return res.json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
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
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Update user (admin view)
router.put('/users/:id', async (req, res) => {
  try {
    console.log('PUT /users/:id called');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    const { id } = req.params;
    const { name, email, phone, role } = req.body;
    
    console.log('Extracted data:', { id, name, email, phone, role });
    
    let model;
    if (role === 'vendor') {
      model = Vendor;
      console.log('Using Vendor model');
    } else if (role === 'delivery') {
      model = DeliveryPerson;
      console.log('Using DeliveryPerson model');
    } else {
      console.log('Invalid role specified:', role);
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    console.log('Attempting to update user with ID:', id);
    const updatedUser = await model.findByIdAndUpdate(
      id,
      { name, email, phone },
      { new: true, runValidators: true }
    ).select('-pin');
    
    console.log('Update result:', updatedUser);
    
    if (!updatedUser) {
      console.log('User not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('User updated successfully');
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Delete user (admin view)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    let model;
    if (role === 'vendor') {
      model = Vendor;
    } else if (role === 'delivery') {
      model = DeliveryPerson;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    const deletedUser = await model.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Get admin earnings details
router.get('/earnings', async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    // Get all orders
    let ordersQuery = { isActive: true };
    
    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      ordersQuery.createdAt = { $gte: today };
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      ordersQuery.createdAt = { $gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      ordersQuery.createdAt = { $gte: monthAgo };
    }
    
    const orders = await Order.find(ordersQuery).populate('restaurantId', 'name');
    const vendors = await Vendor.find({ isActive: true });
    
    console.log(`Found ${orders.length} orders and ${vendors.length} vendors`);
    
    // Constants for admin earnings calculation
    const VENDOR_COMMISSION_RATE = 10; // 10% commission
    const DELIVERY_CHARGE = 8; // ₹8 per order
    
    // Calculate earnings breakdown
    const earningsBreakdown = orders.reduce((acc, order) => {
      try {
        // Skip orders without restaurantId or if restaurantId is null/undefined
        if (!order.restaurantId) {
          console.log('Skipping order without restaurantId:', order._id);
          return acc;
        }
        
        // Ensure both restaurantId values are valid before comparing
        const orderRestaurantId = order.restaurantId.toString();
        
        const vendor = vendors.find(v => {
          if (!v.restaurantId) {
            return false;
          }
          try {
            return v.restaurantId.toString() === orderRestaurantId;
          } catch (err) {
            console.log('Error comparing restaurant IDs:', err);
            return false;
          }
        });
        
        if (vendor) {
          const commission = (order.totalAmount * VENDOR_COMMISSION_RATE) / 100;
          const deliveryCharge = DELIVERY_CHARGE;
          const totalEarnings = commission + deliveryCharge;
          const restaurantName = order.restaurantId?.name || 'Unknown Restaurant';
        
        if (!acc[restaurantName]) {
          acc[restaurantName] = {
            restaurantName,
            totalOrders: 0,
            totalRevenue: 0,
            totalCommission: 0,
            totalDeliveryCharges: 0,
            totalEarnings: 0,
            commissionRate: VENDOR_COMMISSION_RATE,
            deliveryCharge: DELIVERY_CHARGE
          };
        }
        
                  acc[restaurantName].totalOrders += 1;
          acc[restaurantName].totalRevenue += order.totalAmount;
          acc[restaurantName].totalCommission += commission;
          acc[restaurantName].totalDeliveryCharges += deliveryCharge;
          acc[restaurantName].totalEarnings += totalEarnings;
        }
      } catch (err) {
        console.log('Error processing order:', order._id, err);
      }
      return acc;
    }, {});
    
    const earningsArray = Object.values(earningsBreakdown);
    const totalEarnings = earningsArray.reduce((sum, item) => sum + item.totalEarnings, 0);
    const totalRevenue = earningsArray.reduce((sum, item) => sum + item.totalRevenue, 0);
    
    res.json({
      success: true,
      data: {
        period,
        totalEarnings,
        totalRevenue,
        totalOrders: orders.length,
        earningsBreakdown: earningsArray,
        summary: {
          averageCommissionRate: VENDOR_COMMISSION_RATE,
          averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
          averageEarningsPerOrder: orders.length > 0 ? totalEarnings / orders.length : 0,
          totalDeliveryCharges: orders.length * DELIVERY_CHARGE,
          totalCommissionEarnings: earningsArray.reduce((sum, item) => sum + item.totalCommission, 0),
          deliveryChargePerOrder: DELIVERY_CHARGE
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching admin earnings:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings data',
      error: error.message
    });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const DeliveryPerson = require('../models/DeliveryPerson');
const Admin = require('../models/Admin');
const Offer = require('../models/Offer');
const Coupon = require('../models/Coupon');
const Customer = require('../models/Customer');
const { body, validationResult } = require('express-validator');
const { uploadImage } = require('../middleware/uploadMiddleware');
const { deleteImage } = require('../config/cloudinary');

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
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        name: admin.name,
        role: admin.role,
        email: admin.email,
        permissions: admin.permissions
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

// GET active offers (for customer app — public)
router.get('/offers/active', async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      isActive: true,
      validFrom: { $lte: now },
      validTo: { $gte: now }
    })
      .populate('restaurantId', 'name image')
      .sort({ displayOrder: 1 })
      .limit(10);
    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch offers' });
  }
});

// Protect all subsequent routes in this file
const { verifyToken, getUser, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
router.use(verifyToken, getUser, requireAdmin);

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
    
    // Only count non-cancelled orders for revenue & earnings
    const validOrders = orders.filter(o => o.status !== 'Cancelled');
    
    const totalRevenue = validOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenue = validOrders
      .filter(order => order.createdAt && order.createdAt >= today)
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // This month's revenue
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const thisMonthRevenue = validOrders
      .filter(order => order.createdAt && order.createdAt >= monthAgo)
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Calculate admin earnings (10% commission from vendors + ₹8 delivery charge per order)
    const vendors = await Vendor.find({ isActive: true });
    const deliveryPersons = await DeliveryPerson.find({ isActive: true });
    
    // Constants for admin earnings calculation
    const VENDOR_COMMISSION_RATE = 10; // 10% commission
    const AppConfig = require('../models/AppConfig');
    let config = await AppConfig.findOne({ configId: 'global_config' });
    const DELIVERY_CHARGE = config?.deliveryCharge || 8; // dynamic delivery charge
    
    // Calculate total admin earnings from vendor commissions + delivery charges
    const totalAdminEarnings = validOrders.reduce((sum, order) => {
      const vendor = vendors.find(v => v.restaurantId && v.restaurantId.toString() === order.restaurantId.toString());
      if (vendor) {
        const commission = (order.totalAmount * VENDOR_COMMISSION_RATE) / 100;
        const deliveryCharge = DELIVERY_CHARGE;
        return sum + commission + deliveryCharge;
      }
      return sum;
    }, 0);
    
    // Calculate today's admin earnings
    const todayAdminEarnings = validOrders
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
    const thisMonthAdminEarnings = validOrders
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
    
    // Generate last 7 days chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayOrders = orders.filter(o => o.createdAt && o.createdAt >= dayStart && o.createdAt <= dayEnd);
      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      chartData.push({
        date: dateString,
        revenue: dayRevenue,
        orders: dayOrders.length
      });
    }

    // Recent 5 orders
    const recentOrders = await Order.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('restaurantId', 'name image')
      .lean();
      
    // Top 5 restaurants by order count
    const topRestaurantsPipeline = await Order.aggregate([
      { $match: { isActive: true, status: 'Delivered' } },
      { $group: { _id: '$restaurantId', orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { orders: -1 } },
      { $limit: 5 }
    ]);
    
    const topRestaurants = await Promise.all(topRestaurantsPipeline.map(async (item) => {
      const r = await Restaurant.findById(item._id).select('name image').lean();
      return {
        _id: item._id,
        orders: item.orders,
        revenue: item.revenue,
        name: r ? r.name : 'Unknown',
        image: r ? r.image : null
      };
    }));
    
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
        orderStatusCounts: statusCounts,
        chartData,
        recentOrders,
        topRestaurants
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
    const { limit = 100, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Admin sees ALL restaurants (active + inactive)
    const restaurants = await Restaurant.find({})
      .populate('vendorId', 'name email phone isLive accountStatus lastLiveToggle')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Restaurant.countDocuments({});
    
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
    const updates = { ...req.body };
    
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      updates,
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
    
    const deletedRestaurant = await Restaurant.findByIdAndDelete(id);
    
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

// Get restaurant menu (admin view)
router.get('/restaurants/:id/menu', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    res.json({ success: true, data: restaurant.menu });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch menu' });
  }
});

// Add menu item (admin view) — with optional image upload via Cloudinary
router.post('/restaurants/:id/menu', uploadImage, async (req, res) => {
  try {
    const { name, price, category, description, isVeg, preparationTime, isAvailable } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const newItem = {
      name,
      price: parseFloat(price),
      category: category || 'Main Course',
      description: description || name,
      isVeg: isVeg === 'true' || isVeg === true,
      preparationTime: preparationTime ? parseInt(preparationTime) : 15,
      isAvailable: isAvailable !== 'false' && isAvailable !== false
    };

    // Attach Cloudinary image if uploaded
    if (req.imageInfo) {
      newItem.image = { url: req.imageInfo.url, publicId: req.imageInfo.publicId };
    }
    
    restaurant.menu.push(newItem);
    await restaurant.save();
    res.status(201).json({ success: true, message: 'Menu item added successfully', data: restaurant.menu[restaurant.menu.length - 1] });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ success: false, message: 'Failed to add menu item' });
  }
});

// Update menu item (admin view) — with optional image upload
router.put('/restaurants/:id/menu/:itemId', uploadImage, async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const updateData = req.body;
    
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    
    const menuItem = restaurant.menu.id(itemId);
    if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item not found' });
    
    if (updateData.name !== undefined) menuItem.name = updateData.name;
    if (updateData.price !== undefined) menuItem.price = parseFloat(updateData.price);
    if (updateData.category !== undefined) menuItem.category = updateData.category;
    if (updateData.description !== undefined) menuItem.description = updateData.description;
    if (updateData.isVeg !== undefined) menuItem.isVeg = updateData.isVeg === 'true' || updateData.isVeg === true;
    if (updateData.isAvailable !== undefined) menuItem.isAvailable = updateData.isAvailable === 'true' || updateData.isAvailable === true;
    if (updateData.preparationTime !== undefined) menuItem.preparationTime = parseInt(updateData.preparationTime);

    // Handle image update
    if (req.imageInfo) {
      // Delete old image from Cloudinary if exists
      if (menuItem.image && menuItem.image.publicId) {
        try { await deleteImage(menuItem.image.publicId); } catch(e) {}
      }
      menuItem.image = { url: req.imageInfo.url, publicId: req.imageInfo.publicId };
    }
    
    await restaurant.save();
    res.json({ success: true, message: 'Menu item updated successfully', data: menuItem });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ success: false, message: 'Failed to update menu item' });
  }
});

// Delete menu item (admin view)
router.delete('/restaurants/:id/menu/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    
    const menuItem = restaurant.menu.id(itemId);
    if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item not found' });

    // Delete image from Cloudinary if exists
    if (menuItem.image && menuItem.image.publicId) {
      try { await deleteImage(menuItem.image.publicId); } catch(e) {}
    }
    
    restaurant.menu.pull(itemId);
    await restaurant.save();
    
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ success: false, message: 'Failed to delete menu item' });
  }
});

// Upload/Update restaurant image (admin view)
router.post('/restaurants/:id/image', uploadImage, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    if (!req.imageInfo) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    // Delete old image if exists
    if (restaurant.image && typeof restaurant.image === 'object' && restaurant.image.publicId) {
      try { await deleteImage(restaurant.image.publicId); } catch(e) {}
    }

    restaurant.image = req.imageInfo.url;
    await restaurant.save();

    res.json({
      success: true,
      message: 'Restaurant image updated successfully',
      data: { imageUrl: req.imageInfo.url }
    });
  } catch (error) {
    console.error('Error uploading restaurant image:', error);
    res.status(500).json({ success: false, message: 'Failed to upload restaurant image' });
  }
});

// Get all orders (admin view)
router.get('/orders', async (req, res) => {
  try {
    const { status: orderStatus, limit: orderLimit = 50, page: orderPage = 1, restaurantId } = req.query;
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

    // Normalize field names for frontend compatibility
    const normalizedOrders = orders.map(order => {
      const obj = order.toObject();
      obj.restaurant = obj.restaurantId;   // alias so frontend can use order.restaurant.name
      obj.deliveryPerson = obj.deliveryPersonId;
      return obj;
    });
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: normalizedOrders,
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
    
    const obj = updatedOrder.toObject();
    obj.restaurant = obj.restaurantId;
    obj.deliveryPerson = obj.deliveryPersonId;

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: obj
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
      // Return vendors, delivery persons, and customers
      const vendors = await Vendor.find({ isActive: true })
        .select('-pin')
        .populate('restaurantId', 'name')
        .limit(parseInt(limit))
        .skip(skip);
      
      const deliveryPersons = await DeliveryPerson.find({ isActive: true })
        .select('-pin')
        .limit(parseInt(limit))
        .skip(skip);
      
      const customers = await Customer.find({ isActive: true })
        .select('-password')
        .limit(parseInt(limit))
        .skip(skip);
      
      const totalVendors = await Vendor.countDocuments({ isActive: true });
      const totalDeliveryPersons = await DeliveryPerson.countDocuments({ isActive: true });
      const totalCustomers = await Customer.countDocuments({ isActive: true });
      
      return res.json({
        success: true,
        data: {
          vendors,
          deliveryPersons,
          customers
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalVendors + totalDeliveryPersons + totalCustomers,
          pages: Math.ceil((totalVendors + totalDeliveryPersons + totalCustomers) / parseInt(limit))
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

// Get user stats (admin view)
router.get('/users/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query; // vendor, delivery, customer

    let stats = { totalOrders: 0, deliveredOrders: 0, cancelledOrders: 0, revenue: 0 };

    if (role === 'vendor') {
      const vendor = await Vendor.findById(id);
      if (!vendor || !vendor.restaurantId) {
        return res.json({ success: true, data: stats });
      }
      const orders = await Order.find({ restaurantId: vendor.restaurantId });
      stats.totalOrders = orders.length;
      stats.deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
      stats.cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;
      stats.revenue = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    } 
    else if (role === 'delivery') {
      const orders = await Order.find({ deliveryPersonId: id });
      stats.totalOrders = orders.length;
      stats.deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
      stats.cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;
    }
    else if (role === 'customer') {
      const customer = await Customer.findById(id);
      if (!customer) return res.json({ success: true, data: stats });
      const orders = await Order.find({ 'customerInfo.phone': customer.phone });
      stats.totalOrders = orders.length;
      stats.deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
      stats.cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;
      stats.revenue = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    }
    else {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
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

// ─── VENDOR LIVE TOGGLE (Admin Control) ────────────────────────────
// POST /admin/vendors/:id/toggle-live
router.post('/vendors/:id/toggle-live', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Use existing model method that also updates restaurant's isOpen
    await vendor.toggleLiveStatus();

    res.json({
      success: true,
      message: `Vendor "${vendor.name}" is now ${vendor.isLive ? '🟢 LIVE' : '🔴 OFFLINE'}`,
      data: {
        vendorId: vendor._id,
        name: vendor.name,
        isLive: vendor.isLive,
        restaurantId: vendor.restaurantId
      }
    });
  } catch (error) {
    console.error('Error toggling vendor live status:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle vendor status' });
  }
});

// ─── FIX AFFILIATE COUPONS (One-time migration) ─────────────────────
// POST /admin/fix-affiliate-coupons
// Marks all coupons that are linked to any Affiliate as isAffiliate: true
// Needed when coupons were created before the isAffiliate flag was introduced
router.post('/fix-affiliate-coupons', async (req, res) => {
  try {
    const Affiliate = require('../models/Affiliate');
    
    // Get all affiliates that have a coupon linked
    const affiliates = await Affiliate.find({ couponId: { $exists: true, $ne: null } });
    
    if (affiliates.length === 0) {
      return res.json({ success: true, message: 'Koi affiliate coupon nahi mila', fixed: 0 });
    }
    
    const couponIds = affiliates.map(a => a.couponId).filter(Boolean);
    
    // Bulk update: mark all linked coupons as isAffiliate: true
    const result = await Coupon.updateMany(
      { _id: { $in: couponIds } },
      { $set: { isAffiliate: true } }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} affiliate coupon(s) fix ho gaye — ab customer ko nahi dikhenge`,
      data: {
        affiliatesFound: affiliates.length,
        couponsFixed: result.modifiedCount,
        couponCodes: await Coupon.find({ _id: { $in: couponIds } }).select('code isAffiliate')
      }
    });
  } catch (error) {
    console.error('Error fixing affiliate coupons:', error);
    res.status(500).json({ success: false, message: 'Fix failed: ' + error.message });
  }
});

// ─── CUSTOMER OTP VIEWER (Admin Support Tool) ──────────────────────
// GET /admin/customers/otp?phone=9876543210
// Used when customer says "OTP nahi aaya" — admin manually share kare
router.get('/customers/otp', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    const customer = await Customer.findOne({ phone: phone.trim() });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Is phone number se koi customer registered nahi hai: ${phone}`
      });
    }

    // Check if OTP exists and is still valid
    if (!customer.phoneOTP || !customer.phoneOTP.code) {
      return res.status(404).json({
        success: false,
        message: `${customer.name} ke liye koi active OTP nahi hai. Customer ko app se dobara OTP bhejne ko kahein.`
      });
    }

    const isExpired = customer.phoneOTP.expiresAt && new Date() > new Date(customer.phoneOTP.expiresAt);
    
    res.json({
      success: true,
      data: {
        customerName: customer.name,
        phone: customer.phone,
        email: customer.email,
        otp: customer.phoneOTP.code,
        expiresAt: customer.phoneOTP.expiresAt,
        isExpired,
        timeRemaining: isExpired ? 'Expired' : `${Math.max(0, Math.round((new Date(customer.phoneOTP.expiresAt) - new Date()) / 60000))} minutes remaining`
      }
    });
  } catch (error) {
    console.error('Error fetching customer OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch OTP' });
  }
});

// ─── GENERATE OTP FOR CUSTOMER (Admin Support Tool) ────────────────
// POST /admin/customers/generate-otp
// Admin manually banata hai naya OTP jab customer ka SMS nahi aata
// Ye OTP wahi field me save hota hai jo app login verify karta hai
router.post('/customers/generate-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    const customer = await Customer.findOne({ phone: phone.trim() });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Is phone number se koi customer registered nahi hai: ${phone}. Pehle customer ko app pe register karwao.`
      });
    }

    // Generate fresh 6-digit OTP
    const crypto = require('crypto');
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Valid for 10 minutes (same as normal OTP flow)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save to customer's phoneOTP field — app verify karta hai isi field ko
    customer.phoneOTP = { code: otp, expiresAt };
    await customer.save();

    res.json({
      success: true,
      message: `✅ ${customer.name} ke liye naya OTP generate ho gaya!`,
      data: {
        customerName: customer.name,
        phone: customer.phone,
        otp,
        expiresAt,
        validFor: '10 minutes',
        instruction: `Customer ko ye OTP batao: ${otp} — App me "Enter OTP" screen pe type kare`
      }
    });
  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({ success: false, message: 'OTP generate karne mein error' });
  }
});

// GET admin earnings details
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
    
    const allOrders = await Order.find(ordersQuery).populate('restaurantId', 'name');
    // Only count non-cancelled orders for earnings
    const orders = allOrders.filter(o => o.status !== 'Cancelled');
    const vendors = await Vendor.find({ isActive: true });
    
    console.log(`Found ${orders.length} orders and ${vendors.length} vendors`);
    
    // Constants for admin earnings calculation
    const VENDOR_COMMISSION_RATE = 10; // 10% commission
    let config = await AppConfig.findOne({ configId: 'global_config' });
    const DELIVERY_CHARGE = config?.deliveryCharge || 8; // dynamic delivery charge
    
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

// ─── CREATE VENDOR (Admin) ────────────────────────────────────────────────────
// Admin creates a vendor + restaurant in one step
router.post('/create-vendor', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('restaurantName').notEmpty().withMessage('Restaurant name is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, phone, password, restaurantName, restaurantAddress, cuisine, lat, lng } = req.body;
    const mongoose = require('mongoose');

    // Check duplicates
    const existingVendor = await Vendor.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (existingVendor) {
      return res.status(400).json({ success: false, message: 'Vendor with this email or phone already exists' });
    }

    // Create restaurant first with a placeholder vendorId
    const placeholderId = new mongoose.Types.ObjectId();
    const restaurant = new Restaurant({
      name: restaurantName,
      cuisine: cuisine || 'Mixed',
      contact: { phone, email: email.toLowerCase() },
      address: { fullAddress: restaurantAddress || 'Address to be updated' },
      location: { type: 'Point', coordinates: [Number(lng) || 0, Number(lat) || 0] },
      vendorId: placeholderId,
      isActive: true,
      isOpen: true,
    });
    await restaurant.save();

    // Create vendor with real restaurant ID
    const vendor = new Vendor({
      _id: placeholderId,
      name,
      email: email.toLowerCase(),
      phone,
      password,   // pre-save hook will hash
      pin: '1234',
      restaurantId: restaurant._id,
      isEmailVerified: true,
      isActive: true,
      accountStatus: 'approved'
    });
    await vendor.save();

    // Update restaurant vendorId to real vendor ID
    restaurant.vendorId = vendor._id;
    await restaurant.save();

    return res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: {
        vendor: { id: vendor._id, name: vendor.name, email: vendor.email, phone: vendor.phone },
        restaurant: { id: restaurant._id, name: restaurant.name }
      }
    });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ success: false, message: 'Failed to create vendor', error: error.message });
  }
});

// ─── CREATE DELIVERY BOY (Admin) ─────────────────────────────────────────────
router.post('/create-delivery', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, phone, password, vehicleNumber } = req.body;
    const DeliveryPerson = require('../models/DeliveryPerson');

    const existing = await DeliveryPerson.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Delivery person with this email or phone already exists' });
    }

    const delivery = new DeliveryPerson({
      name,
      email: email.toLowerCase(),
      phone,
      password,   // pre-save hook will hash
      pin: '5678',
      vehicleDetails: { type: 'Bike', number: vehicleNumber },
      isEmailVerified: true,
      isActive: true,
      accountStatus: 'approved'
    });
    await delivery.save();

    return res.status(201).json({
      success: true,
      message: 'Delivery person created successfully',
      data: { id: delivery._id, name: delivery.name, email: delivery.email, phone: delivery.phone, vehicleNumber }
    });
  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({ success: false, message: 'Failed to create delivery person', error: error.message });
  }
});

// ─── ONBOARDING ROUTES ──────────────────────────────────────────────────────────
router.get('/onboarding/pending', async (req, res) => {
  try {
    const DeliveryPerson = require('../models/DeliveryPerson');
    
    // Fetch pending vendors
    const pendingVendors = await Vendor.find({ accountStatus: 'pending' })
      .select('name email phone createdAt')
      .lean();
    
    // Fetch pending delivery persons
    const pendingDelivery = await DeliveryPerson.find({ accountStatus: 'pending' })
      .select('name email phone vehicleDetails createdAt')
      .lean();

    // Map to a common format
    const applications = [
      ...pendingVendors.map(v => ({
        id: v._id,
        name: v.name,
        email: v.email,
        phone: v.phone,
        role: 'vendor',
        createdAt: v.createdAt,
        status: 'pending'
      })),
      ...pendingDelivery.map(d => ({
        id: d._id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        role: 'delivery',
        vehicleDetails: d.vehicleDetails,
        createdAt: d.createdAt,
        status: 'pending'
      }))
    ];

    // Sort by newest first
    applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Fetch pending onboarding error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending applications' });
  }
});

router.put('/onboarding/:id/:role/:action', async (req, res) => {
  try {
    const { id, role, action } = req.params;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const Model = role === 'vendor' ? Vendor : require('../models/DeliveryPerson');
    
    const user = await Model.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (action === 'approve') {
      user.accountStatus = 'approved';
      user.isActive = true;
    } else {
      user.accountStatus = 'rejected';
      user.isActive = false;
    }

    await user.save();
    
    // If it's a vendor, we should also activate their restaurant
    if (role === 'vendor' && user.restaurantId) {
      const restaurant = await Restaurant.findById(user.restaurantId);
      if (restaurant) {
        restaurant.isActive = action === 'approve';
        await restaurant.save();
      }
    }

    res.json({ success: true, message: `Application ${action}d successfully`, data: { id, role, accountStatus: user.accountStatus } });
  } catch (error) {
    console.error('Update onboarding status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update application status' });
  }
});

// ─── RESET PASSWORD (Admin) ───────────────────────────────────────────────────
router.post('/reset-password', [
  body('id').notEmpty().withMessage('User ID is required'),
  body('role').isIn(['vendor', 'delivery']).withMessage('Role must be vendor or delivery'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { id, role, newPassword } = req.body;
    const DeliveryPerson = require('../models/DeliveryPerson');
    const Model = role === 'vendor' ? Vendor : DeliveryPerson;

    const user = await Model.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;  // pre-save hook hashes
    await user.save();

    return res.json({ success: true, message: `Password reset successfully for ${user.name}` });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
});

// ─── ADD RESTAURANT (Admin) ───────────────────────────────────────────────────
router.post('/restaurants', [
  body('name').notEmpty().withMessage('Restaurant name is required'),
  body('cuisine').notEmpty().withMessage('Cuisine is required'),
  body('vendorId').notEmpty().withMessage('Vendor ID is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, cuisine, vendorId, phone, email, address } = req.body;

    const restaurant = new Restaurant({
      name,
      cuisine,
      vendorId,
      contact: { phone, email: email || '' },
      address: { fullAddress: address || '' },
      location: { type: 'Point', coordinates: [0, 0] },
      isActive: true,
      isOpen: true,
    });
    await restaurant.save();

    // Link restaurant to vendor
    await Vendor.findByIdAndUpdate(vendorId, { restaurantId: restaurant._id });

    return res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant
    });
  } catch (error) {
    console.error('Add restaurant error:', error);
    res.status(500).json({ success: false, message: 'Failed to create restaurant', error: error.message });
  }
});

// ─── GET RESTAURANT MENU (Admin) ─────────────────────────────────────────────
router.get('/restaurants/:id/menu', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).select('name menu');
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: restaurant.menu || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch menu' });
  }
});

// ─── ADD MENU ITEM (Admin) ────────────────────────────────────────────────────
router.post('/restaurants/:id/menu', [
  body('name').notEmpty().withMessage('Item name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').isIn(['Starters', 'Main Course', 'Desserts', 'Beverages', 'Breads']).withMessage('Invalid category'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, price, category, description, isVeg, preparationTime } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    restaurant.menu.push({
      name,
      price: Number(price),
      category,
      description: description || name,
      isVeg: isVeg !== false,
      preparationTime: preparationTime || 15,
      isAvailable: true,
    });
    await restaurant.save();

    const newItem = restaurant.menu[restaurant.menu.length - 1];
    res.status(201).json({ success: true, message: 'Menu item added', data: newItem });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ success: false, message: 'Failed to add menu item', error: error.message });
  }
});

// ─── DELETE MENU ITEM (Admin) ─────────────────────────────────────────────────
router.delete('/restaurants/:id/menu/:itemId', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    const itemIndex = restaurant.menu.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Menu item not found' });

    restaurant.menu.splice(itemIndex, 1);
    await restaurant.save();

    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete menu item' });
  }
});

// ═══════════════════════════════════════════════════════════════
// OFFERS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// GET all offers (admin)
router.get('/offers', async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate('restaurantId', 'name')
      .sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch offers' });
  }
});

// CREATE offer
router.post('/offers', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('type').isIn(['percentage', 'flat', 'free_delivery', 'bogo']).withMessage('Invalid offer type'),
  body('validFrom').notEmpty().withMessage('Valid from date required'),
  body('validTo').notEmpty().withMessage('Valid to date required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    const offer = new Offer(req.body);
    await offer.save();
    res.status(201).json({ success: true, message: 'Offer created', data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create offer', error: error.message });
  }
});

// UPDATE offer
router.put('/offers/:id', async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, message: 'Offer updated', data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update offer' });
  }
});

// DELETE offer
router.delete('/offers/:id', async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, message: 'Offer deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete offer' });
  }
});

// ═══════════════════════════════════════════════════════════════
// COUPON MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// GET all coupons
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate('applicableRestaurants', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
});

// CREATE coupon
router.post('/coupons', [
  body('code').notEmpty().withMessage('Coupon code is required'),
  body('type').isIn(['percentage', 'flat', 'free_delivery']).withMessage('Invalid coupon type'),
  body('discount').isNumeric().withMessage('Discount must be a number'),
  body('validFrom').notEmpty().withMessage('Valid from date required'),
  body('validTo').notEmpty().withMessage('Valid to date required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    // Check duplicate code
    const existing = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Coupon code already exists' });

    const coupon = new Coupon({ ...req.body, code: req.body.code.toUpperCase() });
    await coupon.save();
    res.status(201).json({ success: true, message: 'Coupon created', data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create coupon', error: error.message });
  }
});

// UPDATE coupon
router.put('/coupons/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon updated', data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
});

// DELETE coupon
router.delete('/coupons/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
});

// VALIDATE coupon (for orders)
router.post('/coupons/validate', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    if (!coupon.isValid()) return res.status(400).json({ success: false, message: 'Coupon is expired or inactive' });
    if (orderAmount < coupon.minOrder) return res.status(400).json({ success: false, message: `Minimum order ₹${coupon.minOrder} required` });

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (orderAmount * coupon.discount) / 100;
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else if (coupon.type === 'flat') {
      discountAmount = coupon.discount;
    } else if (coupon.type === 'free_delivery') {
      discountAmount = 0; // handled separately
    }

    res.json({ success: true, data: { coupon, discountAmount, freeDelivery: coupon.type === 'free_delivery' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to validate coupon' });
  }
});

// ─── MARKETING PUSH NOTIFICATIONS ────────────────────────────────────────────
router.post('/marketing/push-notification', [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { title, message, targetAudience = 'all' } = req.body;
    
    let pushTokens = [];

    if (targetAudience === 'all' || targetAudience === 'customers') {
      const customers = await Customer.find({ pushToken: { $exists: true, $ne: '' } });
      pushTokens.push(...customers.map(c => c.pushToken));
    }
    
    if (targetAudience === 'all' || targetAudience === 'vendors') {
      const vendors = await Vendor.find({ pushToken: { $exists: true, $ne: '' } });
      pushTokens.push(...vendors.map(v => v.pushToken));
    }

    if (targetAudience === 'all' || targetAudience === 'delivery') {
      const deliveryPersons = await DeliveryPerson.find({ pushToken: { $exists: true, $ne: '' } });
      pushTokens.push(...deliveryPersons.map(d => d.pushToken));
    }

    // Remove duplicates
    pushTokens = [...new Set(pushTokens)].filter(Boolean);

    if (pushTokens.length === 0) {
      return res.status(400).json({ success: false, message: 'No users found with registered devices for this audience' });
    }

    const pushNotificationService = require('../services/pushNotificationService');
    await pushNotificationService.sendPushNotificationToMultiple(
      pushTokens, 
      title, 
      message, 
      { type: 'promotional' }
    );

    res.json({ 
      success: true, 
      message: `Notification queued for ${pushTokens.length} devices`,
      count: pushTokens.length
    });
  } catch (error) {
    console.error('Error sending marketing push:', error);
    res.status(500).json({ success: false, message: 'Failed to send notifications' });
  }
});

router.get('/marketing/push-notifications-history', async (req, res) => {
  try {
    // For now we return an empty array or dummy data until we set up a Notification model for broadcasts.
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// ─── APP CONFIG (Surge Pricing / Rain Mode) ──────────────────────────────────
router.get('/config', async (req, res) => {
  try {
    const AppConfig = require('../models/AppConfig');
    let config = await AppConfig.findOne({ configId: 'global_config' });
    if (!config) {
      config = await AppConfig.create({ configId: 'global_config' });
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch config' });
  }
});

router.put('/config', async (req, res) => {
  try {
    const AppConfig = require('../models/AppConfig');
    const config = await AppConfig.findOneAndUpdate(
      { configId: 'global_config' },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, message: 'Config updated', data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update config' });
  }
});

// ─── PAYOUTS & SETTLEMENTS ────────────────────────────────────────────────────
router.get('/payouts', async (req, res) => {
  try {
    const Payout = require('../models/Payout');
    // We can filter by status, role, etc.
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.role) query.role = req.query.role;
    
    const payouts = await Payout.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: payouts });
  } catch (error) {
    console.error('Fetch payouts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payouts' });
  }
});

router.post('/payouts/mark-paid', [
  body('payoutId').notEmpty().withMessage('Payout ID is required'),
  body('transactionRef').notEmpty().withMessage('Transaction Reference is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const Payout = require('../models/Payout');
    const { payoutId, transactionRef, notes } = req.body;

    const payout = await Payout.findById(payoutId);
    if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });
    
    if (payout.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Payout is already marked as paid' });
    }

    payout.status = 'paid';
    payout.transactionRef = transactionRef;
    payout.paidAt = new Date();
    if (notes) payout.notes = notes;

    await payout.save();
    
    res.json({ success: true, message: 'Payout marked as paid successfully', data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update payout' });
  }
});

// ─── VENDOR ORDER SETTLEMENTS (ORDER-BY-ORDER) ──────────────────────────────
router.get('/vendor-orders/:vendorId', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor || !vendor.restaurantId) {
      return res.status(404).json({ success: false, message: 'Vendor or associated restaurant not found' });
    }
    
    // Fetch all Delivered orders for this restaurant
    const orders = await Order.find({
      restaurantId: vendor.restaurantId,
      status: 'Delivered',
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Fetch vendor orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor orders' });
  }
});

router.post('/vendor-orders/settle', async (req, res) => {
  try {
    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No orders provided for settlement' });
    }

    await Order.updateMany(
      { _id: { $in: orderIds } },
      { 
        $set: { 
          vendorPaymentStatus: 'Settled', 
          vendorPaymentDate: new Date() 
        } 
      }
    );

    res.json({ success: true, message: 'Selected orders have been marked as Settled successfully.' });
  } catch (error) {
    console.error('Settle vendor orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to settle orders' });
  }
});

// ─── BANNERS ────────────────────────────────────────────────────────
router.get('/banners', async (req, res) => {
  try {
    const Banner = require('../models/Banner');
    const banners = await Banner.find().sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Banners Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch banners', error: error.message });
  }
});

// removed duplicate route

router.post('/banners', [
  body('title').notEmpty().withMessage('Title is required'),
  body('imageUrl').notEmpty().withMessage('Image URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    
    const Banner = require('../models/Banner');
    const banner = new Banner(req.body);
    await banner.save();
    
    res.status(201).json({ success: true, message: 'Banner created', data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create banner' });
  }
});

router.put('/banners/:id', async (req, res) => {
  try {
    const Banner = require('../models/Banner');
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    
    res.json({ success: true, message: 'Banner updated', data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner' });
  }
});

router.delete('/banners/:id', async (req, res) => {
  try {
    const Banner = require('../models/Banner');
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete banner' });
  }
});

// ─── LIVE DELIVERY TRACKING ──────────────────────────────────────────
router.get('/delivery-locations', async (req, res) => {
  try {
    const DeliveryPerson = require('../models/DeliveryPerson');
    // Fetch only active, approved, and online delivery persons
    const onlineStaff = await DeliveryPerson.find({
      isActive: true,
      accountStatus: 'approved',
      isOnline: true
    }).select('name phone currentLocation isAvailable');

    res.json({ success: true, data: onlineStaff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch delivery locations' });
  }
});

// ─── REFUNDS & DISPUTES ────────────────────────────────────────────────
router.get('/disputes', async (req, res) => {
  try {
    const Order = require('../models/Order');
    const disputes = await Order.find({
      refundStatus: { $ne: 'none' }
    })
    .populate('restaurantId', 'name')
    .sort({ createdAt: -1 });
    
    res.json({ success: true, data: disputes });
  } catch (error) {
    console.error('Disputes Route Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch disputes', error: error.message });
  }
});

router.post('/orders/:id/refund', async (req, res) => {
  try {
    const Order = require('../models/Order');
    const { refundStatus, disputeNotes } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    if (refundStatus) order.refundStatus = refundStatus;
    if (disputeNotes !== undefined) order.disputeNotes = disputeNotes;
    
    await order.save();
    
    res.json({ success: true, message: 'Refund status updated', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update refund status' });
  }
});

// ─── BROADCAST NOTIFICATIONS ───────────────────────────────────────────
router.get('/notifications', async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notifications = await Notification.find().sort({ sentAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

router.post('/notifications', async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const { title, message, targetAudience } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }
    
    const notification = new Notification({
      title,
      message,
      targetAudience: targetAudience || 'all'
    });
    
    await notification.save();
    
    // Here we would typically integrate with Firebase Cloud Messaging (FCM)
    // or OneSignal to actually dispatch the push notifications to devices.
    // For now, we simulate success.
    
    res.status(201).json({ success: true, message: 'Broadcast sent successfully', data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send broadcast' });
  }
});
// ─── SUB-ADMIN MANAGEMENT ──────────────────────────────────────────────
router.get('/admins', requireSuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admins' });
  }
});

router.post('/admins', [
  requireSuperAdmin,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['super_admin', 'admin', 'moderator']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    
    const { name, email, password, role, permissions } = req.body;
    
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Admin with this email already exists' });
    
    const admin = new Admin({ name, email, password, role, permissions: permissions || [] });
    await admin.save();
    
    admin.password = undefined; // Don't send back password
    res.status(201).json({ success: true, message: 'Admin created successfully', data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create admin' });
  }
});

router.put('/admins/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, role, permissions, isActive } = req.body;
    // Note: We don't update password here. Password update should have a separate secure endpoint or use reset flow.
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const admin = await Admin.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    
    res.json({ success: true, message: 'Admin updated', data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update admin' });
  }
});

router.delete('/admins/:id', requireSuperAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    }
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    
    res.json({ success: true, message: 'Admin deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete admin' });
  }
});

const AppConfig = require('../models/AppConfig');

// ─── APP CONFIG ────────────────────────────────────────────────────────
router.get('/config', async (req, res) => {
  try {
    let config = await AppConfig.findOne({ configId: 'global_config' });
    if (!config) {
      config = await AppConfig.create({ configId: 'global_config' });
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch config' });
  }
});

router.put('/config', async (req, res) => {
  try {
    const config = await AppConfig.findOneAndUpdate(
      { configId: 'global_config' },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, message: 'Config updated', data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update config' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ─── AFFILIATE MANAGEMENT ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const Affiliate = require('../models/Affiliate');

// GET /admin/affiliates — List all affiliates
router.get('/affiliates', async (req, res) => {
  try {
    const affiliates = await Affiliate.find({ isActive: true })
      .populate('couponId', 'code type discount commissionAmount isActive')
      .sort({ createdAt: -1 });

    // Summary stats
    const totalPending = affiliates.reduce((sum, a) => sum + (a.pendingCommission || 0), 0);
    const totalPaid = affiliates.reduce((sum, a) => sum + (a.totalPaid || 0), 0);
    const totalEarned = affiliates.reduce((sum, a) => sum + (a.totalCommissionEarned || 0), 0);

    res.json({
      success: true,
      data: affiliates,
      summary: { totalPending, totalPaid, totalEarned }
    });
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch affiliates' });
  }
});

// POST /admin/affiliates — Create new affiliate (auto-creates coupon too)
router.post('/affiliates', async (req, res) => {
  try {
    const {
      name, phone, email, couponCode, couponType = 'flat',
      discountAmount, commissionAmount, commissionPerOrder,
      minOrder = 0, usageLimit = 1000,
      validFrom, validTo,
      payoutDetails, notes
    } = req.body;

    if (!name || !phone || !couponCode || !commissionAmount) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, coupon code aur commission amount required hain'
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: 'Ye coupon code already exist karta hai. Koi doosra code choose karein.'
      });
    }

    const vFrom = validFrom ? new Date(validFrom) : new Date();
    const vTo = validTo ? new Date(validTo) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default

    // 1. Create Affiliate first (without couponId)
    const affiliate = new Affiliate({
      name,
      phone,
      email: email || '',
      couponCode: couponCode.toUpperCase(),
      commissionPerOrder: commissionAmount,
      payoutDetails: payoutDetails || {},
      notes: notes || ''
    });
    await affiliate.save();

    // 2. Create the Coupon linked to this affiliate
    const coupon = new Coupon({
      code: couponCode.toUpperCase(),
      description: `Affiliate coupon for ${name}`,
      type: couponType,
      discount: discountAmount || 0,
      minOrder,
      usageLimit,
      validFrom: vFrom,
      validTo: vTo,
      isActive: true,
      isAffiliate: true,
      affiliateId: affiliate._id,
      commissionAmount: commissionAmount
    });
    await coupon.save();

    // 3. Update affiliate with couponId reference
    affiliate.couponId = coupon._id;
    await affiliate.save();

    res.status(201).json({
      success: true,
      message: `Affiliate "${name}" create ho gaya! Coupon code: ${coupon.code}`,
      data: { affiliate, coupon }
    });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    res.status(500).json({ success: false, message: 'Affiliate create karne mein error', error: error.message });
  }
});

// GET /admin/affiliates/:id — Single affiliate details
router.get('/affiliates/:id', async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id)
      .populate('couponId', 'code type discount commissionAmount isActive usedCount usageLimit validTo');
    if (!affiliate) return res.status(404).json({ success: false, message: 'Affiliate nahi mila' });
    res.json({ success: true, data: affiliate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch affiliate' });
  }
});

// PUT /admin/affiliates/:id — Update affiliate
router.put('/affiliates/:id', async (req, res) => {
  try {
    const { name, phone, email, commissionAmount, payoutDetails, notes, isActive } = req.body;

    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) return res.status(404).json({ success: false, message: 'Affiliate nahi mila' });

    if (name !== undefined) affiliate.name = name;
    if (phone !== undefined) affiliate.phone = phone;
    if (email !== undefined) affiliate.email = email;
    if (commissionAmount !== undefined) {
      affiliate.commissionPerOrder = commissionAmount;
      // Also update the coupon's commissionAmount
      if (affiliate.couponId) {
        await Coupon.findByIdAndUpdate(affiliate.couponId, { commissionAmount });
      }
    }
    if (payoutDetails !== undefined) affiliate.payoutDetails = { ...affiliate.payoutDetails, ...payoutDetails };
    if (notes !== undefined) affiliate.notes = notes;
    if (isActive !== undefined) affiliate.isActive = isActive;

    await affiliate.save();
    res.json({ success: true, message: 'Affiliate update ho gaya', data: affiliate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
});

// DELETE /admin/affiliates/:id — Deactivate affiliate (soft delete)
router.delete('/affiliates/:id', async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) return res.status(404).json({ success: false, message: 'Affiliate nahi mila' });

    // Deactivate the coupon too
    if (affiliate.couponId) {
      await Coupon.findByIdAndUpdate(affiliate.couponId, { isActive: false });
    }
    affiliate.isActive = false;
    await affiliate.save();

    res.json({ success: true, message: 'Affiliate deactivate ho gaya' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// POST /admin/affiliates/:id/payout — Mark commission as paid
router.post('/affiliates/:id/payout', async (req, res) => {
  try {
    const { amount, transactionRef, notes } = req.body;
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) return res.status(404).json({ success: false, message: 'Affiliate nahi mila' });

    if (affiliate.pendingCommission <= 0) {
      return res.status(400).json({ success: false, message: 'Koi pending commission nahi hai' });
    }

    const payAmount = amount || affiliate.pendingCommission;
    await affiliate.markPaid(payAmount);

    res.json({
      success: true,
      message: `₹${payAmount} payout mark as paid ho gaya`,
      data: {
        name: affiliate.name,
        paidAmount: payAmount,
        transactionRef: transactionRef || '',
        remainingPending: affiliate.pendingCommission,
        totalPaid: affiliate.totalPaid
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payout failed', error: error.message });
  }
});

// GET /admin/affiliates/:id/orders — Orders that used this affiliate's coupon
router.get('/affiliates/:id/orders', async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) return res.status(404).json({ success: false, message: 'Affiliate nahi mila' });

    const orders = await Order.find({
      affiliateId: affiliate._id,
      isActive: true
    })
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: orders, totalOrders: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch affiliate orders' });
  }
});

// ─── ADMIN ORDER MANUAL ASSIGNMENT ─────────────────────────────────────
router.post('/orders/:id/assign-delivery', async (req, res) => {
  try {
    const { deliveryPersonId } = req.body;
    const orderId = req.params.id;

    if (!deliveryPersonId) {
      return res.status(400).json({ success: false, message: 'Delivery Person ID is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId);
    if (!deliveryPerson) {
      return res.status(404).json({ success: false, message: 'Delivery Person not found' });
    }

    // Update order with the new delivery boy
    order.deliveryPersonId = deliveryPerson._id;
    order.deliveryPerson = {
      name: deliveryPerson.name,
      phone: deliveryPerson.phone
    };
    
    // Update delivery person's current assignment status if needed
    // Assuming active assignment might be tracked somewhere, but updating the order is the primary source of truth.
    
    await order.save();
    
    // Fetch populated order for frontend
    const populatedOrder = await Order.findById(order._id)
      .populate('restaurantId', 'name cuisine')
      .populate('deliveryPersonId', 'name phone');
      
    const obj = populatedOrder.toObject();
    obj.restaurant = obj.restaurantId;
    obj.deliveryPerson = obj.deliveryPersonId;

    res.json({ 
      success: true, 
      message: 'Delivery person assigned successfully', 
      data: obj 
    });

  } catch (error) {
    console.error('Manual Assignment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign delivery person', error: error.message });
  }
});

// ─── ADMIN MARKETING: Broadcast Push Notifications ──────────────────────────

// POST /admin/marketing/push-notification — Send broadcast to all/targeted users
router.post('/marketing/push-notification', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, message, targetAudience = 'all' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const pushNotificationService = require('../services/pushNotificationService');
    const BroadcastNotification = require('../models/BroadcastNotification');

    const tokens = [];

    // Collect push tokens based on target audience
    if (targetAudience === 'all' || targetAudience === 'customers') {
      const customers = await Customer.find({
        pushToken: { $exists: true, $nin: [null, '', 'dummy-token-android-production'] }
      }).select('pushToken');
      tokens.push(...customers.map(c => c.pushToken).filter(t => pushNotificationService.validatePushToken(t)));
    }

    if (targetAudience === 'all' || targetAudience === 'vendors') {
      const vendors = await Vendor.find({
        pushToken: { $exists: true, $nin: [null, '', 'dummy-token-android-production'] }
      }).select('pushToken');
      tokens.push(...vendors.map(v => v.pushToken).filter(t => pushNotificationService.validatePushToken(t)));
    }

    if (targetAudience === 'all' || targetAudience === 'delivery') {
      const deliveryPeople = await DeliveryPerson.find({
        pushToken: { $exists: true, $nin: [null, '', 'dummy-token-android-production'] }
      }).select('pushToken');
      tokens.push(...deliveryPeople.map(d => d.pushToken).filter(t => pushNotificationService.validatePushToken(t)));
    }

    let notifStatus = 'sent';
    let recipientCount = 0;

    if (tokens.length > 0) {
      // Remove duplicate tokens
      const uniqueTokens = [...new Set(tokens)];
      recipientCount = uniqueTokens.length;

      await pushNotificationService.sendPushNotificationToMultiple(
        uniqueTokens,
        title,
        message,
        { type: 'system' }
      );
    }

    // Save broadcast to history
    const broadcast = await BroadcastNotification.create({
      title,
      message,
      targetAudience,
      sentBy: req.user.id,
      recipientCount,
      status: notifStatus,
    });

    res.json({
      success: true,
      message: `Broadcast sent to ${recipientCount} device(s)`,
      data: broadcast
    });

  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast notification',
      error: error.message
    });
  }
});

// GET /admin/marketing/push-notifications-history — Get broadcast history
router.get('/marketing/push-notifications-history', verifyToken, requireAdmin, async (req, res) => {
  try {
    const BroadcastNotification = require('../models/BroadcastNotification');
    const history = await BroadcastNotification.find()
      .sort({ sentAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching broadcast history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch broadcast history'
    });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { body, validationResult } = require('express-validator');
const { verifyToken, getUser, requireCustomer } = require('../middleware/auth');
const UserNotification = require('../models/UserNotification');

// Get customer profile
router.get('/profile', verifyToken, getUser, requireCustomer, async (req, res) => {
  try {
    let customer = req.userDetails;
    
    // Auto-generate referral code if missing
    if (!customer.referralCode) {
      const crypto = require('crypto');
      const generateReferralCode = (name) => {
        const prefix = name ? name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'Z') : 'ZKA';
        // Make sure prefix is exactly 3 chars
        const safePrefix = (prefix + 'ZKA').substring(0, 3);
        const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
        return `${safePrefix}${suffix}`;
      };
      
      let newCode = generateReferralCode(customer.name);
      // Ensure it's unique
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await Customer.findOne({ referralCode: newCode });
        if (!existing) {
          isUnique = true;
        } else {
          newCode = generateReferralCode(customer.name);
          attempts++;
        }
      }
      
      if (isUnique) {
        customer.referralCode = newCode;
        await customer.save();
      }
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update customer profile
router.patch('/profile', [
  verifyToken,
  getUser,
  requireCustomer,
  body('name').optional().isString().trim(),
  body('phone').optional().isMobilePhone('en-IN'),
  body('email').optional().isEmail()
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

    const { name, phone, email } = req.body;
    const customer = req.userDetails;

    // Check if email/phone already exists (if being updated)
    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({ email });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    if (phone && phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({ phone });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
    }

    // Update fields
    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (email) customer.email = email;

    await customer.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: customer
    });

  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Add/Remove from favourites
router.patch('/favourites', verifyToken, async (req, res) => {
  try {
    const { restaurantId, action } = req.body;
    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (action === 'add') {
      if (!customer.preferences.favoriteRestaurants.includes(restaurantId)) {
        customer.preferences.favoriteRestaurants.push(restaurantId);
      }
    } else {
      customer.preferences.favoriteRestaurants = customer.preferences.favoriteRestaurants.filter(
        id => id.toString() !== restaurantId
      );
    }

    await customer.save();
    res.json({ success: true, favoriteRestaurants: customer.preferences.favoriteRestaurants });
  } catch (error) {
    console.error('Error updating favourites:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get customer favourites
router.get('/favourites', verifyToken, async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id).populate('preferences.favoriteRestaurants');
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, favoriteRestaurants: customer.preferences.favoriteRestaurants });
  } catch (error) {
    console.error('Error fetching favourites:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── NOTIFICATION ROUTES ───────────────────────────────────────────────────

// Get user notifications
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const notifications = await UserNotification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
      
    const unreadCount = await UserNotification.countDocuments({ 
      userId: req.user.id, 
      isRead: false 
    });

    res.json({ 
      success: true, 
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await UserNotification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark all notifications as read
router.patch('/notifications/read-all', verifyToken, async (req, res) => {
  try {
    await UserNotification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get customer addresses
router.get('/addresses', verifyToken, getUser, requireCustomer, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.userDetails.addresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses'
    });
  }
});

// Add new address
router.post('/addresses', [
  verifyToken,
  getUser,
  requireCustomer,
  body('label').optional().isString().trim(),
  body('address').notEmpty().withMessage('Address is required'),
  body('pincode').optional().isString().trim(),
  body('lat').optional().isFloat(),
  body('lng').optional().isFloat(),
  body('isDefault').optional().isBoolean()
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

    const customer = req.userDetails;
    const addressData = req.body;

    await customer.addAddress(addressData);

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: customer.addresses
    });

  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add address'
    });
  }
});

// Update address
router.patch('/addresses/:addressId', [
  verifyToken,
  getUser,
  requireCustomer,
  body('label').optional().isString().trim(),
  body('address').optional().isString(),
  body('pincode').optional().isString().trim(),
  body('lat').optional().isFloat(),
  body('lng').optional().isFloat(),
  body('isDefault').optional().isBoolean()
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

    const customer = req.userDetails;
    const { addressId } = req.params;
    const addressData = req.body;

    await customer.updateAddress(addressId, addressData);

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: customer.addresses
    });

  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update address'
    });
  }
});

// Delete address
router.delete('/addresses/:addressId', verifyToken, getUser, requireCustomer, async (req, res) => {
  try {
    const customer = req.userDetails;
    const { addressId } = req.params;

    await customer.removeAddress(addressId);

    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: customer.addresses
    });

  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address'
    });
  }
});

// Get customer orders
router.get('/orders', verifyToken, getUser, requireCustomer, async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const Order = require('../models/Order');
    
    let query = { 
      'customerInfo.email': req.userDetails.email,
      isActive: true 
    };
    
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
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get customer order by ID
router.get('/orders/:orderId', verifyToken, getUser, requireCustomer, async (req, res) => {
  try {
    const { orderId } = req.params;
    const Order = require('../models/Order');

    const order = await Order.findOne({
      _id: orderId,
      'customerInfo.email': req.userDetails.email,
      isActive: true
    })
    .populate('restaurantId', 'name cuisine address')
    .populate('deliveryPersonId', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

// Update customer preferences
router.patch('/preferences', [
  verifyToken,
  getUser,
  requireCustomer,
  body('notificationSettings.orderUpdates').optional().isBoolean(),
  body('notificationSettings.promotions').optional().isBoolean(),
  body('notificationSettings.newRestaurants').optional().isBoolean(),
  body('dietaryRestrictions').optional().isArray()
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

    const customer = req.userDetails;
    const { notificationSettings, dietaryRestrictions } = req.body;

    if (notificationSettings) {
      customer.preferences.notificationSettings = {
        ...customer.preferences.notificationSettings,
        ...notificationSettings
      };
    }

    if (dietaryRestrictions) {
      customer.preferences.dietaryRestrictions = dietaryRestrictions;
    }

    await customer.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: customer.preferences
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
});

// ─── COUPON: Validate & Apply ─────────────────────────────────────────────────

// GET /api/customers/coupons
router.get('/coupons', verifyToken, async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const Coupon = require('../models/Coupon');
    const now = new Date();
    
    // Find active coupons that are currently valid
    let query = {
      isActive: true,
      validFrom: { $lte: now },
      validTo: { $gte: now },
    };

    const allValidCoupons = await Coupon.find(query);
    
    // Filter by usage limit and restaurant applicability
    const applicableCoupons = allValidCoupons.filter(coupon => {
      if (coupon.usedCount >= coupon.usageLimit) return false;
      
      if (coupon.applicableRestaurants && coupon.applicableRestaurants.length > 0) {
        if (!restaurantId) return false; 
        const isApplicable = coupon.applicableRestaurants.some(r => r.toString() === restaurantId);
        if (!isApplicable) return false;
      }
      return true;
    });

    res.json({ success: true, data: applicableCoupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/customers/apply-coupon
router.post('/apply-coupon', verifyToken, getUser, requireCustomer, async (req, res) => {
  try {
    const { code, subtotal, restaurantId } = req.body;
    if (!code || subtotal === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code and subtotal are required' });
    }

    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({ success: false, message: 'This coupon has expired or reached its usage limit' });
    }

    if (subtotal < coupon.minOrder) {
      const shortfall = coupon.minOrder - subtotal;
      return res.status(400).json({
        success: false,
        message: `Add ₹${shortfall} more to your cart to use this coupon!`
      });
    }

    // Check restaurant restriction
    if (coupon.applicableRestaurants && coupon.applicableRestaurants.length > 0 && restaurantId) {
      const isApplicable = coupon.applicableRestaurants.some(r => r.toString() === restaurantId);
      if (!isApplicable) {
        return res.status(400).json({ success: false, message: 'This coupon is not valid for this restaurant' });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    let discountLabel = '';

    if (coupon.type === 'percentage') {
      discountAmount = (subtotal * coupon.discount) / 100;
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      discountLabel = `${coupon.discount}% OFF`;
    } else if (coupon.type === 'flat') {
      discountAmount = Math.min(coupon.discount, subtotal);
      discountLabel = `₹${coupon.discount} OFF`;
    } else if (coupon.type === 'free_delivery') {
      discountAmount = 0; // delivery fee will be set to 0 on order
      discountLabel = 'FREE DELIVERY';
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    res.json({
      success: true,
      message: 'Coupon applied successfully!',
      data: {
        couponId: coupon._id,
        code: coupon.code,
        type: coupon.type,
        discountAmount,
        discountLabel,
        description: coupon.description
      }
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ success: false, message: 'Failed to apply coupon' });
  }
});

// ─── FAVOURITES: Toggle restaurant favourite ──────────────────────────────────
// POST /api/customers/favourites/toggle
router.post('/favourites/toggle', verifyToken, getUser, requireCustomer, async (req, res) => {
  try {
    const { restaurantId } = req.body;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }

    const customer = req.userDetails;
    const favs = customer.preferences.favoriteRestaurants || [];
    const idx = favs.findIndex(id => id.toString() === restaurantId);

    let isFavourite;
    if (idx > -1) {
      // Remove from favourites
      favs.splice(idx, 1);
      isFavourite = false;
    } else {
      // Add to favourites
      favs.push(restaurantId);
      isFavourite = true;
    }

    customer.preferences.favoriteRestaurants = favs;
    await customer.save();

    res.json({
      success: true,
      message: isFavourite ? 'Added to favourites' : 'Removed from favourites',
      data: { isFavourite, totalFavourites: favs.length }
    });
  } catch (error) {
    console.error('Error toggling favourite:', error);
    res.status(500).json({ success: false, message: 'Failed to update favourites' });
  }
});

// ─── FAVOURITES: Get customer's favourite restaurants ─────────────────────────
// GET /api/customers/favourites
router.get('/favourites', verifyToken, getUser, requireCustomer, async (req, res) => {
  try {
    const customer = await req.userDetails.populate('preferences.favoriteRestaurants', 'name cuisine rating deliveryTime image isOpen');
    const favs = customer.preferences.favoriteRestaurants || [];
    res.json({ success: true, data: favs });
  } catch (error) {
    console.error('Error fetching favourites:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch favourites' });
  }
});

module.exports = router;
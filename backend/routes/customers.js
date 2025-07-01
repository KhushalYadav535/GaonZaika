const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { body, validationResult } = require('express-validator');
const { verifyToken, getUser, requireCustomer } = require('../middleware/auth');

// Get customer profile
router.get('/profile', verifyToken, getUser, requireCustomer, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.userDetails
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

module.exports = router; 
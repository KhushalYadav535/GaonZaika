const express = require('express');
const router = express.Router();
const DeliveryPerson = require('../models/DeliveryPerson');
const Order = require('../models/Order');
const { body, validationResult } = require('express-validator');

// Delivery person login with PIN
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
    const validPIN = process.env.DELIVERY_PIN || '5678';
    
    if (pin !== validPIN) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN'
      });
    }
    
    // Find delivery person by PIN (in production, use hashed PIN)
    const deliveryPerson = await DeliveryPerson.findOne({ pin: pin });
    
    if (!deliveryPerson || !deliveryPerson.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Delivery person not found or inactive'
      });
    }
    
    // Update last login
    await deliveryPerson.updateLastLogin();
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        deliveryPersonId: deliveryPerson._id,
        name: deliveryPerson.name,
        email: deliveryPerson.email,
        phone: deliveryPerson.phone,
        vehicleDetails: deliveryPerson.vehicleDetails
      }
    });
    
  } catch (error) {
    console.error('Error in delivery login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get delivery person orders
router.get('/:id/orders', async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    
    let query = { 
      deliveryPersonId: req.params.id,
      isActive: true 
    };
    
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .populate('restaurantId', 'name cuisine address')
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
    console.error('Error fetching delivery orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Update delivery person location
router.patch('/:id/location', [
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required')
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

    const { latitude, longitude } = req.body;
    const deliveryPerson = await DeliveryPerson.findById(req.params.id);
    
    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: 'Delivery person not found'
      });
    }
    
    await deliveryPerson.updateLocation(latitude, longitude);
    
    res.json({
      success: true,
      message: 'Location updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
});

// Update delivery person availability
router.patch('/:id/availability', [
  body('isAvailable').isBoolean().withMessage('isAvailable must be boolean')
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

    const { isAvailable } = req.body;
    const deliveryPerson = await DeliveryPerson.findById(req.params.id);
    
    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: 'Delivery person not found'
      });
    }
    
    await deliveryPerson.updateAvailability(isAvailable);
    
    res.json({
      success: true,
      message: 'Availability updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability'
    });
  }
});

// OTP verification for delivery completion
router.post('/:orderId/verify-otp', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body;
    const Order = require('../models/Order');

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!order.otp || !order.otp.code) {
      return res.status(400).json({ success: false, message: 'No OTP set for this order' });
    }
    if (order.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    // Mark order as delivered
    order.status = 'Delivered';
    order.otp.verified = true;
    await order.save();
    res.json({ success: true, message: 'OTP verified, order marked as delivered' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
});

module.exports = router; 
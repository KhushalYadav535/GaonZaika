const express = require('express');
const router = express.Router();
const DeliveryPerson = require('../models/DeliveryPerson');
const Order = require('../models/Order');
const { body, validationResult } = require('express-validator');
const { sendOTP } = require('../utils/emailService');

// Delivery person login is now handled by authController
// This route is removed to avoid conflicts

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

// Generate and send OTP for delivery
router.post('/:orderId/generate-otp', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('Generating OTP for order:', orderId);
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    console.log('Order status:', order.status);
    if (order.status !== 'Out for Delivery') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order is not out for delivery yet' 
      });
    }
    
    console.log('Customer email:', order.customerInfo?.email);
    if (!order.customerInfo.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer email not found' 
      });
    }
    
    // Generate OTP
    console.log('Generating OTP...');
    await order.generateOTP();
    console.log('OTP generated:', order.otp.code);
    
    // Send OTP email to customer
    console.log('Sending OTP email to:', order.customerInfo.email);
    const emailSent = await sendOTP(
      order.customerInfo.email, 
      order.otp.code, 
      order.orderId
    );
    
    if (!emailSent) {
      console.log('Failed to send OTP email');
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP email' 
      });
    }
    
    console.log('OTP email sent successfully');
    res.json({ 
      success: true, 
      message: 'OTP generated and sent to customer email',
      orderId: order.orderId
    });
    
  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate OTP',
      error: error.message 
    });
  }
});

// OTP verification for delivery completion
const { sendOrderStatusUpdate } = require('../utils/emailService');

router.post('/:orderId/verify-otp', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (!order.otp || !order.otp.code) {
      return res.status(400).json({ success: false, message: 'No OTP set for this order' });
    }
    
    // Verify OTP using the Order model method
    const isValidOTP = order.verifyOTP(otp);
    if (!isValidOTP) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    // Mark order as delivered
    order.status = 'Delivered';
    order.actualDeliveryTime = new Date();
    await order.save();

    // Send email notification to customer on delivery completion
    if (order.customerInfo && order.customerInfo.email) {
      try {
        await sendOrderStatusUpdate(order.customerInfo.email, order, 'Delivered');
      } catch (emailError) {
        console.error('Failed to send delivery completion email:', emailError);
      }
    }

    res.json({ 
      success: true, 
      message: 'OTP verified successfully, order marked as delivered',
      orderId: order.orderId,
      deliveryTime: order.actualDeliveryTime
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
});

// Test email service
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    console.log('Testing email service with:', email);
    const emailSent = await sendOTP(email, '1234', 'TEST123');
    
    if (emailSent) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email' 
      });
    }
    
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});

// Resend OTP if expired or not received
router.post('/:orderId/resend-otp', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.status !== 'Out for Delivery') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order is not out for delivery yet' 
      });
    }
    
    if (!order.customerInfo.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer email not found' 
      });
    }
    
    // Check if OTP is expired
    if (order.otp && order.otp.expiresAt && new Date() > order.otp.expiresAt) {
      // Generate new OTP
      await order.generateOTP();
    } else if (!order.otp || !order.otp.code) {
      // Generate OTP if not exists
      await order.generateOTP();
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP is still valid. Please wait before requesting a new one.' 
      });
    }
    
    // Send OTP email to customer
    const emailSent = await sendOTP(
      order.customerInfo.email, 
      order.otp.code, 
      order.orderId
    );
    
    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP email' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'OTP resent to customer email',
      orderId: order.orderId,
      expiresAt: order.otp.expiresAt
    });
    
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const DeliveryPerson = require('../models/DeliveryPerson');
const { body, validationResult } = require('express-validator');
const sendOTP = require('../utils/emailService');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');
const pushNotificationService = require('../services/pushNotificationService');
const { verifyToken, getUser } = require('../middleware/auth');

// Validation middleware
const validateOrder = [
  body('restaurantId').isMongoId().withMessage('Invalid restaurant ID'),
  body('customerInfo.name').notEmpty().withMessage('Customer name is required'),
  body('customerInfo.phone').isMobilePhone('en-IN').withMessage('Valid phone number is required'),
  body('customerInfo.address').notEmpty().withMessage('Delivery address is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.name').notEmpty().withMessage('Item name is required'),
  body('items.*.price').isNumeric().withMessage('Valid price is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
  body('totalAmount').isNumeric().withMessage('Valid total amount is required')
];

// Place new order
router.post('/', validateOrder, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      restaurantId,
      customerId,
      customerInfo,
      items,
      subtotal,
      deliveryFee = 20,
      totalAmount,
      notes,
      paymentMethod = 'Cash on Delivery'
    } = req.body;

    // Get customer email for order lookup
    let customerEmail = null;
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customerEmail = customer.email;
      }
    }

    // Verify restaurant exists and is open
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (!restaurant.isOpen || !restaurant.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant is currently closed'
      });
    }

    // Check if vendor is live
    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findOne({ restaurantId: restaurantId });
    if (!vendor || !vendor.isLive) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant is currently offline. Please try again later.'
      });
    }

    // Verify minimum order amount
    if (subtotal < restaurant.minOrder) {
      const shortfall = restaurant.minOrder - subtotal;
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${restaurant.minOrder}. Add ₹${shortfall} more to your cart.`,
        errorType: 'MIN_ORDER_NOT_MET',
        data: {
          currentAmount: subtotal,
          minimumAmount: restaurant.minOrder,
          shortfall: shortfall,
          restaurantName: restaurant.name
        }
      });
    }

    // Create order
    const order = new Order({
      restaurantId,
      customerInfo: {
        ...customerInfo,
        email: customerEmail
      },
      items: items.map(item => ({
        menuItemId: item.menuItemId || new mongoose.Types.ObjectId(), // Generate if not provided
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity
      })),
      subtotal,
      deliveryFee,
      totalAmount,
      notes,
      paymentMethod
    });

    await order.save();

    // Generate OTP for delivery verification
    await order.generateOTP();

    // Send OTP to customer (if email is provided)
    if (customerEmail) {
      try {
        await sendOTP(customerEmail, order.otp.code, order.orderId);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
      }
    }

    // Send push notification to vendor about new order
    try {
      // Find vendor by restaurant
      const vendor = await Restaurant.findById(restaurantId).populate('vendorId');
      
      if (vendor && vendor.vendorId && vendor.vendorId.pushToken) {
        await pushNotificationService.sendNewOrderToVendor(
          vendor.vendorId.pushToken,
          order.orderId,
          customerInfo.name,
          totalAmount
        );
        
        console.log(`Push notification sent to vendor for new order ${order.orderId}`);
      }
    } catch (notificationError) {
      console.error('Error sending push notification to vendor:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        otp: order.otp.code // In production, don't send OTP in response
      }
    });

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place order'
    });
  }
});

// Unified role-based order list
router.get('/', async (req, res) => {
  try {
    const { role, userId, status, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = { isActive: true };
    if (status) query.status = status;
    if (role && userId) {
      if (role === 'vendor') {
        // Find all restaurants for this vendor
        const restaurants = await Restaurant.find({ vendorId: userId }).select('_id');
        const restaurantIds = restaurants.map(r => r._id);
        query.restaurantId = { $in: restaurantIds };
      } else if (role === 'delivery') {
        query.deliveryPersonId = userId;
      } else if (role === 'customer') {
        // Find customer by id and use email for order lookup
        const customer = await Customer.findById(userId);
        if (customer) query['customerInfo.email'] = customer.email;
      }
    }
    const orders = await Order.find(query)
      .populate('restaurantId', 'name cuisine')
      .populate('deliveryPersonId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    const total = await Order.countDocuments(query);
    // Map _id to id for frontend
    const mappedOrders = orders.map(order => ({ ...order.toObject(), id: order._id }));
    res.json({
      success: true,
      data: mappedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Unified order list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantId', 'name cuisine address contact')
      .populate('deliveryPersonId', 'name phone vehicleDetails');
    
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

// Update order status
router.patch('/:id/status', [
  body('status').isIn(['Order Placed', 'Accepted', 'Preparing', 'Ready for Delivery', 'Out for Delivery', 'Delivered', 'Cancelled'])
    .withMessage('Invalid status')
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

    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Store old status for comparison
    const oldStatus = order.status;
    
    // Update order status
    await order.updateStatus(status);
    
    // If status is "Out for Delivery", assign delivery person
    if (status === 'Out for Delivery' && !order.deliveryPersonId) {
      const availableDeliveryPerson = await DeliveryPerson.findOne({
        isActive: true,
        isAvailable: true
      });
      
      if (availableDeliveryPerson) {
        order.deliveryPersonId = availableDeliveryPerson._id;
        await order.save();
      }
    }
    
    // Send push notification to customer if status changed and customer has push token
    if (oldStatus !== status && order.customerInfo && order.customerInfo.email) {
      try {
        // Find customer by email to get push token
        const customer = await Customer.findOne({ email: order.customerInfo.email });
        
        if (customer && customer.pushToken) {
          // Get restaurant name for notification
          const restaurant = await Restaurant.findById(order.restaurantId);
          const restaurantName = restaurant ? restaurant.name : 'Restaurant';
          
          // Send order status update notification
          await pushNotificationService.sendOrderStatusUpdate(
            customer.pushToken,
            order.orderId,
            status,
            restaurantName
          );
          
          console.log(`Push notification sent for order ${order.orderId} status change to ${status}`);
        }
      } catch (notificationError) {
        console.error('Error sending push notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order.orderId,
        status: order.status,
        estimatedDeliveryTime: order.estimatedDeliveryTime
      }
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Verify OTP for delivery
router.post('/:id/verify-otp', [
  body('otp').isLength({ min: 4, max: 4 }).isNumeric().withMessage('Valid 4-digit OTP is required')
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

    const { otp } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Verify OTP
    const isValidOTP = order.verifyOTP(otp);
    
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    // Update order status to delivered
    await order.updateStatus('Delivered');
    
    // Update delivery person stats
    if (order.deliveryPersonId) {
      const deliveryPerson = await DeliveryPerson.findById(order.deliveryPersonId);
      if (deliveryPerson) {
        const commission = (order.totalAmount * deliveryPerson.commission) / 100;
        await deliveryPerson.addEarnings(commission);
        await deliveryPerson.updateDeliveryStats('Delivered');
      }
    }

    // Send push notification to customer about delivery completion
    if (order.customerInfo && order.customerInfo.email) {
      try {
        const customer = await Customer.findOne({ email: order.customerInfo.email });
        
        if (customer && customer.pushToken) {
          const restaurant = await Restaurant.findById(order.restaurantId);
          const restaurantName = restaurant ? restaurant.name : 'Restaurant';
          
          await pushNotificationService.sendOrderStatusUpdate(
            customer.pushToken,
            order.orderId,
            'Delivered',
            restaurantName
          );
          
          console.log(`Push notification sent for order ${order.orderId} delivery completion`);
        }
      } catch (notificationError) {
        console.error('Error sending delivery completion notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }
    
    res.json({
      success: true,
      message: 'OTP verified successfully. Order marked as delivered.',
      data: {
        orderId: order.orderId,
        status: order.status
      }
    });
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

// Cancel order
router.patch('/:id/cancel', verifyToken, getUser, async (req, res) => {
  try {
    console.log('Cancel order request:', {
      orderId: req.params.id,
      reason: req.body.reason,
      userId: req.user.id,
      userRole: req.user.role,
      userEmail: req.userDetails.email
    });
    
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    // Check if order can be cancelled
    if (['Delivered', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled'
      });
    }
    // Authorization: Only customer or vendor can cancel
    const userId = req.user.id;
    const userRole = req.user.role;
    let allowed = false;
    
    console.log('Authorization check:', {
      userRole,
      orderCustomerEmail: order.customerInfo?.email,
      userEmail: req.userDetails.email,
      orderRestaurantId: order.restaurantId
    });
    
    if (userRole === 'customer' && order.customerInfo && req.userDetails.email && order.customerInfo.email === req.userDetails.email) {
      allowed = true;
      console.log('Customer authorization granted');
    }
    
    if (userRole === 'vendor') {
      // Find vendor for this restaurant
      const restaurant = await Restaurant.findById(order.restaurantId);
      console.log('Vendor check:', {
        restaurantFound: !!restaurant,
        restaurantVendorId: restaurant?.vendorId,
        userId,
        match: restaurant?.vendorId?.toString() === userId
      });
      
      if (restaurant && restaurant.vendorId && restaurant.vendorId.toString() === userId) {
        allowed = true;
        console.log('Vendor authorization granted');
      }
    }
    
    if (!allowed) {
      console.log('Authorization denied');
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this order.'
      });
    }
    
    console.log('Authorization granted, proceeding with cancellation');
    // Save cancellation reason
    order.cancellationReason = reason || null;
    await order.updateStatus('Cancelled');
    await order.save();
    
    // Send push notification to customer about order cancellation
    if (order.customerInfo && order.customerInfo.email) {
      try {
        const customer = await Customer.findOne({ email: order.customerInfo.email });
        
        if (customer && customer.pushToken) {
          const restaurant = await Restaurant.findById(order.restaurantId);
          const restaurantName = restaurant ? restaurant.name : 'Restaurant';
          
          await pushNotificationService.sendOrderStatusUpdate(
            customer.pushToken,
            order.orderId,
            'Cancelled',
            restaurantName
          );
          
          console.log(`Push notification sent for order ${order.orderId} cancellation`);
        }
      } catch (notificationError) {
        console.error('Error sending cancellation notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }
    
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId: order.orderId,
        status: order.status,
        cancellationReason: order.cancellationReason
      }
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

// Rate order
router.post('/:id/rate', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isString().trim()
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

    const { rating, review } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    if (order.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate delivered orders'
      });
    }
    
    if (order.rating) {
      return res.status(400).json({
        success: false,
        message: 'Order already rated'
      });
    }
    
    order.rating = rating;
    order.review = review;
    await order.save();
    
    // Update restaurant rating
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant) {
      await restaurant.updateRating(rating);
    }
    
    res.json({
      success: true,
      message: 'Order rated successfully',
      data: {
        orderId: order.orderId,
        rating: order.rating,
        review: order.review
      }
    });
    
  } catch (error) {
    console.error('Error rating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate order'
    });
  }
});

module.exports = router; 
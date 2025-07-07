const express = require('express');
const router = express.Router();
const pushNotificationService = require('../services/pushNotificationService');
const { verifyToken } = require('../middleware/auth');

// Save push token for a user
router.post('/save-token', verifyToken, async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!pushToken) {
      return res.status(400).json({ message: 'Push token is required' });
    }

    // Validate push token format
    if (!pushNotificationService.validatePushToken(pushToken)) {
      return res.status(400).json({ message: 'Invalid push token format' });
    }

    // Update user's push token based on role
    let UserModel;
    switch (userRole) {
      case 'customer':
        UserModel = require('../models/Customer');
        break;
      case 'vendor':
        UserModel = require('../models/Vendor');
        break;
      case 'delivery':
        UserModel = require('../models/DeliveryPerson');
        break;
      case 'admin':
        UserModel = require('../models/Admin');
        break;
      default:
        return res.status(400).json({ message: 'Invalid user role' });
    }

    await UserModel.findByIdAndUpdate(userId, { pushToken });

    res.json({ message: 'Push token saved successfully' });
  } catch (error) {
    console.error('Error saving push token:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send test notification
router.post('/send-test', verifyToken, async (req, res) => {
  try {
    const { title, body } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get user's push token
    let UserModel;
    switch (userRole) {
      case 'customer':
        UserModel = require('../models/Customer');
        break;
      case 'vendor':
        UserModel = require('../models/Vendor');
        break;
      case 'delivery':
        UserModel = require('../models/DeliveryPerson');
        break;
      case 'admin':
        UserModel = require('../models/Admin');
        break;
      default:
        return res.status(400).json({ message: 'Invalid user role' });
    }

    const user = await UserModel.findById(userId);
    if (!user.pushToken) {
      return res.status(400).json({ message: 'No push token found for user' });
    }

    await pushNotificationService.sendPushNotification(
      user.pushToken,
      title || 'Test Notification',
      body || 'This is a test notification from Gaon Zaika',
      { type: 'test' }
    );

    res.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send order status update notification
router.post('/order-status-update', verifyToken, async (req, res) => {
  try {
    const { orderId, status, customerId, restaurantName } = req.body;

    if (!orderId || !status || !customerId) {
      return res.status(400).json({ message: 'Order ID, status, and customer ID are required' });
    }

    // Get customer's push token
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(customerId);

    if (!customer || !customer.pushToken) {
      return res.status(400).json({ message: 'Customer not found or no push token available' });
    }

    await pushNotificationService.sendOrderStatusUpdate(
      customer.pushToken,
      orderId,
      status,
      restaurantName || 'Restaurant'
    );

    res.json({ message: 'Order status notification sent successfully' });
  } catch (error) {
    console.error('Error sending order status notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send new order notification to vendor
router.post('/new-order-vendor', verifyToken, async (req, res) => {
  try {
    const { orderId, vendorId, customerName, totalAmount } = req.body;

    if (!orderId || !vendorId || !customerName || !totalAmount) {
      return res.status(400).json({ message: 'Order ID, vendor ID, customer name, and total amount are required' });
    }

    // Get vendor's push token
    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findById(vendorId);

    if (!vendor || !vendor.pushToken) {
      return res.status(400).json({ message: 'Vendor not found or no push token available' });
    }

    await pushNotificationService.sendNewOrderToVendor(
      vendor.pushToken,
      orderId,
      customerName,
      totalAmount
    );

    res.json({ message: 'New order notification sent to vendor successfully' });
  } catch (error) {
    console.error('Error sending new order notification to vendor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send delivery update notification
router.post('/delivery-update', verifyToken, async (req, res) => {
  try {
    const { orderId, status, customerId, estimatedTime } = req.body;

    if (!orderId || !status || !customerId) {
      return res.status(400).json({ message: 'Order ID, status, and customer ID are required' });
    }

    // Get customer's push token
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(customerId);

    if (!customer || !customer.pushToken) {
      return res.status(400).json({ message: 'Customer not found or no push token available' });
    }

    await pushNotificationService.sendDeliveryUpdate(
      customer.pushToken,
      orderId,
      status,
      estimatedTime
    );

    res.json({ message: 'Delivery update notification sent successfully' });
  } catch (error) {
    console.error('Error sending delivery update notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send promotional notification to all customers
router.post('/promotional', verifyToken, async (req, res) => {
  try {
    const { title, body, promoCode } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can send promotional notifications' });
    }

    // Get all customers with push tokens
    const Customer = require('../models/Customer');
    const customers = await Customer.find({ pushToken: { $exists: true, $ne: null } });

    if (customers.length === 0) {
      return res.status(400).json({ message: 'No customers with push tokens found' });
    }

    const pushTokens = customers.map(customer => customer.pushToken);

    await pushNotificationService.sendPushNotificationToMultiple(
      pushTokens,
      title,
      body,
      { type: 'promotional', promoCode }
    );

    res.json({ 
      message: 'Promotional notification sent successfully',
      recipients: pushTokens.length
    });
  } catch (error) {
    console.error('Error sending promotional notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove push token (when user logs out or uninstalls app)
router.delete('/remove-token', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Remove push token based on role
    let UserModel;
    switch (userRole) {
      case 'customer':
        UserModel = require('../models/Customer');
        break;
      case 'vendor':
        UserModel = require('../models/Vendor');
        break;
      case 'delivery':
        UserModel = require('../models/DeliveryPerson');
        break;
      case 'admin':
        UserModel = require('../models/Admin');
        break;
      default:
        return res.status(400).json({ message: 'Invalid user role' });
    }

    await UserModel.findByIdAndUpdate(userId, { $unset: { pushToken: 1 } });

    res.json({ message: 'Push token removed successfully' });
  } catch (error) {
    console.error('Error removing push token:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 
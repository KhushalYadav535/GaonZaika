const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Vendor = require('../models/Vendor');
const DeliveryPerson = require('../models/DeliveryPerson');
const Admin = require('../models/Admin');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Middleware to get user details
const getUser = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    let user;

    switch (role) {
      case 'customer':
        user = await Customer.findById(id).select('-password');
        break;
      case 'vendor':
        user = await Vendor.findById(id).populate('restaurantId').select('-password');
        break;
      case 'delivery':
        user = await DeliveryPerson.findById(id).select('-password');
        break;
      case 'admin':
        user = await Admin.findById(id).select('-password');
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user role'
        });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.userDetails = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
};

// Role-based authorization middleware
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Specific role middlewares
const requireCustomer = authorizeRole('customer');
const requireVendor = authorizeRole('vendor');
const requireDelivery = authorizeRole('delivery');
const requireAdmin = authorizeRole('admin');

// Optional authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      
      // Get user details
      const { id, role } = decoded;
      let user;

      switch (role) {
        case 'customer':
          user = await Customer.findById(id).select('-password');
          break;
        case 'vendor':
          user = await Vendor.findById(id).populate('restaurantId').select('-password');
          break;
        case 'delivery':
          user = await DeliveryPerson.findById(id).select('-password');
          break;
        case 'admin':
          user = await Admin.findById(id).select('-password');
          break;
      }

      if (user) {
        req.userDetails = user;
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue without authentication
    next();
  }
};

module.exports = {
  verifyToken,
  getUser,
  authorizeRole,
  requireCustomer,
  requireVendor,
  requireDelivery,
  requireAdmin,
  optionalAuth
}; 
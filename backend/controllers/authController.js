const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Vendor = require('../models/Vendor');
const DeliveryPerson = require('../models/DeliveryPerson');
const Admin = require('../models/Admin');
const Restaurant = require('../models/Restaurant');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Customer Authentication
exports.registerCustomer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, phone, email, password } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email or phone already exists'
      });
    }

    // Create new customer
    const customer = new Customer({
      name,
      phone,
      email,
      password
    });

    await customer.save();

    // Generate token
    const token = generateToken(customer._id, 'customer');

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        token,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        }
      }
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

exports.loginCustomer = async (req, res) => {
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

    // Find customer by email
    const customer = await Customer.findOne({ email, isActive: true });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await customer.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await customer.updateLastLogin();

    // Generate token
    const token = generateToken(customer._id, 'customer');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          addresses: customer.addresses
        }
      }
    });

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Vendor Authentication
exports.registerVendor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, phone, email, password, restaurantName } = req.body;

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: 'Vendor with this email or phone already exists'
      });
    }

    // Create vendor first with a dummy restaurantId
    const dummyRestaurantId = new mongoose.Types.ObjectId();
    const vendor = new Vendor({
      name,
      phone,
      email,
      password,
      restaurantId: dummyRestaurantId, // Temporary ID
      pin: '1234' // Default PIN for demo
    });

    await vendor.save();

    // Create restaurant with vendor reference
    const restaurant = new Restaurant({
      name: restaurantName,
      cuisine: 'Mixed',
      rating: 0,
      deliveryTime: {
        min: 30,
        max: 45
      },
      minOrder: 100,
      isOpen: true,
      isActive: true,
      vendorId: vendor._id,
      contact: {
        phone: phone, // Use vendor's phone number
        email: email  // Use vendor's email
      }
    });

    await restaurant.save();

    // Update vendor with the real restaurant reference
    vendor.restaurantId = restaurant._id;
    await vendor.save();

    // Generate token
    const token = generateToken(vendor._id, 'vendor');

    res.status(201).json({
      success: true,
      message: 'Vendor registered successfully',
      data: {
        token,
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          restaurant: {
            id: restaurant._id,
            name: restaurant.name
          }
        }
      }
    });

  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

exports.loginVendor = async (req, res) => {
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

    // Find vendor by email
    const vendor = await Vendor.findOne({ email, isActive: true }).populate('restaurantId');

    if (!vendor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await vendor.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await vendor.updateLastLogin();

    // Generate token
    const token = generateToken(vendor._id, 'vendor');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          restaurant: vendor.restaurantId
        }
      }
    });

  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Delivery Person Authentication
exports.registerDelivery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, phone, email, password, vehicleNumber } = req.body;

    // Check if delivery person already exists
    const existingDelivery = await DeliveryPerson.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingDelivery) {
      return res.status(400).json({
        success: false,
        message: 'Delivery person with this email or phone already exists'
      });
    }

    // Create delivery person
    const deliveryPerson = new DeliveryPerson({
      name,
      phone,
      email,
      password,
      vehicleDetails: {
        type: 'Bike',
        number: vehicleNumber
      },
      pin: '5678' // Default PIN for demo
    });

    await deliveryPerson.save();

    // Generate token
    const token = generateToken(deliveryPerson._id, 'delivery');

    res.status(201).json({
      success: true,
      message: 'Delivery person registered successfully',
      data: {
        token,
        deliveryPerson: {
          id: deliveryPerson._id,
          name: deliveryPerson.name,
          email: deliveryPerson.email,
          phone: deliveryPerson.phone,
          vehicleDetails: deliveryPerson.vehicleDetails
        }
      }
    });

  } catch (error) {
    console.error('Delivery registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

exports.loginDelivery = async (req, res) => {
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

    // Find delivery person by email
    const deliveryPerson = await DeliveryPerson.findOne({ email, isActive: true });

    if (!deliveryPerson) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await deliveryPerson.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await deliveryPerson.updateLastLogin();

    // Generate token
    const token = generateToken(deliveryPerson._id, 'delivery');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        deliveryPerson: {
          id: deliveryPerson._id,
          name: deliveryPerson.name,
          email: deliveryPerson.email,
          phone: deliveryPerson.phone,
          vehicleDetails: deliveryPerson.vehicleDetails
        }
      }
    });

  } catch (error) {
    console.error('Delivery login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Admin Authentication
exports.registerAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Create admin
    const admin = new Admin({
      name,
      email,
      password,
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_users', 'manage_restaurants', 'manage_orders', 'view_analytics']
    });

    await admin.save();

    // Generate token
    const token = generateToken(admin._id, 'admin');

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

exports.loginAdmin = async (req, res) => {
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

    // Find admin by email
    const admin = await Admin.findOne({ email, isActive: true });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await admin.updateLastLogin();

    // Generate token
    const token = generateToken(admin._id, 'admin');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// PIN-based login (for demo purposes)
exports.loginWithPIN = async (req, res) => {
  try {
    const { pin, role } = req.body;

    let user, userRole;

    switch (role) {
      case 'vendor':
        user = await Vendor.findOne({ isActive: true }).populate('restaurantId');
        if (user && await user.comparePin(pin)) {
          userRole = 'vendor';
        } else {
          user = null;
        }
        break;
      case 'delivery':
        // PIN login removed for delivery - use email/password login instead
        user = null;
        break;
      case 'admin':
        // For admin, use static PIN check
        if (pin === process.env.ADMIN_PIN || pin === '9999') {
          user = { _id: 'admin', role: 'admin' };
          userRole = 'admin';
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN'
      });
    }

    // Generate token
    const token = generateToken(user._id, userRole);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          role: userRole,
          ...(user.name && { name: user.name }),
          ...(user.email && { email: user.email }),
          ...(user.phone && { phone: user.phone }),
          ...(user.restaurantId && { restaurant: user.restaurantId })
        }
      }
    });

  } catch (error) {
    console.error('PIN login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};
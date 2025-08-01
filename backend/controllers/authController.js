const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Vendor = require('../models/Vendor');
const DeliveryPerson = require('../models/DeliveryPerson');
const Admin = require('../models/Admin');
const Restaurant = require('../models/Restaurant');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sendOTP, sendVerificationOTP } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper to get model by role
const getModelByRole = (role) => {
  if (role === 'customer') return Customer;
  if (role === 'vendor') return Vendor;
  if (role === 'delivery') return DeliveryPerson;
  return null;
};

// Forgot Password (send OTP)
exports.forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and role are required.' });
    }
    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'Password reset not allowed for admin.' });
    }
    const Model = getModelByRole(role);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const user = await Model.findOne({ email });
    if (!user) {
      // Always respond with success for security
      return res.json({ success: true, message: 'If this email exists, an OTP has been sent.' });
    }
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    user.resetPasswordOTP = { code: otp, expiresAt };
    await user.save();
    // Send OTP via email
    try {
      await sendOTP(email, otp, 'Password Reset');
    } catch (e) {
      // Log but don't fail
      console.error('Error sending OTP email:', e);
    }
    return res.json({ success: true, message: 'If this email exists, an OTP has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request.' });
  }
};

// Reset Password (verify OTP)
exports.resetPassword = async (req, res) => {
  try {
    const { email, role, otp, newPassword } = req.body;
    if (!email || !role || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'Password reset not allowed for admin.' });
    }
    const Model = getModelByRole(role);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const user = await Model.findOne({ email });
    if (!user || !user.resetPasswordOTP || !user.resetPasswordOTP.code) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    if (user.resetPasswordOTP.code !== otp || new Date() > user.resetPasswordOTP.expiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    user.password = newPassword; // Password hashing should be in pre-save
    user.resetPasswordOTP = undefined;
    await user.save();
    return res.json({ success: true, message: 'Password reset successful.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

// Send Email Verification OTP
exports.sendVerificationOTP = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and role are required.' });
    }
    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'Email verification not allowed for admin.' });
    }
    const Model = getModelByRole(role);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const user = await Model.findOne({ email });
    if (!user) {
      // Always respond with success for security
      return res.json({ success: true, message: 'If this email exists, a verification OTP has been sent.' });
    }
    if (user.isEmailVerified) {
      return res.json({ success: true, message: 'Email is already verified.' });
    }
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    user.emailVerificationOTP = { code: otp, expiresAt };
    await user.save();
    // Send OTP via email
    try {
      await sendVerificationOTP(email, otp);
    } catch (e) {
      // Log but don't fail
      console.error('Error sending verification OTP email:', e);
    }
    return res.json({ success: true, message: 'If this email exists, a verification OTP has been sent.' });
  } catch (error) {
    console.error('Send verification OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request.' });
  }
};

// Verify Email OTP
exports.verifyEmailOTP = async (req, res) => {
  try {
    const { email, role, otp } = req.body;
    if (!email || !role || !otp) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'Email verification not allowed for admin.' });
    }
    const Model = getModelByRole(role);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const user = await Model.findOne({ email });
    if (!user || !user.emailVerificationOTP || !user.emailVerificationOTP.code) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    if (user.emailVerificationOTP.code !== otp || new Date() > user.emailVerificationOTP.expiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    await user.save();
    return res.json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Verify email OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify email.' });
  }
};

// Cleanup expired registration data
const cleanupExpiredRegistrationData = () => {
  if (!global.registrationData) return;
  
  const now = new Date();
  Object.keys(global.registrationData).forEach(email => {
    if (global.registrationData[email].expiresAt < now) {
      delete global.registrationData[email];
    }
  });
};

// Send Registration OTP
exports.sendRegistrationOTP = async (req, res) => {
  try {
    // Cleanup expired data first
    cleanupExpiredRegistrationData();
    
    const { name, phone, email, password, role, restaurantName, restaurantAddress, vehicleNumber } = req.body;
    
    if (!name || !phone || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All required fields are missing.' });
    }

    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin registration not allowed via this endpoint.' });
    }

    const Model = getModelByRole(role);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    // Check if user already exists
    const existingUser = await Model.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} with this email or phone already exists`
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Store registration data in session or temporary storage
    // For now, we'll store it in a temporary object (in production, use Redis or similar)
    const registrationData = {
      name,
      phone,
      email,
      password,
      role,
      restaurantName,
      restaurantAddress,
      vehicleNumber,
      otp,
      expiresAt
    };

    // Store in memory (in production, use Redis)
    global.registrationData = global.registrationData || {};
    global.registrationData[email] = registrationData;

    // Send OTP via email
    try {
      await sendVerificationOTP(email, otp);
    } catch (e) {
      console.error('Error sending registration OTP email:', e);
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }

    return res.json({ 
      success: true, 
      message: 'Registration OTP sent to your email. Please verify to complete registration.' 
    });

  } catch (error) {
    console.error('Send registration OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request.' });
  }
};

// Verify Registration OTP and Create Account
exports.verifyRegistrationOTP = async (req, res) => {
  try {
    // Cleanup expired data first
    cleanupExpiredRegistrationData();
    
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    // Get stored registration data
    if (!global.registrationData || !global.registrationData[email]) {
      return res.status(400).json({ success: false, message: 'Registration session expired. Please register again.' });
    }

    const registrationData = global.registrationData[email];

    // Check if OTP is expired
    if (new Date() > registrationData.expiresAt) {
      delete global.registrationData[email];
      return res.status(400).json({ success: false, message: 'OTP expired. Please register again.' });
    }

    // Verify OTP
    if (registrationData.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    const Model = getModelByRole(registrationData.role);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    let user;

    // Create user based on role
    switch (registrationData.role) {
      case 'customer':
        user = new Customer({
          name: registrationData.name,
          phone: registrationData.phone,
          email: registrationData.email,
          password: registrationData.password,
          isEmailVerified: true // Mark as verified since OTP was verified
        });
        break;

      case 'vendor':
        // Create vendor first with a dummy restaurantId
        const dummyRestaurantId = new mongoose.Types.ObjectId();
        user = new Vendor({
          name: registrationData.name,
          phone: registrationData.phone,
          email: registrationData.email,
          password: registrationData.password,
          restaurantId: dummyRestaurantId,
          pin: '1234',
          isEmailVerified: true
        });

        await user.save();

        // Create restaurant with vendor reference
        const restaurant = new Restaurant({
          name: registrationData.restaurantName,
          cuisine: 'Mixed',
          rating: 0,
          deliveryTime: {
            min: 30,
            max: 45
          },
          minOrder: 100,
          isOpen: true,
          isActive: true,
          vendorId: user._id,
          contact: {
            phone: registrationData.phone,
            email: registrationData.email
          },
          address: {
            fullAddress: registrationData.restaurantAddress || 'Address to be set',
            street: '',
            city: '',
            state: '',
            pincode: ''
          },
          location: {
            type: 'Point',
            coordinates: [0, 0]
          }
        });

        await restaurant.save();

        // Update vendor with the real restaurant reference
        user.restaurantId = restaurant._id;
        await user.save();
        break;

      case 'delivery':
        user = new DeliveryPerson({
          name: registrationData.name,
          phone: registrationData.phone,
          email: registrationData.email,
          password: registrationData.password,
          vehicleDetails: {
            type: 'Bike',
            number: registrationData.vehicleNumber
          },
          isEmailVerified: true
        });
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    if (registrationData.role !== 'vendor') {
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id, registrationData.role);

    // Clean up registration data
    delete global.registrationData[email];

    // Prepare response data based on role
    let responseData = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    };

    if (registrationData.role === 'vendor') {
      responseData.user.restaurant = {
        id: user.restaurantId,
        name: registrationData.restaurantName
      };
    } else if (registrationData.role === 'delivery') {
      responseData.user.vehicleDetails = user.vehicleDetails;
    }

    res.status(201).json({
      success: true,
      message: `${registrationData.role.charAt(0).toUpperCase() + registrationData.role.slice(1)} registered successfully`,
      data: responseData
    });

  } catch (error) {
    console.error('Verify registration OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
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

    // Generate OTP for registration
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Store registration data temporarily
    global.registrationData = global.registrationData || {};
    global.registrationData[email] = {
      name,
      phone,
      email,
      password,
      role: 'customer',
      otp,
      expiresAt
    };

    // Send OTP via email
    try {
      await sendVerificationOTP(email, otp);
    } catch (e) {
      console.error('Error sending registration OTP email:', e);
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }

    res.json({
      success: true,
      message: 'Registration OTP sent to your email. Please verify to complete registration.'
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

    const { name, phone, email, password, restaurantName, restaurantAddress } = req.body;

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

    // Generate OTP for registration
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Store registration data temporarily
    global.registrationData = global.registrationData || {};
    global.registrationData[email] = {
      name,
      phone,
      email,
      password,
      role: 'vendor',
      restaurantName,
      restaurantAddress,
      otp,
      expiresAt
    };

    // Send OTP via email
    try {
      await sendVerificationOTP(email, otp);
    } catch (e) {
      console.error('Error sending registration OTP email:', e);
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }

    res.json({
      success: true,
      message: 'Registration OTP sent to your email. Please verify to complete registration.'
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

    // Generate OTP for registration
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Store registration data temporarily
    global.registrationData = global.registrationData || {};
    global.registrationData[email] = {
      name,
      phone,
      email,
      password,
      role: 'delivery',
      vehicleNumber,
      otp,
      expiresAt
    };

    // Send OTP via email
    try {
      await sendVerificationOTP(email, otp);
    } catch (e) {
      console.error('Error sending registration OTP email:', e);
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }

    res.json({
      success: true,
      message: 'Registration OTP sent to your email. Please verify to complete registration.'
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

exports.validateToken = async (req, res) => {
  try {
    // The auth middleware already verified the token
    // We just need to return the user info
    const { id, role } = req.user;
    
    let userData;
    
    switch (role) {
      case 'customer':
        const customer = await Customer.findById(id).select('-password');
        if (!customer || !customer.isActive) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or inactive account'
          });
        }
        userData = {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          addresses: customer.addresses
        };
        break;
        
      case 'vendor':
        const vendor = await Vendor.findById(id).populate('restaurant').select('-password');
        if (!vendor || !vendor.isActive) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or inactive account'
          });
        }
        userData = {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          restaurant: vendor.restaurant
        };
        break;
        
      case 'delivery':
        const deliveryPerson = await DeliveryPerson.findById(id).select('-password');
        if (!deliveryPerson || !deliveryPerson.isActive) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or inactive account'
          });
        }
        userData = {
          id: deliveryPerson._id,
          name: deliveryPerson.name,
          email: deliveryPerson.email,
          phone: deliveryPerson.phone,
          vehicleNumber: deliveryPerson.vehicleNumber
        };
        break;
        
      case 'admin':
        const admin = await Admin.findById(id).select('-password');
        if (!admin || !admin.isActive) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or inactive account'
          });
        }
        userData = {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user role'
        });
    }
    
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: userData,
        role: role
      }
    });
    
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Token validation failed',
      error: error.message
    });
  }
};
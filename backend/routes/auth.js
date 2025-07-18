const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Validation middleware
const validateRegistration = (role) => {
  const validations = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ];

  switch (role) {
    case 'customer':
      validations.push(
        body('name').notEmpty().withMessage('Name is required'),
        body('phone').isMobilePhone('en-IN').withMessage('Valid phone number is required')
      );
      break;
    case 'vendor':
      validations.push(
        body('name').notEmpty().withMessage('Name is required'),
        body('phone').isMobilePhone('en-IN').withMessage('Valid phone number is required'),
        body('restaurantName').notEmpty().withMessage('Restaurant name is required')
      );
      break;
    case 'delivery':
      validations.push(
        body('name').notEmpty().withMessage('Name is required'),
        body('phone').isMobilePhone('en-IN').withMessage('Valid phone number is required'),
        body('vehicleNumber').notEmpty().withMessage('Vehicle number is required')
      );
      break;
    case 'admin':
      validations.push(
        body('name').notEmpty().withMessage('Name is required')
      );
      break;
  }

  return validations;
};

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Customer Routes
router.post('/customer/register', validateRegistration('customer'), authController.registerCustomer);
router.post('/customer/login', validateLogin, authController.loginCustomer);

// Vendor Routes
router.post('/vendor/register', validateRegistration('vendor'), authController.registerVendor);
router.post('/vendor/login', validateLogin, authController.loginVendor);

// Delivery Routes
router.post('/delivery/register', validateRegistration('delivery'), authController.registerDelivery);
router.post('/delivery/login', validateLogin, authController.loginDelivery);

// Admin Routes
router.post('/admin/register', validateRegistration('admin'), authController.registerAdmin);
router.post('/admin/login', validateLogin, authController.loginAdmin);

// PIN-based login (for demo purposes)
router.post('/pin-login', [
  body('pin').isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits'),
  body('role').isIn(['vendor', 'delivery', 'admin']).withMessage('Valid role is required')
], authController.loginWithPIN);

// Forgot/Reset Password (all roles except admin)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Email Verification (all roles except admin)
router.post('/send-verification-otp', authController.sendVerificationOTP);
router.post('/verify-email-otp', authController.verifyEmailOTP);

// Token validation (protected route)
router.get('/validate-token', verifyToken, authController.validateToken);

// Health check for auth routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 
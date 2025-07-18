const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  addresses: [{
    label: {
      type: String,
      default: 'Home'
    },
    address: {
      type: String,
      required: true
    },
    pincode: String,
    lat: Number,
    lng: Number,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  preferences: {
    favoriteRestaurants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant'
    }],
    dietaryRestrictions: [String],
    notificationSettings: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      newRestaurants: { type: Boolean, default: true }
    }
  },
  pushToken: {
    type: String,
    default: null
  },
  resetPasswordOTP: {
    code: String,
    expiresAt: Date
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: {
    code: String,
    expiresAt: Date
  }
}, {
  timestamps: true
});

// Indexes
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
customerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
customerSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Method to add address
customerSchema.methods.addAddress = function(addressData) {
  if (addressData.isDefault) {
    // Remove default from other addresses
    this.addresses.forEach(addr => addr.isDefault = false);
  }
  this.addresses.push(addressData);
  return this.save();
};

// Method to update address
customerSchema.methods.updateAddress = function(addressId, addressData) {
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }
  
  if (addressData.isDefault) {
    this.addresses.forEach(addr => addr.isDefault = false);
  }
  
  Object.assign(address, addressData);
  return this.save();
};

// Method to remove address
customerSchema.methods.removeAddress = function(addressId) {
  this.addresses = this.addresses.filter(addr => addr._id.toString() !== addressId);
  return this.save();
};

// Static method to find active customers
customerSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('Customer', customerSchema); 
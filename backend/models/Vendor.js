const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  pin: {
    type: String,
    required: true,
    minlength: 4
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    fullAddress: String
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String
  },
  documents: {
    panCard: String,
    aadharCard: String,
    gstNumber: String,
    fssaiLicense: String
  },
  commission: {
    type: Number,
    default: 10, // 10% commission
    min: 0,
    max: 100
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
  },
  isLive: {
    type: Boolean,
    default: false
  },
  lastLiveToggle: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
vendorSchema.index({ email: 1 });
vendorSchema.index({ phone: 1 });
vendorSchema.index({ restaurantId: 1 });
vendorSchema.index({ isActive: 1 });

// Pre-save middleware to hash password and PIN
vendorSchema.pre('save', async function(next) {
  try {
    // Hash password if modified
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    // Hash PIN if modified
    if (this.isModified('pin')) {
      const salt = await bcrypt.genSalt(10);
      this.pin = await bcrypt.hash(this.pin, salt);
    }
    
    // Set full address
    if (this.address.street && this.address.city && this.address.state && this.address.pincode) {
      this.address.fullAddress = `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
vendorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare PIN
vendorSchema.methods.comparePin = async function(candidatePin) {
  return await bcrypt.compare(candidatePin, this.pin);
};

// Method to update last login
vendorSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find active vendors
vendorSchema.statics.findActive = function() {
  return this.find({ isActive: true }).populate('restaurantId');
};

// Method to toggle live status
vendorSchema.methods.toggleLiveStatus = async function() {
  this.isLive = !this.isLive;
  this.lastLiveToggle = new Date();
  
  // Update restaurant's isOpen status based on vendor's live status
  if (this.restaurantId) {
    const Restaurant = require('./Restaurant');
    await Restaurant.findByIdAndUpdate(this.restaurantId, {
      isOpen: this.isLive
    });
  }
  
  return this.save();
};

// Method to go live
vendorSchema.methods.goLive = async function() {
  this.isLive = true;
  this.lastLiveToggle = new Date();
  
  // Update restaurant's isOpen status
  if (this.restaurantId) {
    const Restaurant = require('./Restaurant');
    await Restaurant.findByIdAndUpdate(this.restaurantId, {
      isOpen: true
    });
  }
  
  return this.save();
};

// Method to go offline
vendorSchema.methods.goOffline = async function() {
  this.isLive = false;
  this.lastLiveToggle = new Date();
  
  // Update restaurant's isOpen status
  if (this.restaurantId) {
    const Restaurant = require('./Restaurant');
    await Restaurant.findByIdAndUpdate(this.restaurantId, {
      isOpen: false
    });
  }
  
  return this.save();
};

// Virtual for formatted address
vendorSchema.virtual('addressFormatted').get(function() {
  if (this.address.fullAddress) {
    return this.address.fullAddress;
  }
  return `${this.address.street || ''}, ${this.address.city || ''}, ${this.address.state || ''} - ${this.address.pincode || ''}`.trim();
});

module.exports = mongoose.model('Vendor', vendorSchema); 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const deliveryPersonSchema = new mongoose.Schema({
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
  // PIN field removed - using email/password login instead
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    fullAddress: String
  },
  vehicleDetails: {
    type: {
      type: String,
      enum: ['Bike', 'Scooter', 'Cycle', 'Car'],
      default: 'Bike'
    },
    number: String,
    model: String
  },
  documents: {
    drivingLicense: String,
    aadharCard: String,
    panCard: String,
    vehicleRC: String,
    insurance: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
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
  earnings: {
    totalEarnings: {
      type: Number,
      default: 0
    },
    thisMonth: {
      type: Number,
      default: 0
    },
    thisWeek: {
      type: Number,
      default: 0
    }
  },
  deliveryStats: {
    totalDeliveries: {
      type: Number,
      default: 0
    },
    completedDeliveries: {
      type: Number,
      default: 0
    },
    cancelledDeliveries: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  commission: {
    type: Number,
    default: 15, // 15% commission per delivery
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
  }
}, {
  timestamps: true
});

// Indexes
deliveryPersonSchema.index({ email: 1 });
deliveryPersonSchema.index({ phone: 1 });
deliveryPersonSchema.index({ isActive: 1 });
deliveryPersonSchema.index({ isAvailable: 1 });
deliveryPersonSchema.index({ currentLocation: '2dsphere' });

// Pre-save middleware to hash password and PIN
deliveryPersonSchema.pre('save', async function(next) {
  try {
    // Hash password if modified
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    // PIN hashing removed - using email/password login instead
    
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
deliveryPersonSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// PIN comparison method removed - using email/password login instead

// Method to update last login
deliveryPersonSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Method to update location
deliveryPersonSchema.methods.updateLocation = function(latitude, longitude) {
  this.currentLocation.coordinates = [longitude, latitude];
  return this.save();
};

// Method to update availability
deliveryPersonSchema.methods.updateAvailability = function(isAvailable) {
  this.isAvailable = isAvailable;
  return this.save();
};

// Method to add earnings
deliveryPersonSchema.methods.addEarnings = function(amount) {
  this.earnings.totalEarnings += amount;
  this.earnings.thisMonth += amount;
  this.earnings.thisWeek += amount;
  return this.save();
};

// Method to update delivery stats
deliveryPersonSchema.methods.updateDeliveryStats = function(status, rating = null) {
  this.deliveryStats.totalDeliveries += 1;
  
  if (status === 'Delivered') {
    this.deliveryStats.completedDeliveries += 1;
  } else if (status === 'Cancelled') {
    this.deliveryStats.cancelledDeliveries += 1;
  }
  
  if (rating) {
    const totalRating = (this.deliveryStats.averageRating * this.deliveryStats.totalRatings) + rating;
    this.deliveryStats.totalRatings += 1;
    this.deliveryStats.averageRating = totalRating / this.deliveryStats.totalRatings;
  }
  
  return this.save();
};

// Static method to find available delivery persons
deliveryPersonSchema.statics.findAvailable = function() {
  return this.find({ isActive: true, isAvailable: true });
};

// Static method to find delivery persons by location
deliveryPersonSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    isActive: true,
    isAvailable: true,
    currentLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// Virtual for formatted address
deliveryPersonSchema.virtual('addressFormatted').get(function() {
  if (this.address.fullAddress) {
    return this.address.fullAddress;
  }
  return `${this.address.street || ''}, ${this.address.city || ''}, ${this.address.state || ''} - ${this.address.pincode || ''}`.trim();
});

// Virtual for completion rate
deliveryPersonSchema.virtual('completionRate').get(function() {
  if (this.deliveryStats.totalDeliveries === 0) return 0;
  return (this.deliveryStats.completedDeliveries / this.deliveryStats.totalDeliveries) * 100;
});

module.exports = mongoose.model('DeliveryPerson', deliveryPersonSchema);
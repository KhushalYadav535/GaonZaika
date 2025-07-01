const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Breads']
  },
  image: {
    type: String,
    default: null
  },
  isVeg: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    default: 15 // in minutes
  }
}, { timestamps: true });

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  cuisine: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    fullAddress: String
  },
  contact: {
    phone: {
      type: String,
      required: true
    },
    email: String
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  deliveryTime: {
    min: {
      type: Number,
      default: 30
    },
    max: {
      type: Number,
      default: 45
    }
  },
  minOrder: {
    type: Number,
    default: 100
  },
  deliveryFee: {
    type: Number,
    default: 20
  },
  image: {
    type: String,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  menu: [menuItemSchema],
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  }
}, {
  timestamps: true
});

// Index for better query performance
restaurantSchema.index({ name: 'text', cuisine: 'text' });
restaurantSchema.index({ isOpen: 1, isActive: 1 });
restaurantSchema.index({ vendorId: 1 });

// Virtual for formatted delivery time
restaurantSchema.virtual('deliveryTimeFormatted').get(function() {
  return `${this.deliveryTime.min}-${this.deliveryTime.max} min`;
});

// Method to calculate average rating
restaurantSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating * this.totalRatings) + newRating;
  this.totalRatings += 1;
  this.rating = totalRating / this.totalRatings;
  return this.save();
};

// Static method to find open restaurants
restaurantSchema.statics.findOpen = function() {
  return this.find({ isOpen: true, isActive: true });
};

// Pre-save middleware to ensure full address is set
restaurantSchema.pre('save', function(next) {
  if (this.address.street && this.address.city && this.address.state && this.address.pincode) {
    this.address.fullAddress = `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
  }
  next();
});

module.exports = mongoose.model('Restaurant', restaurantSchema); 
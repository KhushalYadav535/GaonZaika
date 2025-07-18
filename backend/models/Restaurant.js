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
    url: {
      type: String,
      default: null
    },
    publicId: {
      type: String,
      default: null
    }
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
  // Location coordinates for distance calculation
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
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
// Geospatial index for location-based queries
restaurantSchema.index({ location: '2dsphere' });

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

// Method to update location coordinates
restaurantSchema.methods.updateLocation = function(latitude, longitude) {
  this.location.coordinates = [longitude, latitude];
  return this.save();
};

// Static method to find open restaurants
restaurantSchema.statics.findOpen = function() {
  return this.find({ isOpen: true, isActive: true });
};

// Static method to find restaurants within a certain distance
restaurantSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    isActive: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    }
  });
};

// Static method to find restaurants within distance and apply filters
restaurantSchema.statics.findNearbyWithFilters = function(longitude, latitude, maxDistance = 10000, filters = {}) {
  const query = {
    isActive: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  };

  // Apply additional filters
  if (filters.isOpen !== undefined) {
    query.isOpen = filters.isOpen;
  }
  
  if (filters.cuisine) {
    query.cuisine = { $regex: filters.cuisine, $options: 'i' };
  }
  
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { cuisine: { $regex: filters.search, $options: 'i' } }
    ];
  }

  // Filter by live restaurants if specified
  if (filters.liveRestaurantIds) {
    query._id = { $in: filters.liveRestaurantIds };
  }
  
  // Filter by all restaurant IDs if specified (for showing all restaurants)
  if (filters.allRestaurantIds && filters.allRestaurantIds.length > 0) {
    query._id = { $in: filters.allRestaurantIds };
  }

  return this.find(query);
};

// Pre-save middleware to ensure full address is set
restaurantSchema.pre('save', function(next) {
  if (this.address.street && this.address.city && this.address.state && this.address.pincode) {
    this.address.fullAddress = `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
  }
  next();
});

module.exports = mongoose.model('Restaurant', restaurantSchema); 
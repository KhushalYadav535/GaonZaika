const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['percentage', 'flat', 'free_delivery', 'bogo'],
    required: true
  },
  value: {
    type: Number,
    default: 0  // percentage or flat amount; 0 for free_delivery
  },
  minOrder: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number,
    default: null  // cap on discount amount
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null  // null = applies to all restaurants
  },
  image: {
    type: String,
    default: null
  },
  backgroundColor: {
    type: String,
    default: '#FF5722'
  },
  validFrom: {
    type: Date,
    required: true
  },
  validTo: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0  // for sorting banners
  },
  clickCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

offerSchema.index({ isActive: 1, validTo: 1 });
offerSchema.index({ restaurantId: 1 });

// Virtual: is this offer currently valid?
offerSchema.virtual('isValid').get(function () {
  const now = new Date();
  return this.isActive && this.validFrom <= now && this.validTo >= now;
});

module.exports = mongoose.model('Offer', offerSchema);

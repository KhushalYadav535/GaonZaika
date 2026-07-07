const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  type: {
    type: String,
    enum: ['percentage', 'flat', 'free_delivery', 'bogo', 'buy_2_get_1', 'free_item', 'custom'],
    required: true
  },
  discount: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  customLabel: {
    type: String,
    default: ''
  },
  minOrder: {
    type: Number,
    default: 0
  },
  usageLimit: {
    type: Number,
    default: 100
  },
  usedCount: {
    type: Number,
    default: 0
  },
  applicableRestaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
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
  // ─── Affiliate Fields ───────────────────────────────────────
  // Is this coupon linked to an affiliate partner?
  isAffiliate: {
    type: Boolean,
    default: false
  },
  // Reference to the Affiliate document
  affiliateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Affiliate',
    default: null
  },
  // Commission amount (flat ₹) that the affiliate earns per order
  // This is SEPARATE from the discount given to the customer
  commissionAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validTo: 1 });

// Check if coupon is still valid
couponSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.isActive &&
    this.validFrom <= now &&
    this.validTo >= now &&
    this.usedCount < this.usageLimit
  );
};

module.exports = mongoose.model('Coupon', couponSchema);

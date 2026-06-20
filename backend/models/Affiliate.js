const mongoose = require('mongoose');

const affiliateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  // Linked coupon code (same as coupon's code field)
  couponCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  // Reference to the Coupon document
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null
  },
  // Commission per order (flat ₹ amount — separate from discount given to customer)
  commissionPerOrder: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  // Stats
  totalOrders: {
    type: Number,
    default: 0
  },
  totalCommissionEarned: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  pendingCommission: {
    type: Number,
    default: 0
  },
  // Bank / UPI details for payout
  payoutDetails: {
    upiId: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    accountHolderName: { type: String, default: '' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

affiliateSchema.index({ couponCode: 1 });
affiliateSchema.index({ isActive: 1 });

// Method: Add commission when an order comes in
affiliateSchema.methods.addCommission = function (amount) {
  this.totalOrders += 1;
  this.totalCommissionEarned += amount;
  this.pendingCommission += amount;
  return this.save();
};

// Method: Mark commission as paid
affiliateSchema.methods.markPaid = function (amount) {
  const toPay = amount || this.pendingCommission;
  this.totalPaid += toPay;
  this.pendingCommission = Math.max(0, this.pendingCommission - toPay);
  return this.save();
};

module.exports = mongoose.model('Affiliate', affiliateSchema);

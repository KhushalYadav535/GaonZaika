const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'role' // Dynamic ref based on the 'role' field
  },
  role: {
    type: String,
    required: true,
    enum: ['Vendor', 'DeliveryPerson']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  transactionRef: {
    type: String, // Bank UTR or UPI ref
    default: null
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  paidAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
payoutSchema.index({ userId: 1, status: 1 });
payoutSchema.index({ periodStart: 1, periodEnd: 1 });

module.exports = mongoose.model('Payout', payoutSchema);

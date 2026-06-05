const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
  // Only one config document should exist, so we can use a fixed identifier
  configId: {
    type: String,
    default: 'global_config',
    unique: true
  },
  isRainModeActive: {
    type: Boolean,
    default: false
  },
  surgeFeeType: {
    type: String,
    enum: ['flat', 'percentage'],
    default: 'flat'
  },
  surgeFeeValue: {
    type: Number,
    default: 0
  },
  isPeakHoursActive: {
    type: Boolean,
    default: false
  },
  deliveryCharge: {
    type: Number,
    default: 8
  },
  customerDeliveryFee: {
    type: Number,
    default: 20
  },
  freeDeliveryThreshold: {
    type: Number,
    default: 0 // 0 means no free delivery by default, unless configured
  },
  // We can add other global configs here later (e.g. app maintenance mode)
  isMaintenanceMode: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AppConfig', appConfigSchema);

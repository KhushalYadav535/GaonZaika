const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['all', 'customers', 'vendors', 'delivery'],
    default: 'all'
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);

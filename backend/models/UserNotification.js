const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer', // We are building this mainly for customers first
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['order_update', 'promotional', 'system', 'offer'],
    default: 'system'
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // e.g., { orderId: '...' }
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserNotification', userNotificationSchema);

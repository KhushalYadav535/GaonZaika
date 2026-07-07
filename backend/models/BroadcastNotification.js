const mongoose = require('mongoose');

const broadcastNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  targetAudience: {
    type: String,
    enum: ['all', 'customers', 'vendors', 'delivery'],
    default: 'all',
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false,
  },
  recipientCount: {
    type: Number,
    default: 0,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent',
  },
}, {
  timestamps: true,
});

broadcastNotificationSchema.index({ sentAt: -1 });

module.exports = mongoose.model('BroadcastNotification', broadcastNotificationSchema);

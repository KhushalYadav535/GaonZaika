const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetId: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);

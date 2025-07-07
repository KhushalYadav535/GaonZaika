const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'manage_users', 'manage_restaurants', 'manage_orders', 'view_analytics']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  pushToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
adminSchema.index({ email: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ role: 1 });

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
adminSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Method to check permission
adminSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Static method to find active admins
adminSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to create default admin
adminSchema.statics.createDefaultAdmin = async function() {
  const defaultAdmin = await this.findOne({ email: 'admin@gaonzaika.com' });
  if (!defaultAdmin) {
    await this.create({
      name: 'Super Admin',
      email: 'admin@gaonzaika.com',
      password: 'Khushal@2003',
      role: 'super_admin',
      permissions: ['read', 'write', 'delete', 'manage_users', 'manage_restaurants', 'manage_orders', 'view_analytics']
    });
    console.log('Default admin created');
  }
};

module.exports = mongoose.model('Admin', adminSchema); 
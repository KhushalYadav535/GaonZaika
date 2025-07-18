const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant.menu',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    default: function() {
      return `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  customerInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    email: String
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 20
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Order Placed', 'Accepted', 'Preparing', 'Ready for Delivery', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Order Placed'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'Online Payment'],
    default: 'Cash on Delivery'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPerson',
    default: null
  },
  estimatedDeliveryTime: {
    type: Date,
    default: null
  },
  actualDeliveryTime: {
    type: Date,
    default: null
  },
  otp: {
    code: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  notes: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  review: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  cancellationReason: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ orderId: 1 });
orderSchema.index({ restaurantId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'customerInfo.phone': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ deliveryPersonId: 1 });

// Pre-save middleware to generate order ID
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  if (newStatus === 'Out for Delivery') {
    // Set estimated delivery time (30-45 minutes from now)
    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + Math.floor(Math.random() * 15) + 30);
    this.estimatedDeliveryTime = estimatedTime;
  }
  
  if (newStatus === 'Delivered') {
    this.actualDeliveryTime = new Date();
  }
  
  return this.save();
};

// Method to generate OTP
orderSchema.methods.generateOTP = function() {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes
  
  this.otp = {
    code: otp,
    expiresAt: expiresAt
  };
  
  return this.save();
};

// Method to verify OTP
orderSchema.methods.verifyOTP = function(inputOTP) {
  if (!this.otp || !this.otp.code) {
    return false;
  }
  
  if (new Date() > this.otp.expiresAt) {
    return false;
  }
  
  return this.otp.code === inputOTP;
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status, isActive: true });
};

// Static method to find orders by restaurant
orderSchema.statics.findByRestaurant = function(restaurantId) {
  return this.find({ restaurantId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find orders by delivery person
orderSchema.statics.findByDeliveryPerson = function(deliveryPersonId) {
  return this.find({ deliveryPersonId, isActive: true }).sort({ createdAt: -1 });
};

// Virtual for order duration
orderSchema.virtual('duration').get(function() {
  if (this.actualDeliveryTime && this.createdAt) {
    const duration = this.actualDeliveryTime - this.createdAt;
    return Math.round(duration / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for formatted status
orderSchema.virtual('statusFormatted').get(function() {
  return this.status.replace(/([A-Z])/g, ' $1').trim();
});

module.exports = mongoose.model('Order', orderSchema); 
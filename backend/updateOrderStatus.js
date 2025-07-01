const mongoose = require('mongoose');
const Order = require('./models/Order');

async function updateOrderStatus() {
  try {
    await mongoose.connect('mongodb+srv://infoniict3:u3LxBHUbcVwNJhG2@gaonzaika.azbxae5.mongodb.net/');
    console.log('Connected to MongoDB');
    
    // Find an order in "Order Placed" status
    const order = await Order.findOne({ status: 'Order Placed' });
    
    if (!order) {
      console.log('No order in "Order Placed" status found');
      return;
    }
    
    console.log(`Found order: ${order.orderId} (Status: ${order.status})`);
    
    // Update status to "Out for Delivery"
    order.status = 'Out for Delivery';
    await order.save();
    
    console.log(`Updated order ${order.orderId} to "Out for Delivery" status`);
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

updateOrderStatus(); 
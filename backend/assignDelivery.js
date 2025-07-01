const mongoose = require('mongoose');
const Order = require('./models/Order');
const DeliveryPerson = require('./models/DeliveryPerson');

async function assignDelivery() {
  try {
    await mongoose.connect('mongodb+srv://infoniict3:u3LxBHUbcVwNJhG2@gaonzaika.azbxae5.mongodb.net/');
    console.log('Connected to MongoDB');
    
    // Find available delivery person
    const deliveryPerson = await DeliveryPerson.findOne({
      isActive: true,
      isAvailable: true
    });
    
    if (!deliveryPerson) {
      console.log('No available delivery person found');
      return;
    }
    
    console.log(`Using delivery person: ${deliveryPerson.name} (${deliveryPerson.email})`);
    
    // Find orders that need delivery assignment
    const ordersToAssign = await Order.find({
      status: 'Out for Delivery',
      deliveryPersonId: null
    });
    
    console.log(`Found ${ordersToAssign.length} orders to assign`);
    
    // Assign delivery person to orders
    for (const order of ordersToAssign) {
      order.deliveryPersonId = deliveryPerson._id;
      await order.save();
      console.log(`Assigned order ${order.orderId} to ${deliveryPerson.name}`);
    }
    
    console.log('Delivery assignment completed');
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

assignDelivery(); 
const mongoose = require('mongoose');
const Order = require('./models/Order');
const DeliveryPerson = require('./models/DeliveryPerson');

async function checkOrders() {
  try {
    await mongoose.connect('mongodb+srv://infoniict3:u3LxBHUbcVwNJhG2@gaonzaika.azbxae5.mongodb.net/');
    console.log('Connected to MongoDB');
    
    // Check all orders
    const orders = await Order.find({}).populate('deliveryPersonId', 'name email isAvailable');
    console.log('\n=== ALL ORDERS ===');
    orders.forEach(order => {
      console.log(`Order ID: ${order.orderId}`);
      console.log(`Status: ${order.status}`);
      console.log(`Delivery Person: ${order.deliveryPersonId ? order.deliveryPersonId.name : 'Not Assigned'}`);
      console.log(`Delivery Person Available: ${order.deliveryPersonId ? order.deliveryPersonId.isAvailable : 'N/A'}`);
      console.log('---');
    });
    
    // Check available delivery persons
    const deliveryPersons = await DeliveryPerson.find({ isActive: true });
    console.log('\n=== AVAILABLE DELIVERY PERSONS ===');
    deliveryPersons.forEach(dp => {
      console.log(`Name: ${dp.name}`);
      console.log(`Email: ${dp.email}`);
      console.log(`Is Available: ${dp.isAvailable}`);
      console.log(`Is Active: ${dp.isActive}`);
      console.log('---');
    });
    
    // Check orders that need delivery assignment
    const ordersNeedingDelivery = await Order.find({ 
      status: 'Out for Delivery',
      deliveryPersonId: null 
    });
    console.log('\n=== ORDERS NEEDING DELIVERY ASSIGNMENT ===');
    console.log(`Count: ${ordersNeedingDelivery.length}`);
    ordersNeedingDelivery.forEach(order => {
      console.log(`Order ID: ${order.orderId}, Status: ${order.status}`);
    });
    
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOrders(); 
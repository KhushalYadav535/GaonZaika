const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const DeliveryPerson = require('./models/DeliveryPerson');
const Order = require('./models/Order');

async function fixOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gaonzaika');
    console.log('Connected to DB');

    const hemant = await DeliveryPerson.findOne({ name: { $regex: 'hemant', $options: 'i' } });
    if (!hemant) {
      console.log('Delivery boy named Hemant not found!');
      process.exit(1);
    }
    console.log('Found Hemant:', hemant._id, hemant.name);

    // Find orders for Akhil Saroj
    const orders = await Order.find({ 
      'customerInfo.name': { $regex: 'akhil saroj', $options: 'i' } 
    }).sort({ createdAt: -1 }).limit(1);

    if (orders.length === 0) {
      console.log('No orders found for Akhil Saroj!');
      process.exit(1);
    }

    console.log(`Found ${orders.length} orders for Akhil Saroj. Updating...`);

    for (const order of orders) {
      order.deliveryPersonId = hemant._id;
      order.status = 'Delivered';
      await order.save();
      console.log(`Successfully assigned order ${order.orderId} to Hemant and marked as Delivered!`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fixOrders();

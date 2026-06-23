const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const DeliveryPerson = require('./models/DeliveryPerson');
const Order = require('./models/Order');

async function fixOrder() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gaonzaika');
    console.log('Connected to DB');

    const hemant = await DeliveryPerson.findOne({ name: { $regex: 'hemant', $options: 'i' } });
    if (!hemant) {
      console.log('Delivery boy named Hemant not found!');
      process.exit(1);
    }
    console.log('Found Hemant:', hemant._id, hemant.name);

    const order = await Order.findOne({ status: 'Out for Delivery', deliveryPersonId: null }).sort({ createdAt: -1 });
    if (!order) {
      console.log('No unassigned Out for Delivery order found!');
      process.exit(1);
    }
    console.log('Found unassigned order:', order.orderId);

    order.deliveryPersonId = hemant._id;
    await order.save();
    console.log('Successfully assigned order', order.orderId, 'to Hemant!');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fixOrder();

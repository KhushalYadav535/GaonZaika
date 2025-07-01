const mongoose = require('mongoose');
const Order = require('./models/Order');
const DeliveryPerson = require('./models/DeliveryPerson');

async function assignToKhushal() {
  await mongoose.connect('mongodb+srv://infoniict3:u3LxBHUbcVwNJhG2@gaonzaika.azbxae5.mongodb.net/');
  const khushal = await DeliveryPerson.findOne({ email: 'khushalyadav535@gmail.com' });
  if (!khushal) {
    console.log('Khushal Yadav not found');
    await mongoose.connection.close();
    return;
  }
  const order = await Order.findOne({ status: 'Out for Delivery' });
  if (!order) {
    console.log('No Out for Delivery order found');
    await mongoose.connection.close();
    return;
  }
  order.deliveryPersonId = khushal._id;
  await order.save();
  console.log(`Order ${order.orderId} assigned to Khushal Yadav`);
  await mongoose.connection.close();
}
assignToKhushal(); 
const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order');
const Customer = require('./models/Customer');

async function checkPhoneMismatch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gaonzaika');
    
    // Sample orders
    const orders = await Order.find().select('customerInfo.phone').limit(10);
    console.log("Sample Order Phones:", orders.map(o => o.customerInfo.phone));

    // Sample customers
    const customers = await Customer.find().select('phone').limit(10);
    console.log("Sample Customer Phones:", customers.map(c => c.phone));
    
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

checkPhoneMismatch();

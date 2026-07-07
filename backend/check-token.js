const mongoose = require('mongoose');
require('dotenv').config();
const Customer = require('./models/Customer');
const Vendor = require('./models/Vendor');
const DeliveryPerson = require('./models/DeliveryPerson');

async function checkToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gaonzaika');
    
    const customer = await Customer.findOne({ pushToken: { $exists: true, $nin: [null, ''] } }).select('name phone pushToken updatedAt');
    console.log('Customer:', customer);
    
    const vendor = await Vendor.findOne({ pushToken: { $exists: true, $nin: [null, ''] } }).select('name phone pushToken updatedAt');
    console.log('Vendor:', vendor);

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

checkToken();

const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

async function checkVendors() {
  try {
    await mongoose.connect('mongodb+srv://infoniict3:u3LxBHUbcVwNJhG2@gaonzaika.azbxae5.mongodb.net/');
    console.log('Connected to MongoDB');
    
    const vendors = await Vendor.find({});
    console.log('All vendors:', vendors.map(v => ({
      id: v._id,
      name: v.name,
      email: v.email,
      pin: v.pin,
      isActive: v.isActive
    })));
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkVendors(); 
const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');
const Restaurant = require('./models/Restaurant');
require('dotenv').config();

const testGoLive = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a vendor to test with
    const vendor = await Vendor.findOne().populate('restaurantId');
    if (!vendor) {
      console.log('No vendor found. Please create a vendor first.');
      return;
    }

    console.log('Testing with vendor:', vendor.name);
    console.log('Initial live status:', vendor.isLive);
    console.log('Restaurant isOpen:', vendor.restaurantId?.isOpen);

    // Test going live
    console.log('\n--- Testing Go Live ---');
    await vendor.goLive();
    console.log('After goLive():');
    console.log('Vendor isLive:', vendor.isLive);
    console.log('Last live toggle:', vendor.lastLiveToggle);

    // Check restaurant status
    const updatedRestaurant = await Restaurant.findById(vendor.restaurantId._id);
    console.log('Restaurant isOpen:', updatedRestaurant.isOpen);

    // Test going offline
    console.log('\n--- Testing Go Offline ---');
    await vendor.goOffline();
    console.log('After goOffline():');
    console.log('Vendor isLive:', vendor.isLive);

    // Check restaurant status again
    const updatedRestaurant2 = await Restaurant.findById(vendor.restaurantId._id);
    console.log('Restaurant isOpen:', updatedRestaurant2.isOpen);

    // Test toggle
    console.log('\n--- Testing Toggle ---');
    await vendor.toggleLiveStatus();
    console.log('After toggle():');
    console.log('Vendor isLive:', vendor.isLive);

    const updatedRestaurant3 = await Restaurant.findById(vendor.restaurantId._id);
    console.log('Restaurant isOpen:', updatedRestaurant3.isOpen);

    console.log('\n✅ Go Live functionality test completed successfully!');

  } catch (error) {
    console.error('Error testing Go Live:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testGoLive(); 
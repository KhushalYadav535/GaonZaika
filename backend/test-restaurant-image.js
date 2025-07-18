const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');
const Restaurant = require('./models/Restaurant');
require('dotenv').config();

const testRestaurantImage = async () => {
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
    console.log('Restaurant:', vendor.restaurantId?.name);
    console.log('Current restaurant image:', vendor.restaurantId?.image);

    // Test updating restaurant image
    console.log('\n--- Testing Restaurant Image Update ---');
    const testImageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400';
    
    vendor.restaurantId.image = testImageUrl;
    await vendor.restaurantId.save();
    
    console.log('Updated restaurant image to:', vendor.restaurantId.image);

    // Test removing restaurant image
    console.log('\n--- Testing Restaurant Image Removal ---');
    vendor.restaurantId.image = null;
    await vendor.restaurantId.save();
    
    console.log('Removed restaurant image. Current image:', vendor.restaurantId.image);

    console.log('\n✅ Restaurant image functionality test completed successfully!');

  } catch (error) {
    console.error('Error testing restaurant image:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testRestaurantImage(); 
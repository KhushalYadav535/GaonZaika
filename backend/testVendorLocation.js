const mongoose = require('mongoose');
require('dotenv').config();

const Vendor = require('./models/Vendor');
const Restaurant = require('./models/Restaurant');

const testVendorLocation = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a vendor and their restaurant
    const vendor = await Vendor.findOne().populate('restaurantId');
    
    if (!vendor) {
      console.log('No vendors found. Please create a vendor first.');
      return;
    }

    console.log('\n📋 Current Vendor & Restaurant Info:');
    console.log('Vendor:', vendor.name);
    console.log('Restaurant:', vendor.restaurantId.name);
    console.log('Current Location:', vendor.restaurantId.location);
    console.log('Current Address:', vendor.restaurantId.address);

    // Test updating location
    const testLocation = {
      latitude: 19.0760,
      longitude: 72.8777,
      address: 'Mumbai Central, Mumbai, Maharashtra',
      street: 'Mumbai Central',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400008'
    };

    console.log('\n🔄 Testing location update...');
    
    // Simulate the API call
    const restaurant = await Restaurant.findById(vendor.restaurantId._id);
    if (!restaurant) {
      console.log('Restaurant not found');
      return;
    }

    // Update restaurant location coordinates
    restaurant.location = {
      type: 'Point',
      coordinates: [testLocation.longitude, testLocation.latitude]
    };

    // Update address information
    restaurant.address = {
      fullAddress: testLocation.address,
      street: testLocation.street,
      city: testLocation.city,
      state: testLocation.state,
      pincode: testLocation.pincode
    };

    await restaurant.save();

    console.log('✅ Location updated successfully!');
    console.log('New Location:', restaurant.location);
    console.log('New Address:', restaurant.address);

    // Test nearby search
    console.log('\n🔍 Testing nearby search...');
    const nearbyRestaurants = await Restaurant.findNearby(
      testLocation.longitude,
      testLocation.latitude,
      10000 // 10km radius
    );

    console.log(`Found ${nearbyRestaurants.length} restaurants within 10km`);
    nearbyRestaurants.forEach((rest, index) => {
      console.log(`${index + 1}. ${rest.name} - ${rest.location.coordinates}`);
    });

    console.log('\n✅ Vendor location functionality test completed!');

  } catch (error) {
    console.error('Error testing vendor location:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the test
testVendorLocation(); 
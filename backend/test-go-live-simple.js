const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');
const Restaurant = require('./models/Restaurant');
require('dotenv').config();

const testGoLiveSimple = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test restaurant first
    const testRestaurant = new Restaurant({
      name: 'Test Restaurant for Go Live',
      cuisine: 'Test Cuisine',
      description: 'Test restaurant for Go Live functionality',
      address: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        fullAddress: 'Test Street, Test City, Test State - 123456'
      },
      contact: {
        phone: '9876543210',
        email: 'test@restaurant.com'
      },
      rating: 4.0,
      totalRatings: 10,
      deliveryTime: {
        min: 30,
        max: 45
      },
      minOrder: 100,
      deliveryFee: 20,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      isOpen: false,
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [82.2917321, 25.5071805] // longitude, latitude
      }
    });

    await testRestaurant.save();
    console.log('Created test restaurant:', testRestaurant.name);

    // Create a test vendor
    const testVendor = new Vendor({
      name: 'Test Vendor for Go Live',
      email: 'testvendor@example.com',
      phone: '9876543211',
      password: 'testpassword123',
      pin: '1234',
      restaurantId: testRestaurant._id,
      isActive: true,
      isLive: false
    });

    await testVendor.save();
    console.log('Created test vendor:', testVendor.name);
    console.log('Initial live status:', testVendor.isLive);
    console.log('Restaurant isOpen:', testRestaurant.isOpen);

    // Test going live
    console.log('\n--- Testing Go Live ---');
    await testVendor.goLive();
    console.log('After goLive():');
    console.log('Vendor isLive:', testVendor.isLive);
    console.log('Last live toggle:', testVendor.lastLiveToggle);

    // Check restaurant status
    const updatedRestaurant = await Restaurant.findById(testRestaurant._id);
    console.log('Restaurant isOpen:', updatedRestaurant.isOpen);

    // Test going offline
    console.log('\n--- Testing Go Offline ---');
    await testVendor.goOffline();
    console.log('After goOffline():');
    console.log('Vendor isLive:', testVendor.isLive);

    // Check restaurant status again
    const updatedRestaurant2 = await Restaurant.findById(testRestaurant._id);
    console.log('Restaurant isOpen:', updatedRestaurant2.isOpen);

    // Test toggle
    console.log('\n--- Testing Toggle ---');
    await testVendor.toggleLiveStatus();
    console.log('After toggle():');
    console.log('Vendor isLive:', testVendor.isLive);

    const updatedRestaurant3 = await Restaurant.findById(testRestaurant._id);
    console.log('Restaurant isOpen:', updatedRestaurant3.isOpen);

    console.log('\n✅ Go Live functionality test completed successfully!');

    // Clean up test data
    await Vendor.findByIdAndDelete(testVendor._id);
    await Restaurant.findByIdAndDelete(testRestaurant._id);
    console.log('Test data cleaned up');

  } catch (error) {
    console.error('Error testing Go Live:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testGoLiveSimple(); 
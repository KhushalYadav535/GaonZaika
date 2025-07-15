const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
require('dotenv').config();

const testRestaurants = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all restaurants
    const restaurants = await Restaurant.find({});
    console.log(`Found ${restaurants.length} restaurants`);

    if (restaurants.length === 0) {
      console.log('No restaurants found in database');
      return;
    }

    // Check each restaurant's location
    restaurants.forEach((restaurant, index) => {
      console.log(`\nRestaurant ${index + 1}: ${restaurant.name}`);
      console.log('Location:', restaurant.location);
      console.log('Address:', restaurant.address);
      console.log('Is Active:', restaurant.isActive);
      console.log('Is Open:', restaurant.isOpen);
    });

    // Check if any restaurants have valid coordinates
    const restaurantsWithLocation = restaurants.filter(r => 
      r.location && 
      r.location.coordinates && 
      r.location.coordinates.length === 2 &&
      r.location.coordinates[0] !== 0 && 
      r.location.coordinates[1] !== 0
    );

    console.log(`\nRestaurants with valid location: ${restaurantsWithLocation.length}/${restaurants.length}`);

    if (restaurantsWithLocation.length === 0) {
      console.log('No restaurants have valid location coordinates. Run updateRestaurantLocations.js first.');
    } else {
      console.log('Testing nearby search with Delhi coordinates...');
      
      // Test the findNearbyWithFilters method
      const nearbyRestaurants = await Restaurant.findNearbyWithFilters(
        77.2090, // Delhi longitude
        28.6139, // Delhi latitude
        10000,   // 10km in meters
        { isOpen: true }
      );
      
      console.log(`Found ${nearbyRestaurants.length} restaurants near Delhi`);
      nearbyRestaurants.forEach((restaurant, index) => {
        console.log(`${index + 1}. ${restaurant.name} - ${restaurant.location.coordinates}`);
      });
    }

  } catch (error) {
    console.error('Error testing restaurants:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the test
testRestaurants(); 
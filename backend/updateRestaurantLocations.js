const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
require('dotenv').config();

// Sample locations around major Indian cities
const sampleLocations = [
  // Mumbai area
  { lat: 19.0760, lng: 72.8777, city: 'Mumbai' },
  { lat: 19.2183, lng: 72.9781, city: 'Thane' },
  { lat: 19.0223, lng: 72.8564, city: 'Mumbai Suburbs' },
  
  // Delhi area
  { lat: 28.7041, lng: 77.1025, city: 'Delhi' },
  { lat: 28.6139, lng: 77.2090, city: 'New Delhi' },
  { lat: 28.4595, lng: 77.0266, city: 'Gurgaon' },
  
  // Bangalore area
  { lat: 12.9716, lng: 77.5946, city: 'Bangalore' },
  { lat: 12.9789, lng: 77.5917, city: 'Bangalore Central' },
  { lat: 12.9716, lng: 77.5946, city: 'Bangalore South' },
  
  // Chennai area
  { lat: 13.0827, lng: 80.2707, city: 'Chennai' },
  { lat: 13.0827, lng: 80.2707, city: 'Chennai Central' },
  
  // Kolkata area
  { lat: 22.5726, lng: 88.3639, city: 'Kolkata' },
  { lat: 22.5726, lng: 88.3639, city: 'Kolkata Central' },
  
  // Hyderabad area
  { lat: 17.3850, lng: 78.4867, city: 'Hyderabad' },
  { lat: 17.3850, lng: 78.4867, city: 'Hyderabad Central' },
  
  // Pune area
  { lat: 18.5204, lng: 73.8567, city: 'Pune' },
  { lat: 18.5204, lng: 73.8567, city: 'Pune Central' },
  
  // Ahmedabad area
  { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad' },
  { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad Central' },
  
  // Jaipur area
  { lat: 26.9124, lng: 75.7873, city: 'Jaipur' },
  { lat: 26.9124, lng: 75.7873, city: 'Jaipur Central' }
];

const updateRestaurantLocations = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all restaurants
    const restaurants = await Restaurant.find({});
    console.log(`Found ${restaurants.length} restaurants to update`);

    if (restaurants.length === 0) {
      console.log('No restaurants found. Please create some restaurants first.');
      return;
    }

    // Update each restaurant with a random location
    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i];
      const locationIndex = i % sampleLocations.length;
      const location = sampleLocations[locationIndex];
      
      // Add some random variation to make locations more realistic
      const latVariation = (Math.random() - 0.5) * 0.01; // ±0.005 degrees (~500m)
      const lngVariation = (Math.random() - 0.5) * 0.01; // ±0.005 degrees (~500m)
      
      const finalLat = location.lat + latVariation;
      const finalLng = location.lng + lngVariation;

      // Update restaurant location
      await Restaurant.findByIdAndUpdate(restaurant._id, {
        location: {
          type: 'Point',
          coordinates: [finalLng, finalLat] // MongoDB expects [longitude, latitude]
        },
        address: {
          ...restaurant.address,
          city: location.city,
          fullAddress: `${restaurant.address.street || 'Restaurant'}, ${location.city}`
        }
      });

      console.log(`Updated ${restaurant.name} with location: ${finalLat}, ${finalLng} (${location.city})`);
    }

    console.log('✅ Successfully updated all restaurant locations!');
    console.log('\n📍 Sample locations added:');
    sampleLocations.forEach((loc, index) => {
      console.log(`${index + 1}. ${loc.city}: ${loc.lat}, ${loc.lng}`);
    });

  } catch (error) {
    console.error('Error updating restaurant locations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
updateRestaurantLocations(); 
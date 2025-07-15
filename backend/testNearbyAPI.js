const axios = require('axios');

const testNearbyAPI = async () => {
  try {
    console.log('Testing nearby restaurants API...');
    
    // Test with Delhi coordinates
    const response = await axios.get('http://localhost:3000/api/restaurants/nearby', {
      params: {
        latitude: 28.6139,
        longitude: 77.2090,
        radius: 10,
        isOpen: true
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log(`✅ Success! Found ${response.data.data.length} restaurants`);
      response.data.data.forEach((restaurant, index) => {
        console.log(`${index + 1}. ${restaurant.name} - ${restaurant.distance} away`);
      });
    } else {
      console.log('❌ API returned success: false');
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.response?.status, error.response?.data);
    console.error('Error details:', error.message);
  }
};

// Run the test
testNearbyAPI(); 
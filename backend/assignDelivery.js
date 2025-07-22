const mongoose = require('mongoose');
const Order = require('./models/Order');
const DeliveryPerson = require('./models/DeliveryPerson');
const Restaurant = require('./models/Restaurant');

// Helper to calculate distance between two lat/lng points (Haversine formula)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

async function assignDelivery() {
  try {
    await mongoose.connect('mongodb+srv://infoniict3:u3LxBHUbcVwNJhG2@gaonzaika.azbxae5.mongodb.net/');
    console.log('Connected to MongoDB');

    // Find orders that need delivery assignment
    const ordersToAssign = await Order.find({
      status: 'Out for Delivery',
      deliveryPersonId: null
    }).populate('restaurantId');

    console.log(`Found ${ordersToAssign.length} orders to assign`);

    for (const order of ordersToAssign) {
      const restaurant = order.restaurantId;
      if (!restaurant || !restaurant.location || !restaurant.location.coordinates) {
        console.log(`Order ${order.orderId} has no valid restaurant location.`);
        continue;
      }
      const [restLng, restLat] = restaurant.location.coordinates;
      // Find available delivery persons within 10km
      const availableDeliveryPersons = await DeliveryPerson.find({
        isActive: true,
        isAvailable: true,
        currentLocation: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [restLng, restLat]
            },
            $maxDistance: 10000 // 10 km in meters
          }
        }
      });
      if (!availableDeliveryPersons.length) {
        console.log(`No available delivery person within 10km for order ${order.orderId}`);
        continue;
      }
      // Assign the nearest one
      const deliveryPerson = availableDeliveryPersons[0];
      order.deliveryPersonId = deliveryPerson._id;
      await order.save();
      console.log(`Assigned order ${order.orderId} to ${deliveryPerson.name} (${deliveryPerson.email})`);
    }

    console.log('Delivery assignment completed');
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

assignDelivery(); 
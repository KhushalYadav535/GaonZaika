const mongoose = require('mongoose');
const DeliveryPerson = require('./models/DeliveryPerson');

const createDeliveryPerson = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/food_delivery');
    console.log('Connected to MongoDB');

    // Create delivery person
    const deliveryPerson = new DeliveryPerson({
      name: 'Test Delivery',
      email: 'delivery@test.com',
      phone: '9876543215',
      password: 'test123',
      vehicleDetails: {
        type: 'Bike',
        number: 'DL01AB1234',
        model: 'Honda Activa'
      },
      isAvailable: true,
      isActive: true
    });

    await deliveryPerson.save();
    console.log('✅ Delivery person created successfully:');
    console.log('   Name:', deliveryPerson.name);
    console.log('   Email:', deliveryPerson.email);
    console.log('   Phone:', deliveryPerson.phone);
    console.log('   Is Active:', deliveryPerson.isActive);

  } catch (error) {
    console.error('❌ Error creating delivery person:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

createDeliveryPerson(); 
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Restaurant = require('./models/Restaurant');

const testOrder = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://infoniict3:u3LxBHUbcVwNJhG2@gaonzaika.azbxae5.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Get restaurant
    const restaurant = await Restaurant.findOne({ name: 'Test Restaurant' });
    if (!restaurant) {
      console.log('Restaurant not found');
      return;
    }
    
    console.log('Restaurant found:', restaurant.name);
    
    // Create test order
    const order = new Order({
      restaurantId: restaurant._id,
      customerInfo: {
        name: 'Test Customer',
        phone: '9876543210',
        address: 'Test Address, Test City',
        email: 'test@example.com'
      },
      items: [
        {
          menuItemId: restaurant.menu[0]._id,
          name: 'Butter Chicken',
          price: 180,
          quantity: 2,
          totalPrice: 360
        },
        {
          menuItemId: restaurant.menu[1]._id,
          name: 'Naan',
          price: 25,
          quantity: 4,
          totalPrice: 100
        }
      ],
      subtotal: 460,
      deliveryFee: 20,
      totalAmount: 480,
      status: 'Order Placed',
      notes: 'Test order for API testing'
    });
    
    await order.save();
    await order.generateOTP();
    
    console.log('✅ Test order created:', order.orderId);
    console.log('🔐 Order OTP:', order.otp.code);
    console.log('📦 Order status:', order.status);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testOrder(); 
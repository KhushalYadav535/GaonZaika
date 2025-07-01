const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const Order = require('./models/Order');
const Customer = require('./models/Customer');
const Vendor = require('./models/Vendor');
const DeliveryPerson = require('./models/DeliveryPerson');

const seedData = async () => {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Create sample customer
    const customer = await Customer.findOneAndUpdate(
      { email: 'test@example.com' },
      {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '9876543210',
        password: 'test123',
        addresses: [
          {
            label: 'Home',
            address: 'Test Address, Test City',
            pincode: '123456',
            isDefault: true
          }
        ]
      },
      { upsert: true, new: true }
    );

    // Create sample vendors
    const vendor1 = await Vendor.findOneAndUpdate(
      { email: 'vendor1@test.com' },
      {
        name: 'Village Dhaba Owner',
        email: 'vendor1@test.com',
        phone: '9876543301',
        password: 'test123',
        restaurantName: 'Village Dhaba'
      },
      { upsert: true, new: true }
    ).catch(err => {
      if (err.code === 11000) {
        console.log('Vendor 1 already exists, skipping...');
        return Vendor.findOne({ email: 'vendor1@test.com' });
      }
      throw err;
    });

    const vendor2 = await Vendor.findOneAndUpdate(
      { email: 'vendor2@test.com' },
      {
        name: 'Spice Garden Owner',
        email: 'vendor2@test.com',
        phone: '9876543302',
        password: 'test123',
        restaurantName: 'Spice Garden'
      },
      { upsert: true, new: true }
    ).catch(err => {
      if (err.code === 11000) {
        console.log('Vendor 2 already exists, skipping...');
        return Vendor.findOne({ email: 'vendor2@test.com' });
      }
      throw err;
    });

    const vendor3 = await Vendor.findOneAndUpdate(
      { email: 'vendor3@test.com' },
      {
        name: 'Tandoor House Owner',
        email: 'vendor3@test.com',
        phone: '9876543303',
        password: 'test123',
        restaurantName: 'Tandoor House'
      },
      { upsert: true, new: true }
    ).catch(err => {
      if (err.code === 11000) {
        console.log('Vendor 3 already exists, skipping...');
        return Vendor.findOne({ email: 'vendor3@test.com' });
      }
      throw err;
    });

    const vendor4 = await Vendor.findOneAndUpdate(
      { email: 'vendor4@test.com' },
      {
        name: 'Sweet Corner Owner',
        email: 'vendor4@test.com',
        phone: '9876543304',
        password: 'test123',
        restaurantName: 'Sweet Corner'
      },
      { upsert: true, new: true }
    ).catch(err => {
      if (err.code === 11000) {
        console.log('Vendor 4 already exists, skipping...');
        return Vendor.findOne({ email: 'vendor4@test.com' });
      }
      throw err;
    });

    // Create sample restaurants
    const restaurant1 = await Restaurant.findOneAndUpdate(
      { name: 'Village Dhaba' },
      {
        name: 'Village Dhaba',
        cuisine: 'North Indian',
        description: 'Authentic North Indian cuisine with traditional recipes',
        address: {
          street: 'Main Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          fullAddress: 'Main Street, Test City, Test State - 123456'
        },
        contact: {
          phone: '9876543301',
          email: 'village@dhaba.com'
        },
        rating: 4.5,
        totalRatings: 120,
        deliveryTime: {
          min: 30,
          max: 45
        },
        minOrder: 100,
        deliveryFee: 20,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        isOpen: true,
        isActive: true,
        vendorId: vendor1._id,
        menu: [
          {
            name: 'Butter Chicken',
            description: 'Creamy and rich butter chicken with authentic spices',
            price: 180,
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
            isVeg: false,
            isAvailable: true,
            preparationTime: 20
          },
          {
            name: 'Paneer Tikka',
            description: 'Grilled cottage cheese with aromatic spices',
            price: 150,
            category: 'Starters',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
            isVeg: true,
            isAvailable: true,
            preparationTime: 15
          },
          {
            name: 'Dal Makhani',
            description: 'Creamy black lentils cooked overnight',
            price: 120,
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
            isVeg: true,
            isAvailable: true,
            preparationTime: 25
          },
          {
            name: 'Naan',
            description: 'Soft and fluffy naan bread',
            price: 25,
            category: 'Breads',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
            isVeg: true,
            isAvailable: true,
            preparationTime: 10
          }
        ]
      },
      { upsert: true, new: true }
    );

    const restaurant2 = await Restaurant.findOneAndUpdate(
      { name: 'Spice Garden' },
      {
        name: 'Spice Garden',
        cuisine: 'South Indian',
        description: 'Traditional South Indian delicacies',
        address: {
          street: 'Spice Lane',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          fullAddress: 'Spice Lane, Test City, Test State - 123456'
        },
        contact: {
          phone: '9876543302',
          email: 'spice@garden.com'
        },
        rating: 4.2,
        totalRatings: 85,
        deliveryTime: {
          min: 25,
          max: 40
        },
        minOrder: 80,
        deliveryFee: 15,
        image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400',
        isOpen: true,
        isActive: true,
        vendorId: vendor2._id,
        menu: [
          {
            name: 'Masala Dosa',
            description: 'Crispy dosa with potato filling and chutney',
            price: 120,
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
            isVeg: true,
            isAvailable: true,
            preparationTime: 15
          },
          {
            name: 'Idli Sambar',
            description: 'Soft idlis with hot sambar',
            price: 80,
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
            isVeg: true,
            isAvailable: true,
            preparationTime: 10
          },
          {
            name: 'Filter Coffee',
            description: 'Traditional South Indian filter coffee',
            price: 30,
            category: 'Beverages',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
            isVeg: true,
            isAvailable: true,
            preparationTime: 5
          }
        ]
      },
      { upsert: true, new: true }
    );

    const restaurant3 = await Restaurant.findOneAndUpdate(
      { name: 'Tandoor House' },
      {
        name: 'Tandoor House',
        cuisine: 'Mughlai',
        description: 'Royal Mughlai cuisine with tandoor specialties',
        address: {
          street: 'Royal Road',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          fullAddress: 'Royal Road, Test City, Test State - 123456'
        },
        contact: {
          phone: '9876543303',
          email: 'tandoor@house.com'
        },
        rating: 4.7,
        totalRatings: 95,
        deliveryTime: {
          min: 35,
          max: 50
        },
        minOrder: 120,
        deliveryFee: 25,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
        isOpen: false,
        isActive: true,
        vendorId: vendor3._id,
        menu: [
          {
            name: 'Chicken Biryani',
            description: 'Fragrant rice with tender chicken and spices',
            price: 200,
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
            isVeg: false,
            isAvailable: true,
            preparationTime: 30
          },
          {
            name: 'Tandoori Chicken',
            description: 'Marinated chicken cooked in tandoor',
            price: 250,
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
            isVeg: false,
            isAvailable: true,
            preparationTime: 25
          },
          {
            name: 'Raita',
            description: 'Cooling yogurt with vegetables',
            price: 40,
            category: 'Starters',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
            isVeg: true,
            isAvailable: true,
            preparationTime: 5
          }
        ]
      },
      { upsert: true, new: true }
    );

    const restaurant4 = await Restaurant.findOneAndUpdate(
      { name: 'Sweet Corner' },
      {
        name: 'Sweet Corner',
        cuisine: 'Desserts',
        description: 'Delicious sweets and desserts',
        address: {
          street: 'Sweet Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          fullAddress: 'Sweet Street, Test City, Test State - 123456'
        },
        contact: {
          phone: '9876543304',
          email: 'sweet@corner.com'
        },
        rating: 4.3,
        totalRatings: 65,
        deliveryTime: {
          min: 20,
          max: 30
        },
        minOrder: 50,
        deliveryFee: 10,
        image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
        isOpen: true,
        isActive: true,
        vendorId: vendor4._id,
        menu: [
          {
            name: 'Gulab Jamun',
            description: 'Soft and sweet gulab jamun',
            price: 60,
            category: 'Desserts',
            image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
            isVeg: true,
            isAvailable: true,
            preparationTime: 5
          },
          {
            name: 'Rasgulla',
            description: 'Spongy rasgulla in sugar syrup',
            price: 50,
            category: 'Desserts',
            image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
            isVeg: true,
            isAvailable: true,
            preparationTime: 5
          },
          {
            name: 'Kheer',
            description: 'Rice pudding with nuts and saffron',
            price: 80,
            category: 'Desserts',
            image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
            isVeg: true,
            isAvailable: true,
            preparationTime: 10
          }
        ]
      },
      { upsert: true, new: true }
    );

    // Create sample delivery person
    const deliveryPerson = await DeliveryPerson.findOneAndUpdate(
      { email: 'delivery@test.com' },
      {
        name: 'Test Delivery',
        email: 'delivery@test.com',
        phone: '9876543215',
        password: 'test123',
        vehicleNumber: 'DL01AB1234',
        isAvailable: true,
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Create sample order
    const existingOrder = await Order.findOne({ 'customerInfo.email': 'test@example.com' });
    if (!existingOrder) {
      const order = new Order({
        restaurantId: restaurant1._id,
        customerInfo: {
          name: customer.name,
          phone: customer.phone,
          address: customer.addresses[0].address,
          email: customer.email
        },
        items: [
          {
            menuItemId: restaurant1.menu[0]._id,
            name: 'Butter Chicken',
            price: 180,
            quantity: 2,
            totalPrice: 360
          },
          {
            menuItemId: restaurant1.menu[3]._id,
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
        notes: 'Test order for API testing',
        deliveryPersonId: deliveryPerson._id
      });

      await order.save();
      
      // Generate OTP for the order
      await order.generateOTP();
      
      console.log('✅ Sample order created:', order.orderId);
      console.log('🔐 Order OTP:', order.otp.code);
    }

    console.log('✅ Database seeded successfully!');
    console.log('📋 Sample data created:');
    console.log(`   - Customer: ${customer.email}`);
    console.log(`   - Vendors: ${vendor1.email}, ${vendor2.email}, ${vendor3.email}, ${vendor4.email}`);
    console.log(`   - Restaurants: ${restaurant1.name}, ${restaurant2.name}, ${restaurant3.name}, ${restaurant4.name}`);
    console.log(`   - Delivery Person: ${deliveryPerson.email}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

module.exports = seedData; 
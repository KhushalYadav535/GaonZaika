const mongoose = require('mongoose');
const pushNotificationService = require('./services/pushNotificationService');
const Vendor = require('./models/Vendor');
const DeliveryPerson = require('./models/DeliveryPerson');
const Customer = require('./models/Customer');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://infoniict3:u3LxBHUbcVwNJhG2@gaonzaika.azbxae5.mongodb.net/');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test notification function
async function testNotifications() {
  try {
    await connectDB();
    
    console.log('🔔 Testing Push Notifications...\n');
    
    // Test 1: Check vendors with push tokens
    console.log('1. Checking vendors with push tokens:');
    const vendors = await Vendor.find({ pushToken: { $exists: true, $ne: null } });
    console.log(`Found ${vendors.length} vendors with push tokens`);
    
    if (vendors.length > 0) {
      const vendor = vendors[0];
      console.log(`Testing notification to vendor: ${vendor.name} (${vendor.email})`);
      
      try {
        await pushNotificationService.sendNewOrderToVendor(
          vendor.pushToken,
          'TEST-ORDER-123',
          'Test Customer',
          250
        );
        console.log('✅ Vendor notification sent successfully!');
      } catch (error) {
        console.error('❌ Vendor notification failed:', error.message);
      }
    }
    
    // Test 2: Check delivery persons with push tokens
    console.log('\n2. Checking delivery persons with push tokens:');
    const deliveryPersons = await DeliveryPerson.find({ 
      pushToken: { $exists: true, $ne: null },
      isOnline: true 
    });
    console.log(`Found ${deliveryPersons.length} online delivery persons with push tokens`);
    
    if (deliveryPersons.length > 0) {
      const pushTokens = deliveryPersons.map(d => d.pushToken).filter(Boolean);
      console.log(`Testing notification to ${pushTokens.length} delivery persons`);
      
      try {
        await pushNotificationService.sendPushNotificationToMultiple(
          pushTokens,
          'Test Delivery Order',
          'This is a test notification for delivery persons',
          { orderId: 'TEST-ORDER-123', type: 'new_order' }
        );
        console.log('✅ Delivery person notifications sent successfully!');
      } catch (error) {
        console.error('❌ Delivery person notifications failed:', error.message);
      }
    }
    
    // Test 3: Check customers with push tokens
    console.log('\n3. Checking customers with push tokens:');
    const customers = await Customer.find({ pushToken: { $exists: true, $ne: null } });
    console.log(`Found ${customers.length} customers with push tokens`);
    
    if (customers.length > 0) {
      const customer = customers[0];
      console.log(`Testing notification to customer: ${customer.name} (${customer.email})`);
      
      try {
        await pushNotificationService.sendOrderStatusUpdate(
          customer.pushToken,
          'TEST-ORDER-123',
          'preparing',
          'Test Restaurant'
        );
        console.log('✅ Customer notification sent successfully!');
      } catch (error) {
        console.error('❌ Customer notification failed:', error.message);
      }
    }
    
    // Test 4: Send test notification to all users
    console.log('\n4. Sending test notification to all users:');
    const allTokens = [
      ...vendors.map(v => v.pushToken),
      ...deliveryPersons.map(d => d.pushToken),
      ...customers.map(c => c.pushToken)
    ].filter(Boolean);
    
    if (allTokens.length > 0) {
      try {
        await pushNotificationService.sendPushNotificationToMultiple(
          allTokens,
          'Gaon Zaika Test',
          'This is a test notification from Gaon Zaika app. If you receive this, notifications are working!',
          { type: 'test' }
        );
        console.log(`✅ Test notification sent to ${allTokens.length} devices successfully!`);
      } catch (error) {
        console.error('❌ Test notification failed:', error.message);
      }
    } else {
      console.log('❌ No push tokens found. Make sure users have logged in and granted notification permissions.');
    }
    
    console.log('\n🎉 Notification testing completed!');
    console.log('\n📱 To test notifications:');
    console.log('1. Make sure your app is installed on a physical device');
    console.log('2. Login as vendor/delivery/customer');
    console.log('3. Grant notification permissions when prompted');
    console.log('4. Place a test order to see notifications in action');
    
  } catch (error) {
    console.error('Error testing notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase disconnected');
  }
}

// Run the test
testNotifications();

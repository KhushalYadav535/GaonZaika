const pushNotificationService = require('./services/pushNotificationService');
const Customer = require('./models/Customer');
const Vendor = require('./models/Vendor');

// Test push notification functionality
async function testPushNotifications() {
  console.log('🧪 Testing Push Notifications...\n');

  try {
    // Test 1: Validate push token format
    console.log('1. Testing push token validation:');
    const validToken = 'ExponentPushToken[test-token-123]';
    const invalidToken = 'invalid-token';
    
    console.log('Valid token:', pushNotificationService.validatePushToken(validToken));
    console.log('Invalid token:', pushNotificationService.validatePushToken(invalidToken));
    console.log('');

    // Test 2: Test order status update notification
    console.log('2. Testing order status update notification:');
    try {
      await pushNotificationService.sendOrderStatusUpdate(
        validToken,
        'TEST123',
        'Accepted',
        'Test Restaurant'
      );
      console.log('✅ Order status update notification sent successfully');
    } catch (error) {
      console.log('❌ Order status update notification failed:', error.message);
    }
    console.log('');

    // Test 3: Test new order notification to vendor
    console.log('3. Testing new order notification to vendor:');
    try {
      await pushNotificationService.sendNewOrderToVendor(
        validToken,
        'TEST123',
        'John Doe',
        500
      );
      console.log('✅ New order notification to vendor sent successfully');
    } catch (error) {
      console.log('❌ New order notification to vendor failed:', error.message);
    }
    console.log('');

    // Test 4: Check if customers have push tokens
    console.log('4. Checking customers with push tokens:');
    const customersWithTokens = await Customer.find({ pushToken: { $exists: true, $ne: null } });
    console.log(`Found ${customersWithTokens.length} customers with push tokens`);
    if (customersWithTokens.length > 0) {
      console.log('Sample customer tokens:');
      customersWithTokens.slice(0, 3).forEach(customer => {
        console.log(`- ${customer.email}: ${customer.pushToken ? 'Has token' : 'No token'}`);
      });
    }
    console.log('');

    // Test 5: Check if vendors have push tokens
    console.log('5. Checking vendors with push tokens:');
    const vendorsWithTokens = await Vendor.find({ pushToken: { $exists: true, $ne: null } });
    console.log(`Found ${vendorsWithTokens.length} vendors with push tokens`);
    if (vendorsWithTokens.length > 0) {
      console.log('Sample vendor tokens:');
      vendorsWithTokens.slice(0, 3).forEach(vendor => {
        console.log(`- ${vendor.email}: ${vendor.pushToken ? 'Has token' : 'No token'}`);
      });
    }
    console.log('');

    // Test 6: Test with real token if available
    if (customersWithTokens.length > 0) {
      console.log('6. Testing with real customer token:');
      const realToken = customersWithTokens[0].pushToken;
      if (pushNotificationService.validatePushToken(realToken)) {
        try {
          await pushNotificationService.sendOrderStatusUpdate(
            realToken,
            'REAL123',
            'Preparing',
            'Real Restaurant'
          );
          console.log('✅ Real token test successful');
        } catch (error) {
          console.log('❌ Real token test failed:', error.message);
          if (error.response?.data) {
            console.log('Error details:', error.response.data);
          }
        }
      } else {
        console.log('❌ Real token is invalid format');
      }
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }

  console.log('🏁 Push notification tests completed');
}

// Run the test
testPushNotifications().then(() => {
  console.log('Test script finished');
  process.exit(0);
}).catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
}); 
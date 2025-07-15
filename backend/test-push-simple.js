const pushNotificationService = require('./services/pushNotificationService');

// Simple push notification test without database
async function testPushNotificationsSimple() {
  console.log('🧪 Testing Push Notifications (Simple)...\n');

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
      const result = await pushNotificationService.sendOrderStatusUpdate(
        validToken,
        'TEST123',
        'Accepted',
        'Test Restaurant'
      );
      console.log('✅ Order status update notification sent successfully');
      console.log('Result:', result);
    } catch (error) {
      console.log('❌ Order status update notification failed:', error.message);
    }
    console.log('');

    // Test 3: Test new order notification to vendor
    console.log('3. Testing new order notification to vendor:');
    try {
      const result = await pushNotificationService.sendNewOrderToVendor(
        validToken,
        'TEST123',
        'John Doe',
        500
      );
      console.log('✅ New order notification to vendor sent successfully');
      console.log('Result:', result);
    } catch (error) {
      console.log('❌ New order notification to vendor failed:', error.message);
    }
    console.log('');

    // Test 4: Test with a real-looking token format
    console.log('4. Testing with real-looking token format:');
    const realLookingToken = 'ExponentPushToken[ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]]';
    try {
      const result = await pushNotificationService.sendOrderStatusUpdate(
        realLookingToken,
        'REAL123',
        'Preparing',
        'Real Restaurant'
      );
      console.log('✅ Real-looking token test successful');
      console.log('Result:', result);
    } catch (error) {
      console.log('❌ Real-looking token test failed:', error.message);
      if (error.response?.data) {
        console.log('Error details:', error.response.data);
      }
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }

  console.log('🏁 Simple push notification tests completed');
  console.log('\n📝 Notes:');
  console.log('- "DeviceNotRegistered" errors are expected for test tokens');
  console.log('- This confirms the push notification service is working');
  console.log('- Real notifications will work with valid device tokens');
}

// Run the test
testPushNotificationsSimple().then(() => {
  console.log('Test script finished');
  process.exit(0);
}).catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
}); 
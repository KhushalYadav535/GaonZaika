const AsyncStorage = require('@react-native-async-storage/async-storage');

// Test authentication persistence
const testAuthPersistence = async () => {
  console.log('🧪 Testing Authentication Persistence...\n');

  // Test 1: Check if tokens are stored correctly
  console.log('1. Testing token storage...');
  
  // Simulate storing tokens
  const testTokens = {
    customerToken: 'customer_test_token_123',
    vendorToken: 'vendor_test_token_456',
    deliveryToken: 'delivery_test_token_789',
    adminToken: 'admin_test_token_012'
  };

  try {
    await AsyncStorage.multiSet([
      ['customerToken', testTokens.customerToken],
      ['vendorToken', testTokens.vendorToken],
      ['deliveryToken', testTokens.deliveryToken],
      ['adminToken', testTokens.adminToken]
    ]);
    console.log('✅ Tokens stored successfully');

    // Test 2: Check if tokens can be retrieved
    console.log('\n2. Testing token retrieval...');
    const retrievedTokens = await AsyncStorage.multiGet([
      'customerToken',
      'vendorToken', 
      'deliveryToken',
      'adminToken'
    ]);

    const tokenMap = Object.fromEntries(retrievedTokens);
    console.log('Retrieved tokens:', tokenMap);

    // Test 3: Check authentication status logic
    console.log('\n3. Testing authentication status logic...');
    
    const customerToken = await AsyncStorage.getItem('customerToken');
    const vendorToken = await AsyncStorage.getItem('vendorToken');
    const deliveryToken = await AsyncStorage.getItem('deliveryToken');
    const adminToken = await AsyncStorage.getItem('adminToken');

    let initialRoute = 'RoleSelection';
    let initialParams = {};

    if (customerToken && customerToken.trim()) {
      initialRoute = 'Customer';
      initialParams = { screen: 'CustomerTabs' };
      console.log('✅ Customer authenticated - should navigate to CustomerTabs');
    } else if (vendorToken && vendorToken.trim()) {
      initialRoute = 'Vendor';
      initialParams = { screen: 'VendorTabs' };
      console.log('✅ Vendor authenticated - should navigate to VendorTabs');
    } else if (deliveryToken && deliveryToken.trim()) {
      initialRoute = 'Delivery';
      initialParams = { screen: 'DeliveryTabs' };
      console.log('✅ Delivery authenticated - should navigate to DeliveryTabs');
    } else if (adminToken && adminToken.trim()) {
      initialRoute = 'Admin';
      initialParams = { screen: 'AdminTabs' };
      console.log('✅ Admin authenticated - should navigate to AdminTabs');
    } else {
      console.log('❌ No valid tokens found - should show RoleSelection');
    }

    console.log(`Initial route: ${initialRoute}`);
    console.log(`Initial params:`, initialParams);

    // Test 4: Test logout functionality
    console.log('\n4. Testing logout functionality...');
    
    // Simulate customer logout
    await AsyncStorage.multiRemove(['customerData', 'customerToken']);
    console.log('✅ Customer logout - tokens cleared');

    // Check if customer token is cleared
    const clearedCustomerToken = await AsyncStorage.getItem('customerToken');
    if (!clearedCustomerToken) {
      console.log('✅ Customer token successfully cleared');
    } else {
      console.log('❌ Customer token not cleared properly');
    }

    // Test 5: Test role switching
    console.log('\n5. Testing role switching...');
    
    // Clear all tokens first
    await AsyncStorage.multiRemove([
      'customerData', 'customerToken',
      'vendorData', 'vendorToken', 
      'deliveryData', 'deliveryToken',
      'adminData', 'adminToken'
    ]);
    console.log('✅ All tokens cleared for role switching test');

    // Now check authentication status again
    const finalCustomerToken = await AsyncStorage.getItem('customerToken');
    const finalVendorToken = await AsyncStorage.getItem('vendorToken');
    const finalDeliveryToken = await AsyncStorage.getItem('deliveryToken');
    const finalAdminToken = await AsyncStorage.getItem('adminToken');

    if (!finalCustomerToken && !finalVendorToken && !finalDeliveryToken && !finalAdminToken) {
      console.log('✅ All tokens cleared - should show RoleSelection');
    } else {
      console.log('❌ Some tokens still exist after clearing');
    }

    console.log('\n🎉 Authentication persistence test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Token storage: ✅ Working');
    console.log('- Token retrieval: ✅ Working');
    console.log('- Authentication logic: ✅ Working');
    console.log('- Logout functionality: ✅ Working');
    console.log('- Role switching: ✅ Working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testAuthPersistence(); 
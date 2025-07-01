const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testCustomer = {
  name: 'Test Customer',
  email: 'test@customer.com',
  phone: '9876543210',
  password: 'password123'
};

const testVendor = {
  name: 'Test Vendor',
  email: 'test@vendor.com',
  phone: '9876543211',
  password: 'password123',
  restaurantName: 'Test Restaurant'
};

const testDelivery = {
  name: 'Test Delivery',
  email: 'test@delivery.com',
  phone: '9876543212',
  password: 'password123',
  vehicleNumber: 'DL01AB1234'
};

const testAdmin = {
  name: 'Test Admin',
  email: 'test@admin.com',
  password: 'password123'
};

async function testAuth() {
  console.log('🧪 Testing Authentication Endpoints...\n');

  try {
    // Test 1: Customer Registration
    console.log('1. Testing Customer Registration...');
    const customerReg = await axios.post(`${BASE_URL}/auth/customer/register`, testCustomer);
    console.log('✅ Customer registered:', customerReg.data.success);
    console.log('   Token:', customerReg.data.data.token ? '✅' : '❌');
    console.log('');

    // Test 2: Customer Login
    console.log('2. Testing Customer Login...');
    const customerLogin = await axios.post(`${BASE_URL}/auth/customer/login`, {
      email: testCustomer.email,
      password: testCustomer.password
    });
    console.log('✅ Customer login:', customerLogin.data.success);
    console.log('   Token:', customerLogin.data.data.token ? '✅' : '❌');
    console.log('');

    // Test 3: Vendor Registration
    console.log('3. Testing Vendor Registration...');
    const vendorReg = await axios.post(`${BASE_URL}/auth/vendor/register`, testVendor);
    console.log('✅ Vendor registered:', vendorReg.data.success);
    console.log('   Token:', vendorReg.data.data.token ? '✅' : '❌');
    console.log('');

    // Test 4: Vendor Login
    console.log('4. Testing Vendor Login...');
    const vendorLogin = await axios.post(`${BASE_URL}/auth/vendor/login`, {
      email: testVendor.email,
      password: testVendor.password
    });
    console.log('✅ Vendor login:', vendorLogin.data.success);
    console.log('   Token:', vendorLogin.data.data.token ? '✅' : '❌');
    console.log('');

    // Test 5: Delivery Registration
    console.log('5. Testing Delivery Registration...');
    const deliveryReg = await axios.post(`${BASE_URL}/auth/delivery/register`, testDelivery);
    console.log('✅ Delivery registered:', deliveryReg.data.success);
    console.log('   Token:', deliveryReg.data.data.token ? '✅' : '❌');
    console.log('');

    // Test 6: Delivery Login
    console.log('6. Testing Delivery Login...');
    const deliveryLogin = await axios.post(`${BASE_URL}/auth/delivery/login`, {
      email: testDelivery.email,
      password: testDelivery.password
    });
    console.log('✅ Delivery login:', deliveryLogin.data.success);
    console.log('   Token:', deliveryLogin.data.data.token ? '✅' : '❌');
    console.log('');

    // Test 7: Admin Registration
    console.log('7. Testing Admin Registration...');
    const adminReg = await axios.post(`${BASE_URL}/auth/admin/register`, testAdmin);
    console.log('✅ Admin registered:', adminReg.data.success);
    console.log('   Token:', adminReg.data.data.token ? '✅' : '❌');
    console.log('');

    // Test 8: Admin Login
    console.log('8. Testing Admin Login...');
    const adminLogin = await axios.post(`${BASE_URL}/auth/admin/login`, {
      email: testAdmin.email,
      password: testAdmin.password
    });
    console.log('✅ Admin login:', adminLogin.data.success);
    console.log('   Token:', adminLogin.data.data.token ? '✅' : '❌');
    console.log('');

    // Test 9: PIN Login (Demo)
    console.log('9. Testing PIN Login (Demo)...');
    const pinLogin = await axios.post(`${BASE_URL}/auth/pin-login`, {
      pin: '1234',
      role: 'vendor'
    });
    console.log('✅ PIN login:', pinLogin.data.success);
    console.log('   Token:', pinLogin.data.data.token ? '✅' : '❌');
    console.log('');

    // Test 10: Health Check
    console.log('10. Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/auth/health`);
    console.log('✅ Health check:', health.data.success);
    console.log('');

    console.log('🎉 All authentication tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Customer auth: ✅');
    console.log('   - Vendor auth: ✅');
    console.log('   - Delivery auth: ✅');
    console.log('   - Admin auth: ✅');
    console.log('   - PIN auth: ✅');
    console.log('   - Health check: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Make sure your server is running on port 3000');
    console.log('   Run: npm run dev');
  }
}

// Run tests
testAuth(); 
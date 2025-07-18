const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test order cancellation
async function testOrderCancellation() {
  console.log('🧪 Testing Order Cancellation...\n');

  try {
    // Step 1: Customer login
    console.log('1. Customer Login...');
    const customerLogin = await axios.post(`${BASE_URL}/auth/customer/login`, {
      email: 'test@customer.com',
      password: 'password123'
    });
    
    if (!customerLogin.data.success) {
      console.log('❌ Customer login failed:', customerLogin.data.message);
      return;
    }
    
    const customerToken = customerLogin.data.data.token;
    console.log('✅ Customer logged in successfully');
    
    // Step 2: Get customer orders
    console.log('\n2. Getting customer orders...');
    const ordersResponse = await axios.get(`${BASE_URL}/orders?role=customer&userId=${customerLogin.data.data.customer.id}`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    if (!ordersResponse.data.success) {
      console.log('❌ Failed to get orders:', ordersResponse.data.message);
      return;
    }
    
    const orders = ordersResponse.data.data;
    console.log(`✅ Found ${orders.length} orders`);
    
    if (orders.length === 0) {
      console.log('❌ No orders found to test cancellation');
      return;
    }
    
    // Step 3: Find an order that can be cancelled
    const cancellableOrder = orders.find(order => 
      ['Order Placed', 'Accepted', 'Preparing'].includes(order.status)
    );
    
    if (!cancellableOrder) {
      console.log('❌ No cancellable orders found');
      console.log('Available orders:');
      orders.forEach(order => {
        console.log(`  - Order ${order.orderId}: ${order.status}`);
      });
      return;
    }
    
    console.log(`✅ Found cancellable order: ${cancellableOrder.orderId} (${cancellableOrder.status})`);
    
    // Step 4: Cancel the order
    console.log('\n3. Cancelling order...');
    const cancelResponse = await axios.patch(`${BASE_URL}/orders/${cancellableOrder._id}/cancel`, {
      reason: 'Test cancellation - customer request'
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    if (cancelResponse.data.success) {
      console.log('✅ Order cancelled successfully');
      console.log('   Order ID:', cancelResponse.data.data.orderId);
      console.log('   Status:', cancelResponse.data.data.status);
      console.log('   Reason:', cancelResponse.data.data.cancellationReason);
    } else {
      console.log('❌ Order cancellation failed:', cancelResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testOrderCancellation(); 
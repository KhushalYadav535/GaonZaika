const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testOTPFlow() {
  try {
    console.log('Testing OTP Registration Flow...\n');

    // Step 1: Send registration OTP
    console.log('1. Sending registration OTP...');
    const registrationData = {
      name: 'Test User',
      phone: '9876543210',
      email: 'test@example.com',
      password: 'password123',
      role: 'customer'
    };

    const sendOTPResponse = await axios.post(`${BASE_URL}/auth/send-registration-otp`, registrationData);
    console.log('Send OTP Response:', sendOTPResponse.data);

    if (!sendOTPResponse.data.success) {
      console.error('Failed to send OTP');
      return;
    }

    // Step 2: Verify OTP (this would normally come from email)
    console.log('\n2. Verifying OTP...');
    console.log('Note: In a real scenario, you would get the OTP from your email');
    console.log('For testing, we need to check the server logs or global.registrationData');
    
    // For testing purposes, let's try with a dummy OTP first
    const verifyOTPData = {
      email: 'test@example.com',
      otp: '123456' // This will likely fail, but let's see the error
    };

    try {
      const verifyOTPResponse = await axios.post(`${BASE_URL}/auth/verify-registration-otp`, verifyOTPData);
      console.log('Verify OTP Response:', verifyOTPResponse.data);
    } catch (error) {
      console.log('Verify OTP Error (expected with dummy OTP):', error.response?.data);
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testOTPFlow(); 
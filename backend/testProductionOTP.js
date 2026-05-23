/**
 * Production OTP Test Script
 * Usage: node testProductionOTP.js <phone> <mode>
 * mode: 'login' ya 'register'
 * Examples:
 *   node testProductionOTP.js 9876543210 login
 *   node testProductionOTP.js 9876543210 register "Test User"
 */

const axios = require('axios');

const PRODUCTION_URL = 'https://gaonzaika.onrender.com/api';

const phone = process.argv[2];
const mode = process.argv[3] || 'login';
const name = process.argv[4] || 'Test User';

if (!phone) {
  console.error('Usage: node testProductionOTP.js <phone_number> [login|register] [name]');
  process.exit(1);
}

async function testSendOTP() {
  console.log('='.repeat(60));
  console.log(`🔥 Production OTP Test`);
  console.log(`📱 Phone   : ${phone}`);
  console.log(`🔑 Mode    : ${mode}`);
  console.log(`🌐 API URL : ${PRODUCTION_URL}`);
  console.log('='.repeat(60));

  try {
    let endpoint, payload;

    if (mode === 'login') {
      endpoint = '/auth/customer/send-login-otp';
      payload = { phone };
    } else {
      endpoint = '/auth/customer/send-registration-otp';
      payload = { phone, name };
    }

    console.log(`\n📤 Sending OTP to: ${phone}`);
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Payload: ${JSON.stringify(payload)}`);

    const response = await axios.post(`${PRODUCTION_URL}${endpoint}`, payload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('\n✅ Response Status:', response.status);
    console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      if (response.data.smsFailed) {
        console.log('\n⚠️  SMS delivery failed (Twilio issue) — lekin OTP DB mein save hua hai.');
        console.log('💡 Master OTP "123456" se verify karein.');
      } else {
        console.log('\n🎉 OTP successfully sent! Check your phone.');
      }
    } else {
      console.log('\n❌ OTP send failed:', response.data.message);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.status, error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('💡 Production server reachable nahi hai. Check: https://gaonzaika.onrender.com');
    }
  }
}

testSendOTP();

require('dotenv').config();
const { sendVerificationOTP, sendPasswordResetOTP } = require('./utils/emailService');

async function testEmailService() {
  console.log('Testing SendGrid Email Service...');
  console.log('Using API Key:', process.env.SENDGRID_API_KEY ? 'Configured' : 'Using default');
  
  try {
    // Test verification OTP email
    console.log('\n1. Testing verification OTP email...');
    const testEmail = 'your-email@gmail.com'; // Replace with your actual email
    const testOTP = '123456';
    
    console.log(`Sending to: ${testEmail}`);
    const verificationResult = await sendVerificationOTP(testEmail, testOTP);
    console.log('Verification OTP email result:', verificationResult);
    
    if (verificationResult) {
      console.log('✅ Verification email sent successfully!');
      console.log('📧 Check your email (including spam folder)');
    } else {
      console.log('❌ Verification email failed');
    }
    
    // Test password reset OTP email
    console.log('\n2. Testing password reset OTP email...');
    const passwordResetResult = await sendPasswordResetOTP(testEmail, testOTP);
    console.log('Password reset OTP email result:', passwordResetResult);
    
    if (passwordResetResult) {
      console.log('✅ Password reset email sent successfully!');
      console.log('📧 Check your email (including spam folder)');
    } else {
      console.log('❌ Password reset email failed');
    }
    
    console.log('\n🎉 Email service test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testEmailService();

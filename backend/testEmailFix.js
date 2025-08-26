require('dotenv').config();
const { sendVerificationOTP } = require('./utils/emailService');

async function testEmailFix() {
  console.log('Testing improved email service...');
  console.log('Environment check:');
  console.log('- SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : 'Not set');
  console.log('- EMAIL_HOST:', process.env.EMAIL_HOST || 'smtp.gmail.com');
  console.log('- EMAIL_USER:', process.env.EMAIL_USER || 'gaonzaika@gmail.com');
  
  try {
    const testEmail = 'test@example.com'; // Replace with your test email
    const testOTP = '123456';
    
    console.log(`\nSending test email to: ${testEmail}`);
    const result = await sendVerificationOTP(testEmail, testOTP);
    
    if (result) {
      console.log('✅ Email sent successfully!');
    } else {
      console.log('❌ Email failed to send');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailFix();

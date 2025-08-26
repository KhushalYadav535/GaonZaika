require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Debug: Check if .env is loaded
console.log('Environment variables loaded:');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : 'Not set');
console.log('API Key starts with SG.:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.startsWith('SG.') : 'No key');

// Set your SendGrid API key (temporarily hardcoded for testing)
const apiKey = process.env.SENDGRID_API_KEY || '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';
sgMail.setApiKey(apiKey);

async function testSendGrid() {
  console.log('Testing SendGrid Email Service...');
  console.log('API Key configured:', apiKey ? 'Yes' : 'No');
  console.log('Using API Key:', apiKey.substring(0, 10) + '...');
  
  const msg = {
    to: 'test@example.com', // Replace with your test email
    from: 'gaonzaika@gmail.com', // Verified sender
    subject: 'Test Email from Gaon Zaika',
    text: 'This is a test email from Gaon Zaika using SendGrid!',
    html: '<strong>This is a test email from Gaon Zaika using SendGrid!</strong>',
  };

  try {
    console.log('Sending test email...');
    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully!');
    console.log('Response:', response[0].statusCode);
    console.log('Headers:', response[0].headers);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Error body:', error.response.body);
    }
    return false;
  }
}

// Run the test
testSendGrid();

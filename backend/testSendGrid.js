require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Debug: Check if .env is loaded
console.log('Environment variables loaded:');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : 'Not set');
console.log('API Key starts with SG.:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.startsWith('SG.') : 'No key');

// Set your SendGrid API key
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable not set. Please set it in your .env file.');
  process.exit(1);
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function testSendGrid() {
  console.log('Testing SendGrid Email Service...');
  console.log('API Key configured:', process.env.SENDGRID_API_KEY ? 'Yes' : 'No');
  console.log('Using API Key:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.substring(0, 10) + '...' : 'None');
  
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

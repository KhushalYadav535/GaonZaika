require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Set your SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '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');

async function testSendGrid() {
  console.log('Testing SendGrid Email Service...');
  console.log('API Key configured:', process.env.SENDGRID_API_KEY ? 'Yes' : 'No');
  
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

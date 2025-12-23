/**
 * Helper script to fetch available Twilio phone numbers
 * Run this to find the correct phone number for your account
 * Usage: node utils/getTwilioPhoneNumbers.js
 */

const twilio = require('twilio');
require('dotenv').config();

// Use ONLY environment variables here. Do not hardcode real credentials.
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

async function getTwilioPhoneNumbers() {
  try {
    if (!accountSid || !authToken) {
      console.error('Twilio credentials not set. Please configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.');
      return;
    }

    const client = twilio(accountSid, authToken);
    
    console.log('Fetching phone numbers from Twilio account:', accountSid.substring(0, 10) + '...');
    console.log('---');
    
    // Get all phone numbers
    const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 20 });
    
    if (phoneNumbers.length === 0) {
      console.log('No phone numbers found in this account.');
      console.log('Please purchase a phone number from Twilio Console:');
      console.log('https://console.twilio.com/us1/develop/phone-numbers/manage/search');
      return;
    }
    
    console.log(`Found ${phoneNumbers.length} phone number(s):\n`);
    
    phoneNumbers.forEach((number, index) => {
      console.log(`${index + 1}. Phone Number: ${number.phoneNumber}`);
      console.log(`   Friendly Name: ${number.friendlyName || 'N/A'}`);
      console.log(`   SID: ${number.sid}`);
      console.log(`   Capabilities:`, number.capabilities);
      console.log('');
    });
    
    console.log('---');
    console.log('Copy one of these phone numbers and set it in your .env file:');
    console.log(`TWILIO_PHONE_NUMBER=${phoneNumbers[0].phoneNumber}`);
    
  } catch (error) {
    console.error('Error fetching phone numbers:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 20003) {
      console.error('\nAuthentication failed. Please check:');
      console.error('1. TWILIO_ACCOUNT_SID is correct');
      console.error('2. TWILIO_AUTH_TOKEN is correct');
    }
  }
}

// Run if called directly
if (require.main === module) {
  getTwilioPhoneNumbers();
}

module.exports = { getTwilioPhoneNumbers };


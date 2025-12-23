const twilio = require('twilio');
require('dotenv').config();

// Twilio configuration
// NOTE: Do NOT hardcode real credentials here. Always use environment variables (.env)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// Twilio phone number - must be in E.164 format (e.g., +15075790227)
// This must match a verified / purchased number in your Twilio account
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
let client;
try {
  if (!accountSid || !authToken) {
    console.error(
      'Twilio credentials not set. Please configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.'
    );
    client = null;
  } else {
    client = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Twilio client:', error);
  client = null;
}

/**
 * Send OTP via SMS using Twilio
 * @param {string} phoneNumber - Phone number with country code (e.g., +919876543210)
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>} - Returns true if SMS sent successfully
 */
const sendOTP = async (phoneNumber, otp) => {
  try {
    if (!client) {
      console.error('Twilio client not initialized');
      return false;
    }
    
    console.log('Sending OTP via Twilio to:', phoneNumber);
    
    // Ensure phone number has country code
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      // If no country code, assume India (+91)
      formattedPhone = '+91' + formattedPhone.replace(/^0+/, ''); // Remove leading zeros
    }
    
    const message = await client.messages.create({
      body: `Your Gaon Zaika OTP is: ${otp}. This OTP is valid for 10 minutes. Do not share this OTP with anyone.`,
      from: twilioPhoneNumber,
      to: formattedPhone
    });
    
    console.log('SMS sent successfully. Message SID:', message.sid);
    return true;
    
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      status: error.status,
      moreInfo: error.moreInfo
    });
    
    // Log specific error messages
    if (error.code === 21211) {
      console.error('Twilio Error: Invalid "To" phone number');
    } else if (error.code === 21212) {
      console.error('Twilio Error: Invalid "From" phone number');
    } else if (error.code === 21608) {
      console.error('Twilio Error: Unverified phone number (Trial account restriction)');
    } else if (error.code === 20003) {
      console.error('Twilio Error: Authentication failed - check Account SID and Auth Token');
    }
    
    return false;
  }
};

/**
 * Send login OTP
 */
const sendLoginOTP = async (phoneNumber, otp) => {
  try {
    if (!client) {
      console.error('Twilio client not initialized');
      return false;
    }
    
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
    }
    
    console.log('Sending login OTP via Twilio:', {
      to: formattedPhone,
      from: twilioPhoneNumber
    });
    
    const message = await client.messages.create({
      body: `Your Gaon Zaika login OTP is: ${otp}. This OTP is valid for 10 minutes.`,
      from: twilioPhoneNumber,
      to: formattedPhone
    });
    
    console.log('Login OTP SMS sent successfully. Message SID:', message.sid);
    return true;
    
  } catch (error) {
    console.error('Error sending login OTP SMS:', error);
    console.error('Twilio Error Details:', {
      code: error.code,
      message: error.message,
      status: error.status,
      moreInfo: error.moreInfo,
      stack: error.stack
    });
    
    // Log specific error messages for common issues
    if (error.code === 21211) {
      console.error('Twilio Error: Invalid "To" phone number:', formattedPhone);
    } else if (error.code === 21212) {
      console.error('Twilio Error: Invalid "From" phone number:', twilioPhoneNumber);
    } else if (error.code === 21608) {
      console.error('Twilio Error: Unverified phone number. Trial accounts can only send to verified numbers.');
      console.error('Please verify this number in Twilio console:', formattedPhone);
    } else if (error.code === 20003) {
      console.error('Twilio Error: Authentication failed. Check Account SID and Auth Token.');
    } else if (error.code === 21408) {
      console.error('Twilio Error: Permission denied. Check Twilio account permissions.');
    } else if (error.code === 21660) {
      console.error('Twilio Error: Phone number mismatch - The "From" number does not belong to this account');
      console.error('Please check your Twilio Console for the correct phone number');
      console.error('Current From number:', twilioPhoneNumber);
      console.error('Account SID:', accountSid);
      console.error('\nTo find your correct phone number, run:');
      console.error('node utils/getTwilioPhoneNumbers.js');
      console.error('Or check Twilio Console: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
    }
    
    return false;
  }
};

/**
 * Send registration OTP
 */
const sendRegistrationOTP = async (phoneNumber, otp) => {
  try {
    if (!client) {
      console.error('Twilio client not initialized');
      return false;
    }
    
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
    }
    
    console.log('Sending registration OTP via Twilio:', {
      to: formattedPhone,
      from: twilioPhoneNumber,
      accountSid: accountSid ? accountSid.substring(0, 10) + '...' : 'Not set'
    });
    
    const message = await client.messages.create({
      body: `Welcome to Gaon Zaika! Your registration OTP is: ${otp}. This OTP is valid for 10 minutes.`,
      from: twilioPhoneNumber,
      to: formattedPhone
    });
    
    console.log('Registration OTP SMS sent successfully. Message SID:', message.sid);
    return true;
    
  } catch (error) {
    console.error('Error sending registration OTP SMS:', error);
    console.error('Twilio Error Details:', {
      code: error.code,
      message: error.message,
      status: error.status,
      moreInfo: error.moreInfo,
      stack: error.stack
    });
    
    // Log specific error messages
    if (error.code === 21211) {
      console.error('Twilio Error: Invalid "To" phone number');
    } else if (error.code === 21212) {
      console.error('Twilio Error: Invalid "From" phone number');
    } else if (error.code === 21608) {
      console.error('Twilio Error: Unverified phone number (Trial account restriction)');
    } else if (error.code === 20003) {
      console.error('Twilio Error: Authentication failed - check Account SID and Auth Token');
    } else if (error.code === 21660) {
      console.error('Twilio Error: Phone number mismatch - The "From" number does not belong to this account');
      console.error('Current From number:', twilioPhoneNumber);
      console.error('Account SID:', accountSid);
      console.error('\nTo find your correct phone number, run:');
      console.error('node utils/getTwilioPhoneNumbers.js');
      console.error('Or check Twilio Console: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
    }
    
    return false;
  }
};

module.exports = {
  sendOTP,
  sendLoginOTP,
  sendRegistrationOTP
};


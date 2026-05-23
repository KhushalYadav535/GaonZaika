const twilio = require('twilio');
const axios = require('axios');
require('dotenv').config();
const { formatIndianPhone } = require('./phoneUtils');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const msg91AuthKey = process.env.MSG91_AUTH_KEY;
const msg91SenderId = process.env.MSG91_SENDER_ID || 'GAONZK';
const smsProvider = (process.env.SMS_PROVIDER || '').toLowerCase();

let client = null;
let twilioAccountType = null;

const TWILIO_USER_MESSAGES = {
  21608: 'Trial account: is number ko Twilio Console mein verify karein, ya account upgrade karein.',
  21211: 'Invalid phone number. 10-digit mobile number enter karein.',
  21212: 'SMS sender number invalid hai. TWILIO_PHONE_NUMBER check karein.',
  20003: 'Twilio credentials galat hain. .env file check karein.',
  21660: 'TWILIO_PHONE_NUMBER is account se match nahi karta.',
  21408: 'Twilio account permission issue. Geo permissions check karein.'
};

const getUserMessage = (errorCode, fallback) => {
  return TWILIO_USER_MESSAGES[errorCode] || fallback || 'OTP SMS bhejne mein problem aayi. Thodi der baad try karein.';
};

const resolveProvider = () => {
  if (smsProvider === 'msg91' && msg91AuthKey) return 'msg91';
  if (smsProvider === 'twilio' && client) return 'twilio';
  if (msg91AuthKey) return 'msg91';
  if (client) return 'twilio';
  return null;
};

const sendViaMsg91 = async (phoneNumber, message) => {
  const formattedPhone = formatIndianPhone(phoneNumber);
  if (!formattedPhone) {
    return {
      success: false,
      errorCode: 'INVALID_PHONE',
      userMessage: 'Valid 10-digit Indian mobile number enter karein.'
    };
  }

  const mobile = formattedPhone.replace('+', '');

  try {
    const response = await axios.post(
      'https://control.msg91.com/api/v5/flow/',
      {
        template_id: process.env.MSG91_TEMPLATE_ID,
        short_url: '0',
        recipients: [
          {
            mobiles: mobile,
            var: message
          }
        ]
      },
      {
        headers: {
          authkey: msg91AuthKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data?.type === 'success' || response.status === 200) {
      console.log('MSG91 SMS sent to:', formattedPhone);
      return { success: true };
    }

    console.error('MSG91 unexpected response:', response.data);
    return {
      success: false,
      errorCode: 'MSG91_FAILED',
      userMessage: 'OTP SMS bhejne mein problem aayi (MSG91).'
    };
  } catch (msg91FlowError) {
    // Fallback: legacy HTTP API (works without template_id)
    try {
      const params = new URLSearchParams({
        authkey: msg91AuthKey,
        mobiles: mobile,
        message,
        sender: msg91SenderId,
        route: '4',
        country: '91'
      });

      const legacyResponse = await axios.get(
        `https://api.msg91.com/api/sendhttp.php?${params.toString()}`,
        { timeout: 15000 }
      );

      const body = String(legacyResponse.data || '').trim();
      if (body && !body.toLowerCase().includes('error')) {
        console.log('MSG91 legacy SMS sent to:', formattedPhone, 'id:', body);
        return { success: true };
      }

      console.error('MSG91 legacy API error:', body);
      return {
        success: false,
        errorCode: 'MSG91_FAILED',
        userMessage: 'OTP SMS bhejne mein problem aayi (MSG91). Sender ID / route check karein.'
      };
    } catch (error) {
      console.error('MSG91 SMS error:', error.response?.data || error.message);
      return {
        success: false,
        errorCode: 'MSG91_FAILED',
        userMessage: 'OTP SMS bhejne mein problem aayi (MSG91). API key check karein.'
      };
    }
  }
};

const sendViaTwilio = async (phoneNumber, body) => {
  if (!client) {
    return {
      success: false,
      errorCode: 'TWILIO_NOT_CONFIGURED',
      userMessage: 'SMS service configure nahi hai. TWILIO_ACCOUNT_SID aur TWILIO_AUTH_TOKEN set karein.'
    };
  }

  if (!twilioPhoneNumber) {
    return {
      success: false,
      errorCode: 'TWILIO_FROM_MISSING',
      userMessage: 'TWILIO_PHONE_NUMBER .env mein set karein.'
    };
  }

  const formattedPhone = formatIndianPhone(phoneNumber);
  if (!formattedPhone) {
    return {
      success: false,
      errorCode: 'INVALID_PHONE',
      userMessage: 'Valid 10-digit Indian mobile number enter karein.'
    };
  }

  try {
    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    console.log('Twilio SMS sent. SID:', message.sid, 'to:', formattedPhone);

    if (twilioAccountType === 'Trial') {
      console.warn(
        'Twilio Trial account: OTP sirf verified numbers par deliver hota hai. Production ke liye account upgrade ya MSG91 use karein.'
      );
    }

    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('Twilio SMS error:', {
      code: error.code,
      message: error.message,
      status: error.status,
      to: formattedPhone
    });

    return {
      success: false,
      errorCode: String(error.code || 'TWILIO_ERROR'),
      userMessage: getUserMessage(error.code, error.message)
    };
  }
};

const sendSms = async (phoneNumber, body) => {
  const provider = resolveProvider();

  if (!provider) {
    if (process.env.NODE_ENV === 'development' && process.env.LOG_OTP_TO_CONSOLE === 'true') {
      console.log('[DEV] OTP (no SMS provider):', formatIndianPhone(phoneNumber), body);
      return { success: true, devMode: true };
    }

    return {
      success: false,
      errorCode: 'SMS_NOT_CONFIGURED',
      userMessage: 'SMS service configure nahi hai. Twilio ya MSG91 credentials add karein.'
    };
  }

  if (provider === 'msg91') {
    return sendViaMsg91(phoneNumber, body);
  }

  return sendViaTwilio(phoneNumber, body);
};

// Initialize Twilio client
try {
  if (!accountSid || !authToken) {
    console.error(
      'Twilio credentials not set. Configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN, or use MSG91_AUTH_KEY.'
    );
  } else {
    client = twilio(accountSid, authToken);
    console.log('Twilio client initialized');

    client.api.accounts(accountSid).fetch()
      .then((account) => {
        twilioAccountType = account.type;
        if (account.type === 'Trial') {
          console.warn(
            'WARNING: Twilio Trial account detected. Customer OTP sirf verified phone numbers par jayega. ' +
            'Fix: https://console.twilio.com/us1/develop/phone-numbers/manage/verified — ya MSG91_AUTH_KEY set karein.'
          );
        }
      })
      .catch((err) => console.error('Could not fetch Twilio account info:', err.message));
  }
} catch (error) {
  console.error('Error initializing Twilio client:', error);
  client = null;
}

const sendOTP = async (phoneNumber, otp) => {
  const body = `Your Gaon Zaika OTP is: ${otp}. Valid for 10 minutes. Do not share.`;
  return sendSms(phoneNumber, body);
};

const sendLoginOTP = async (phoneNumber, otp) => {
  const body = `Your Gaon Zaika login OTP is: ${otp}. Valid for 10 minutes.`;
  return sendSms(phoneNumber, body);
};

const sendRegistrationOTP = async (phoneNumber, otp) => {
  const body = `Welcome to Gaon Zaika! Registration OTP: ${otp}. Valid for 10 minutes.`;
  return sendSms(phoneNumber, body);
};

module.exports = {
  sendOTP,
  sendLoginOTP,
  sendRegistrationOTP,
  sendSms,
  formatIndianPhone
};

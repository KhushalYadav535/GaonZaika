const twilio = require('twilio');
const axios = require('axios');
require('dotenv').config();
const { formatIndianPhone } = require('./phoneUtils');

// ─── Provider Credentials ────────────────────────────────────────────────────
const twoFactorApiKey  = process.env.TWO_FACTOR_API_KEY;           // 2Factor.in
const twoFactorTemplate = process.env.TWO_FACTOR_TEMPLATE || 'GaonZaikaOTP'; // Approved template name

const msg91AuthKey  = process.env.MSG91_AUTH_KEY;
const msg91SenderId = process.env.MSG91_SENDER_ID || 'GAONZK';

const accountSid       = process.env.TWILIO_ACCOUNT_SID;
const authToken        = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// SMS_PROVIDER env se override karo: '2factor' | 'msg91' | 'twilio'
const smsProvider = (process.env.SMS_PROVIDER || '').toLowerCase();

let twilioClient = null;
let twilioAccountType = null;

// ─── Provider Resolution (Priority: 2factor > msg91 > twilio) ────────────────
const resolveProvider = () => {
  if (smsProvider === '2factor'  && twoFactorApiKey)  return '2factor';
  if (smsProvider === 'msg91'    && msg91AuthKey)      return 'msg91';
  if (smsProvider === 'twilio'   && twilioClient)      return 'twilio';
  // Auto-detect
  if (twoFactorApiKey)  return '2factor';
  if (msg91AuthKey)     return 'msg91';
  if (twilioClient)     return 'twilio';
  return null;
};

// ─── 2Factor.in ──────────────────────────────────────────────────────────────
// API: GET https://2factor.in/API/V1/{API_KEY}/SMS/{PHONE}/{OTP}/{TEMPLATE}
// Template "GaonZaikaOTP": "XXXX is your OTP for phone verification on Gaon Zaika. Do not share this OTP with anyone."
const sendVia2Factor = async (phoneNumber, otp) => {
  const formattedPhone = formatIndianPhone(phoneNumber);
  if (!formattedPhone) {
    return { success: false, errorCode: 'INVALID_PHONE', userMessage: 'Valid 10-digit Indian mobile number enter karein.' };
  }

  // 2Factor sirf 10-digit number accept karta hai (without +91)
  const digits = formattedPhone.replace('+91', '');

  try {
    const url = `https://2factor.in/API/V1/${twoFactorApiKey}/SMS/${digits}/${otp}/${twoFactorTemplate}`;
    const response = await axios.get(url, { timeout: 15000 });

    if (response.data?.Status === 'Success') {
      console.log(`[2FACTOR] ✅ OTP sent to ${formattedPhone} | Session: ${response.data.Details}`);
      return { success: true, sessionId: response.data.Details };
    }

    console.error('[2FACTOR] ❌ Unexpected response:', response.data);
    return {
      success: false,
      errorCode: '2FACTOR_FAILED',
      userMessage: `OTP bhejne mein dikkat aayi: ${response.data?.Details || 'Unknown error'}`
    };
  } catch (error) {
    console.error('[2FACTOR] ❌ API error:', error.response?.data || error.message);
    return {
      success: false,
      errorCode: '2FACTOR_ERROR',
      userMessage: 'OTP SMS bhejne mein problem aayi. Thodi der baad try karein.'
    };
  }
};

// ─── MSG91 ────────────────────────────────────────────────────────────────────
const sendViaMsg91 = async (phoneNumber, message) => {
  const formattedPhone = formatIndianPhone(phoneNumber);
  if (!formattedPhone) {
    return { success: false, errorCode: 'INVALID_PHONE', userMessage: 'Valid 10-digit Indian mobile number enter karein.' };
  }

  const mobile = formattedPhone.replace('+', '');

  try {
    const response = await axios.post(
      'https://control.msg91.com/api/v5/flow/',
      {
        template_id: process.env.MSG91_TEMPLATE_ID,
        short_url: '0',
        recipients: [{ mobiles: mobile, var: message }]
      },
      { headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' }, timeout: 15000 }
    );

    if (response.data?.type === 'success' || response.status === 200) {
      console.log('[MSG91] ✅ SMS sent to:', formattedPhone);
      return { success: true };
    }

    console.error('[MSG91] ❌ Unexpected response:', response.data);
    return { success: false, errorCode: 'MSG91_FAILED', userMessage: 'OTP SMS bhejne mein problem aayi (MSG91).' };
  } catch (msg91FlowError) {
    // Fallback to legacy API
    try {
      const params = new URLSearchParams({
        authkey: msg91AuthKey, mobiles: mobile, message,
        sender: msg91SenderId, route: '4', country: '91'
      });
      const legacyResponse = await axios.get(
        `https://api.msg91.com/api/sendhttp.php?${params.toString()}`,
        { timeout: 15000 }
      );
      const body = String(legacyResponse.data || '').trim();
      if (body && !body.toLowerCase().includes('error')) {
        console.log('[MSG91 legacy] ✅ SMS sent to:', formattedPhone);
        return { success: true };
      }
      return { success: false, errorCode: 'MSG91_FAILED', userMessage: 'OTP SMS bhejne mein problem aayi (MSG91).' };
    } catch (error) {
      console.error('[MSG91] ❌ Error:', error.response?.data || error.message);
      return { success: false, errorCode: 'MSG91_FAILED', userMessage: 'OTP SMS bhejne mein problem aayi (MSG91).' };
    }
  }
};

// ─── Twilio ───────────────────────────────────────────────────────────────────
const sendViaTwilio = async (phoneNumber, body) => {
  if (!twilioClient || !twilioPhoneNumber) {
    return { success: false, errorCode: 'TWILIO_NOT_CONFIGURED', userMessage: 'Twilio configure nahi hai.' };
  }

  const formattedPhone = formatIndianPhone(phoneNumber);
  if (!formattedPhone) {
    return { success: false, errorCode: 'INVALID_PHONE', userMessage: 'Valid 10-digit Indian mobile number enter karein.' };
  }

  try {
    const message = await twilioClient.messages.create({ body, from: twilioPhoneNumber, to: formattedPhone });
    console.log('[TWILIO] ✅ SMS sent. SID:', message.sid, 'to:', formattedPhone);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('[TWILIO] ❌ Error:', { code: error.code, message: error.message, to: formattedPhone });
    return {
      success: false,
      errorCode: String(error.code || 'TWILIO_ERROR'),
      userMessage: error.message || 'OTP SMS bhejne mein problem aayi.'
    };
  }
};

// ─── Main sendSms ─────────────────────────────────────────────────────────────
const sendSms = async (phoneNumber, body, otp = null) => {
  const provider = resolveProvider();
  console.log(`[SMS] Using provider: ${provider || 'NONE'}`);

  if (!provider) {
    if (process.env.NODE_ENV !== 'production' && process.env.LOG_OTP_TO_CONSOLE === 'true') {
      console.log('[DEV] OTP (no SMS provider):', formatIndianPhone(phoneNumber), body);
      return { success: true, devMode: true };
    }
    return { success: false, errorCode: 'SMS_NOT_CONFIGURED', userMessage: 'SMS service configure nahi hai.' };
  }

  if (provider === '2factor') {
    // 2Factor ke liye OTP directly pass karte hain (template mein XXXX replace hoga)
    return sendVia2Factor(phoneNumber, otp || body);
  }

  if (provider === 'msg91') return sendViaMsg91(phoneNumber, body);

  return sendViaTwilio(phoneNumber, body);
};

// ─── Initialize Twilio (kept as fallback) ─────────────────────────────────────
try {
  if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
    console.log('[TWILIO] Client initialized (fallback provider)');
    twilioClient.api.accounts(accountSid).fetch()
      .then(account => {
        twilioAccountType = account.type;
        if (account.type === 'Trial') {
          console.warn('[TWILIO] ⚠️ Trial account — OTP sirf verified numbers par jayega.');
        }
      })
      .catch(err => console.error('[TWILIO] Could not fetch account info:', err.message));
  } else {
    console.log('[TWILIO] Credentials not set — skipping Twilio init.');
  }
} catch (error) {
  console.error('[TWILIO] Init error:', error);
  twilioClient = null;
}

// ─── Exports ──────────────────────────────────────────────────────────────────
const sendOTP = async (phoneNumber, otp) => {
  return sendSms(phoneNumber, `Your Gaon Zaika OTP is: ${otp}. Valid for 10 minutes. Do not share.`, otp);
};

const sendLoginOTP = async (phoneNumber, otp) => {
  return sendSms(phoneNumber, `Your Gaon Zaika login OTP is: ${otp}. Valid for 10 minutes.`, otp);
};

const sendRegistrationOTP = async (phoneNumber, otp) => {
  return sendSms(phoneNumber, `Welcome to Gaon Zaika! Registration OTP: ${otp}. Valid for 10 minutes.`, otp);
};

module.exports = {
  sendOTP,
  sendLoginOTP,
  sendRegistrationOTP,
  sendSms,
  formatIndianPhone
};

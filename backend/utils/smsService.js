const axios = require('axios');
require('dotenv').config();
const { formatIndianPhone } = require('./phoneUtils');

// ─── apitxt.com Credentials ───────────────────────────────────────────────────
const APITXT_AUTH_KEY = process.env.APITXT_AUTH_KEY || '5sM9Kkva6cBecF9Z1tNyyrl_OdfjE3vGtrJTudjZsy0';
const APITXT_BASE_URL = 'https://apitxt.com/api/sendOTP';

// Optional overrides from .env
const APITXT_CHANNEL    = (process.env.APITXT_CHANNEL    || 'sms').toLowerCase();  // 'sms' | 'whatsapp' | 'voice'
const APITXT_TEMPLATE_ID = process.env.APITXT_TEMPLATE_ID || null;  // numeric template_id (SMS only)

// ─── Send OTP via apitxt.com ──────────────────────────────────────────────────
/**
 * Sends an OTP using apitxt.com's Unified OTP API.
 *
 * @param {string} phoneNumber  - Raw phone number (10-digit, 91XXXXXXXXXX, or +91XXXXXXXXXX)
 * @param {string} otp          - The OTP code to send
 * @param {string} [channel]    - 'sms' | 'whatsapp' | 'voice' (defaults to APITXT_CHANNEL)
 * @returns {Promise<{success: boolean, requestId?: string, errorCode?: string, userMessage?: string}>}
 */
const sendViaApitxt = async (phoneNumber, otp, channel = APITXT_CHANNEL) => {
  const formattedPhone = formatIndianPhone(phoneNumber);
  if (!formattedPhone) {
    return {
      success: false,
      errorCode: 'INVALID_PHONE',
      userMessage: 'Valid 10-digit Indian mobile number enter karein.'
    };
  }

  // apitxt accepts number with country code, no '+' prefix (e.g. 919999999999)
  const mobile = formattedPhone.replace('+', '');

  const params = {
    authkey: APITXT_AUTH_KEY,
    mobile,
    otp,
    channel,
    country: '91'
  };

  // Attach optional template_id (SMS only)
  if (APITXT_TEMPLATE_ID && channel === 'sms') {
    params.template_id = APITXT_TEMPLATE_ID;
  }

  try {
    console.log(`[APITXT] Sending ${channel.toUpperCase()} OTP to ${formattedPhone}...`);
    const response = await axios.get(APITXT_BASE_URL, { params, timeout: 15000 });

    if (response.data?.status === 'success') {
      const requestId = response.data?.data?.request_id;
      console.log(`[APITXT] ✅ OTP sent to ${formattedPhone} | Request ID: ${requestId}`);
      return { success: true, requestId, method: `APITXT_${channel.toUpperCase()}` };
    }

    // API returned a non-success status
    const errMsg = response.data?.message || JSON.stringify(response.data);
    console.error('[APITXT] ❌ API responded with failure:', errMsg);
    return {
      success: false,
      errorCode: 'APITXT_FAILED',
      userMessage: `OTP bhejne mein dikkat aayi: ${errMsg}`
    };
  } catch (error) {
    const detail = error.response?.data || error.message;
    console.error('[APITXT] ❌ Request error:', detail);
    return {
      success: false,
      errorCode: 'APITXT_ERROR',
      userMessage: 'OTP SMS bhejne mein problem aayi. Thodi der baad try karein.'
    };
  }
};

// ─── Main sendSms (public interface, matches previous signature) ──────────────
/**
 * @param {string} phoneNumber - Mobile number
 * @param {string} body        - Unused legacy param (kept for backward compat)
 * @param {string|null} otp    - OTP code (preferred over body)
 */
const sendSms = async (phoneNumber, body, otp = null) => {
  const otpCode = otp || body;

  if (!APITXT_AUTH_KEY) {
    if (process.env.NODE_ENV !== 'production' && process.env.LOG_OTP_TO_CONSOLE === 'true') {
      console.log('[DEV] OTP (no SMS provider):', formatIndianPhone(phoneNumber), otpCode);
      return { success: true, devMode: true };
    }
    return {
      success: false,
      errorCode: 'SMS_NOT_CONFIGURED',
      userMessage: 'SMS service configure nahi hai.'
    };
  }

  return sendViaApitxt(phoneNumber, otpCode);
};

// ─── Convenience exports (same interface as before) ──────────────────────────
const sendOTP = async (phoneNumber, otp) => {
  return sendViaApitxt(phoneNumber, otp);
};

const sendLoginOTP = async (phoneNumber, otp, channel) => {
  return sendViaApitxt(phoneNumber, otp, channel);
};

const sendRegistrationOTP = async (phoneNumber, otp, channel) => {
  return sendViaApitxt(phoneNumber, otp, channel);
};

module.exports = {
  sendOTP,
  sendLoginOTP,
  sendRegistrationOTP,
  sendSms,
  formatIndianPhone
};

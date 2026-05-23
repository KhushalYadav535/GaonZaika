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

// ─── Provider Resolution (Priority: msg91 > 2factor > twilio) ────────────────
const resolveProvider = () => {
  if (smsProvider === 'msg91'    && msg91AuthKey)      return 'msg91';
  if (smsProvider === '2factor'  && twoFactorApiKey)  return '2factor';
  if (smsProvider === 'twilio'   && twilioClient)      return 'twilio';
  // Auto-detect
  if (msg91AuthKey)     return 'msg91';
  if (twoFactorApiKey)  return '2factor';
  if (twilioClient)     return 'twilio';
  return null;
};

// ─── 2Factor.in ──────────────────────────────────────────────────────────────
// PRIMARY  : R1 Transactional SMS API — DLT sender GZAIKA se direct SMS, no voice fallback
// FALLBACK : V1 OTP API (voice call fallback ho sakta hai)
// Template : "XXXX is your OTP for phone verification on Gaon Zaika. Do not share this OTP with anyone."
const sendVia2Factor = async (phoneNumber, otp) => {
  const formattedPhone = formatIndianPhone(phoneNumber);
  if (!formattedPhone) {
    return { success: false, errorCode: 'INVALID_PHONE', userMessage: 'Valid 10-digit Indian mobile number enter karein.' };
  }

  // 2Factor sirf 10-digit number accept karta hai (without +91)
  const digits = formattedPhone.replace('+91', '');
  const senderID = process.env.TWO_FACTOR_SENDER_ID || 'GZAIKA';

  // Template text mein XXXX ko actual OTP se replace karein
  const smsText = `${otp} is your OTP for phone verification on Gaon Zaika. Do not share this OTP with anyone.`;

  // ── Step 1: R1 Transactional SMS API (DLT-compliant, no voice fallback) ──────
  try {
    const r1Url = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${twoFactorApiKey}&to=${digits}&from=${senderID}&msg=${encodeURIComponent(smsText)}&templatename=${encodeURIComponent(twoFactorTemplate)}`;
    console.log(`[2FACTOR R1] Sending transactional SMS to ${formattedPhone} from ${senderID}...`);
    const r1Response = await axios.get(r1Url, { timeout: 15000 });

    if (r1Response.data?.Status === 'Success') {
      console.log(`[2FACTOR R1] OTP SMS sent to ${formattedPhone} | Session: ${r1Response.data.Details}`);
      return { success: true, sessionId: r1Response.data.Details, method: 'R1_TRANS_SMS' };
    }

    console.warn('[2FACTOR R1] R1 API response:', r1Response.data, '— trying V1 OTP API...');
  } catch (r1Error) {
    console.warn('[2FACTOR R1] R1 API error:', r1Error.response?.data || r1Error.message, '— trying V1 OTP API...');
  }


  // ── Step 2: V1 OTP API as fallback ───────────────────────────────────────────
  try {
    const v1Url = `https://2factor.in/API/V1/${twoFactorApiKey}/SMS/${digits}/${otp}/${twoFactorTemplate}`;
    console.log(`[2FACTOR V1] Fallback OTP send to ${formattedPhone}...`);
    const v1Response = await axios.get(v1Url, { timeout: 15000 });

    if (v1Response.data?.Status === 'Success') {
      console.log(`[2FACTOR V1] OTP sent to ${formattedPhone} | Session: ${v1Response.data.Details}`);
      return { success: true, sessionId: v1Response.data.Details, method: 'V1_OTP' };
    }

    console.error('[2FACTOR V1] Unexpected response:', v1Response.data);
    return {
      success: false,
      errorCode: '2FACTOR_FAILED',
      userMessage: `OTP bhejne mein dikkat aayi: ${v1Response.data?.Details || 'Unknown error'}`
    };
  } catch (error) {
    console.error('[2FACTOR] Both APIs failed:', error.response?.data || error.message);
    return {
      success: false,
      errorCode: '2FACTOR_ERROR',
      userMessage: 'OTP SMS bhejne mein problem aayi. Thodi der baad try karein.'
    };
  }
};


// ─── MSG91 ────────────────────────────────────────────────────────────────────
const sendViaMsg91 = async (phoneNumber, otp) => {
  const formattedPhone = formatIndianPhone(phoneNumber);
  if (!formattedPhone) {
    return { success: false, errorCode: 'INVALID_PHONE', userMessage: 'Valid 10-digit Indian mobile number enter karein.' };
  }

  // MSG91 OTP API requires country code without '+' (e.g. 918182838680)
  const mobile = formattedPhone.replace('+', '');

  try {
    const response = await axios.get('https://control.msg91.com/api/v5/otp', {
      params: {
        mobile: mobile,
        authkey: msg91AuthKey,
        otp: otp
      },
      timeout: 15000
    });

    if (response.data?.type === 'success') {
      console.log(`[MSG91] ✅ OTP sent to ${formattedPhone} | Request ID: ${response.data.request_id}`);
      return { success: true, sessionId: response.data.request_id, method: 'MSG91_OTP' };
    }

    console.error('[MSG91] ❌ Unexpected response:', response.data);
    return {
      success: false,
      errorCode: 'MSG91_FAILED',
      userMessage: `OTP bhejne mein dikkat aayi: ${response.data?.message || 'Unknown error'}`
    };
  } catch (error) {
    console.error('[MSG91] ❌ API error:', error.response?.data || error.message);
    return {
      success: false,
      errorCode: 'MSG91_ERROR',
      userMessage: 'OTP SMS bhejne mein problem aayi (MSG91).'
    };
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

  if (provider === 'msg91') {
    return sendViaMsg91(phoneNumber, otp || body);
  }

  if (provider === '2factor') {
    // 2Factor ke liye OTP directly pass karte hain (template mein XXXX replace hoga)
    return sendVia2Factor(phoneNumber, otp || body);
  }

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

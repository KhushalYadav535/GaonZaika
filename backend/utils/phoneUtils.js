/**
 * Normalize Indian mobile numbers to E.164 (+91XXXXXXXXXX).
 */
const formatIndianPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  let cleaned = phone.trim().replace(/[\s-]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.slice(1).replace(/\D/g, '');
    if (cleaned.startsWith('+91')) {
      const digits = cleaned.slice(3);
      if (digits.length === 10) {
        return `+91${digits}`;
      }
    }
    return cleaned.length >= 12 ? cleaned : null;
  }

  const digitsOnly = cleaned.replace(/\D/g, '');
  let national = digitsOnly;

  if (national.startsWith('91') && national.length === 12) {
    national = national.slice(2);
  }
  if (national.startsWith('0')) {
    national = national.replace(/^0+/, '');
  }

  if (national.length !== 10 || !/^[6-9]\d{9}$/.test(national)) {
    return null;
  }

  return `+91${national}`;
};

/**
 * Build MongoDB query matching common stored phone formats.
 */
const buildPhoneQuery = (formattedPhone) => {
  if (!formattedPhone) {
    return null;
  }

  const digits = formattedPhone.replace(/\D/g, '');
  const national = digits.startsWith('91') && digits.length === 12
    ? digits.slice(2)
    : digits.slice(-10);

  const variants = new Set([
    formattedPhone,
    national,
    `91${national}`,
    `+91${national}`,
    `0${national}`
  ]);

  return { phone: { $in: [...variants] } };
};

module.exports = {
  formatIndianPhone,
  buildPhoneQuery
};

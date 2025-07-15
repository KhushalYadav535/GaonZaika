const crypto = require('crypto');

console.log('🔐 Generating Secure Secrets for Gaon Zaika...\n');

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('');

// Generate API Key (for future use)
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('API_KEY (for future use):');
console.log(apiKey);
console.log('');

// Generate Session Secret
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET (for future use):');
console.log(sessionSecret);
console.log('');

console.log('📋 Instructions:');
console.log('1. Copy the JWT_SECRET above');
console.log('2. Paste it in Render Environment Variables');
console.log('3. Keep these secrets secure and never commit to Git');
console.log('');

console.log('🔒 Security Tips:');
console.log('✅ Use different secrets for development and production');
console.log('✅ Regularly rotate your secrets');
console.log('✅ Store secrets in environment variables only');
console.log('✅ Never log or display secrets in production'); 
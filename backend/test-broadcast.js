const mongoose = require('mongoose');
require('dotenv').config();
const Customer = require('./models/Customer');
const Vendor = require('./models/Vendor');
const DeliveryPerson = require('./models/DeliveryPerson');
const pushNotificationService = require('./services/pushNotificationService');

async function sendTestBroadcast() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gaonzaika');
    console.log('Connected to DB');

    const title = 'Welcome to Gaon Zaika! 🎉';
    const message = 'Thank you for downloading Gaon Zaika. Enjoy tasty local food delivered fresh to your doorstep! ❤️🍽️';
    
    const tokens = [];

    const customers = await Customer.find({ pushToken: { $exists: true, $ne: '' } }).select('pushToken');
    tokens.push(...customers.map(c => c.pushToken));

    const vendors = await Vendor.find({ pushToken: { $exists: true, $ne: '' } }).select('pushToken');
    tokens.push(...vendors.map(v => v.pushToken));

    const delivery = await DeliveryPerson.find({ pushToken: { $exists: true, $ne: '' } }).select('pushToken');
    tokens.push(...delivery.map(d => d.pushToken));

    const validTokens = [...new Set(tokens.filter(t => t && t.startsWith('Expo')))];
    console.log(`Found ${validTokens.length} valid tokens.`);

    if (validTokens.length > 0) {
      const response = await pushNotificationService.sendPushNotificationToMultiple(
        validTokens,
        title,
        message,
        { type: 'system' }
      );
      console.log('Broadcast Sent:', response);
    } else {
      console.log('No valid tokens found to send.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

sendTestBroadcast();

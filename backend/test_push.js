const mongoose = require('mongoose');
const axios = require('axios');

async function testPush() {
  await mongoose.connect('mongodb+srv://user1:khushal123@cluster0.zoxm4.mongodb.net/gaon-zaika?retryWrites=true&w=majority&appName=Cluster0');
  
  const Customer = mongoose.model('Customer', new mongoose.Schema({ pushToken: String }, { strict: false }));
  const Vendor = mongoose.model('Vendor', new mongoose.Schema({ pushToken: String }, { strict: false }));
  const DeliveryPerson = mongoose.model('DeliveryPerson', new mongoose.Schema({ pushToken: String }, { strict: false }));

  const customers = await Customer.find({ pushToken: { $exists: true, $ne: null } });
  const vendors = await Vendor.find({ pushToken: { $exists: true, $ne: null } });
  const delivery = await DeliveryPerson.find({ pushToken: { $exists: true, $ne: null } });

  const allTokens = [
    ...customers.map(c => c.pushToken),
    ...vendors.map(v => v.pushToken),
    ...delivery.map(d => d.pushToken)
  ].filter(Boolean);

  console.log(`Found ${allTokens.length} tokens.`);
  console.log('Tokens:', allTokens);

  if (allTokens.length === 0) {
    console.log('No tokens found. Cannot test.');
    process.exit(0);
  }

  const messages = allTokens.map(token => ({
    to: token,
    sound: 'default',
    title: 'Hello from Server!',
    body: 'This is a direct test message to verify Expo Push',
    data: { type: 'promotional' },
    priority: 'high',
    vibrate: [0, 250, 250, 250],
    badge: 1,
    channelId: 'order-notifications',
  }));

  try {
    console.log('Sending to Expo:', JSON.stringify(messages, null, 2));
    const response = await axios.post('https://exp.host/--/api/v2/push/send', messages, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });
    console.log('Expo Response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('Expo Error:', err.response?.data || err.message);
  }

  process.exit(0);
}

testPush();

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const DeliveryPerson = require('./models/DeliveryPerson');

async function markOffline() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gaonzaika');
    console.log('Connected to DB');

    // Update all delivery persons to offline except Hemant
    const result = await DeliveryPerson.updateMany(
      { name: { $not: { $regex: 'hemant', $options: 'i' } } },
      { $set: { isOnline: false } }
    );
    
    console.log(`Successfully updated ${result.modifiedCount} delivery boys to offline.`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
markOffline();

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function fixAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Delete and recreate with PLAIN text — pre-save hook will hash it once
  await Admin.deleteOne({ email: 'admin@gaonzaika.com' });
  console.log('Old admin deleted');

  // Pass plain text password — model's pre-save hook handles hashing
  const admin = new Admin({
    name: 'Super Admin',
    email: 'admin@gaonzaika.com',
    password: 'Khushal@2003',   // plain text — will be hashed by pre-save
    role: 'super_admin',
    isActive: true,
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_restaurants', 'manage_orders', 'view_analytics']
  });
  await admin.save();
  console.log('✅ Admin created with plain text (pre-save hook will hash)');

  // Verify
  const found = await Admin.findOne({ email: 'admin@gaonzaika.com' });
  const isMatch = await found.comparePassword('Khushal@2003');
  console.log('✅ Password verification:', isMatch ? 'PASS ✓' : 'FAIL ✗');
  console.log('isActive:', found.isActive);

  await mongoose.disconnect();
  process.exit(0);
}

fixAdmin().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

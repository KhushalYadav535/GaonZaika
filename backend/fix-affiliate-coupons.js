const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  const Affiliate = require('./models/Affiliate');
  const Coupon = require('./models/Coupon');
  
  // Step 1: Fix via Affiliate model links
  const affiliates = await Affiliate.find({ couponId: { $exists: true, $ne: null } });
  console.log('Affiliates with coupon:', affiliates.length);
  
  const couponIds = affiliates.map(a => a.couponId).filter(Boolean);
  console.log('Coupon IDs to fix:', couponIds.map(id => id.toString()));
  
  if (couponIds.length > 0) {
    const result = await Coupon.updateMany(
      { _id: { $in: couponIds } },
      { $set: { isAffiliate: true } }
    );
    console.log('Fixed via affiliate link:', result.modifiedCount, 'coupon(s)');
  }
  
  // Step 2: Fix any coupon whose description mentions "affiliate"
  const result2 = await Coupon.updateMany(
    { description: { $regex: 'affiliate', $options: 'i' } },
    { $set: { isAffiliate: true } }
  );
  console.log('Fixed via description pattern:', result2.modifiedCount, 'coupon(s)');
  
  // Step 3: Show all coupons status
  const allCoupons = await Coupon.find({}).select('code isAffiliate description');
  console.log('\nAll coupons in DB:');
  allCoupons.forEach(c => {
    console.log(`  ${c.code} | isAffiliate: ${c.isAffiliate} | ${c.description}`);
  });
  
  mongoose.disconnect();
  console.log('\nDone! Restart your server to apply changes.');
});

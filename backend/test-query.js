const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Coupon = require('./models/Coupon');
  
  const now = new Date();
  let query = {
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now },
    isAffiliate: { $ne: true }
  };
  
  const coupons = await Coupon.find(query);
  console.log('Customer API would return:');
  coupons.forEach(c => console.log(c.code, 'isAffiliate:', c.isAffiliate));
  
  mongoose.disconnect();
});

const express = require('express');
const router = express.Router();
const AppConfig = require('../models/AppConfig');

// Get public config (used by customer app to calculate surge fee, etc.)
router.get('/', async (req, res) => {
  try {
    let config = await AppConfig.findOne({ configId: 'global_config' });
    if (!config) {
      config = await AppConfig.create({ configId: 'global_config' });
    }
    
    // Only return public safe fields
    res.json({
      success: true,
      data: {
        isRainModeActive: config.isRainModeActive,
        surgeFeeType: config.surgeFeeType,
        surgeFeeValue: config.surgeFeeValue,
        isPeakHoursActive: config.isPeakHoursActive,
        isMaintenanceMode: config.isMaintenanceMode,
        deliveryCharge: config.deliveryCharge || 8,
        customerDeliveryFee: config.customerDeliveryFee || 20,
        freeDeliveryThreshold: config.freeDeliveryThreshold || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch config' });
  }
});

module.exports = router;

const cron = require('node-cron');
const Restaurant = require('../models/Restaurant');

class CronService {
  start() {
    // Run every minute
    cron.schedule('* * * * *', async () => {
      try {
        await this.checkBusinessHours();
      } catch (error) {
        console.error('Error running business hours cron:', error);
      }
    });
    console.log('Cron jobs started.');
  }

  async checkBusinessHours() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    // Assuming IST timezone (you can adapt this if you have a specific timezone)
    // For simplicity, we just use local server time. In production, use moment-timezone
    const currentDay = days[now.getDay()];
    
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;

    // Get all restaurants that have operating hours defined
    const restaurants = await Restaurant.find({ 
      'operatingHours': { $exists: true, $ne: null }
    });

    for (const restaurant of restaurants) {
      if (!restaurant.operatingHours[currentDay]) continue;
      
      const { open, close } = restaurant.operatingHours[currentDay];
      if (!open || !close) continue;

      let shouldBeOpen = false;

      // Handle typical case: open < close (e.g. 09:00 to 22:00)
      if (open <= close) {
        if (currentTimeStr >= open && currentTimeStr < close) {
          shouldBeOpen = true;
        }
      } else {
        // Handle overnight case: open > close (e.g. 18:00 to 02:00)
        if (currentTimeStr >= open || currentTimeStr < close) {
          shouldBeOpen = true;
        }
      }

      if (restaurant.isOpen !== shouldBeOpen) {
        restaurant.isOpen = shouldBeOpen;
        await restaurant.save();
        console.log(`Updated restaurant ${restaurant.name} isOpen to ${shouldBeOpen} based on business hours.`);
      }
    }
  }
}

module.exports = new CronService();

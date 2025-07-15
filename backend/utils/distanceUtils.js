/**
 * Distance calculation utilities using Haversine formula
 * for calculating distances between two points on Earth
 */

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a point is within a certain radius of another point
 * @param {number} centerLat - Latitude of center point
 * @param {number} centerLon - Longitude of center point
 * @param {number} pointLat - Latitude of point to check
 * @param {number} pointLon - Longitude of point to check
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} True if point is within radius
 */
function isWithinRadius(centerLat, centerLon, pointLat, pointLon, radiusKm) {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusKm;
}

/**
 * Calculate delivery time based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} baseTime - Base delivery time in minutes
 * @returns {number} Estimated delivery time in minutes
 */
function calculateDeliveryTime(distanceKm, baseTime = 30) {
  // Add 2 minutes per kilometer after 5km
  const extraTime = Math.max(0, distanceKm - 5) * 2;
  return Math.round(baseTime + extraTime);
}

/**
 * Calculate delivery fee based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} baseFee - Base delivery fee
 * @returns {number} Delivery fee
 */
function calculateDeliveryFee(distanceKm, baseFee = 20) {
  // Add ₹5 per kilometer after 3km
  const extraFee = Math.max(0, distanceKm - 3) * 5;
  return Math.round(baseFee + extraFee);
}

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

/**
 * Get bounding box coordinates for a given center point and radius
 * @param {number} centerLat - Latitude of center point
 * @param {number} centerLon - Longitude of center point
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Bounding box coordinates
 */
function getBoundingBox(centerLat, centerLon, radiusKm) {
  const latDelta = radiusKm / EARTH_RADIUS_KM * (180 / Math.PI);
  const lonDelta = radiusKm / EARTH_RADIUS_KM * (180 / Math.PI) / Math.cos(toRadians(centerLat));
  
  return {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLon: centerLon - lonDelta,
    maxLon: centerLon + lonDelta
  };
}

module.exports = {
  calculateDistance,
  isWithinRadius,
  calculateDeliveryTime,
  calculateDeliveryFee,
  formatDistance,
  getBoundingBox,
  EARTH_RADIUS_KM
}; 
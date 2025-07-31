/**
 * Utility functions for formatting and displaying delivery addresses
 */

/**
 * Format delivery details into a readable address string
 * @param {Object} deliveryDetails - The delivery details object
 * @returns {string} Formatted address string
 */
export const formatDeliveryAddress = (deliveryDetails) => {
  if (!deliveryDetails) return '';

  const parts = [];

  // Add house number and apartment if available
  if (deliveryDetails.houseNumber) {
    parts.push(deliveryDetails.houseNumber);
  }
  if (deliveryDetails.apartment) {
    parts.push(deliveryDetails.apartment);
  }
  if (deliveryDetails.floor) {
    parts.push(`Floor: ${deliveryDetails.floor}`);
  }

  // Add landmark if available
  if (deliveryDetails.landmark) {
    parts.push(`Near: ${deliveryDetails.landmark}`);
  }

  // Add area, city, and pincode
  if (deliveryDetails.area) {
    parts.push(deliveryDetails.area);
  }
  if (deliveryDetails.city && deliveryDetails.pincode) {
    parts.push(`${deliveryDetails.city} - ${deliveryDetails.pincode}`);
  } else if (deliveryDetails.city) {
    parts.push(deliveryDetails.city);
  }

  // Add state if available
  if (deliveryDetails.state) {
    parts.push(deliveryDetails.state);
  }

  return parts.join(', ');
};

/**
 * Get a short summary of the delivery location
 * @param {Object} deliveryDetails - The delivery details object
 * @returns {string} Short location summary
 */
export const getLocationSummary = (deliveryDetails) => {
  if (!deliveryDetails) return '';

  const parts = [];
  
  if (deliveryDetails.area) {
    parts.push(deliveryDetails.area);
  }
  if (deliveryDetails.city) {
    parts.push(deliveryDetails.city);
  }
  if (deliveryDetails.pincode) {
    parts.push(deliveryDetails.pincode);
  }

  return parts.join(', ');
};

/**
 * Check if delivery details are complete
 * @param {Object} deliveryDetails - The delivery details object
 * @returns {boolean} True if details are complete
 */
export const isDeliveryDetailsComplete = (deliveryDetails) => {
  if (!deliveryDetails) return false;

  const requiredFields = ['area', 'city', 'pincode'];
  return requiredFields.every(field => deliveryDetails[field] && deliveryDetails[field].trim());
};

/**
 * Get delivery instructions summary
 * @param {Object} deliveryDetails - The delivery details object
 * @returns {string} Instructions summary
 */
export const getDeliveryInstructions = (deliveryDetails) => {
  if (!deliveryDetails) return '';

  const instructions = [];

  if (deliveryDetails.houseNumber) {
    instructions.push(`House/Flat: ${deliveryDetails.houseNumber}`);
  }
  if (deliveryDetails.apartment) {
    instructions.push(`Building: ${deliveryDetails.apartment}`);
  }
  if (deliveryDetails.floor) {
    instructions.push(`Floor: ${deliveryDetails.floor}`);
  }
  if (deliveryDetails.landmark) {
    instructions.push(`Landmark: ${deliveryDetails.landmark}`);
  }
  if (deliveryDetails.additionalInstructions) {
    instructions.push(`Special Instructions: ${deliveryDetails.additionalInstructions}`);
  }

  return instructions.join('\n');
};

/**
 * Validate delivery details
 * @param {Object} deliveryDetails - The delivery details object
 * @returns {Object} Validation result with isValid and errors
 */
export const validateDeliveryDetails = (deliveryDetails) => {
  const errors = [];

  if (!deliveryDetails) {
    return { isValid: false, errors: ['Delivery details are required'] };
  }

  if (!deliveryDetails.area || !deliveryDetails.area.trim()) {
    errors.push('Area/Locality is required');
  }

  if (!deliveryDetails.city || !deliveryDetails.city.trim()) {
    errors.push('City is required');
  }

  if (!deliveryDetails.pincode || !deliveryDetails.pincode.trim()) {
    errors.push('Pincode is required');
  } else if (!/^\d{6}$/.test(deliveryDetails.pincode)) {
    errors.push('Pincode must be 6 digits');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 
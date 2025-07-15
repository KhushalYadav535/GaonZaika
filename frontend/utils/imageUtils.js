/**
 * Utility functions for handling images safely
 */

/**
 * Safely extract image URL from various image object formats
 * @param {Object|string} image - Image object or string URL
 * @param {string} fallbackUrl - Fallback URL if image is invalid
 * @returns {string} Valid image URL
 */
export const getImageUrl = (image, fallbackUrl = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400') => {
  if (!image) {
    return fallbackUrl;
  }
  
  // If image is already a string URL
  if (typeof image === 'string') {
    return image;
  }
  
  // If image is an object with url property (Cloudinary format)
  if (image && typeof image === 'object' && image.url) {
    return image.url;
  }
  
  // If image is an object with other possible URL properties
  if (image && typeof image === 'object') {
    // Check for common URL properties
    const possibleUrlProps = ['url', 'uri', 'src', 'imageUrl', 'image_url'];
    for (const prop of possibleUrlProps) {
      if (image[prop] && typeof image[prop] === 'string') {
        return image[prop];
      }
    }
  }
  
  return fallbackUrl;
};

/**
 * Check if an image object has a valid URL
 * @param {Object|string} image - Image object or string URL
 * @returns {boolean} True if image has a valid URL
 */
export const hasValidImageUrl = (image) => {
  const url = getImageUrl(image, null);
  return url !== null;
};

/**
 * Get restaurant image URL with fallback
 * @param {Object|string} image - Restaurant image object or string
 * @returns {string} Valid restaurant image URL
 */
export const getRestaurantImageUrl = (image) => {
  return getImageUrl(image, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400');
};

/**
 * Get menu item image URL with fallback
 * @param {Object|string} image - Menu item image object or string
 * @returns {string} Valid menu item image URL
 */
export const getMenuItemImageUrl = (image) => {
  return getImageUrl(image, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400');
};

export default {
  getImageUrl,
  hasValidImageUrl,
  getRestaurantImageUrl,
  getMenuItemImageUrl
}; 
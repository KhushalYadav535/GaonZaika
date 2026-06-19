const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image to Cloudinary from file path
const uploadImage = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'gaon-zaika',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      resource_type: 'auto'
    });
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Upload image to Cloudinary from memory buffer (for Render/serverless — no disk writes)
const uploadImageBuffer = (buffer, mimetype) => {
  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'gaon-zaika',
        unique_filename: true,
        overwrite: false,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          console.error('Error uploading buffer to Cloudinary:', error);
          resolve({ success: false, error: error.message });
        } else {
          resolve({
            success: true,
            url: result.secure_url,
            public_id: result.public_id
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    if (!publicId) return { success: true };
    
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  uploadImage,
  uploadImageBuffer,
  deleteImage
};
 
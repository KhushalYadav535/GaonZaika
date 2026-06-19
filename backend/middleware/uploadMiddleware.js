const multer = require('multer');
const { uploadImageBuffer } = require('../config/cloudinary');

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer with MEMORY storage (no disk writes — required for Render/serverless)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow 1 file per request
  }
});

// Middleware for single image upload with Cloudinary integration
const uploadImage = (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // If no file uploaded, continue without image processing
    if (!req.file) {
      return next();
    }

    try {
      // Upload buffer directly to Cloudinary (no temp file needed)
      const uploadResult = await uploadImageBuffer(req.file.buffer, req.file.mimetype);
      
      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to cloud storage'
        });
      }

      // Set image info in request
      req.imageInfo = {
        url: uploadResult.url,
        publicId: uploadResult.public_id
      };

      next();
    } catch (error) {
      console.error('Error in upload middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process image upload'
      });
    }
  });
};

module.exports = {
  uploadImage
}; 
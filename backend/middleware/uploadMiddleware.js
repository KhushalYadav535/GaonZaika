const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadImage: uploadToCloudinary } = require('../config/cloudinary');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
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
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(req.file);
      
      if (!uploadResult.success) {
        // Cleanup local file
        cleanupUploadedFile(req.file.path);
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

      // Cleanup local file after successful upload
      cleanupUploadedFile(req.file.path);

      next();
    } catch (error) {
      // Cleanup local file
      cleanupUploadedFile(req.file.path);
      console.error('Error in upload middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process image upload'
      });
    }
  });
};

// Cleanup uploaded files after processing
const cleanupUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  uploadImage,
  cleanupUploadedFile
}; 
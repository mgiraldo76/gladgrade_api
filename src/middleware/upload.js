const multer = require('multer');
const path = require('path');
const { createError } = require('../utils/errorUtils');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store files in the uploads directory
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Configure file filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(createError('Only image files are allowed', 400), false);
  }
};

// Configure upload limits
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 5 // Max 5 files at once
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits
});

module.exports = upload;
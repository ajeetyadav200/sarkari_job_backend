const express = require('express');
const router = express.Router();
const multer = require('multer');
const { AuthUser } = require('../middleware/authMiddleware');

const {
  uploadSingle,
  uploadFields,
  deleteFile,
  getUploadConfig
} = require('../controller/uploadController/uploadController');

/**
 * Upload Routes - Industry Standard File Upload API
 *
 * Features:
 * - Memory storage (no temp files on disk)
 * - Scalable and reusable across all modules
 * - Support for single, multiple, and field-based uploads
 */

// Multer configuration with memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type '${file.mimetype}' is not allowed`), false);
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10 // Max 10 files per request
  }
});

// Dynamic fields upload configuration
const dynamicFieldsUpload = upload.fields([
  { name: 'officialNotification', maxCount: 1 },
  { name: 'examDateNotice', maxCount: 1 },
  { name: 'syllabusFile', maxCount: 1 },
  { name: 'admitCardFile', maxCount: 1 },
  { name: 'answerKeyFile', maxCount: 1 },
  { name: 'resultFile', maxCount: 1 },
  { name: 'otherFile', maxCount: 1 },
  { name: 'otherFiles', maxCount: 5 },
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]);

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per request'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: `Unexpected field: ${err.field}`
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// ==================== PUBLIC ROUTES ====================

/**
 * @route   GET /api/upload/config
 * @desc    Get upload configuration (allowed types, max sizes, etc.)
 * @access  Public
 */
router.get('/config', getUploadConfig);

// ==================== PROTECTED ROUTES ====================

// All upload routes require authentication
router.use(AuthUser);

/**
 * @route   POST /api/upload/single
 * @desc    Upload a single file
 * @access  Private
 * @body    file (form-data), folder (optional), customName (optional)
 */
router.post('/single', upload.single('file'), handleMulterError, uploadSingle);

/**
 * @route   POST /api/upload/fields
 * @desc    Upload files with specific field names
 * @access  Private
 * @body    Various file fields (form-data), folder (optional)
 */
router.post('/fields', dynamicFieldsUpload, handleMulterError, uploadFields);

/**
 * @route   DELETE /api/upload/:cloudinaryId
 * @desc    Delete a file from Cloudinary
 * @access  Private
 * @param   cloudinaryId - The Cloudinary public ID of the file (URL encoded)
 */
router.delete('/:cloudinaryId', deleteFile);

module.exports = router;

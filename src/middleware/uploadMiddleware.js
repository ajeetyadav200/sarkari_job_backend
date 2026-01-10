const multer = require('multer');

/**
 * Upload Middleware - Industry Standard Configuration
 *
 * Uses memory storage for:
 * - Better scalability (no temp files)
 * - Stream-based uploads to cloud
 * - Works with serverless environments
 */

// Memory storage configuration
const memoryStorage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
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

// File filter function
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type '${file.mimetype}' is not allowed. Allowed: images (jpg, png, gif, webp) and documents (pdf, doc, docx, xls, xlsx)`), false);
  }
};

// Base multer configuration
const multerConfig = {
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Max 10 files per request
  }
};

// Create multer instance
const upload = multer(multerConfig);

// ==================== MIDDLEWARE FUNCTIONS ====================

/**
 * Upload single file
 * @param {string} fieldName - Form field name (default: 'file')
 */
const uploadSingleFile = (fieldName = 'file') => {
  return upload.single(fieldName);
};

/**
 * Upload multiple files with same field name
 * @param {string} fieldName - Form field name (default: 'files')
 * @param {number} maxCount - Maximum number of files (default: 10)
 */
const uploadMultipleFiles = (fieldName = 'files', maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Upload files with dynamic field names
 * For forms with multiple file inputs (officialNotification, syllabusFile, etc.)
 */
const uploadDynamicFiles = upload.fields([
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

/**
 * Custom fields upload
 * @param {Array} fields - Array of field configurations
 * @example uploadCustomFields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 5 }])
 */
const uploadCustomFields = (fields) => {
  return upload.fields(fields);
};

/**
 * Error handling middleware for multer errors
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const errorMessages = {
      'LIMIT_FILE_SIZE': 'File too large. Maximum size is 10MB',
      'LIMIT_FILE_COUNT': 'Too many files. Maximum is 10 files per request',
      'LIMIT_UNEXPECTED_FILE': `Unexpected field: ${err.field}`,
      'LIMIT_PART_COUNT': 'Too many parts in the request',
      'LIMIT_FIELD_KEY': 'Field name too long',
      'LIMIT_FIELD_VALUE': 'Field value too long',
      'LIMIT_FIELD_COUNT': 'Too many fields'
    };

    return res.status(400).json({
      success: false,
      message: errorMessages[err.code] || err.message,
      code: err.code
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

/**
 * Validate file exists middleware
 */
const requireFile = (fieldName = 'file') => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }
    next();
  };
};

/**
 * Validate specific file field exists
 */
const requireFileField = (fieldName) => {
  return (req, res, next) => {
    if (!req.files || !req.files[fieldName] || req.files[fieldName].length === 0) {
      return res.status(400).json({
        success: false,
        message: `File field '${fieldName}' is required`
      });
    }
    next();
  };
};

module.exports = {
  // Middleware functions
  uploadSingleFile,
  uploadMultipleFiles,
  uploadDynamicFiles,
  uploadCustomFields,
  handleMulterError,
  requireFile,
  requireFileField,
  // Export multer instance for custom configurations
  upload,
  // Export config for reference
  ALLOWED_MIME_TYPES,
  multerConfig
};

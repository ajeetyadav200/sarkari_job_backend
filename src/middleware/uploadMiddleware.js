const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Middleware for single file upload
const uploadSingleFile = (fieldName = 'file') => {
  return upload.single(fieldName);
};

// Middleware for multiple files upload (max 10 files)
const uploadMultipleFiles = (fieldName = 'files', maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for dynamic file fields
// Accepts multiple file fields with different names
const uploadDynamicFiles = upload.fields([
  { name: 'officialNotification', maxCount: 1 },
  { name: 'examDateNotice', maxCount: 1 },
  { name: 'syllabusFile', maxCount: 1 },
  { name: 'admitCardFile', maxCount: 1 },
  { name: 'answerKeyFile', maxCount: 1 },
  { name: 'resultFile', maxCount: 1 },
  { name: 'otherFile', maxCount: 1 },
  { name: 'otherFiles', maxCount: 5 }
]);

// Cleanup uploaded files (used in error cases)
const cleanupFiles = (files) => {
  if (!files) return;

  const fileArray = Array.isArray(files) ? files : [files];

  fileArray.forEach(file => {
    if (file && file.path) {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
  });
};

// Cleanup multiple file fields
const cleanupFileFields = (fileFields) => {
  if (!fileFields) return;

  Object.keys(fileFields).forEach(key => {
    const files = fileFields[key];
    cleanupFiles(files);
  });
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadDynamicFiles,
  cleanupFiles,
  cleanupFileFields
};

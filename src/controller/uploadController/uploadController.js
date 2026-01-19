const { cloudinary } = require('../../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload Controller - Industry Standard File Upload System
 *
 * Features:
 * - Memory storage (no temp files)
 * - Stream-based upload to Cloudinary
 * - Support for images, PDFs, documents
 * - Multiple file upload support
 * - Folder organization by type
 */

// Folder mapping for different upload types
const UPLOAD_FOLDERS = {
  'job': 'jobs',
  'admission': 'admissions',
  'admit-card': 'admit-cards',
  'answer-key': 'answer-keys',
  'result': 'results',
  'notification': 'notifications',
  'syllabus': 'syllabus',
  'document': 'documents',
  'image': 'images',
  'other': 'others'
};

// Allowed file types
const ALLOWED_MIME_TYPES = {
  // Images
  'image/jpeg': { type: 'image', resourceType: 'image' },
  'image/jpg': { type: 'image', resourceType: 'image' },
  'image/png': { type: 'image', resourceType: 'image' },
  'image/gif': { type: 'image', resourceType: 'image' },
  'image/webp': { type: 'image', resourceType: 'image' },
  // Documents - PDF uploaded as 'image' type to bypass untrusted customer restrictions
  // Cloudinary supports PDF as image type and can display/convert them
  'application/pdf': { type: 'document', resourceType: 'image' },
  'application/msword': { type: 'document', resourceType: 'raw' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { type: 'document', resourceType: 'raw' },
  'application/vnd.ms-excel': { type: 'document', resourceType: 'raw' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { type: 'document', resourceType: 'raw' }
};

// Max file sizes (in bytes)
const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,    // 5MB for images
  document: 10 * 1024 * 1024  // 10MB for documents
};

/**
 * Upload file buffer to Cloudinary using stream (OPTIMIZED)
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const isImage = options.resourceType === 'image';
    const isRaw = options.resourceType === 'raw';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'uploads',
        resource_type: options.resourceType || 'auto',
        public_id: options.publicId || undefined,
        // For raw files (PDFs, docs), include the format/extension
        ...(isRaw && options.format && { format: options.format }),
        // Set access mode to public to avoid "untrusted customer" issues
        access_mode: 'public',
        type: 'upload',
        // SPEED OPTIMIZATIONS
        use_filename: false,            // Skip filename processing
        unique_filename: true,
        overwrite: false,
        eager_async: true,              // Don't wait for transformations
        invalidate: false,              // Skip CDN invalidation
        // Skip unnecessary processing
        exif: false,                    // Don't extract EXIF data
        colors: false,                  // Don't extract colors
        faces: false,                   // Don't detect faces
        image_metadata: false,          // Don't extract image metadata
        phash: false,                   // Don't compute perceptual hash
        ...(isImage && {
          quality: 'auto:eco',          // Faster compression (eco vs good)
        }),
        ...options.cloudinaryOptions
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          // Construct URL if secure_url is missing (can happen with certain upload settings)
          let fileUrl = result.secure_url;
          if (!fileUrl && result.public_id) {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const resourceType = result.resource_type || 'raw';
            fileUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${result.public_id}`;
            // Add format extension if available
            if (result.format) {
              fileUrl += `.${result.format}`;
            }
          }

          resolve({
            url: fileUrl,
            publicId: result.public_id,
            cloudinaryId: result.public_id,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes,
            width: result.width || null,
            height: result.height || null,
            createdAt: result.created_at
          });
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Validate file before upload
 * @param {Object} file - Multer file object
 * @returns {Object} - Validation result
 */
const validateFile = (file) => {
  const errors = [];

  // Check if file exists
  if (!file) {
    return { valid: false, errors: ['No file provided'] };
  }

  // Check mime type
  const mimeConfig = ALLOWED_MIME_TYPES[file.mimetype];
  if (!mimeConfig) {
    errors.push(`File type '${file.mimetype}' is not allowed. Allowed types: images (jpg, png, gif, webp) and documents (pdf, doc, docx, xls, xlsx)`);
  }

  // Check file size
  if (mimeConfig) {
    const maxSize = MAX_FILE_SIZES[mimeConfig.type];
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      errors.push(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB) for ${mimeConfig.type}s`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    fileType: mimeConfig?.type || 'unknown',
    resourceType: mimeConfig?.resourceType || 'auto'
  };
};

/**
 * Upload single file
 * POST /api/upload/single
 */
const uploadSingle = async (req, res) => {
  try {
    const file = req.file;
    const { folder = 'other', customName } = req.body;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors: validation.errors
      });
    }

    // Get folder path
    const folderPath = UPLOAD_FOLDERS[folder] || UPLOAD_FOLDERS['other'];

    // Extract file extension from original filename
    const fileExtension = file.originalname.split('.').pop().toLowerCase();

    // Generate public ID if custom name provided
    const publicId = customName
      ? `${folderPath}/${customName.replace(/[^a-zA-Z0-9-_]/g, '_')}_${Date.now()}`
      : undefined;

    // Upload to Cloudinary
    const result = await uploadBufferToCloudinary(file.buffer, {
      folder: folderPath,
      resourceType: validation.resourceType,
      publicId,
      format: fileExtension // Pass file extension for raw files (PDFs, docs)
    });

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileName: customName || file.originalname,
        originalName: file.originalname,
        fileUrl: result.url,
        cloudinaryId: result.cloudinaryId,
        fileType: validation.fileType,
        format: result.format,
        size: result.bytes,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Upload files with specific field names (for forms with multiple file inputs)
 * POST /api/upload/fields
 * OPTIMIZED: Uses Promise.all for parallel uploads
 */
const uploadFields = async (req, res) => {
  try {
    const files = req.files; // Object with field names as keys
    const { folder = 'other' } = req.body;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      });
    }

    const folderPath = UPLOAD_FOLDERS[folder] || UPLOAD_FOLDERS['other'];
    const results = {};
    const errors = [];

    // Prepare all upload tasks for parallel execution
    const uploadTasks = [];

    for (const fieldName of Object.keys(files)) {
      const fileArray = files[fieldName];

      for (const file of fileArray) {
        const customName = req.body[`${fieldName}_name`];
        const validation = validateFile(file);

        if (!validation.valid) {
          errors.push({
            fieldName,
            fileName: file.originalname,
            errors: validation.errors
          });
          continue;
        }

        // Extract file extension from original filename
        const fileExtension = file.originalname.split('.').pop().toLowerCase();

        // Add to upload tasks array for parallel processing
        uploadTasks.push({
          fieldName,
          file,
          customName,
          validation,
          promise: uploadBufferToCloudinary(file.buffer, {
            folder: folderPath,
            resourceType: validation.resourceType,
            format: fileExtension // Pass file extension for raw files (PDFs, docs)
          })
        });
      }
    }

    // Execute all uploads in parallel
    const uploadResults = await Promise.allSettled(
      uploadTasks.map(task => task.promise)
    );

    // Process results
    uploadResults.forEach((result, index) => {
      const task = uploadTasks[index];

      if (result.status === 'fulfilled') {
        results[task.fieldName] = {
          fileName: task.customName || task.file.originalname,
          originalName: task.file.originalname,
          fileUrl: result.value.url,
          cloudinaryId: result.value.cloudinaryId,
          fileType: task.validation.fileType,
          format: result.value.format,
          size: result.value.bytes,
          uploadedAt: new Date().toISOString()
        };
      } else {
        errors.push({
          fieldName: task.fieldName,
          fileName: task.file.originalname,
          errors: [result.reason?.message || 'Upload failed']
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: `${Object.keys(results).length} file(s) uploaded successfully`,
      data: {
        files: results,
        failed: errors
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete file from Cloudinary
 * DELETE /api/upload/:cloudinaryId
 * or POST /api/upload/delete (with body)
 */
const deleteFile = async (req, res) => {
  try {
    // Support both URL param and body for cloudinaryId
    let cloudinaryId = req.params.cloudinaryId || req.body.cloudinaryId;
    let resourceType = req.query.type || req.body.resourceType;
    const fileUrl = req.body.fileUrl; // Optional: pass fileUrl to detect type

    if (!cloudinaryId) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary ID is required'
      });
    }

    // Decode the cloudinaryId (it may be URL encoded)
    const decodedId = decodeURIComponent(cloudinaryId);

    // Auto-detect resource type from fileUrl if provided
    if (!resourceType && fileUrl) {
      if (fileUrl.includes('/raw/upload/')) {
        resourceType = 'raw';
      } else if (fileUrl.includes('/video/upload/')) {
        resourceType = 'video';
      } else {
        resourceType = 'image';
      }
    }

    // Try all resource types to ensure deletion
    // Cloudinary sometimes returns 'ok' even if file doesn't exist for that type
    const typesToTry = resourceType
      ? [resourceType, 'raw', 'image', 'video'].filter((v, i, a) => a.indexOf(v) === i)
      : ['raw', 'image', 'video']; // Try raw first (PDFs are common)

    let deleted = false;
    let lastResult = null;

    for (const type of typesToTry) {
      try {
        const result = await cloudinary.uploader.destroy(decodedId, {
          resource_type: type,
          invalidate: true
        });
        lastResult = result;

        if (result.result === 'ok') {
          // Verify deletion by checking if resource exists
          deleted = true;
          console.log(`File deleted as ${type}:`, decodedId);
          break;
        }
      } catch (err) {
        // Continue trying other types
        console.log(`Delete attempt as ${type} failed:`, err.message);
      }
    }

    if (deleted) {
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } else if (lastResult?.result === 'not found') {
      return res.status(404).json({
        success: false,
        message: 'File not found on Cloudinary'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete file',
        result: lastResult?.result
      });
    }

  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get upload configuration (for frontend)
 * GET /api/upload/config
 */
const getUploadConfig = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        allowedTypes: Object.keys(ALLOWED_MIME_TYPES),
        maxSizes: {
          image: MAX_FILE_SIZES.image / (1024 * 1024) + 'MB',
          document: MAX_FILE_SIZES.document / (1024 * 1024) + 'MB'
        },
        folders: Object.keys(UPLOAD_FOLDERS)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get upload configuration'
    });
  }
};

module.exports = {
  uploadSingle,
  uploadFields,
  deleteFile,
  getUploadConfig,
  // Export utilities for use in other controllers
  uploadBufferToCloudinary,
  validateFile,
  UPLOAD_FOLDERS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZES
};

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with optimized settings
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Optimized upload options for faster uploads
const UPLOAD_OPTIMIZATION = {
  // Image optimization presets
  image: {
    quality: 'auto:good',        // Auto quality optimization
    fetch_format: 'auto',        // Auto format (webp for supported browsers)
    flags: 'attachment',         // Faster upload processing
    eager_async: true,           // Process transformations asynchronously
  },
  // PDF/Document options
  document: {
    resource_type: 'raw',
    flags: 'attachment',
  }
};

// Verify Cloudinary connection
const verifyCloudinaryConnection = async () => {
  try {
    // Verify configuration is loaded
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error('Cloudinary credentials are missing in environment variables');
    }

    // Test connection by getting account details
    await cloudinary.api.ping();

    console.log('✅ Cloudinary connected successfully!');

    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
};

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath, folder = 'answer-keys') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    });

    return {
      url: result.secure_url,
      cloudinaryId: result.public_id,
      format: result.format
    };
  } catch (error) {
    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
};

// Delete file from Cloudinary (handles all resource types: image, raw, video)
const deleteFromCloudinary = async (cloudinaryId, resourceType = null) => {
  try {
    if (!cloudinaryId) return { result: 'skipped', reason: 'No cloudinaryId provided' };

    // If resource type is specified, try that first
    if (resourceType) {
      const result = await cloudinary.uploader.destroy(cloudinaryId, {
        resource_type: resourceType,
        invalidate: true
      });
      if (result.result === 'ok') return result;
    }

    // Try as image first (most common)
    let result = await cloudinary.uploader.destroy(cloudinaryId, {
      resource_type: 'image',
      invalidate: true
    });
    if (result.result === 'ok') return result;

    // Try as raw (PDFs, docs)
    result = await cloudinary.uploader.destroy(cloudinaryId, {
      resource_type: 'raw',
      invalidate: true
    });
    if (result.result === 'ok') return result;

    // Try as video
    result = await cloudinary.uploader.destroy(cloudinaryId, {
      resource_type: 'video',
      invalidate: true
    });

    return result;
  } catch (error) {
    console.error(`Failed to delete file ${cloudinaryId}:`, error.message);
    throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
  }
};

// Upload multiple files to Cloudinary
const uploadMultipleToCloudinary = async (files, folder = 'answer-keys') => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file.path, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    throw new Error(`Failed to upload multiple files: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultipleToCloudinary,
  verifyCloudinaryConnection,
  UPLOAD_OPTIMIZATION
};

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify Cloudinary connection
const verifyCloudinaryConnection = async () => {
  try {
    console.log('\n📡 Attempting to connect to Cloudinary...');

    // Verify configuration is loaded
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error('Cloudinary credentials are missing in environment variables');
    }

    // Test connection by getting account details
    const result = await cloudinary.api.ping();

    console.log('✅ Cloudinary connected successfully!');
    // console.log(`☁️  Cloud Name: ${config.cloud_name}`);
    // console.log(`📊 Status: ${result.status || 'OK'}`);
    // console.log('🎉 Ready to upload files!\n');

    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed!');
    console.error(`🔴 Error: ${error.message}`);
    console.error('💡 Please check your .env file for correct Cloudinary credentials:\n');
    console.error('   - CLOUDINARY_CLOUD_NAME');
    console.error('   - CLOUDINARY_API_KEY');
    console.error('   - CLOUDINARY_API_SECRET\n');
    return false;
  }
};

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath, folder = 'answer-keys') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto', // Automatically detect file type
      use_filename: true,
      unique_filename: true
    });

    return {
      url: result.secure_url,
      cloudinaryId: result.public_id,
      format: result.format
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (cloudinaryId) => {
  try {
    const result = await cloudinary.uploader.destroy(cloudinaryId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
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
    console.error('Multiple upload error:', error);
    throw new Error(`Failed to upload multiple files: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultipleToCloudinary,
  verifyCloudinaryConnection
};

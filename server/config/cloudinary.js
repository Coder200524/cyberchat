// ============================================================
// server/config/cloudinary.js
// Configures Cloudinary for file/image uploads
// ============================================================
// WHY: Cloudinary is a cloud storage service for media files.
// If Cloudinary credentials are not set, we fall back to
// local disk storage so the app still works during development.
// ============================================================

const cloudinary = require('cloudinary').v2;

// Check if Cloudinary credentials are provided
const cloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name_here' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key_here' &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret_here';

if (cloudinaryConfigured) {
  // Configure Cloudinary with real credentials
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured — uploads will go to the cloud');
} else {
  console.log('⚠️  Cloudinary credentials not set — using local disk storage as fallback');
  console.log('   Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env to enable cloud uploads');
}

module.exports = { cloudinary, cloudinaryConfigured };

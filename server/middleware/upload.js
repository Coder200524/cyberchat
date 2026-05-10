// ============================================================
// server/middleware/upload.js
// File Upload Middleware (Multer + Cloudinary or Local Disk)
// ============================================================
// WHY: When a user sends a file/image in chat, we need to store
// it somewhere. We prefer Cloudinary (cloud), but fall back to
// local disk storage if Cloudinary is not configured.
//
// HOW IT WORKS:
// - Multer handles the file from the request
// - If Cloudinary is set up → file is uploaded to Cloudinary cloud
// - If not → file is saved to /server/uploads/ folder locally
// ============================================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { cloudinaryConfigured, cloudinary } = require('../config/cloudinary');

let upload;

if (cloudinaryConfigured) {
  // ---- CLOUDINARY STORAGE ----
  // Files go directly to Cloudinary cloud storage
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  // Image extensions that Cloudinary can serve as images
  const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    // IMPORTANT: params must be a FUNCTION so we can set resource_type
    // dynamically per file. Static objects don't allow this.
    // - Images → resource_type: 'image' → served at /image/upload/ URL
    // - PDFs, ZIPs, TXTs → resource_type: 'raw' → served at /raw/upload/ URL
    //   (This is why PDFs were failing — they were being served as images!)
    params: (req, file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const isImage = IMAGE_EXTENSIONS.includes(ext);

      return {
        folder: 'cyberchat',
        resource_type: isImage ? 'image' : 'raw',
        // For raw files, keep the original extension so browsers can download them correctly
        format: undefined,
      };
    },
  });

  upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|txt|zip/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (extname || mimetype) {
        cb(null, true);
      } else {
        cb(new Error('File type not allowed'));
      }
    },
  });

  console.log('📤 Upload middleware: using Cloudinary');
} else {
  // ---- LOCAL DISK STORAGE (FALLBACK) ----
  // Files are saved to /server/uploads/ on your computer

  // Create the uploads directory if it doesn't exist
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Create a unique filename: timestamp + original name
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

  upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
    fileFilter: (req, file, cb) => {
      // Allowed file types
      const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|txt|zip/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (extname || mimetype) {
        cb(null, true);
      } else {
        cb(new Error('File type not allowed'));
      }
    },
  });

  console.log('📤 Upload middleware: using local disk storage (./uploads/)');
}

module.exports = upload;

// ============================================================
// server/routes/messages.js
// File/Image Upload Route
// ============================================================
// POST /api/messages/upload
//   → Accepts a file, uploads it, saves a message to DB
//   → Returns the file URL to display in chat
// ============================================================

const express = require('express');
const path = require('path');
const axios = require('axios');
const Message = require('../models/Message');
const Room = require('../models/Room');
const protect = require('../middleware/auth');
const upload = require('../middleware/upload');
const { cloudinaryConfigured, cloudinary } = require('../config/cloudinary');
const { emitRoomActivity } = require('../socket/index');

const router = express.Router();

// ============================================================
// GET /api/messages/download/:id
// Download a shared file through the backend so we can preserve
// the original filename, Content-Type, and stream the file safely.
// ============================================================
router.get('/download/:id', protect, async (req, res) => {
  try {
    console.log(`SERVER: 🎯 Route hit confirmation: GET /api/messages/download/${req.params.id}`);
    console.log(`SERVER: 📄 Requested file ID: ${req.params.id}`);
    
    const message = await Message.findById(req.params.id);
    if (!message) {
      console.log(`SERVER: ❌ Message not found for ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Message not found' });
    }
    
    console.log(`SERVER: ✅ Found message: ${message._id}`);

    if (message.type !== 'file' || !message.fileUrl) {
      return res.status(400).json({ message: 'File download not available' });
    }

    const fileName = message.fileName || `file-${message._id}`;
    const mimeType = message.fileMimeType || 'application/octet-stream';
    const fileUrl = message.fileUrl;

    console.log(`SERVER: 🔗 Generated download URL/Path: ${fileUrl}`);

    const safeFileName = encodeURIComponent(fileName).replace(/['()]/g, '');
    const contentDisposition = `attachment; filename="${fileName}"; filename*=UTF-8''${safeFileName}`;
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Content-Type', mimeType);

    if (fileUrl.startsWith('http')) {
      const response = await axios.get(fileUrl, { responseType: 'stream' });
      const remoteContentType = response.headers['content-type'];
      if (remoteContentType) {
        res.setHeader('Content-Type', remoteContentType);
      }
      response.data.pipe(res);
      return;
    }

    // Local fallback: serve file from disk if Cloudinary is not configured.
    const localPath = path.join(__dirname, '..', 'uploads', message.filePublicId || path.basename(fileUrl));
    res.sendFile(localPath);
  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Unable to download file' });
    }
  }
});

// ============================================================
// POST /api/messages/upload
// Upload a file or image and save it as a message
// ============================================================
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const { roomCode } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!roomCode) {
      return res.status(400).json({ message: 'Room code is required' });
    }

    // Find the room
    const room = await Room.findOne({ code: roomCode.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Determine the file URL and public ID
    // Cloudinary: req.file.path is the URL, req.file.filename is the public ID
    // Local: req.file.filename is the filename, we build the URL
    let fileUrl;
    let filePublicId;

    if (cloudinaryConfigured) {
      // For Cloudinary, multer-storage-cloudinary gives us the URL in .path or .secure_url
      fileUrl = req.file.path || req.file.secure_url || req.file.url;
      filePublicId = req.file.filename; // This is the public_id (e.g., "cyberchat/xyz123")
    } else {
      // Build a local URL: http://localhost:5000/uploads/filename.jpg
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      filePublicId = req.file.filename; // Just the filename on disk
    }

    // Determine if it's an image or a regular file
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileName = req.file.originalname || req.file.filename;
    const fileExtension = path.extname(fileName || '').toLowerCase();
    const fileType = imageExtensions.includes(fileExtension) ? 'image' : 'file';
    const fileMimeType = req.file.mimetype || null;

    // Cloudinary attachment URL forces the browser to download with the original
    // filename and extension. We also keep the normal `fileUrl` for preview.
    let fileDownloadUrl = null;
    if (cloudinaryConfigured && fileType === 'file' && filePublicId) {
      try {
        if (cloudinary.utils && typeof cloudinary.utils.download_url === 'function') {
          fileDownloadUrl = cloudinary.utils.download_url(filePublicId, {
            resource_type: 'raw',
            attachment: fileName,
            secure: true,
          });
        } else {
          fileDownloadUrl = cloudinary.url(filePublicId, {
            resource_type: 'raw',
            flags: 'attachment',
            attachment: fileName,
            secure: true,
          });
        }
      } catch (cloudinaryError) {
        console.warn('Cloudinary download URL generation failed, falling back to raw fileUrl', cloudinaryError);
      }

      // Fallback when Cloudinary download URL is not usable.
      if (!fileDownloadUrl) {
        const encodedName = encodeURIComponent(fileName);
        fileDownloadUrl = `${fileUrl}?fl_attachment=true&attachment=${encodedName}`;
      }
    } else if (!cloudinaryConfigured) {
      fileDownloadUrl = fileUrl;
    }

    // Debug logging: original filename, mimetype, and generated file URLs.
    console.log('🧪 File upload debug:', {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileUrl,
      fileDownloadUrl,
      filePublicId,
    });

    // Save the message to the database
    const message = await Message.create({
      room: room._id,
      sender: req.user.id,
      content: '',
      fileUrl,
      fileDownloadUrl,
      fileType,
      fileName,
      fileMimeType,
      fileExtension,
      filePublicId,
      type: 'file',
    });

    // Update room stats
    room.totalFiles += 1;
    room.totalMessages += 1;
    room.lastActivity = new Date();
    await room.save();

    // Emit updated room activity immediately after successful upload
    // so the shared file count and message count stay in sync.
    const io = req.app.get('io');
    if (io) {
      await emitRoomActivity(io, room.code);
    }

    // Populate sender info for the response
    await message.populate('sender', 'username avatar');

    res.status(201).json({
      message: 'File uploaded successfully',
      chatMessage: message,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

module.exports = router;

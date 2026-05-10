// ============================================================
// server/models/Message.js
// Defines the shape of a Message document in MongoDB
// ============================================================
// WHY: Every message sent in a room is stored here so users
// can see previous messages when they join a room.
// ============================================================

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // Which room this message belongs to
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },

    // Who sent this message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The actual text content of the message (optional if it's a file)
    content: {
      type: String,
      default: '',
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },

    // File URL if the message contains an uploaded file or image
    fileUrl: {
      type: String,
      default: null,
    },

    // Download URL for files that should preserve the original filename
    // and force the browser to download the attachment correctly.
    fileDownloadUrl: {
      type: String,
      default: null,
    },

    // Type of file: 'image', 'file', or null for text messages
    fileType: {
      type: String,
      enum: ['image', 'file', null],
      default: null,
    },

    // Original filename (for file download display)
    fileName: {
      type: String,
      default: null,
    },

    // Original MIME type of the uploaded file
    fileMimeType: {
      type: String,
      default: null,
    },

    // Original file extension, derived from the original filename
    fileExtension: {
      type: String,
      default: null,
    },

    // Storage ID/Filename (used to delete the file when room is destructed)
    filePublicId: {
      type: String,
      default: null,
    },

    // message type: 'text', 'file', or 'system' (e.g., "User joined the room")
    type: {
      type: String,
      enum: ['text', 'file', 'system'],
      default: 'text',
    },
  },
  {
    // createdAt = the message timestamp shown in chat
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', messageSchema);

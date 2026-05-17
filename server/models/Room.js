// ============================================================
// server/models/Room.js
// Defines the shape of a Room document in MongoDB
// ============================================================
// WHY: Rooms are the chat spaces users create and join.
// Each room has a unique 6-character code like "X82KLM".
// ============================================================

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    // Room display name (e.g., "Dev Team", "Study Group")
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      maxlength: [50, 'Room name cannot exceed 50 characters'],
    },

    // Unique 6-character room code for joining (e.g., "X82KLM")
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      length: 6,
    },

    // The user who created this room
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // List of users who are members of this room
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Tracks when the last activity happened (used for self-destruct)
    lastActivity: {
      type: Date,
      default: Date.now,
    },

    // Total messages sent in this room (for Room Activity stats)
    totalMessages: {
      type: Number,
      default: 0,
    },

    // Total files shared in this room (for Room Activity stats)
    totalFiles: {
      type: Number,
      default: 0,
    },

    // If true, this room will auto-delete after 30 minutes of inactivity
    selfDestruct: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// TTL Index: Auto-delete rooms after 30 minutes of inactivity
// This is MongoDB's built-in mechanism for automatic expiration
// The TTL index monitors the lastActivity field
// ============================================================
roomSchema.index(
  { lastActivity: 1 },
  { 
    expireAfterSeconds: 1800, // 30 minutes = 1800 seconds
    // Only applies to rooms where selfDestruct is true
    partialFilterExpression: { selfDestruct: true }
  }
);

// ============================================================
// Pre-delete Hook: Cleanup messages and files when room is deleted
// This runs BEFORE a room is deleted from MongoDB
// ============================================================
roomSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const Message = require('./Message');
    const { cloudinary, cloudinaryConfigured } = require('../config/cloudinary');
    const path = require('path');
    const fs = require('fs');

    // Find all messages in this room that have files
    const messagesWithFiles = await Message.find({ 
      room: this._id, 
      filePublicId: { $ne: null } 
    });

    // Delete each file from storage
    const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    for (const msg of messagesWithFiles) {
      try {
        if (cloudinaryConfigured) {
          // Cloudinary requires resource_type when deleting
          const ext = path.extname(msg.fileName || msg.filePublicId || '').toLowerCase();
          const resourceType = IMAGE_EXTENSIONS.includes(ext) ? 'image' : 'raw';
          await cloudinary.uploader.destroy(msg.filePublicId, { resource_type: resourceType });
          console.log(`🗑️ Deleted from Cloudinary (${resourceType}): ${msg.filePublicId}`);
        } else {
          // Delete from Local Disk
          const filePath = path.join(__dirname, '..', 'uploads', msg.filePublicId);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted from Disk: ${msg.filePublicId}`);
          }
        }
      } catch (fileErr) {
        console.error(`❌ Failed to delete file ${msg.filePublicId}:`, fileErr);
      }
    }

    // Delete all messages from this room
    await Message.deleteMany({ room: this._id });
    console.log(`🗑️ Deleted all messages for room ${this.code}`);

    next();
  } catch (error) {
    console.error('Pre-delete hook error:', error);
    next(error);
  }
});

// Support for findByIdAndDelete
roomSchema.pre('findOneAndDelete', async function(next) {
  try {
    const Message = require('./Message');
    const { cloudinary, cloudinaryConfigured } = require('../config/cloudinary');
    const path = require('path');
    const fs = require('fs');

    // Get the room that will be deleted
    const room = await this.model.findOne(this.getFilter());
    if (!room) return next();

    // Find all messages in this room that have files
    const messagesWithFiles = await Message.find({ 
      room: room._id, 
      filePublicId: { $ne: null } 
    });

    // Delete each file from storage
    const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    for (const msg of messagesWithFiles) {
      try {
        if (cloudinaryConfigured) {
          const ext = path.extname(msg.fileName || msg.filePublicId || '').toLowerCase();
          const resourceType = IMAGE_EXTENSIONS.includes(ext) ? 'image' : 'raw';
          await cloudinary.uploader.destroy(msg.filePublicId, { resource_type: resourceType });
          console.log(`🗑️ Deleted from Cloudinary (${resourceType}): ${msg.filePublicId}`);
        } else {
          const filePath = path.join(__dirname, '..', 'uploads', msg.filePublicId);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted from Disk: ${msg.filePublicId}`);
          }
        }
      } catch (fileErr) {
        console.error(`❌ Failed to delete file ${msg.filePublicId}:`, fileErr);
      }
    }

    // Delete all messages from this room
    await Message.deleteMany({ room: room._id });
    console.log(`🗑️ Deleted all messages for room ${room.code}`);

    next();
  } catch (error) {
    console.error('Pre-delete hook error:', error);
    next(error);
  }
});

module.exports = mongoose.model('Room', roomSchema);

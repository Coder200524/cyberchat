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

module.exports = mongoose.model('Room', roomSchema);

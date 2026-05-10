// ============================================================
// server/models/User.js
// Defines the shape of a User document in MongoDB
// ============================================================
// WHY: A "model" tells MongoDB what fields each user has.
// Like a blueprint — every user document follows this shape.
// ============================================================

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Username must be unique — no two users can have the same name
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,         // Remove extra spaces
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
    },

    // We store the HASHED password, never the plain text password
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },

    // Avatar URL from DiceBear API — this is the final image URL stored in the user profile
    // Example: https://api.dicebear.com/7.x/bottts/svg?seed=Alice
    avatar: {
      type: String,
      default: '',
    },

    // Avatar style selected by the user (DiceBear style name)
    avatarStyle: {
      type: String,
      default: 'bottts',
    },

    // Seed used to generate the avatar image from DiceBear
    avatarSeed: {
      type: String,
      default: '',
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// Build a DiceBear avatar URL from style and seed
const buildDicebearUrl = (style, seed) => {
  const safeStyle = style || 'bottts';
  const safeSeed = seed || 'cyberchat';
  return `https://api.dicebear.com/7.x/${safeStyle}/svg?seed=${encodeURIComponent(safeSeed)}&backgroundColor=0D0D0D`;
};

// Auto-generate avatar URL before saving a new user
userSchema.pre('save', function (next) {
  if (!this.avatar) {
    const seed = this.avatarSeed || this.username || 'cyberchat';
    this.avatar = buildDicebearUrl(this.avatarStyle, seed);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);

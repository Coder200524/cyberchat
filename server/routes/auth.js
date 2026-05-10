// ============================================================
// server/routes/auth.js
// Authentication Routes: Register + Login
// ============================================================
// WHY: Users need to create accounts and log in before they
// can use the chat. This file handles both of those actions.
//
// POST /api/auth/register  → Create a new account
// POST /api/auth/login     → Log into an existing account
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/auth');

const router = express.Router();

const allowedAvatarStyles = ['adventurer', 'pixel-art', 'bottts', 'lorelei', 'thumbs'];

const buildDicebearUrl = (style, seed) => {
  const safeStyle = allowedAvatarStyles.includes(style) ? style : 'bottts';
  const safeSeed = seed && seed.trim() ? seed.trim() : 'cyberchat';
  return `https://api.dicebear.com/7.x/${safeStyle}/svg?seed=${encodeURIComponent(safeSeed)}&backgroundColor=0D0D0D`;
};

// ---- Helper: Generate JWT Token ----
// A JWT is like a digital ID card — it proves who you are
// without needing to log in again on every request.
const generateToken = (userId, username) => {
  return jwt.sign(
    { id: userId, username },     // Payload: data stored in the token
    process.env.JWT_SECRET,        // Secret key used to sign it
    { expiresIn: '7d' }            // Token expires after 7 days
  );
};

// ============================================================
// POST /api/auth/register
// Create a new user account
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { username, password, avatarStyle, avatarSeed } = req.body;

    // --- Validation ---
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if username is already taken
    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already taken. Choose a different one.' });
    }

    // --- Hash the password ---
    // bcrypt adds "salt" (random noise) before hashing — makes it very secure
    // The number 12 is the "salt rounds" — higher = more secure but slower
    const hashedPassword = await bcrypt.hash(password, 12);

    // --- Create the user ---
    const finalStyle = allowedAvatarStyles.includes(avatarStyle) ? avatarStyle : 'bottts';
    const finalSeed = avatarSeed && avatarSeed.trim() ? avatarSeed.trim() : username.trim();
    const avatarUrl = buildDicebearUrl(finalStyle, finalSeed);

    const user = await User.create({
      username: username.trim(),
      password: hashedPassword,
      avatar: avatarUrl,
      avatarStyle: finalStyle,
      avatarSeed: finalSeed,
    });

    // --- Generate JWT token ---
    const token = generateToken(user._id, user.username);

    // --- Send response ---
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        avatarStyle: user.avatarStyle,
        avatarSeed: user.avatarSeed,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ============================================================
// POST /api/auth/login
// Log into an existing account
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // --- Validation ---
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // --- Find the user ---
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // --- Check the password ---
    // bcrypt.compare() hashes the entered password and checks against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // --- Generate JWT token ---
    const token = generateToken(user._id, user.username);

    // --- Send response ---
    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        avatarStyle: user.avatarStyle,
        avatarSeed: user.avatarSeed,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ============================================================
// PUT /api/auth/avatar
// Update the logged in user's DiceBear avatar settings
// ============================================================
router.put('/avatar', protect, async (req, res) => {
  try {
    const { avatarStyle, avatarSeed } = req.body;

    if (!avatarStyle || !avatarSeed) {
      return res.status(400).json({ message: 'Avatar style and seed are required' });
    }

    const finalStyle = allowedAvatarStyles.includes(avatarStyle) ? avatarStyle : 'bottts';
    const finalSeed = avatarSeed.trim() || 'cyberchat';
    const avatarUrl = buildDicebearUrl(finalStyle, finalSeed);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        avatarStyle: finalStyle,
        avatarSeed: finalSeed,
        avatar: avatarUrl,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Avatar updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        avatarStyle: updatedUser.avatarStyle,
        avatarSeed: updatedUser.avatarSeed,
      },
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Server error updating avatar' });
  }
});

module.exports = router;

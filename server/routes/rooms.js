// ============================================================
// server/routes/rooms.js
// Room Management Routes
// ============================================================
// POST /api/rooms/create  → Create a new room
// POST /api/rooms/join    → Join a room by code
// GET  /api/rooms/:code   → Get room details + message history
// GET  /api/rooms/my      → Get all rooms the user is in
// ============================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const Message = require('../models/Message');
const protect = require('../middleware/auth');

const router = express.Router();

// ---- Helper: Generate a unique 6-character room code ----
// Example output: "X82KLM"
const generateRoomCode = () => {
  // Take first 6 characters of a UUID (minus hyphens), uppercase
  return uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase();
};

// ============================================================
// POST /api/rooms/create
// Create a new chat room
// ============================================================
router.post('/create', protect, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    // Generate a unique room code (retry if collision)
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateRoomCode();
      const existing = await Room.findOne({ code });
      if (!existing) isUnique = true;
    }

    // Create the room in MongoDB
    const room = await Room.create({
      name: name.trim(),
      code,
      createdBy: req.user.id,
      members: [req.user.id], // Creator is automatically a member
    });

    res.status(201).json({
      message: 'Room created!',
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        createdBy: req.user.id,
      },
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error creating room' });
  }
});

// ============================================================
// POST /api/rooms/join
// Join an existing room using its 6-character code
// ============================================================
router.post('/join', protect, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Room code is required' });
    }

    // Find the room by code (case-insensitive)
    const room = await Room.findOne({ code: code.trim().toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found. Check the code and try again.' });
    }

    // Add user to members if not already a member
    if (!room.members.includes(req.user.id)) {
      room.members.push(req.user.id);
      room.lastActivity = new Date();
      await room.save();
    }

    res.json({
      message: 'Joined room successfully!',
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
      },
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error joining room' });
  }
});

// ============================================================
// GET /api/rooms/my
// Get all rooms the logged-in user belongs to
// ============================================================
router.get('/my', protect, async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user.id })
      .sort({ lastActivity: -1 }) // Most recently active first
      .select('name code lastActivity totalMessages totalFiles');

    res.json({ rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

// ============================================================
// GET /api/rooms/:code
// Get a single room's details and its message history
// ============================================================
router.get('/:code', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() })
      .populate('createdBy', 'username avatar'); // Fill in creator's info

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Get the last 100 messages for this room
    const messages = await Message.find({ room: room._id })
      .populate('sender', 'username avatar') // Fill in sender info
      .sort({ createdAt: 1 })               // Oldest first
      .limit(100);

    res.json({ room, messages });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error fetching room' });
  }
});

module.exports = router;

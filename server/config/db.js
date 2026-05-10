// ============================================================
// server/config/db.js
// Connects to MongoDB Atlas using Mongoose
// ============================================================
// WHY: We need a database to store users, rooms, and messages.
// MongoDB Atlas is a cloud-hosted database — no local setup needed.
// ============================================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1); // Stop the server if DB connection fails
  }
};

module.exports = connectDB;

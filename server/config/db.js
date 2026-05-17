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

    // Ensure indexes are created (especially TTL indexes)
    // This is important for automatic room deletion
    await mongoose.connection.collection('rooms').createIndex(
      { lastActivity: 1 },
      { 
        expireAfterSeconds: 1800, // 30 minutes
        partialFilterExpression: { selfDestruct: true },
        name: 'ttl_self_destruct_30min'
      }
    );
    console.log('✅ TTL index created for rooms (30 minutes auto-delete on inactivity)');

    // Also ensure Mongoose schema indexes are created
    await conn.syncIndexes();
    console.log('✅ All Mongoose schema indexes synced');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1); // Stop the server if DB connection fails
  }
};

module.exports = connectDB;

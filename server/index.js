// ============================================================
// server/index.js
// Main Entry Point — The heart of the backend server
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file FIRST
dotenv.config();

// Import our custom modules
const connectDB = require('./config/db');
const { setupSocket } = require('./socket/index');

// Import routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');

// ---- Connect to MongoDB Atlas ----
connectDB();

// ---- Create Express App ----
const app = express();

// ---- Create HTTP server (needed to attach Socket.IO) ----
const server = http.createServer(app);

// ---- Allowed Origins (handles Vite port changes automatically) ----
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
].filter(Boolean);

// ---- Create Socket.IO Server ----
const io = new Server(server, {
  cors: {
    origin: "https://cyberchat-snowy.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Make the Socket.IO instance available to route handlers
app.set('io', io);

// ---- Middleware ----
app.use(
  cors({
    origin: "https://cyberchat-snowy.vercel.app",
    credentials: true
  })
);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🚀 CyberChat server is running!' });
});

// ---- Setup Socket.IO event handlers ----
setupSocket(io);

// ---- Start the Server ----
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════╗');
  console.log('║     🌐 CyberChat Server Running     ║');
  console.log(`║     Port: ${PORT}                       ║`);
  console.log('╚════════════════════════════════════╝');
  console.log('');
});

// ---- Global Error Handlers to catch silent crashes ----
process.on('unhandledRejection', (reason) => {
  console.error('💥 CRASH REASON (Unhandled Rejection):', reason);
});

process.on('uncaughtException', (err) => {
  console.error('💥 CRASH ERROR (Uncaught Exception):', err);
  process.exit(1);
});
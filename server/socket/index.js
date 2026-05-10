// ============================================================
// server/socket/index.js
// Socket.IO Real-Time Event Handler
// ============================================================
// WHY: This is the "real-time engine" of the app.
// Regular HTTP (REST API) works like a letter — you send a
// request and wait for a reply. Socket.IO works like a phone
// call — both sides can talk at any time instantly.
//
// HOW IT WORKS:
// 1. User opens the app → browser connects to this server via WebSocket
// 2. They "join" a room (Socket.IO room = a group channel)
// 3. When anyone in that group sends an event, ALL group members get it
// 4. Events flow instantly with no page refresh needed
//
// EVENTS HANDLED:
// Client → Server:
//   join-room     → User joins a chat room
//   leave-room    → User leaves a chat room
//   send-message  → User sends a text message
//   typing        → User started typing
//   stop-typing   → User stopped typing
//   vote-kick     → User votes to kick someone
//
// Server → Client:
//   message-received   → New message for everyone in the room
//   online-users       → Updated list of who's online
//   user-typing        → Someone is typing
//   user-stop-typing   → Someone stopped typing
//   vote-kick-update   → Kick vote progress
//   user-kicked        → Someone was kicked
//   room-activity      → Updated room stats
//   system-message     → Join/leave notifications
// ============================================================

const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { cloudinary, cloudinaryConfigured } = require('../config/cloudinary');

// ---- In-Memory Stores ----
// These are NOT saved to the database — they reset when the server restarts.
// They track CURRENT session data only.

// Who is currently online in each room
// Shape: { roomCode: [ { userId, username, avatar, socketId } ] }
const onlineUsersMap = {};

// Vote kick tracking
// Shape: { roomCode: { targetUserId: Set(voterUserIds) } }
const voteKickMap = {};

// Self-destruct timers — one per room
// Shape: { roomCode: setTimeout handle }
const destructTimers = {};

// ---- Self-Destruct Timer Duration ----
const SELF_DESTRUCT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

// ============================================================
// setupSocket: called once in index.js to attach all listeners
// ============================================================
const setupSocket = (io) => {

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ========================================================
    // EVENT: join-room
    // Fired when a user opens a chat room
    // ========================================================
    socket.on('join-room', async ({ roomCode, userId, username, avatar }) => {
      try {
        console.log(`DEBUG: User ${username} joining room ${roomCode}...`);
        
        // Join the Socket.IO "room" (like a group channel)
        socket.join(roomCode);

        // Store this user in our online users map
        if (!onlineUsersMap[roomCode]) {
          onlineUsersMap[roomCode] = [];
        }

        // Remove any existing entry for this user (e.g., reconnect)
        onlineUsersMap[roomCode] = onlineUsersMap[roomCode].filter(
          (u) => u.userId !== userId
        );

        // Add the user
        onlineUsersMap[roomCode].push({ userId, username, avatar, socketId: socket.id });

        // Cancel any self-destruct timer — someone joined!
        if (destructTimers[roomCode]) {
          console.log(`DEBUG: Cancelling timer for ${roomCode}`);
          clearTimeout(destructTimers[roomCode]);
          delete destructTimers[roomCode];
          console.log(`⏰ Self-destruct timer cancelled for room ${roomCode}`);
        }

        // Save which room this socket is in (needed for disconnect cleanup)
        socket.roomCode = roomCode;
        socket.userId = userId;
        socket.username = username;

        // Tell everyone in the room who is now online
        io.to(roomCode).emit('online-users', onlineUsersMap[roomCode]);

        // Send a system message: "Username joined the room"
        const systemMsg = {
          type: 'system',
          content: `${username} joined the room`,
          createdAt: new Date(),
        };
        io.to(roomCode).emit('system-message', systemMsg);

        console.log(`DEBUG: Emitting room activity for ${roomCode}...`);
        // Send updated room activity stats
        await emitRoomActivity(io, roomCode);

        console.log(`👤 ${username} joined room ${roomCode}`);
      } catch (error) {
        console.error('CRITICAL join-room error:', error);
      }
    });

    // ========================================================
    // EVENT: send-message
    // Fired when a user sends a text message
    // ========================================================
    socket.on('send-message', async ({ roomCode, content, userId }) => {
      try {
        if (!content || !content.trim()) return;

        // Find the room in the database
        const room = await Room.findOne({ code: roomCode });
        if (!room) return;

        // Save the message to MongoDB
        const message = await Message.create({
          room: room._id,
          sender: userId,
          content: content.trim(),
          type: 'text',
        });

        // Get the sender's info to attach to the message
        const user = await User.findById(userId).select('username avatar');

        // Update room stats and last activity
        room.totalMessages += 1;
        room.lastActivity = new Date();
        await room.save();

        // Build the message object to send to all users in the room
        const messageData = {
          _id: message._id,
          content: message.content,
          type: 'text',
          sender: {
            _id: userId,
            username: user.username,
            avatar: user.avatar,
          },
          createdAt: message.createdAt,
        };

        // Broadcast the message to everyone in the room
        // io.to(roomCode) = everyone in the room, including the sender
        io.to(roomCode).emit('message-received', messageData);

        // Update room activity stats
        await emitRoomActivity(io, roomCode);

      } catch (error) {
        console.error('send-message error:', error);
      }
    });

    // ========================================================
    // EVENT: file-message
    // Fired after a file is uploaded via REST API
    // The REST route saves to DB, then frontend emits this
    // to broadcast the file message in real-time
    // ========================================================
    socket.on('file-message', ({ roomCode, messageData }) => {
      // Broadcast the already-saved file message to everyone
      io.to(roomCode).emit('message-received', messageData);
    });

    // ========================================================
    // EVENT: typing / stop-typing
    // Shows "username is typing..." indicator to other users
    // ========================================================
    socket.on('typing', ({ roomCode, username }) => {
      // Tell everyone ELSE in the room (not the typer) about it
      socket.to(roomCode).emit('user-typing', username);
    });

    socket.on('stop-typing', ({ roomCode }) => {
      socket.to(roomCode).emit('user-stop-typing', socket.username);
    });

    // ========================================================
    // EVENT: vote-kick
    // A user votes to remove another user from the room
    // ========================================================
    socket.on('vote-kick', async ({ roomCode, targetUserId, voterId, voterUsername }) => {
      try {
        // Prevent self-voting
        if (targetUserId === voterId) {
          socket.emit('vote-kick-error', { message: "You can't vote to kick yourself" });
          return;
        }

        // Initialize tracking structures
        if (!voteKickMap[roomCode]) voteKickMap[roomCode] = {};
        if (!voteKickMap[roomCode][targetUserId]) {
          voteKickMap[roomCode][targetUserId] = new Set();
        }

        // Prevent duplicate votes from the same user
        if (voteKickMap[roomCode][targetUserId].has(voterId)) {
          socket.emit('vote-kick-error', { message: 'You have already voted to kick this user' });
          return;
        }

        // Record the vote
        voteKickMap[roomCode][targetUserId].add(voterId);

        const totalOnline = onlineUsersMap[roomCode]?.length || 1;
        const voteCount = voteKickMap[roomCode][targetUserId].size;
        const required = Math.ceil(totalOnline / 2); // Need >50% votes

        // Broadcast vote progress to everyone in the room
        io.to(roomCode).emit('vote-kick-update', {
          targetUserId,
          voteCount,
          required,
          totalOnline,
        });

        // If enough votes, kick the user!
        if (voteCount >= required) {
          const targetUser = onlineUsersMap[roomCode]?.find(
            (u) => u.userId === targetUserId
          );

          if (targetUser) {
            // Tell the kicked user they've been removed
            io.to(targetUser.socketId).emit('you-were-kicked', {
              message: 'You have been voted out of this room.',
            });

            // Remove them from our online map
            onlineUsersMap[roomCode] = onlineUsersMap[roomCode].filter(
              (u) => u.userId !== targetUserId
            );

            // Clear their votes
            delete voteKickMap[roomCode][targetUserId];

            // Tell everyone else who was kicked
            io.to(roomCode).emit('user-kicked', {
              userId: targetUserId,
              username: targetUser.username,
            });

            // System message
            io.to(roomCode).emit('system-message', {
              type: 'system',
              content: `${targetUser.username} was removed by vote kick`,
              createdAt: new Date(),
            });

            // Update online users list
            io.to(roomCode).emit('online-users', onlineUsersMap[roomCode]);
          }
        }
      } catch (error) {
        console.error('vote-kick error:', error);
      }
    });

    // ========================================================
    // EVENT: leave-room
    // Fired when a user manually leaves a room
    // ========================================================
    socket.on('leave-room', ({ roomCode, userId, username }) => {
      handleUserLeave(io, socket, roomCode, userId, username);
    });

    // ========================================================
    // EVENT: disconnect
    // Fired automatically when the browser tab is closed
    // or connection is lost
    // ========================================================
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      if (socket.roomCode && socket.userId) {
        handleUserLeave(io, socket, socket.roomCode, socket.userId, socket.username);
      }
    });

  }); // end io.on('connection')

}; // end setupSocket

// ============================================================
// HELPER: handleUserLeave
// Clean up when a user leaves or disconnects
// ============================================================
const handleUserLeave = async (io, socket, roomCode, userId, username) => {
  try {
    // Leave the Socket.IO room
    socket.leave(roomCode);

    // Remove user from online map
    if (onlineUsersMap[roomCode]) {
      onlineUsersMap[roomCode] = onlineUsersMap[roomCode].filter(
        (u) => u.userId !== userId
      );

      // Tell remaining users who's still online
      io.to(roomCode).emit('online-users', onlineUsersMap[roomCode]);

      // System message: user left
      io.to(roomCode).emit('system-message', {
        type: 'system',
        content: `${username} left the room`,
        createdAt: new Date(),
      });

      // ---- Self-Destruct Logic ----
      // If the room is now empty, start the 30-minute countdown
      if (onlineUsersMap[roomCode].length === 0) {
        console.log(`🕐 Room ${roomCode} is empty — starting 30-min self-destruct timer`);

        const timer = setTimeout(async () => {
          try {
            // Find the room
            const room = await Room.findOne({ code: roomCode });
            if (room) {
              console.log(`🕐 Room ${roomCode} self-destruct sequence initiated...`);

              // 1. Find all messages in this room that have files
              const messagesWithFiles = await Message.find({ 
                room: room._id, 
                filePublicId: { $ne: null } 
              });

              // 2. Delete each file from storage
              const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
              for (const msg of messagesWithFiles) {
                try {
                  if (cloudinaryConfigured) {
                    // Cloudinary requires resource_type when deleting.
                    // 'raw' for PDFs/ZIPs/TXTs, 'image' for images.
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

              // 3. Delete all messages from DB
              await Message.deleteMany({ room: room._id });

              // 4. Delete the room itself
              await Room.findByIdAndDelete(room._id);

              console.log(`💥 Room ${roomCode} and all its files have been permanently deleted.`);
            }
            // Clean up in-memory data
            delete onlineUsersMap[roomCode];
            delete voteKickMap[roomCode];
            delete destructTimers[roomCode];
          } catch (err) {
            console.error('Self-destruct error:', err);
          }
        }, SELF_DESTRUCT_MS);

        destructTimers[roomCode] = timer;
      }
    }
  } catch (error) {
    console.error('handleUserLeave error:', error);
  }
};

// ============================================================
// HELPER: getOnlineUsersForRoom
// Return the current online users list for a room.
// ============================================================
const getOnlineUsersForRoom = (roomCode) => {
  return onlineUsersMap[roomCode] || [];
};

// ============================================================
// HELPER: emitRoomActivity
// Sends updated room stats to all users in the room
// ============================================================
const emitRoomActivity = async (io, roomCode) => {
  try {
    const room = await Room.findOne({ code: roomCode });
    if (!room) return;

    const stats = {
      totalMessages: room.totalMessages,
      totalFiles: room.totalFiles,
      onlineCount: onlineUsersMap[roomCode]?.length || 0,
      onlineUsers: getOnlineUsersForRoom(roomCode),
    };

    io.to(roomCode).emit('room-activity', stats);
    io.to(roomCode).emit('room_activity_update', stats);
  } catch (error) {
    console.error('emitRoomActivity error:', error);
  }
};

module.exports = {
  setupSocket,
  emitRoomActivity,
  getOnlineUsersForRoom,
};

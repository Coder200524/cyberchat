import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { compressImage } from '../utils/imageCompression';

import MessageBubble from '../components/MessageBubble';
import OnlineUsers from '../components/OnlineUsers';
import RoomActivity from '../components/RoomActivity';
import RoomCodeBadge from '../components/RoomCodeBadge';
import TypingIndicator from '../components/TypingIndicator';

const ChatRoomPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [roomStats, setRoomStats] = useState(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [systemAlert, setSystemAlert] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // --- 1. Fetch Initial Room Data ---
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const res = await api.get(`/rooms/${code}`);
        setRoom(res.data.room);
        setMessages(res.data.messages || []);
        setRoomStats({
          totalMessages: res.data.room.totalMessages || 0,
          totalFiles: res.data.room.totalFiles || 0,
          onlineUsers: [],
        });
      } catch (err) {
        console.error("Failed to fetch room", err);
        navigate('/dashboard'); // Kick back if room doesn't exist
      }
    };
    fetchRoomData();
  }, [code, navigate]);

  // --- 2. Setup Socket Connections ---
  useEffect(() => {
    if (!socket || !room || !user) return;

    // Join the room
    socket.emit('join-room', {
      roomCode: room.code,
      userId: user.id,
      username: user.username,
      avatar: user.avatar
    });

    // Listen for new messages
    socket.on('message-received', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for online users updates
    socket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    // Listen for typing events
    socket.on('user-typing', (username) => {
      setTypingUsers((prev) => {
        if (!prev.includes(username)) return [...prev, username];
        return prev;
      });
    });

    socket.on('user-stop-typing', (username) => {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    });

    // Listen for system messages
    socket.on('system-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Listen for room activity updates
    socket.on('room-activity', (stats) => {
      setRoomStats(stats);
    });

    socket.on('room_activity_update', (stats) => {
      setRoomStats(stats);
    });

    // Listen for kick events
    socket.on('user-kicked', ({ userId, username }) => {
      // If we are still here, just show an alert (system message handles the chat log)
      if (userId !== user.id) {
         // Show temporary alert overlay
         setSystemAlert(`${username} was kicked from the room.`);
         setTimeout(() => setSystemAlert(null), 3000);
      }
    });

    socket.on('you-were-kicked', ({ message }) => {
      alert(message);
      navigate('/dashboard');
    });

    socket.on('vote-kick-update', ({ voteCount, required, targetUserId }) => {
       // Could show a toast here with progress
       console.log(`Kick vote: ${voteCount}/${required}`);
    });

    socket.on('vote-kick-error', ({ message }) => {
      alert(message);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave-room', { roomCode: room.code, userId: user.id, username: user.username });
      socket.off('message-received');
      socket.off('online-users');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('system-message');
      socket.off('room-activity');
      socket.off('room_activity_update');
      socket.off('user-kicked');
      socket.off('you-were-kicked');
      socket.off('vote-kick-update');
      socket.off('vote-kick-error');
    };
  }, [socket, room, user, navigate]);

  // --- 3. Auto Scroll to Bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // --- 4. Handle Sending Text Messages ---
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !room) return;

    socket.emit('send-message', {
      roomCode: room.code,
      content: newMessage,
      userId: user.id
    });

    socket.emit('stop-typing', { roomCode: room.code });
    setNewMessage('');
  };

  // --- 5. Handle Typing Indicator ---
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (socket && room) {
      socket.emit('typing', { roomCode: room.code, username: user.username });

      // Clear existing timeout
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      // Set new timeout to stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', { roomCode: room.code });
      }, 2000);
    }
  };

  // --- 6. Handle File Uploads ---
  const handleFileUpload = async (e) => {
    let file = e.target.files[0];
    if (!file || !room) return;

    // Reset input
    e.target.value = '';
    setUploadError('');

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return setUploadError('File exceeds 10MB limit.');
    }

    setIsUploading(true);

    try {
      // Compress image files before upload (speeds up transmission significantly)
      if (file.type.startsWith('image/')) {
        file = await compressImage(file, 1200, 1200, 0.8);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomCode', room.code);

      // Show uploading message with file name
      const uploadingMsg = `Uploading ${file.name}...`;
      console.log(uploadingMsg);
      
      const res = await api.post('/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Broadcast the saved file message via Socket
      socket.emit('file-message', {
        roomCode: room.code,
        messageData: res.data.chatMessage
      });

    } catch (err) {
      console.error('Upload failed', err);
      
      // Provide specific error messages
      if (err.code === 'ECONNABORTED') {
        setUploadError('Upload timed out. Please try a smaller file.');
      } else if (err.response?.status === 413) {
        setUploadError('File is too large. Max size is 10MB.');
      } else if (err.response?.data?.message) {
        setUploadError(err.response.data.message);
      } else {
        setUploadError('File upload failed. Please try again.');
      }
      
      setTimeout(() => setUploadError(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  if (!room) return (
    <div className="flex-1 flex items-center justify-center text-cyber-cyan font-orbitron animate-pulse">
      ESTABLISHING CONNECTION...
    </div>
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-73px)] relative">
      
      {/* System Alert Overlay */}
      {systemAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-2 rounded-full font-orbitron text-sm shadow-lg border border-red-300 animate-fade-in">
          {systemAlert}
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-cyber-bg min-w-0">
        
        {/* Chat Header */}
        <div className="h-14 md:h-16 border-b border-white/10 bg-cyber-card/50 flex items-center justify-between px-3 sm:px-6 shrink-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <h2 className="font-orbitron font-bold text-sm sm:text-lg text-white truncate max-w-[150px] sm:max-w-[200px] md:max-w-md">
              {room.name}
            </h2>
            <div className="hidden sm:block">
               <RoomCodeBadge code={room.code} />
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-red-500 font-inter text-xs sm:text-sm flex items-center gap-1 sm:gap-2 transition-colors border border-transparent hover:border-red-500/30 px-2 sm:px-3 py-1.5 rounded"
          >
            <span className="hidden sm:inline">DISCONNECT</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Mobile Room Code (visible only on small screens) */}
        <div className="sm:hidden px-4 py-2 border-b border-white/5 bg-cyber-bg">
          <RoomCodeBadge code={room.code} />
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 flex flex-col">
          {messages.length === 0 ? (
            <div className="m-auto text-center text-gray-500 font-inter italic space-y-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>Secure channel established.</p>
              <p>All transmissions are encrypted.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <MessageBubble 
                key={msg._id || index} 
                message={msg} 
                isOwnMessage={msg.sender?._id === user.id} 
              />
            ))
          )}
          
          <TypingIndicator typingUsers={typingUsers} />
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-2 sm:p-4 bg-cyber-card/80 border-t border-white/10 shrink-0">
          
          {uploadError && (
             <div className="text-red-400 text-xs mb-2 font-inter">{uploadError}</div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex gap-1 sm:gap-2 relative">
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`p-2 sm:p-3 rounded bg-cyber-bg border border-white/10 text-gray-400 hover:text-cyber-purple hover:border-cyber-purple transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Upload File"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              )}
            </button>
            
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />

            <input
              type="text"
              className="flex-1 input-cyber font-inter text-sm"
              placeholder="Message..."
              value={newMessage}
              onChange={handleTyping}
            />

            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="btn-cyber-cyan px-2 sm:px-4 py-2 flex items-center justify-center disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar (Users & Activity) */}
      <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-white/10 bg-cyber-bg flex flex-col shrink-0 overflow-y-auto">
        <div className="p-2 sm:p-3 flex-1 flex flex-col gap-1 min-h-0">
          <div className="flex-1 min-h-[120px] md:min-h-[200px]">
             <OnlineUsers users={onlineUsers} roomCode={room?.code} />
          </div>
          <div className="shrink-0 pt-1">
             <RoomActivity stats={roomStats} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default ChatRoomPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  
  const [recentRooms, setRecentRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch recent rooms on load
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/rooms/my');
        setRecentRooms(res.data.rooms);
      } catch (err) {
        console.error("Failed to fetch recent rooms", err);
      }
    };
    fetchRooms();
  }, []);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    
    setError('');
    setLoading(true);
    
    try {
      await api.post('/rooms/join', { code: roomCode.trim() });
      navigate(`/room/${roomCode.trim().toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    
    setError('');
    setLoading(true);
    
    try {
      const res = await api.post('/rooms/create', { name: roomName.trim() });
      navigate(`/room/${res.data.room.code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row p-6 gap-6 max-w-7xl mx-auto w-full">
      {/* Left Column: Actions */}
      <div className="w-full md:w-1/2 flex flex-col gap-6 animate-fade-in">
        <div className="glass-card p-6 border-t-4 border-t-cyber-cyan">
          <h2 className="text-2xl font-orbitron font-bold text-white mb-6 tracking-wider">
            SYSTEM <span className="text-cyber-cyan">NEXUS</span>
          </h2>
          
          <div className="flex mb-6 border-b border-white/10">
            <button 
              className={`flex-1 py-3 font-orbitron text-sm transition-all ${
                activeTab === 'join' 
                  ? 'text-cyber-cyan border-b-2 border-cyber-cyan' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => { setActiveTab('join'); setError(''); }}
            >
              JOIN ROOM
            </button>
            <button 
              className={`flex-1 py-3 font-orbitron text-sm transition-all ${
                activeTab === 'create' 
                  ? 'text-cyber-purple border-b-2 border-cyber-purple' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => { setActiveTab('create'); setError(''); }}
            >
              CREATE ROOM
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 font-inter text-sm text-center">
              {error}
            </div>
          )}

          {activeTab === 'join' ? (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-cyber-cyan font-orbitron text-xs mb-2">ROOM CODE // ENTRY KEY</label>
                <input 
                  type="text" 
                  className="input-cyber uppercase text-center text-xl tracking-widest" 
                  placeholder="XXXXXX"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || roomCode.length < 6}
                className="w-full btn-cyber-cyan py-3 text-lg"
              >
                {loading ? 'CONNECTING...' : 'INITIALIZE UPLINK'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-cyber-purple font-orbitron text-xs mb-2">ROOM DESIGNATION // NAME</label>
                <input 
                  type="text" 
                  className="input-cyber focus:border-cyber-purple focus:ring-cyber-purple" 
                  placeholder="e.g., Secure Channel Alpha"
                  maxLength={50}
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !roomName.trim()}
                className="w-full btn-cyber-purple py-3 text-lg"
              >
                {loading ? 'GENERATING...' : 'ESTABLISH NEW SECURE ROOM'}
              </button>
            </form>
          )}
        </div>
        
        {/* Info Card */}
        <div className="glass-card p-6 bg-cyber-card/50">
          <h3 className="font-orbitron text-cyber-cyan text-sm mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            SYSTEM PROTOCOLS
          </h3>
          <ul className="text-gray-400 font-inter text-sm space-y-2 list-disc list-inside">
            <li>Rooms automatically self-destruct after 30 minutes of inactivity.</li>
            <li>All transmissions (messages/files) are wiped upon destruction.</li>
            <li>Users can be forcefully disconnected via vote-kick mechanism.</li>
          </ul>
        </div>
      </div>

      {/* Right Column: Recent Rooms */}
      <div className="w-full md:w-1/2 flex flex-col animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="glass-card p-6 flex-1 flex flex-col h-full">
          <h3 className="text-lg font-orbitron font-bold text-white mb-4 tracking-wide border-b border-white/10 pb-2">
            RECENT CONNECTIONS
          </h3>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {recentRooms.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 py-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="font-orbitron text-sm">NO PREVIOUS LOGS FOUND</p>
              </div>
            ) : (
              recentRooms.map((room) => (
                <div 
                  key={room._id} 
                  className="bg-cyber-bg/50 border border-white/5 p-4 rounded-lg hover:border-cyber-cyan/50 hover:bg-white/5 transition-all group cursor-pointer"
                  onClick={() => navigate(`/room/${room.code}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-orbitron font-bold text-white group-hover:text-cyber-cyan transition-colors truncate pr-2">
                      {room.name}
                    </h4>
                    <span className="text-xs font-mono bg-cyber-card border border-white/10 px-2 py-1 rounded text-cyber-purple tracking-widest">
                      {room.code}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-gray-500 font-inter flex gap-3">
                      <span title="Total Messages">💬 {room.totalMessages || 0}</span>
                      <span title="Files Shared">📎 {room.totalFiles || 0}</span>
                    </div>
                    <span className="text-[10px] text-gray-600 font-inter uppercase">
                      Active: {new Date(room.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

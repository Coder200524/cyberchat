import React from 'react';
import Avatar from './Avatar';
import VoteKickButton from './VoteKickButton';
import { useAuth } from '../context/AuthContext';

const OnlineUsers = ({ users, roomCode }) => {
  const { user: currentUser } = useAuth();

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 className="font-orbitron font-bold text-cyber-cyan text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse-glow"></span>
          ONLINE USERS
        </h3>
        <span className="bg-cyber-cyan/20 text-cyber-cyan px-2 py-0.5 rounded text-xs font-bold">
          {users.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {users.length === 0 ? (
          <p className="text-sm text-gray-500 font-inter text-center mt-4">Nobody here...</p>
        ) : (
          <ul className="space-y-1">
            {users.map((u) => {
              const isMe = currentUser?.id === u.userId;
              
              return (
                <li 
                  key={u.socketId} 
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                    isMe ? 'bg-cyber-cyan/10 border border-cyber-cyan/30' : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative">
                      <Avatar url={u.avatar} size="w-8 h-8" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-cyber-bg rounded-full"></span>
                    </div>
                    <span className="font-inter text-sm text-white truncate max-w-[100px]" title={u.username}>
                      {u.username}
                      {isMe && <span className="text-cyber-cyan text-xs ml-1">(You)</span>}
                    </span>
                  </div>
                  
                  {!isMe && (
                    <VoteKickButton 
                      targetUserId={u.userId} 
                      targetUsername={u.username} 
                      roomCode={roomCode} 
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;

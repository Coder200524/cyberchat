import React from 'react';

const RoomActivity = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="glass-card mt-4 overflow-hidden">
      <div className="p-3 border-b border-white/10 bg-white/5">
        <h3 className="font-orbitron font-bold text-cyber-purple text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          ROOM ACTIVITY
        </h3>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="bg-cyber-bg/50 border border-white/5 p-3 rounded-lg text-center flex flex-col items-center justify-center">
          <span className="text-2xl font-orbitron font-bold text-cyber-cyan">{stats.totalMessages || 0}</span>
          <span className="text-[10px] text-gray-500 font-inter uppercase tracking-widest mt-1">Messages</span>
        </div>
        
        <div className="bg-cyber-bg/50 border border-white/5 p-3 rounded-lg text-center flex flex-col items-center justify-center">
          <span className="text-2xl font-orbitron font-bold text-cyber-purple">{stats.totalFiles || 0}</span>
          <span className="text-[10px] text-gray-500 font-inter uppercase tracking-widest mt-1">Files Shared</span>
        </div>
      </div>
    </div>
  );
};

export default RoomActivity;

import React from 'react';

const RoomCodeBadge = ({ code }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    // Could add a toast notification here
  };

  return (
    <div 
      onClick={handleCopy}
      className="inline-flex items-center gap-3 bg-cyber-bg border border-cyber-purple/50 rounded-lg px-4 py-2 cursor-pointer hover:border-cyber-cyan hover:shadow-cyan-glow transition-all group"
      title="Click to copy code"
    >
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 font-inter uppercase tracking-widest leading-none mb-1">Room Code</span>
        <span className="font-orbitron font-bold tracking-widest text-cyber-purple group-hover:text-cyber-cyan transition-colors leading-none">
          {code}
        </span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-cyber-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </div>
  );
};

export default RoomCodeBadge;

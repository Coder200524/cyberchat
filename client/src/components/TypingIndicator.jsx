import React from 'react';

const TypingIndicator = ({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing`;
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing`;
    return 'Several people are typing';
  };

  return (
    <div className="flex items-center gap-2 p-2 px-4 animate-fade-in">
      <div className="flex gap-1 items-center bg-cyber-card py-1 px-3 rounded-full border border-white/5">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="text-xs text-gray-400 font-inter ml-2 italic">{getTypingText()}...</span>
      </div>
    </div>
  );
};

export default TypingIndicator;

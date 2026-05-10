import React from 'react';

const Avatar = ({ url, size = 'w-10 h-10', className = '' }) => {
  return (
    <div className={`relative rounded-full overflow-hidden border border-cyber-cyan shadow-cyan-glow bg-cyber-bg ${size} ${className}`}>
      {url ? (
        <img 
          src={url} 
          alt="Avatar" 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-cyber-cyan text-xs">
          ?
        </div>
      )}
    </div>
  );
};

export default Avatar;

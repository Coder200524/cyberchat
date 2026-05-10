import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const VoteKickButton = ({ targetUserId, targetUsername, roomCode }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const handleVote = () => {
    if (window.confirm(`Are you sure you want to vote to kick ${targetUsername}?`)) {
      socket.emit('vote-kick', {
        roomCode,
        targetUserId,
        voterId: user.id,
        voterUsername: user.username
      });
    }
  };

  return (
    <button
      onClick={handleVote}
      className="text-gray-500 hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-colors group"
      title={`Vote to kick ${targetUsername}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
      </svg>
    </button>
  );
};

export default VoteKickButton;

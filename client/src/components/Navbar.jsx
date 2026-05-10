import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Avatar from './Avatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-cyber-card border-b border-cyber-cyan/30 shadow-lg px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-lg bg-cyber-bg border border-cyber-cyan flex items-center justify-center shadow-cyan-glow group-hover:scale-110 transition-transform">
          <span className="text-cyber-cyan font-orbitron font-bold text-xl">C</span>
        </div>
        <h1 className="text-2xl font-orbitron font-bold tracking-wider text-white">
          Cyber<span className="text-cyber-cyan">Chat</span>
        </h1>
      </Link>

      {user && (
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm font-inter text-gray-400">STATUS:</span>
            <span className="text-sm font-orbitron text-cyber-cyan animate-pulse">ONLINE</span>
          </div>
          
          <Link
            to="/profile"
            className="text-cyber-cyan border border-cyber-cyan/20 px-3 py-1 rounded-full font-inter text-sm hover:bg-cyber-cyan/10 transition-colors"
          >
            PROFILE
          </Link>

          <div className="flex items-center gap-3 bg-cyber-bg py-1 px-4 rounded-full border border-white/10">
            <span className="font-orbitron text-white text-sm">{user.username}</span>
            <Avatar url={user.avatar} size="w-8 h-8" />
          </div>

          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-cyber-purple transition-colors flex items-center gap-2 font-inter text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

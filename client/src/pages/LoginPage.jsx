import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyber-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyber-purple/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-card p-8 animate-fade-in relative z-10 border-t-4 border-t-cyber-cyan">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-orbitron font-bold text-white tracking-wider mb-2">ACCESS TERMINAL</h2>
          <p className="text-gray-400 font-inter text-sm">Enter credentials to establish connection</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 font-inter text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-cyber-cyan font-orbitron text-sm mb-2" htmlFor="username">
              USERNAME //
            </label>
            <input
              id="username"
              type="text"
              className="input-cyber"
              placeholder="Enter your handle..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-cyber-cyan font-orbitron text-sm mb-2" htmlFor="password">
              PASSWORD //
            </label>
            <input
              id="password"
              type="password"
              className="input-cyber"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-cyber-cyan mt-4"
          >
            {loading ? 'AUTHENTICATING...' : 'INITIALIZE CONNECTION'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-6">
          <p className="text-gray-400 font-inter text-sm">
            No access clearance?{' '}
            <Link to="/register" className="text-cyber-purple hover:text-cyber-cyan hover:underline transition-colors font-orbitron tracking-wide">
              REGISTER HERE
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

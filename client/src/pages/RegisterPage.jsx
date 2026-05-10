import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const avatarStyles = ['adventurer', 'pixel-art', 'bottts', 'lorelei', 'thumbs'];

const buildDicebearUrl = (style, seed) => {
  const safeStyle = style || 'bottts';
  const safeSeed = seed && seed.trim() ? seed.trim() : 'cyberchat';
  return `https://api.dicebear.com/7.x/${safeStyle}/svg?seed=${encodeURIComponent(safeSeed)}&backgroundColor=0D0D0D`;
};

const generateRandomSeed = (username) => {
  const base = username.trim() || 'cyber';
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${base}-${randomPart}`;
};

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('bottts');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [useUsernameSeed, setUseUsernameSeed] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (username.length < 3) {
      return setError('Username must be at least 3 characters');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      const seed = useUsernameSeed ? username.trim() || 'cyberchat' : avatarSeed;
      await register(username, password, avatarStyle, seed);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const previewSeed = useUsernameSeed ? username.trim() || 'cyberchat' : avatarSeed || 'cyberchat';
  const avatarPreviewUrl = useMemo(
    () => buildDicebearUrl(avatarStyle, previewSeed),
    [avatarStyle, previewSeed]
  );

  const handleRandomize = () => {
    const seed = generateRandomSeed(username);
    setAvatarSeed(seed);
    setUseUsernameSeed(false);
  };

  const handleStyleSelect = (style) => {
    setAvatarStyle(style);
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-cyber-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-cyber-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-5xl glass-card p-8 animate-fade-in relative z-10 border-t-4 border-t-cyber-purple">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-orbitron font-bold text-white tracking-wider mb-2">NEW IDENTITY</h2>
          <p className="text-gray-400 font-inter text-sm">Register your handle in the database</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 font-inter text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="glass-card p-6 border border-white/10 bg-white/5">
            <div className="flex flex-col items-center text-center mb-6">
              <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-inter mb-2">Avatar Preview</p>
              <span className="inline-flex items-center justify-center rounded-full border border-cyber-purple bg-white/5 px-4 py-1 text-sm font-orbitron text-white">
                Live DiceBear Preview
              </span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-cyber-cyan shadow-cyan-glow bg-cyber-bg">
                <img src={avatarPreviewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              </div>

              <button
                type="button"
                onClick={handleRandomize}
                className="btn-cyber-purple text-sm px-4 py-3"
              >
                Generate Random Avatar
              </button>

              <div className="w-full">
                <div className="text-xs text-gray-400 font-inter mb-2">Style</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {avatarStyles.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => handleStyleSelect(style)}
                      className={`px-3 py-2 rounded-full text-xs font-semibold transition ${avatarStyle === style ? 'bg-cyber-cyan text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-cyber-purple font-orbitron text-sm mb-2" htmlFor="username">
              USERNAME //
            </label>
            <input
              id="username"
              type="text"
              className="input-cyber focus:border-cyber-purple focus:ring-cyber-purple"
              placeholder="Choose a handle..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-cyber-purple font-orbitron text-sm mb-2" htmlFor="password">
              PASSWORD //
            </label>
            <input
              id="password"
              type="password"
              className="input-cyber focus:border-cyber-purple focus:ring-cyber-purple"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-cyber-purple font-orbitron text-sm mb-2" htmlFor="confirmPassword">
              CONFIRM PASSWORD //
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="input-cyber focus:border-cyber-purple focus:ring-cyber-purple"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-cyber-purple mt-6"
          >
            {loading ? 'PROCESSING...' : 'CREATE IDENTITY'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-6">
          <p className="text-gray-400 font-inter text-sm">
            Already have clearance?{' '}
            <Link to="/login" className="text-cyber-cyan hover:text-cyber-purple hover:underline transition-colors font-orbitron tracking-wide">
              LOGIN HERE
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

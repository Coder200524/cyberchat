import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const avatarStyles = ['adventurer', 'pixel-art', 'bottts', 'lorelei', 'thumbs'];

const buildDicebearUrl = (style, seed) => {
  const safeStyle = style || 'bottts';
  const safeSeed = seed && seed.trim() ? seed.trim() : 'cyberchat';
  return `https://api.dicebear.com/7.x/${safeStyle}/svg?seed=${encodeURIComponent(safeSeed)}&backgroundColor=0D0D0D`;
};

const generateRandomSeed = (username) => {
  const base = username?.trim() || 'cyber';
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${base}-${randomPart}`;
};

const ProfilePage = () => {
  const { user, updateAvatar } = useAuth();
  const [avatarStyle, setAvatarStyle] = useState(user?.avatarStyle || 'bottts');
  const [avatarSeed, setAvatarSeed] = useState(user?.avatarSeed || '');
  const [useUsernameSeed, setUseUsernameSeed] = useState(!user?.avatarSeed);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const previewSeed = useUsernameSeed ? user?.username || 'cyberchat' : avatarSeed || 'cyberchat';
  const avatarPreviewUrl = useMemo(
    () => buildDicebearUrl(avatarStyle, previewSeed),
    [avatarStyle, previewSeed]
  );

  const handleRandomize = () => {
    const seed = generateRandomSeed(user?.username || 'cyber');
    setAvatarSeed(seed);
    setUseUsernameSeed(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    setSaving(true);

    try {
      const seed = useUsernameSeed ? user?.username || 'cyberchat' : avatarSeed;
      await updateAvatar(avatarStyle, seed);
      setMessage('Avatar saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save avatar. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-cyber-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-cyber-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-3xl glass-card p-8 animate-fade-in relative z-10 border-t-4 border-t-cyber-purple">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-orbitron font-bold text-white tracking-wider mb-2">PROFILE AVATAR</h2>
            <p className="text-gray-400 font-inter text-sm max-w-xl">Choose your DiceBear avatar style, preview it live, and save it to your account.</p>
          </div>
          <Link
            to="/dashboard"
            className="text-cyber-cyan border border-cyber-cyan/20 px-4 py-2 rounded-full font-inter text-sm hover:bg-cyber-cyan/10 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 font-inter text-sm text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 bg-cyber-cyan/10 border border-cyber-cyan/50 rounded text-cyber-cyan font-inter text-sm text-center">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="glass-card p-6 border border-white/10 bg-white/5">
            <div className="flex flex-col items-center gap-4 text-center mb-6">
              <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-cyber-cyan shadow-cyan-glow bg-cyber-bg">
                <img src={avatarPreviewUrl} alt="Current avatar preview" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-inter">Current Preview</p>
                <p className="text-lg font-orbitron text-white">{avatarStyle} / {previewSeed}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRandomize}
              className="w-full btn-cyber-purple px-4 py-3 text-sm"
            >
              Randomize Avatar
            </button>
          </div>

          <form onSubmit={handleSave} className="glass-card p-6 border border-white/10 bg-white/5 space-y-6">
            <div>
              <label className="block text-cyber-purple font-orbitron text-sm mb-2">Avatar Style</label>
              <div className="flex flex-wrap gap-2">
                {avatarStyles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setAvatarStyle(style)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${avatarStyle === style ? 'bg-cyber-cyan text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-cyber-purple font-orbitron text-sm mb-2">Seed Source</label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setUseUsernameSeed(true)}
                  className={`w-full text-left px-4 py-3 rounded-xl border ${useUsernameSeed ? 'border-cyber-cyan bg-cyber-cyan/10' : 'border-white/10 bg-white/5 hover:border-cyber-cyan/30'} text-sm font-inter transition`}
                >
                  Use my username as the seed: <span className="font-bold text-white">{user?.username}</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUseUsernameSeed(false)}
                    className={`w-full text-left px-4 py-3 rounded-xl border ${!useUsernameSeed ? 'border-cyber-cyan bg-cyber-cyan/10' : 'border-white/10 bg-white/5 hover:border-cyber-cyan/30'} text-sm font-inter transition`}
                  >
                    Use a custom seed
                  </button>
                  {!useUsernameSeed && (
                    <input
                      type="text"
                      value={avatarSeed}
                      onChange={(e) => setAvatarSeed(e.target.value)}
                      placeholder="Type a seed or random string"
                      className="mt-3 w-full input-cyber focus:border-cyber-purple focus:ring-cyber-purple"
                    />
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full btn-cyber-purple px-4 py-3 text-sm"
            >
              {saving ? 'SAVING...' : 'SAVE AVATAR'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

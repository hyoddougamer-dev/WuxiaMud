// ============================================
// LOGIN PAGE - 凌云道 (Língyún Dào)
// Página de autenticação estética
// ============================================

import React, { useState, useEffect } from 'react';
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Volume2, VolumeX, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMusic } from '../contexts/MusicContext';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { signIn, signUp } = useAuth();
  const { playLoginMusic, isMuted, toggleMute, volume, setVolume } = useMusic();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  // Iniciar música quando o utilizador interage (evitar autoplay block)
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        playLoginMusic();
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [hasInteracted, playLoginMusic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          onSuccess();
        }
      } else {
        // Validações
        if (username.length < 3) {
          setError('Username must be at least 3 characters');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const result = await signUp(email, password, username);
        if (result.error) {
          setError(result.error);
        } else {
          setError('');
          alert('Account created! Check your email to verify your account.');
          setMode('login');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Music Control - Canto superior direito */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2 border border-stone-600/30">
        <button
          onClick={toggleMute}
          className="text-stone-400 hover:text-stone-200 transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-20 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-yellow-600"
        />
      </div>

      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/background-video.mp4" type="video/mp4" />
      </video>
      
      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      {/* Subtle Particles (on top of video) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-500/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Wuxia MUD" 
            className="h-40 mx-auto drop-shadow-[0_0_30px_rgba(255,180,50,0.5)]"
          />
        </div>

        {/* Form Card */}
        <div className="bg-stone-900/50 backdrop-blur-xl border border-stone-600/30 rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-yellow-700/80 to-yellow-800/80 text-yellow-100 border border-yellow-600/40'
                  : 'bg-stone-800/40 text-stone-400 hover:text-stone-200 border border-stone-600/30'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-yellow-700/80 to-yellow-800/80 text-yellow-100 border border-yellow-600/40'
                  : 'bg-stone-800/40 text-stone-400 hover:text-stone-200 border border-stone-600/30'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username (só no register) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="w-full px-4 py-3 pl-10 bg-stone-900/60 border border-stone-600/40 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-yellow-600/60 transition-all"
                  />
                  <Sparkles size={18} className="absolute left-3 top-3.5 text-stone-500" />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 pl-10 bg-stone-900/60 border border-stone-600/40 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-yellow-600/60 transition-all"
                />
                <Mail size={18} className="absolute left-3 top-3.5 text-stone-500" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 pl-10 pr-10 bg-stone-900/60 border border-stone-600/40 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-yellow-600/60 transition-all"
                />
                <Lock size={18} className="absolute left-3 top-3.5 text-stone-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-700/90 to-yellow-800/90 hover:from-yellow-600/90 hover:to-yellow-700/90 text-yellow-100 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-yellow-600/30"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : mode === 'login' ? (
                'Enter World'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'login' && (
              <button className="text-xs text-yellow-600/70 hover:text-yellow-500 transition-colors">
                Forgot your password?
              </button>
            )}
            <p className="text-[10px] text-stone-400">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-yellow-600 hover:text-yellow-500"
              >
                {mode === 'login' ? 'Register here' : 'Login here'}
              </button>
            </p>
          </div>
        </div>

        {/* Info Footer */}
        <div className="text-center mt-6 text-stone-400/60 text-xs flex items-center justify-center gap-1">
          <Globe size={12} /> Online game · Your progress is saved in the cloud
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

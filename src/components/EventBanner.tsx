/**
 * Event Banner Component - Shows active event at top of screen
 * Automatically appears/disappears based on game_config
 */

import React, { useState, useEffect } from 'react';
import { useGameConfig } from '../hooks/useGameConfig';
import { X, Clock, Sparkles, Gift, Zap } from 'lucide-react';

interface EventBannerProps {
  className?: string;
}

export const EventBanner: React.FC<EventBannerProps> = ({ className = '' }) => {
  const { config, loading } = useGameConfig();
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Calculate time remaining
  useEffect(() => {
    if (!config.event_end) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const end = new Date(config.event_end!).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Ending soon...');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [config.event_end]);

  // Reset dismissed state when event changes
  useEffect(() => {
    setDismissed(false);
  }, [config.active_event]);

  if (loading || !config.active_event || dismissed) {
    return null;
  }

  // Determine banner color based on multipliers
  const getGradient = () => {
    if (config.exp_multiplier > 1 && config.drop_rate_multiplier > 1 && config.spirit_stones_multiplier > 1) {
      return 'from-yellow-600 via-amber-500 to-yellow-600'; // Golden Week
    }
    if (config.exp_multiplier >= 2) {
      return 'from-blue-600 via-cyan-500 to-blue-600'; // EXP
    }
    if (config.drop_rate_multiplier >= 2) {
      return 'from-purple-600 via-pink-500 to-purple-600'; // Drops
    }
    if (config.spirit_stones_multiplier >= 2) {
      return 'from-green-600 via-emerald-500 to-green-600'; // Stones
    }
    return 'from-amber-600 via-yellow-500 to-amber-600'; // Default
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className={`bg-gradient-to-r ${getGradient()} px-4 py-2`}>
        {/* Animated background sparkles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute top-1 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }} />
          <div className="absolute bottom-1 left-1/2 w-1.5 h-1.5 bg-white/25 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
        </div>

        <div className="flex items-center justify-between relative z-10">
          {/* Event Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
              <Sparkles size={14} className="text-white animate-pulse" />
              <span className="text-white font-bold text-sm">{config.active_event}</span>
            </div>
            
            {/* Multipliers */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              {config.exp_multiplier > 1 && (
                <span className="bg-black/20 px-2 py-0.5 rounded text-white flex items-center gap-1">
                  <Zap size={12} />
                  EXP {config.exp_multiplier}x
                </span>
              )}
              {config.drop_rate_multiplier > 1 && (
                <span className="bg-black/20 px-2 py-0.5 rounded text-white flex items-center gap-1">
                  <Gift size={12} />
                  Drops {config.drop_rate_multiplier}x
                </span>
              )}
              {config.spirit_stones_multiplier > 1 && (
                <span className="bg-black/20 px-2 py-0.5 rounded text-white flex items-center gap-1">
                  💎 Stones {config.spirit_stones_multiplier}x
                </span>
              )}
            </div>
          </div>

          {/* Time & Close */}
          <div className="flex items-center gap-2">
            {timeLeft && (
              <span className="text-xs text-white/80 flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded">
                <Clock size={12} />
                {timeLeft}
              </span>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-black/20 rounded transition-colors text-white/60 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventBanner;

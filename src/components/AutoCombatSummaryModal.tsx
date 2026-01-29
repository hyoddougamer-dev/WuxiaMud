// ============================================
// AUTO-COMBAT SUMMARY MODAL - WuxiaMUD
// Premium session results display
// ============================================

import React, { useEffect, useState } from 'react';
import { X, Sword, Coins, Star, Package, Clock, Skull, TrendingUp, Sparkles, Trophy, Gem, Zap, ChevronDown, ChevronUp } from 'lucide-react';

export interface AutoCombatSessionStats {
  startTime: number;
  endTime: number;
  totalKills: number;
  totalExpGained: number;
  totalSpiritStones: number;
  lootCollected: Array<{
    id: string;
    name: string;
    count: number;
    rarity: string;
    iconType?: string;
  }>;
  levelsGained: number;
  deaths: number;
  bossesKilled: number;
  stopReason: 'manual' | 'timer' | 'lowHp' | 'levelUp' | 'rareDrop' | 'death';
}

export const emptySessionStats: AutoCombatSessionStats = {
  startTime: 0,
  endTime: 0,
  totalKills: 0,
  totalExpGained: 0,
  totalSpiritStones: 0,
  lootCollected: [],
  levelsGained: 0,
  deaths: 0,
  bossesKilled: 0,
  stopReason: 'manual',
};

interface AutoCombatSummaryModalProps {
  isOpen: boolean;
  stats: AutoCombatSessionStats;
  onClose: () => void;
}

// Animated counter component
const AnimatedNumber: React.FC<{ value: number; duration?: number; prefix?: string; suffix?: string; delay?: number }> = ({ 
  value, 
  duration = 1500,
  prefix = '',
  suffix = '',
  delay = 0
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    let delayTimeout: ReturnType<typeof setTimeout>;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    delayTimeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay);
    
    return () => {
      clearTimeout(delayTimeout);
      cancelAnimationFrame(animationFrame);
    };
  }, [value, duration, delay]);
  
  return <>{prefix}{displayValue.toLocaleString()}{suffix}</>;
};

// Stat card component
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtext?: string;
  gradient: string;
  borderColor: string;
  delay?: number;
}> = ({ icon, label, value, subtext, gradient, borderColor, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div className={`relative overflow-hidden rounded-xl transition-all duration-500 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {/* Glow effect */}
      <div className={`absolute -inset-0.5 ${gradient} rounded-xl blur opacity-30`} />
      
      <div className={`relative p-4 rounded-xl bg-gradient-to-br ${gradient} border ${borderColor}`}>
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-xl" />
        
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-2 p-2 rounded-lg bg-black/30">
            {icon}
          </div>
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            {typeof value === 'number' ? <AnimatedNumber value={value} delay={delay} /> : value}
          </div>
          <div className="text-xs text-white/70 uppercase tracking-wide">{label}</div>
          {subtext && (
            <div className="text-[10px] text-white/50 mt-0.5">{subtext}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AutoCombatSummaryModal: React.FC<AutoCombatSummaryModalProps> = ({
  isOpen,
  stats,
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [showLootDetails, setShowLootDetails] = useState(false);
  
  // Group loot by rarity for display - MUST be before any early returns
  const lootByRarity = React.useMemo(() => {
    const grouped: Record<string, typeof stats.lootCollected> = {};
    const order = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
    
    stats.lootCollected.forEach(item => {
      if (!grouped[item.rarity]) grouped[item.rarity] = [];
      grouped[item.rarity].push(item);
    });
    
    return order.filter(r => grouped[r]).map(rarity => ({
      rarity,
      items: grouped[rarity],
    }));
  }, [stats.lootCollected]);
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };
  
  if (!isOpen) return null;
  
  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };
  
  const duration = stats.endTime - stats.startTime;
  const killsPerMinute = duration > 0 ? (stats.totalKills / (duration / 60000)).toFixed(1) : '0';
  const expPerMinute = duration > 0 ? Math.round(stats.totalExpGained / (duration / 60000)) : 0;
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      case 'Uncommon': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'Rare': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'Epic': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'Legendary': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };
  
  const getStopReasonDisplay = (reason: string) => {
    const configs: Record<string, { text: string; icon: React.ReactNode; color: string }> = {
      manual: { text: 'Session Stopped', icon: <X size={16} />, color: 'text-cyan-400' },
      timer: { text: 'Time Limit Reached', icon: <Clock size={16} />, color: 'text-amber-400' },
      lowHp: { text: 'HP Emergency Stop', icon: <Skull size={16} />, color: 'text-red-400' },
      levelUp: { text: 'Level Up!', icon: <TrendingUp size={16} />, color: 'text-green-400' },
      rareDrop: { text: 'Rare Item Found!', icon: <Gem size={16} />, color: 'text-purple-400' },
      death: { text: 'Defeated in Battle', icon: <Skull size={16} />, color: 'text-red-500' },
    };
    return configs[reason] || configs.manual;
  };
  
  const stopReasonConfig = getStopReasonDisplay(stats.stopReason);
  
  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
      isClosing ? 'opacity-0' : 'opacity-100'
    }`}>
      {/* Backdrop with blur and particles */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Victory particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full animate-bounce ${
              i % 3 === 0 ? 'bg-amber-400/40 w-2 h-2' : 
              i % 3 === 1 ? 'bg-purple-400/30 w-1.5 h-1.5' : 
              'bg-cyan-400/30 w-1 h-1'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
      
      {/* Modal */}
      <div className={`relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl transition-all duration-500 ${
        isClosing ? 'scale-90 opacity-0 rotate-3' : 'scale-100 opacity-100 rotate-0'
      }`}>
        {/* Outer glow */}
        <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 via-purple-500 to-amber-500 rounded-2xl blur-lg opacity-40 animate-pulse" />
        
        {/* Main container */}
        <div className="relative bg-gradient-to-b from-[#1a1d28] via-[#151820] to-[#0f1218] border border-amber-500/40 rounded-2xl overflow-hidden">
          
          {/* Header with celebration effect */}
          <div className="relative p-6 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-900/50 via-orange-900/30 to-amber-900/50" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,200,100,0.2),transparent_60%)]" />
            
            {/* Decorative rays */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 h-32 w-1 bg-gradient-to-b from-amber-400/20 to-transparent origin-bottom"
                  style={{ transform: `rotate(${i * 45}deg)` }}
                />
              ))}
            </div>
            
            {/* Trophy icon */}
            <div className="relative flex flex-col items-center">
              <div className="relative mb-3">
                <div className="absolute -inset-4 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/50">
                  <Trophy size={40} className="text-white drop-shadow-lg" />
                </div>
                {/* Sparkles around trophy */}
                <Sparkles size={16} className="absolute -top-1 -right-1 text-amber-300 animate-pulse" />
                <Sparkles size={12} className="absolute -bottom-2 -left-2 text-yellow-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
                <Star size={14} className="absolute top-0 -left-3 text-orange-300 animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
              
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 drop-shadow-lg mb-1">
                Session Complete!
              </h2>
              
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 ${stopReasonConfig.color}`}>
                {stopReasonConfig.icon}
                <span className="text-sm font-medium">{stopReasonConfig.text}</span>
              </div>
            </div>
            
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-gray-300" />
            </button>
          </div>
          
          {/* Stats Grid */}
          <div className="p-4 grid grid-cols-2 gap-3">
            <StatCard
              icon={<Clock size={20} className="text-cyan-400" />}
              label="Duration"
              value={formatDuration(duration)}
              gradient="from-cyan-900/40 to-blue-900/30"
              borderColor="border-cyan-500/30"
              delay={100}
            />
            <StatCard
              icon={<Skull size={20} className="text-red-400" />}
              label="Kills"
              value={stats.totalKills}
              subtext={`${killsPerMinute}/min`}
              gradient="from-red-900/40 to-rose-900/30"
              borderColor="border-red-500/30"
              delay={200}
            />
            <StatCard
              icon={<Star size={20} className="text-green-400" />}
              label="Total EXP"
              value={stats.totalExpGained}
              subtext={`${expPerMinute}/min`}
              gradient="from-green-900/40 to-emerald-900/30"
              borderColor="border-green-500/30"
              delay={300}
            />
            <StatCard
              icon={<Coins size={20} className="text-amber-400" />}
              label="Spirit Stones"
              value={stats.totalSpiritStones}
              gradient="from-amber-900/40 to-orange-900/30"
              borderColor="border-amber-500/30"
              delay={400}
            />
            
            {/* Level Up Banner */}
            {stats.levelsGained > 0 && (
              <div className="col-span-2 relative overflow-hidden rounded-xl">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-xl blur opacity-50 animate-pulse" />
                <div className="relative p-4 rounded-xl bg-gradient-to-r from-purple-900/50 via-pink-900/30 to-purple-900/50 border border-purple-400/40 flex items-center justify-center gap-4">
                  <TrendingUp size={28} className="text-purple-400" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                      +{stats.levelsGained} Level{stats.levelsGained > 1 ? 's' : ''}!
                    </div>
                    <div className="text-xs text-purple-300/70">Congratulations on your progress!</div>
                  </div>
                  <Zap size={28} className="text-pink-400 animate-pulse" />
                </div>
              </div>
            )}
            
            {/* Bosses Killed */}
            {stats.bossesKilled > 0 && (
              <div className="col-span-2 relative overflow-hidden rounded-xl">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-xl blur opacity-40" />
                <div className="relative p-3 rounded-xl bg-gradient-to-r from-red-900/50 via-orange-900/30 to-red-900/50 border border-red-400/40 flex items-center justify-center gap-3">
                  <Sword size={24} className="text-red-400" />
                  <span className="text-lg font-bold text-red-300">
                    {stats.bossesKilled} Boss{stats.bossesKilled > 1 ? 'es' : ''} Slain!
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Loot Section */}
          <div className="mx-4 mb-4">
            <button
              onClick={() => setShowLootDetails(!showLootDetails)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-900/30 via-orange-900/20 to-amber-900/30 border border-amber-500/30 transition-all hover:border-amber-400/50"
            >
              <div className="flex items-center gap-2">
                <Package size={16} className="text-amber-400" />
                <span className="text-sm font-bold text-amber-300">
                  Loot Collected ({stats.lootCollected.length} items)
                </span>
              </div>
              {showLootDetails ? (
                <ChevronUp size={16} className="text-amber-400" />
              ) : (
                <ChevronDown size={16} className="text-amber-400" />
              )}
            </button>
            
            {showLootDetails && (
              <div className="mt-2 p-3 rounded-xl bg-black/30 border border-white/10 max-h-[150px] overflow-y-auto">
                {stats.lootCollected.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Package size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No loot collected</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lootByRarity.map(({ rarity, items }) => (
                      <div key={rarity}>
                        <div className={`text-xs font-bold mb-1 ${getRarityColor(rarity).split(' ')[0]}`}>
                          {rarity} ({items.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {items.map((item, idx) => (
                            <div
                              key={`${item.id}-${idx}`}
                              className={`px-2 py-1 rounded border text-xs ${getRarityColor(item.rarity)}`}
                            >
                              <span className="font-medium">{item.name}</span>
                              {item.count > 1 && <span className="ml-1 opacity-70">x{item.count}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Deaths Warning */}
          {stats.deaths > 0 && (
            <div className="mx-4 mb-4 p-3 rounded-xl bg-gradient-to-r from-red-900/40 to-rose-900/30 border border-red-500/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Skull size={20} className="text-red-400" />
              </div>
              <div>
                <div className="text-red-300 font-bold">You died {stats.deaths} time{stats.deaths > 1 ? 's' : ''}</div>
                <div className="text-xs text-red-400/70">Consider upgrading your gear or potions!</div>
              </div>
            </div>
          )}
          
          {/* Close Button */}
          <div className="p-4 border-t border-white/10 bg-black/40">
            <button
              onClick={handleClose}
              className="w-full py-4 rounded-xl font-bold transition-all relative overflow-hidden group bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white border border-amber-400/50 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              
              <span className="relative flex items-center justify-center gap-2">
                <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                <span className="text-lg">Awesome! Continue Playing</span>
                <Sparkles size={20} className="group-hover:-rotate-12 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoCombatSummaryModal;

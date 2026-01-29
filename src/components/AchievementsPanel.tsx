import React, { useState } from 'react';
import { Trophy, Sword, Shield, Star, Crown, Skull, Gem, Package, Flame, Zap, Heart, Award, Target, Clock, Map, BookOpen, Users, Coins, X, Lock, Check, ChevronRight } from 'lucide-react';
import { 
  achievementsDatabase, 
  type Achievement, 
  type AchievementCategory, 
  type PlayerAchievements,
  getAchievementProgress,
  getRarityColor,
  getCategoryLabel
} from '../data/achievementSystem';

interface AchievementsPanelProps {
  playerAchievements: PlayerAchievements;
  onClose: () => void;
}

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  Trophy: <Trophy size={20} />,
  Sword: <Sword size={20} />,
  Shield: <Shield size={20} />,
  Star: <Star size={20} />,
  Crown: <Crown size={20} />,
  Skull: <Skull size={20} />,
  Gem: <Gem size={20} />,
  Package: <Package size={20} />,
  Flame: <Flame size={20} />,
  Zap: <Zap size={20} />,
  Heart: <Heart size={20} />,
  Award: <Award size={20} />,
  Target: <Target size={20} />,
  Clock: <Clock size={20} />,
  Map: <Map size={20} />,
  BookOpen: <BookOpen size={20} />,
  Users: <Users size={20} />,
  Coins: <Coins size={20} />,
};

const categories: AchievementCategory[] = ['combat', 'cultivation', 'exploration', 'crafting', 'collection', 'mastery', 'social'];

const AchievementCard: React.FC<{
  achievement: Achievement;
  progress: { current: number; target: number; percent: number };
  isUnlocked: boolean;
}> = ({ achievement, progress, isUnlocked }) => {
  const rarityClass = getRarityColor(achievement.rarity);
  
  // Hide hidden achievements that aren't unlocked
  if (achievement.hidden && !isUnlocked) {
    return (
      <div className="bg-gray-900/60 border border-gray-700/30 rounded-xl p-5 flex items-center gap-4 opacity-50">
        <div className="w-14 h-14 rounded-xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center">
          <Lock size={24} className="text-gray-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-gray-500 font-bold text-base">??? Hidden Achievement ???</h4>
          <p className="text-gray-600 text-sm mt-1">Complete secret requirements to unlock</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative overflow-hidden rounded-xl border transition-all ${
      isUnlocked 
        ? `${rarityClass} shadow-lg` 
        : 'bg-gray-900/40 border-gray-700/30 opacity-80 hover:opacity-100'
    }`}>
      {/* Unlocked glow effect */}
      {isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 pointer-events-none" />
      )}
      
      <div className="p-5 flex items-start gap-5">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUnlocked 
            ? 'bg-gradient-to-br from-amber-500/30 to-amber-700/30 border-2 border-amber-500/50' 
            : 'bg-gray-800/50 border border-gray-700/50'
        }`}>
          <span className={`${isUnlocked ? 'text-amber-400' : 'text-gray-500'} [&>svg]:w-6 [&>svg]:h-6`}>
            {iconMap[achievement.icon] || <Trophy size={24} />}
          </span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className={`font-bold text-base ${isUnlocked ? 'text-white' : 'text-gray-300'}`}>
              {achievement.name}
            </h4>
            {isUnlocked && <Check size={16} className="text-green-400" />}
            <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${rarityClass}`}>
              {achievement.rarity}
            </span>
          </div>
          
          <p className={`text-sm ${isUnlocked ? 'text-gray-300' : 'text-gray-500'}`}>
            {achievement.description}
          </p>
          
          {/* Progress Bar */}
          {!isUnlocked && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500">Progress</span>
                <span className="text-gray-400 font-medium">{progress.current.toLocaleString()} / {progress.target.toLocaleString()}</span>
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 rounded-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Rewards */}
          {achievement.rewards && (
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {achievement.rewards.exp && (
                <span className="text-xs px-3 py-1 bg-cyan-900/30 border border-cyan-600/30 rounded-lg text-cyan-400 font-medium">
                  +{achievement.rewards.exp.toLocaleString()} EXP
                </span>
              )}
              {achievement.rewards.spiritStones && (
                <span className="text-xs px-3 py-1 bg-cyan-900/30 border border-cyan-600/30 rounded-lg text-cyan-300 font-medium">
                  +{achievement.rewards.spiritStones.toLocaleString()} 💎
                </span>
              )}
              {achievement.rewards.title && (
                <span className="text-xs px-3 py-1 bg-amber-900/30 border border-amber-600/30 rounded-lg text-amber-400 font-medium flex items-center gap-1.5">
                  <Crown size={12} />
                  Title: {achievement.rewards.title}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ 
  playerAchievements, 
  onClose 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  
  // Filter achievements
  const filteredAchievements = selectedCategory === 'all' 
    ? achievementsDatabase 
    : achievementsDatabase.filter(a => a.category === selectedCategory);
  
  // Calculate stats
  const totalUnlocked = Object.values(playerAchievements.progress).filter(p => p.unlocked).length;
  const totalAchievements = achievementsDatabase.filter(a => !a.hidden).length;
  const completionPercent = Math.round((totalUnlocked / totalAchievements) * 100);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[900px] max-h-[90vh] bg-gradient-to-br from-[#1a1f2e] to-[#151820] border-2 border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/20 border-b border-amber-500/30 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-700/30 border border-amber-500/50 flex items-center justify-center">
                <Trophy size={28} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-amber-400">Achievements & Titles</h2>
                <p className="text-sm text-gray-400 mt-0.5">Chronicle of your legendary deeds</p>
              </div>
            </div>
            
            {/* Progress Overview */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{totalUnlocked}<span className="text-gray-500 text-lg">/{totalAchievements}</span></div>
                <div className="text-xs text-gray-500">{completionPercent}% Complete</div>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#374151" strokeWidth="4" />
                  <circle 
                    cx="32" cy="32" r="28" fill="none" 
                    stroke="url(#achievementGrad)" 
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${completionPercent * 1.76} 176`}
                  />
                  <defs>
                    <linearGradient id="achievementGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                  </defs>
                </svg>
                <Trophy size={20} className="absolute inset-0 m-auto text-amber-400" />
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400 hover:text-white" />
            </button>
          </div>
        </div>
        
        {/* Category Tabs - Enhanced Layout */}
        <div className="px-6 py-5 border-b border-amber-500/20 bg-gradient-to-b from-black/30 to-transparent">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`group relative px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-b from-amber-500/40 to-amber-600/30 text-amber-300 border-2 border-amber-400/60 shadow-xl shadow-amber-500/30'
                  : 'bg-gradient-to-b from-gray-700/50 to-gray-800/50 text-gray-300 border border-gray-600/50 hover:text-amber-300 hover:border-amber-500/40 hover:bg-gray-700/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <Trophy size={16} className={selectedCategory === 'all' ? 'text-amber-400' : 'text-gray-500 group-hover:text-amber-400'} />
                All ({achievementsDatabase.length})
              </span>
              {selectedCategory === 'all' && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-amber-400 rounded-full" />
              )}
            </button>
            {categories.map(cat => {
              const count = achievementsDatabase.filter(a => a.category === cat).length;
              const unlocked = achievementsDatabase.filter(a => 
                a.category === cat && playerAchievements.progress[a.id]?.unlocked
              ).length;
              const catIcons: Record<AchievementCategory, React.ReactNode> = {
                combat: <Sword size={16} />,
                cultivation: <Flame size={16} />,
                exploration: <Map size={16} />,
                crafting: <Package size={16} />,
                collection: <Gem size={16} />,
                mastery: <Crown size={16} />,
                social: <Users size={16} />
              };
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`group relative px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-b from-amber-500/40 to-amber-600/30 text-amber-300 border-2 border-amber-400/60 shadow-xl shadow-amber-500/30'
                      : 'bg-gradient-to-b from-gray-700/50 to-gray-800/50 text-gray-300 border border-gray-600/50 hover:text-amber-300 hover:border-amber-500/40 hover:bg-gray-700/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={selectedCategory === cat ? 'text-amber-400' : 'text-gray-500 group-hover:text-amber-400'}>
                      {catIcons[cat]}
                    </span>
                    {getCategoryLabel(cat)} ({unlocked}/{count})
                  </span>
                  {selectedCategory === cat && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-amber-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Achievements List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredAchievements.map(achievement => {
            const progress = getAchievementProgress(achievement, playerAchievements);
            const isUnlocked = playerAchievements.progress[achievement.id]?.unlocked || false;
            
            return (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                progress={progress}
                isUnlocked={isUnlocked}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Mini achievement notification popup
export const AchievementUnlockPopup: React.FC<{
  achievement: Achievement;
  onClose: () => void;
}> = ({ achievement, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-down">
      <div className={`flex items-center gap-4 px-6 py-4 rounded-xl border-2 shadow-2xl backdrop-blur-sm
        bg-gradient-to-r from-amber-900/90 to-orange-900/80 border-amber-500/60`}
      >
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-500/40 to-amber-700/40 border border-amber-400 flex items-center justify-center">
          <Trophy size={28} className="text-amber-300" />
        </div>
        <div>
          <div className="text-amber-300 text-xs uppercase tracking-widest font-bold mb-0.5">
            Achievement Unlocked!
          </div>
          <div className="text-white font-bold text-lg">{achievement.name}</div>
          <div className="text-amber-200/70 text-xs mt-0.5">{achievement.description}</div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors ml-2">
          <X size={16} className="text-amber-200" />
        </button>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { 
  Sparkles, Gift, Trophy, Calendar, Star, 
  ChevronRight, Clock, CheckCircle2, Lock,
  Flame, Zap, Sword, Target, Scroll, Crown,
  Moon, Coins, Gem, Hammer, CircleDot, Skull,
  ShieldCheck, Award
} from 'lucide-react';
import { SpiritStoneIcon } from '../ItemIcon';
import {
  DAILY_REWARDS,
  CULTIVATION_MILESTONES,
  getDailyReward,
  getMilestoneProgress,
  type CultivationProgress,
  type CultivationMilestone,
  type DailyReward,
} from '../../data/cultivationSystem';
import { cultivationIcons } from '../../utils/iconSystem';

// ============================================
// ICON MAPPING - Wuxia-themed icons using Lucide
// ============================================

const MILESTONE_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  milestone_level: ({ size, className }) => <Flame size={size} className={className || 'text-orange-400'} />,
  milestone_dragon: ({ size, className }) => <Zap size={size} className={className || 'text-purple-400'} />,
  milestone_golden_core: ({ size, className }) => <Star size={size} className={className || 'text-yellow-400'} />,
  milestone_combat: ({ size, className }) => <Sword size={size} className={className || 'text-red-400'} />,
  milestone_sword: ({ size, className }) => <Sword size={size} className={className || 'text-cyan-400'} />,
  milestone_slayer: ({ size, className }) => <Skull size={size} className={className || 'text-rose-400'} />,
  milestone_scroll: ({ size, className }) => <Scroll size={size} className={className || 'text-amber-400'} />,
  milestone_quest: ({ size, className }) => <Target size={size} className={className || 'text-emerald-400'} />,
  milestone_legend: ({ size, className }) => <Crown size={size} className={className || 'text-yellow-400'} />,
  milestone_calendar: ({ size, className }) => <Calendar size={size} className={className || 'text-blue-400'} />,
  milestone_moon: ({ size, className }) => <Moon size={size} className={className || 'text-indigo-400'} />,
  milestone_coins: ({ size, className }) => <Coins size={size} className={className || 'text-yellow-400'} />,
  milestone_gem: ({ size, className }) => <Gem size={size} className={className || 'text-cyan-400'} />,
  milestone_hammer: ({ size, className }) => <Hammer size={size} className={className || 'text-orange-400'} />,
  milestone_anvil: ({ size, className }) => <ShieldCheck size={size} className={className || 'text-slate-400'} />,
};

const MilestoneIcon: React.FC<{ iconKey: string; size?: number; className?: string }> = ({ 
  iconKey, 
  size = 24, 
  className 
}) => {
  const IconComponent = MILESTONE_ICONS[iconKey];
  if (IconComponent) {
    return <IconComponent size={size} className={className} />;
  }
  // Fallback
  return <Award size={size} className={className || 'text-gray-400'} />;
};

// Player type stub - will be replaced with proper import
interface PlayerStats {
  level: number;
  totalKills?: number;
  questsCompleted?: number;
  totalStonesEarned?: number;
  totalCrafts?: number;
}

interface CultivationPageProps {
  player: PlayerStats;
  cultivationProgress: CultivationProgress;
  onClaimDaily: (day: number) => void;
  onClaimMilestone: (milestoneId: string) => void;
}

type TabType = 'daily' | 'milestones';

// ============================================
// DAILY REWARD CARD
// ============================================

const DailyRewardCard: React.FC<{
  reward: DailyReward;
  currentDay: number;
  isClaimed: boolean;
  onClaim: () => void;
}> = ({ reward, currentDay, isClaimed, onClaim }) => {
  const isAvailable = currentDay === reward.day && !isClaimed;
  const isPast = reward.day < currentDay || isClaimed;
  const isFuture = reward.day > currentDay && !isClaimed;
  
  let borderColor = 'border-gray-600/30';
  let bgColor = 'bg-black/40';
  let glowClass = '';
  
  if (reward.isMilestone) {
    borderColor = isPast ? 'border-yellow-600/50' : 'border-yellow-500/30';
    bgColor = 'bg-gradient-to-br from-yellow-900/20 to-amber-900/20';
    if (isAvailable) glowClass = 'ring-2 ring-yellow-400/50 animate-pulse';
  } else if (isAvailable) {
    borderColor = 'border-cyan-400/60';
    bgColor = 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30';
    glowClass = 'ring-2 ring-cyan-400/50';
  } else if (isPast) {
    borderColor = 'border-green-600/40';
    bgColor = 'bg-green-900/20';
  }
  
  return (
    <div
      className={`
        relative rounded-xl border-2 ${borderColor} ${bgColor} ${glowClass}
        p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg
        ${isAvailable ? 'cursor-pointer hover:border-cyan-300' : ''}
        ${isFuture ? 'opacity-60' : ''}
      `}
      onClick={isAvailable ? onClaim : undefined}
    >
      {/* Day Badge */}
      <div className={`
        absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center
        text-sm font-bold border-2
        ${reward.isMilestone 
          ? 'bg-yellow-600 border-yellow-400 text-white' 
          : isPast 
            ? 'bg-green-600 border-green-400 text-white'
            : 'bg-gray-700 border-gray-500 text-gray-300'
        }
      `}>
        {reward.day}
      </div>
      
      {/* Status Icon */}
      <div className="absolute -top-2 -right-2">
        {isClaimed && (
          <CheckCircle2 className="text-green-400" size={24} />
        )}
        {isFuture && (
          <Lock className="text-gray-500" size={20} />
        )}
        {isAvailable && (
          <Gift className="text-cyan-400 animate-bounce" size={24} />
        )}
      </div>
      
      {/* Milestone Star */}
      {reward.isMilestone && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10">
          <Star size={80} className="text-yellow-400" />
        </div>
      )}
      
      {/* Rewards */}
      <div className="mt-4 space-y-1 text-center relative z-10">
        {reward.rewards.spiritStones && (
          <div className={`text-lg font-bold flex items-center justify-center gap-1 ${reward.isMilestone ? 'text-yellow-300' : 'text-cyan-300'}`}>
            <SpiritStoneIcon size="sm" /> {reward.rewards.spiritStones}
          </div>
        )}
        {reward.rewards.exp && (
          <div className="text-sm text-purple-300 flex items-center justify-center gap-1">
            <Sparkles size={14} /> {reward.rewards.exp} EXP
          </div>
        )}
        {reward.rewards.items && reward.rewards.items.length > 0 && (
          <div className="text-xs text-green-300 flex items-center justify-center gap-1">
            <Gift size={12} /> +{reward.rewards.items.reduce((acc, i) => acc + i.quantity, 0)} items
          </div>
        )}
        {reward.rewards.title && (
          <div className="text-xs text-amber-300 italic mt-1 flex items-center justify-center gap-1">
            <Award size={12} /> "{reward.rewards.title}"
          </div>
        )}
      </div>
      
      {/* Claim Button */}
      {isAvailable && (
        <div className="mt-3 text-center">
          <span className="text-xs bg-cyan-600 text-white px-3 py-1 rounded-full font-bold">
            CLAIM!
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// MILESTONE CARD
// ============================================

const MilestoneCard: React.FC<{
  milestone: CultivationMilestone;
  progress: { current: number; target: number; percent: number };
  isClaimed: boolean;
  onClaim: () => void;
}> = ({ milestone, progress, isClaimed, onClaim }) => {
  const isComplete = progress.current >= progress.target;
  const canClaim = isComplete && !isClaimed;
  
  return (
    <div
      className={`
        relative rounded-xl border-2 p-4 transition-all duration-300
        ${isClaimed 
          ? 'border-green-600/40 bg-green-900/20 opacity-75' 
          : canClaim
            ? 'border-cyan-400/60 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 ring-2 ring-cyan-400/50 cursor-pointer hover:scale-102'
            : 'border-gray-600/30 bg-black/40'
        }
      `}
      onClick={canClaim ? onClaim : undefined}
    >
      {/* Icon & Title */}
      <div className="flex items-start gap-3">
        <div className={`
          w-12 h-12 flex items-center justify-center rounded-lg
          ${isClaimed ? 'bg-green-800/40' : 'bg-gray-800/60'}
        `}>
          <MilestoneIcon iconKey={milestone.icon} size={28} />
        </div>
        
        <div className="flex-1">
          <h4 className={`font-bold ${isClaimed ? 'text-green-300' : 'text-gray-100'}`}>
            {milestone.name}
          </h4>
          <p className="text-xs text-amber-400/70 font-serif italic">
            {milestone.nameZh}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {milestone.description}
          </p>
        </div>
        
        {/* Status */}
        {isClaimed && (
          <CheckCircle2 className="text-green-400 flex-shrink-0" size={24} />
        )}
      </div>
      
      {/* Progress Bar */}
      {!isClaimed && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Progress</span>
            <span className={progress.percent >= 100 ? 'text-cyan-300' : 'text-gray-400'}>
              {progress.current} / {progress.target}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                progress.percent >= 100 
                  ? 'bg-gradient-to-r from-cyan-500 to-green-500' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-500'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Rewards Preview */}
      <div className="mt-3 flex flex-wrap gap-2">
        {milestone.rewards.spiritStones && (
          <span className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded flex items-center gap-1">
            <SpiritStoneIcon size="xs" /> {milestone.rewards.spiritStones}
          </span>
        )}
        {milestone.rewards.exp && (
          <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
            <Sparkles size={12} /> {milestone.rewards.exp} EXP
          </span>
        )}
        {milestone.rewards.ap && (
          <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded flex items-center gap-1">
            <Zap size={12} /> +{milestone.rewards.ap} AP
          </span>
        )}
        {milestone.rewards.title && (
          <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
            <Award size={12} /> Title
          </span>
        )}
      </div>
      
      {/* Claim Button */}
      {canClaim && (
        <div className="mt-3 text-center">
          <span className="bg-gradient-to-r from-cyan-600 to-green-600 text-white px-4 py-1.5 rounded-full font-bold text-sm flex items-center justify-center gap-1">
            <Sparkles size={14} /> Claim Reward
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN PAGE
// ============================================

export const CultivationPage: React.FC<CultivationPageProps> = ({
  player,
  cultivationProgress,
  onClaimDaily,
  onClaimMilestone,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  
  const playerStats = useMemo(() => ({
    level: player.level || 1,
    totalKills: player.totalKills || 0,
    questsCompleted: player.questsCompleted || 0,
    totalStonesEarned: player.totalStonesEarned || 0,
    totalCrafts: player.totalCrafts || 0,
    consecutiveLogins: cultivationProgress.consecutiveLogins || 0,
  }), [player, cultivationProgress]);
  
  const currentDay = cultivationProgress.consecutiveLogins || 1;
  
  // Group milestones by type
  const milestonesByType = useMemo(() => {
    const groups: Record<string, CultivationMilestone[]> = {
      level: [],
      kills: [],
      quests: [],
      days_logged: [],
      spirit_stones: [],
      crafts: [],
    };
    
    CULTIVATION_MILESTONES.forEach(m => {
      groups[m.requirement.type]?.push(m);
    });
    
    return groups;
  }, []);
  
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/40 via-cyan-900/40 to-purple-900/40 border-2 border-purple-500/30 rounded-xl p-6 wuxia-glow wuxia-corners">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <img 
                  src={cultivationIcons.meditation} 
                  alt=""
                  className="w-full h-full object-contain drop-shadow-lg"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 font-serif wuxia-title">
                  Cultivation Path
                </h2>
                <p className="text-sm text-gray-400">Daily rewards & achievements</p>
              </div>
            </div>
            
            {/* Streak Counter */}
            <div className="flex items-center gap-4">
              <div className="text-center bg-black/40 rounded-lg px-4 py-2 border border-orange-500/30">
                <div className="text-2xl font-bold text-orange-400">
                  {cultivationProgress.consecutiveLogins || 0}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Flame size={12} className="text-orange-400" />
                  Day Streak
                </div>
              </div>
              <div className="text-center bg-black/40 rounded-lg px-4 py-2 border border-purple-500/30">
                <div className="text-2xl font-bold text-purple-400">
                  {cultivationProgress.totalLogins || 0}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar size={12} className="text-purple-400" />
                  Total Days
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('daily')}
            className={`
              flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300
              flex items-center justify-center gap-2
              ${activeTab === 'daily'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-300'
              }
            `}
          >
            <Gift size={20} />
            Daily Rewards
            {currentDay <= 28 && !cultivationProgress.claimedDailyRewards.includes(currentDay) && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">1</span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('milestones')}
            className={`
              flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300
              flex items-center justify-center gap-2
              ${activeTab === 'milestones'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-300'
              }
            `}
          >
            <Trophy size={20} />
            Milestones
          </button>
        </div>
        
        {/* Daily Rewards Tab */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            {/* Week Headers */}
            {[1, 2, 3, 4].map(week => (
              <div key={week} className="bg-black/40 border border-gray-600/30 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-cyan-400" />
                  Week {week}
                  {week === Math.ceil(currentDay / 7) && currentDay <= 28 && (
                    <span className="text-xs bg-cyan-600/40 text-cyan-300 px-2 py-0.5 rounded-full ml-2">
                      Current
                    </span>
                  )}
                </h3>
                
                <div className="grid grid-cols-7 gap-3">
                  {DAILY_REWARDS.slice((week - 1) * 7, week * 7).map(reward => (
                    <DailyRewardCard
                      key={reward.day}
                      reward={reward}
                      currentDay={currentDay}
                      isClaimed={cultivationProgress.claimedDailyRewards.includes(reward.day)}
                      onClaim={() => onClaimDaily(reward.day)}
                    />
                  ))}
                </div>
              </div>
            ))}
            
            {/* Cycle Complete Message */}
            {currentDay > 28 && (
              <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-2 border-yellow-500/30 rounded-xl p-6 text-center">
                <Star className="mx-auto text-yellow-400 mb-3" size={48} />
                <h3 className="text-xl font-bold text-yellow-300 mb-2">
                  Cultivation Cycle Complete!
                </h3>
                <p className="text-gray-400">
                  You have completed the 28-day cycle. Continue logging in for milestones!
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            {/* Level Milestones */}
            <div className="bg-black/40 border border-gray-600/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" />
                Level Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {milestonesByType.level.map(m => (
                  <MilestoneCard
                    key={m.id}
                    milestone={m}
                    progress={getMilestoneProgress(m, playerStats)}
                    isClaimed={cultivationProgress.claimedMilestones.includes(m.id)}
                    onClaim={() => onClaimMilestone(m.id)}
                  />
                ))}
              </div>
            </div>
            
            {/* Combat Milestones */}
            <div className="bg-black/40 border border-gray-600/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
                <Sword size={18} className="text-red-400" />
                Combat Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {milestonesByType.kills.map(m => (
                  <MilestoneCard
                    key={m.id}
                    milestone={m}
                    progress={getMilestoneProgress(m, playerStats)}
                    isClaimed={cultivationProgress.claimedMilestones.includes(m.id)}
                    onClaim={() => onClaimMilestone(m.id)}
                  />
                ))}
              </div>
            </div>
            
            {/* Quest Milestones */}
            <div className="bg-black/40 border border-gray-600/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
                <Scroll size={18} className="text-amber-400" />
                Quest Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {milestonesByType.quests.map(m => (
                  <MilestoneCard
                    key={m.id}
                    milestone={m}
                    progress={getMilestoneProgress(m, playerStats)}
                    isClaimed={cultivationProgress.claimedMilestones.includes(m.id)}
                    onClaim={() => onClaimMilestone(m.id)}
                  />
                ))}
              </div>
            </div>
            
            {/* Login & Dedication Milestones */}
            <div className="bg-black/40 border border-gray-600/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-purple-400" />
                Dedication Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {milestonesByType.days_logged.map(m => (
                  <MilestoneCard
                    key={m.id}
                    milestone={m}
                    progress={getMilestoneProgress(m, playerStats)}
                    isClaimed={cultivationProgress.claimedMilestones.includes(m.id)}
                    onClaim={() => onClaimMilestone(m.id)}
                  />
                ))}
              </div>
            </div>
            
            {/* Wealth & Crafting */}
            <div className="bg-black/40 border border-gray-600/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
                <SpiritStoneIcon size="md" />
                Wealth & Crafting
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...milestonesByType.spirit_stones, ...milestonesByType.crafts].map(m => (
                  <MilestoneCard
                    key={m.id}
                    milestone={m}
                    progress={getMilestoneProgress(m, playerStats)}
                    isClaimed={cultivationProgress.claimedMilestones.includes(m.id)}
                    onClaim={() => onClaimMilestone(m.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CultivationPage;

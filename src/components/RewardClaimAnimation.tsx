import React, { useState, useEffect } from 'react';
import { Sparkles, Gem, Star, Coins, Zap, Gift, Package } from 'lucide-react';
import { ResourceIcon } from './ui/GameIcon';

interface RewardItem {
  type: 'exp' | 'stones' | 'item' | 'gold' | 'reputation';
  amount?: number;
  name?: string;
  rarity?: string;
}

interface RewardClaimAnimationProps {
  rewards: RewardItem[];
  onComplete: () => void;
  position?: { x: number; y: number } | 'center';
}

// Individual floating reward particle
const FloatingParticle: React.FC<{
  reward: RewardItem;
  delay: number;
  index: number;
}> = ({ reward, delay, index }) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (!visible) return null;
  
  const getIcon = () => {
    switch (reward.type) {
      case 'exp': return <ResourceIcon type="exp" size={20} />;
      case 'stones': return <ResourceIcon type="spiritStone" size={20} />;
      case 'gold': return <Coins className="text-yellow-400" size={20} />;
      case 'item': return <Package className="text-purple-400" size={20} />;
      case 'reputation': return <Star className="text-amber-400" size={20} />;
      default: return <Gift className="text-pink-400" size={20} />;
    }
  };
  
  const getColor = () => {
    switch (reward.type) {
      case 'exp': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/50';
      case 'stones': return 'text-cyan-300 bg-cyan-500/20 border-cyan-500/50';
      case 'gold': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'item': return 'text-purple-400 bg-purple-500/20 border-purple-500/50';
      case 'reputation': return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
      default: return 'text-pink-400 bg-pink-500/20 border-pink-500/50';
    }
  };
  
  const getRarityGlow = () => {
    if (reward.type !== 'item') return '';
    switch (reward.rarity?.toLowerCase()) {
      case 'legendary': return 'shadow-lg shadow-orange-500/50 border-orange-400';
      case 'epic': return 'shadow-lg shadow-purple-500/50 border-purple-400';
      case 'rare': return 'shadow-lg shadow-blue-500/50 border-blue-400';
      case 'uncommon': return 'shadow-lg shadow-green-500/50 border-green-400';
      default: return '';
    }
  };
  
  const getText = () => {
    if (reward.type === 'exp') return `+${reward.amount} EXP`;
    if (reward.type === 'stones') return `+${reward.amount} Spirit Stones`;
    if (reward.type === 'gold') return `+${reward.amount} Gold`;
    if (reward.type === 'reputation') return `+${reward.amount} Reputation`;
    if (reward.type === 'item') return reward.name || 'Item';
    return '';
  };
  
  // Random horizontal offset for variety
  const xOffset = (index % 5) * 20 - 40; // -40 to 40px
  
  return (
    <div
      className={`absolute flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm
        animate-reward-float ${getColor()} ${getRarityGlow()}`}
      style={{
        left: `calc(50% + ${xOffset}px)`,
        bottom: '30%',
        transform: 'translateX(-50%)',
        animationDelay: `${delay}ms`,
        zIndex: 100 - index,
      }}
    >
      <div className="animate-bounce-subtle">{getIcon()}</div>
      <span className="font-bold text-sm whitespace-nowrap drop-shadow-lg">{getText()}</span>
      
      {/* Sparkle particles around the reward */}
      {[...Array(3)].map((_, i) => (
        <Sparkles
          key={i}
          size={10}
          className="absolute text-white/60 animate-ping"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${i * 200}ms`,
          }}
        />
      ))}
    </div>
  );
};

// Main component that orchestrates the animation
export const RewardClaimAnimation: React.FC<RewardClaimAnimationProps> = ({ 
  rewards, 
  onComplete,
  position = 'center' 
}) => {
  const [isActive, setIsActive] = useState(true);
  
  useEffect(() => {
    // Auto-close after all animations complete
    const duration = 300 + rewards.length * 200 + 1500; // base + stagger + display time
    const timer = setTimeout(() => {
      setIsActive(false);
      onComplete();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [rewards.length, onComplete]);
  
  if (!isActive || rewards.length === 0) return null;
  
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {/* Background flash effect */}
      <div className="absolute inset-0 bg-gradient-radial from-amber-500/10 to-transparent animate-pulse-once" />
      
      {/* Central glow burst */}
      <div className="absolute w-64 h-64 rounded-full bg-gradient-radial from-amber-500/30 via-amber-500/10 to-transparent animate-scale-burst" />
      
      {/* Floating rewards */}
      {rewards.map((reward, i) => (
        <FloatingParticle 
          key={`${reward.type}-${i}`}
          reward={reward}
          delay={i * 200}
          index={i}
        />
      ))}
      
      {/* "Quest Complete" or "Reward Claimed" text */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <h2 className="text-3xl font-serif font-bold text-amber-400 drop-shadow-[0_0_20px_rgba(255,200,100,0.8)] animate-title-appear">
          <Sparkles className="inline-block mr-2 animate-spin-slow" size={28} />
          Rewards Claimed!
          <Sparkles className="inline-block ml-2 animate-spin-slow" size={28} />
        </h2>
      </div>
      
      {/* Bottom particles shooting up */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-particle-rise"
            style={{
              left: `${5 + (i * 6.5)}%`,
              bottom: '-10px',
              animationDelay: `${i * 80}ms`,
              backgroundColor: ['#fbbf24', '#60a5fa', '#a78bfa', '#34d399'][i % 4],
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Hook to trigger reward animations
export const useRewardAnimation = () => {
  const [animationState, setAnimationState] = useState<{
    isPlaying: boolean;
    rewards: RewardItem[];
  }>({ isPlaying: false, rewards: [] });
  
  const playRewardAnimation = (rewards: RewardItem[]) => {
    if (rewards.length === 0) return;
    setAnimationState({ isPlaying: true, rewards });
  };
  
  const handleComplete = () => {
    setAnimationState({ isPlaying: false, rewards: [] });
  };
  
  const RewardAnimationComponent = animationState.isPlaying ? (
    <RewardClaimAnimation 
      rewards={animationState.rewards} 
      onComplete={handleComplete}
    />
  ) : null;
  
  return { playRewardAnimation, RewardAnimationComponent };
};

// CSS animations to add to index.css or App.css
// Add these to your global CSS:
/*
@keyframes reward-float {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(50px) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1.1);
  }
  40% {
    transform: translateX(-50%) translateY(-10px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-80px) scale(0.8);
  }
}

@keyframes scale-burst {
  0% {
    transform: scale(0);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.4;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes title-appear {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-50%) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) translateY(-50%) scale(1.1);
  }
  100% {
    transform: translateX(-50%) translateY(-50%) scale(1);
  }
}

@keyframes particle-rise {
  0% {
    opacity: 0;
    transform: translateY(0) scale(1);
  }
  10% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-200px) scale(0.5);
  }
}

@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes pulse-once {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.animate-reward-float {
  animation: reward-float 2s ease-out forwards;
}

.animate-scale-burst {
  animation: scale-burst 1s ease-out forwards;
}

.animate-title-appear {
  animation: title-appear 0.5s ease-out forwards;
}

.animate-particle-rise {
  animation: particle-rise 1.5s ease-out forwards;
}

.animate-bounce-subtle {
  animation: bounce-subtle 0.6s ease-in-out infinite;
}

.animate-pulse-once {
  animation: pulse-once 1s ease-out forwards;
}

.animate-spin-slow {
  animation: spin 3s linear infinite;
}
*/

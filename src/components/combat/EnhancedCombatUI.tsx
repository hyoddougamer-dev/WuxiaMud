// ============================================
// ENHANCED COMBAT UI COMPONENTS - 凌云道
// Improved visual components for combat experience
// ============================================

import React, { useRef, useEffect, useState } from 'react';
import { 
  Sword, Shield, Wind, Flame, Snowflake, Skull, 
  TreePine, ChevronRight, Sparkles, X, RotateCcw, Scroll, Star, Link, HeartCrack, Leaf, Gem, CornerUpLeft, XCircle
} from 'lucide-react';
import { uiFrameIcons } from '../../utils/iconSystem';
import { ELEMENT_ICON_PATHS } from '../../data/elementSystem';
import { ResourceIcon, ActionIcon } from '../ui/GameIcon';

// ============================================
// TYPES
// ============================================

export interface CombatLogEntry {
  id: number;
  text: string;
  type: 'damage' | 'heal' | 'critical' | 'miss' | 'block' | 'dodge' | 'skill' | 'system' | 'effect' | 'passive' | 'combo' | 'element';
  element?: string;
  timestamp: Date;
  actor?: 'player' | 'enemy';
}

export interface SkillButtonProps {
  skillId: string;
  skillName: string;
  skillIcon: string;
  element: string;
  qiCost: number;
  cooldown: number;
  currentCooldown: number;
  isDisabled: boolean;
  onUse: () => void;
  hotkey: string;
}

export interface DefenseButtonProps {
  type: 'block' | 'dodge' | 'counter';
  cooldown: number;
  currentCooldown: number;
  isActive: boolean;
  onUse: () => void;
}

// ============================================
// ELEMENT STYLING
// ============================================

const ELEMENT_CONFIG = {
  Fire: { 
    color: '#FF6B35', 
    bgColor: 'rgba(255, 107, 53, 0.2)',
    borderColor: 'border-orange-500',
    icon: <img src={ELEMENT_ICON_PATHS.Fire} alt="Fire" className="w-3 h-3" />,
    glow: 'shadow-orange-500/50'
  },
  Ice: { 
    color: '#00D4FF', 
    bgColor: 'rgba(0, 212, 255, 0.2)',
    borderColor: 'border-cyan-500',
    icon: <img src={ELEMENT_ICON_PATHS.Ice} alt="Ice" className="w-3 h-3" />,
    glow: 'shadow-cyan-500/50'
  },
  Lightning: { 
    color: '#FFD700', 
    bgColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: 'border-yellow-500',
    icon: <img src={ELEMENT_ICON_PATHS.Lightning} alt="Lightning" className="w-3 h-3" />,
    glow: 'shadow-yellow-500/50'
  },
  Wood: { 
    color: '#4ADE80', 
    bgColor: 'rgba(74, 222, 128, 0.2)',
    borderColor: 'border-green-500',
    icon: <img src={ELEMENT_ICON_PATHS.Wood} alt="Wood" className="w-3 h-3" />,
    glow: 'shadow-green-500/50'
  },
  Void: { 
    color: '#A855F7', 
    bgColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: 'border-purple-500',
    icon: <img src={ELEMENT_ICON_PATHS.Void} alt="Void" className="w-3 h-3" />,
    glow: 'shadow-purple-500/50'
  },
  None: { 
    color: '#9CA3AF', 
    bgColor: 'rgba(156, 163, 175, 0.2)',
    borderColor: 'border-gray-500',
    icon: <Sword size={12} className="text-gray-400" />,
    glow: 'shadow-gray-500/50'
  },
};

// ============================================
// ENHANCED COMBAT LOG
// ============================================

interface EnhancedCombatLogProps {
  entries: CombatLogEntry[];
  maxEntries?: number;
  isPaused?: boolean;
  onPauseToggle?: () => void;
}

export const EnhancedCombatLog: React.FC<EnhancedCombatLogProps> = ({
  entries,
  maxEntries = 50,
  isPaused = false,
  onPauseToggle,
}) => {
  const logRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll when new entries come in (unless hovered/paused)
  useEffect(() => {
    if (logRef.current && !isHovered && !isPaused) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries, isHovered, isPaused]);

  const getEntryStyle = (entry: CombatLogEntry) => {
    const baseStyle = 'px-3 py-1.5 border-l-3 text-sm leading-relaxed';
    
    switch (entry.type) {
      case 'damage':
        return `${baseStyle} border-l-red-500 text-red-200 bg-red-950/30`;
      case 'heal':
        return `${baseStyle} border-l-green-500 text-green-200 bg-green-950/30`;
      case 'critical':
        return `${baseStyle} border-l-yellow-500 text-yellow-200 bg-yellow-950/30 font-bold`;
      case 'miss':
        return `${baseStyle} border-l-gray-500 text-gray-400 bg-gray-950/30 italic`;
      case 'block':
        return `${baseStyle} border-l-blue-500 text-blue-200 bg-blue-950/30`;
      case 'dodge':
        return `${baseStyle} border-l-cyan-500 text-cyan-200 bg-cyan-950/30`;
      case 'skill':
        return `${baseStyle} border-l-purple-500 text-purple-200 bg-purple-950/30`;
      case 'passive':
        return `${baseStyle} border-l-amber-500 text-amber-200 bg-amber-950/30`;
      case 'combo':
        return `${baseStyle} border-l-pink-500 text-pink-200 bg-pink-950/30 font-bold`;
      case 'element':
        const elemConfig = ELEMENT_CONFIG[entry.element as keyof typeof ELEMENT_CONFIG] || ELEMENT_CONFIG.None;
        return `${baseStyle} ${elemConfig.borderColor} bg-opacity-30`;
      case 'system':
      default:
        return `${baseStyle} border-l-slate-500 text-slate-300 bg-slate-950/30`;
    }
  };

  const getEntryIcon = (entry: CombatLogEntry): React.ReactNode => {
    switch (entry.type) {
      case 'damage': return entry.actor === 'player' 
        ? <Sword size={12} className="text-red-400" /> 
        : <HeartCrack size={12} className="text-red-400" />;
      case 'heal': return <ResourceIcon type="hp" size={12} />;
      case 'critical': return <Sparkles size={12} className="text-yellow-400" />;
      case 'miss': return <Wind size={12} className="text-gray-400" />;
      case 'block': return <Shield size={12} className="text-blue-400" />;
      case 'dodge': return <Wind size={12} className="text-cyan-400" />;
      case 'skill': return <Sparkles size={12} className="text-purple-400" />;
      case 'passive': return <Star size={12} className="text-amber-400" />;
      case 'combo': return <Link size={12} className="text-pink-400" />;
      case 'element': return ELEMENT_CONFIG[entry.element as keyof typeof ELEMENT_CONFIG]?.icon || <Sword size={12} className="text-gray-400" />;
      case 'system': return <Scroll size={12} className="text-slate-400" />;
      default: return <span className="text-slate-400">•</span>;
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-slate-950/80 rounded-lg border border-slate-700/50 overflow-hidden backdrop-blur-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Sword size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Combat Log</span>
        </div>
        {onPauseToggle && (
          <button
            onClick={onPauseToggle}
            className={`p-1 rounded transition-colors ${isPaused ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-slate-700'}`}
            title={isPaused ? 'Resume scrolling' : 'Pause scrolling'}
          >
            {isPaused ? <RotateCcw size={12} /> : <X size={12} />}
          </button>
        )}
      </div>

      {/* Log entries */}
      <div 
        ref={logRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        <div className="space-y-0.5 p-1">
          {entries.slice(-maxEntries).map((entry, index) => (
            <div
              key={entry.id || index}
              className={`${getEntryStyle(entry)} rounded-r-md transition-all duration-300 hover:bg-opacity-50`}
              style={{
                animation: index === entries.length - 1 ? 'slideIn 0.3s ease-out' : undefined,
              }}
            >
              <span className="mr-2 opacity-80">{getEntryIcon(entry)}</span>
              <span>{entry.text}</span>
              <span className="float-right text-xs opacity-40 ml-2">
                {entry.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      {(isHovered || isPaused) && (
        <div className="px-3 py-1 bg-slate-800/50 border-t border-slate-700/30 text-xs text-slate-500 flex items-center gap-1">
          {isPaused ? <><RotateCcw size={12} /> Paused</> : <><ChevronRight size={12} /> Viewing - scroll resumed on mouse leave</>}
        </div>
      )}
    </div>
  );
};

// ============================================
// ENHANCED SKILL BUTTON
// ============================================

export const EnhancedSkillButton: React.FC<SkillButtonProps> = ({
  skillId,
  skillName,
  skillIcon,
  element,
  qiCost,
  cooldown,
  currentCooldown,
  isDisabled,
  onUse,
  hotkey,
}) => {
  const elemConfig = ELEMENT_CONFIG[element as keyof typeof ELEMENT_CONFIG] || ELEMENT_CONFIG.None;
  const isOnCooldown = currentCooldown > 0;
  const canUse = !isDisabled && !isOnCooldown;

  return (
    <button
      onClick={onUse}
      disabled={!canUse}
      className={`
        relative w-16 h-16 sm:w-20 sm:h-20
        transition-all duration-200
        ${canUse 
          ? `hover:scale-110 shadow-lg active:scale-95` 
          : 'opacity-50 cursor-not-allowed'
        }
        overflow-hidden group
      `}
      style={{
        backgroundImage: `url(${uiFrameIcons.skillButton})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
      title={`${skillName} (${hotkey})\nQI Cost: ${qiCost}\nCooldown: ${cooldown}s`}
    >
      {/* Background glow effect */}
      {canUse && (
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity"
          style={{ background: `radial-gradient(circle, ${elemConfig.color} 0%, transparent 70%)` }}
        />
      )}

      {/* Skill icon */}
      <div className="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl">
        {skillIcon}
      </div>

      {/* Cooldown overlay */}
      {isOnCooldown && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <span className="text-2xl font-bold text-white drop-shadow-lg">
            {Math.ceil(currentCooldown)}
          </span>
        </div>
      )}

      {/* QI cost badge */}
      <div className="absolute bottom-1 left-1 right-1 flex justify-between items-end">
        <span className="text-xs font-bold text-cyan-400 bg-black/60 px-1 rounded flex items-center gap-0.5">
          {qiCost}<Gem size={10} />
        </span>
        <span className="text-xs font-bold text-slate-400 bg-black/60 px-1 rounded">
          {hotkey}
        </span>
      </div>

      {/* Element indicator */}
      <div 
        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-sm"
        style={{ background: elemConfig.bgColor, border: `1px solid ${elemConfig.color}` }}
      >
        {elemConfig.icon}
      </div>
    </button>
  );
};

// ============================================
// DEFENSE BUTTON
// ============================================

export const DefenseButton: React.FC<DefenseButtonProps> = ({
  type,
  cooldown,
  currentCooldown,
  isActive,
  onUse,
}) => {
  const isOnCooldown = currentCooldown > 0;
  const canUse = !isOnCooldown;

  const config: Record<string, { icon: React.ReactNode; color: string; label: string; hotkey: string }> = {
    block: { icon: <ActionIcon action="block" size={20} />, color: 'blue', label: 'Block', hotkey: 'Q' },
    dodge: { icon: <ActionIcon action="dodge" size={20} />, color: 'cyan', label: 'Dodge', hotkey: 'E' },
    counter: { icon: <ActionIcon action="counter" size={20} />, color: 'purple', label: 'Counter', hotkey: 'R' },
  };

  const { icon, color, label, hotkey } = config[type];

  return (
    <button
      onClick={onUse}
      disabled={!canUse}
      className={`
        relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl
        border-2 transition-all duration-200
        ${canUse 
          ? `border-${color}-500 hover:scale-105 hover:shadow-lg hover:shadow-${color}-500/30 active:scale-95` 
          : 'border-slate-700 opacity-50 cursor-not-allowed'
        }
        ${isActive ? `bg-${color}-500/30` : 'bg-gradient-to-br from-slate-800 to-slate-900'}
        overflow-hidden group
      `}
      title={`${label} (${hotkey})\nCooldown: ${cooldown}s`}
    >
      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl">
        {icon}
      </div>

      {/* Cooldown overlay */}
      {isOnCooldown && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <span className="text-xl font-bold text-white">
            {Math.ceil(currentCooldown)}
          </span>
        </div>
      )}

      {/* Hotkey */}
      <div className="absolute bottom-0.5 right-0.5 text-xs font-bold text-slate-400 bg-black/60 px-1 rounded">
        {hotkey}
      </div>

      {/* Active glow */}
      {isActive && (
        <div className={`absolute inset-0 animate-pulse bg-${color}-500/20 rounded-xl`} />
      )}
    </button>
  );
};

// ============================================
// HP/QI BAR COMPONENT
// ============================================

interface VitalBarEnhancedProps {
  current: number;
  max: number;
  type: 'hp' | 'qi';
  showNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const VitalBarEnhanced: React.FC<VitalBarEnhancedProps> = ({
  current,
  max,
  type,
  showNumbers = true,
  size = 'md',
  animated = true,
}) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const isLow = percentage < 25;

  const sizeClasses = {
    sm: 'h-3',
    md: 'h-5',
    lg: 'h-7',
  };

  const colors = type === 'hp' 
    ? {
        gradient: isLow 
          ? 'from-red-800 via-red-600 to-red-500' 
          : 'from-red-600 via-red-500 to-orange-500',
        border: 'border-red-500/50',
        icon: <ResourceIcon type="hp" size={12} />,
        glow: isLow ? 'shadow-red-500/50' : '',
      }
    : {
        gradient: 'from-cyan-600 via-cyan-500 to-blue-500',
        border: 'border-cyan-500/50',
        icon: <ResourceIcon type="qi" size={12} />,
        glow: '',
      };

  return (
    <div className="w-full">
      {showNumbers && (
        <div className="flex justify-between text-xs mb-1">
          <span className={`font-bold drop-shadow-lg flex items-center gap-1 ${type === 'hp' ? 'text-red-400' : 'text-cyan-400'}`}>
            {colors.icon} {Math.ceil(current)}/{max}
          </span>
          <span className="text-slate-500">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={`${sizeClasses[size]} bg-black/60 rounded-full ${colors.border} border-2 overflow-hidden shadow-inner ${colors.glow} ${isLow && animated ? 'animate-pulse' : ''}`}>
        <div 
          className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-700 relative`}
          style={{ width: `${percentage}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30" />
          
          {/* Animated pulse for low HP */}
          {isLow && animated && type === 'hp' && (
            <div className="absolute inset-0 animate-pulse bg-white/20" />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TURN INDICATOR
// ============================================

interface TurnIndicatorProps {
  isPlayerTurn: boolean;
  turnNumber?: number;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({ isPlayerTurn, turnNumber }) => {
  return (
    <div className={`
      inline-flex items-center gap-3 px-6 py-3 rounded-full font-black text-lg uppercase tracking-widest
      border-2 backdrop-blur-sm transition-all duration-500
      ${isPlayerTurn 
        ? 'bg-blue-600/80 text-white border-blue-400 shadow-lg shadow-blue-500/50' 
        : 'bg-red-600/80 text-white border-red-400 shadow-lg shadow-red-500/50'
      }
    `}>
      <span className="text-2xl">{isPlayerTurn ? <Sword size={24} /> : <Skull size={24} />}</span>
      <span>{isPlayerTurn ? 'YOUR TURN' : 'ENEMY TURN'}</span>
      {turnNumber && <span className="text-sm opacity-60">#{turnNumber}</span>}
    </div>
  );
};

// ============================================
// COMBO INDICATOR
// ============================================

interface ComboIndicatorProps {
  comboCount: number;
  comboName?: string;
  multiplier?: number;
  isActive: boolean;
}

export const ComboIndicator: React.FC<ComboIndicatorProps> = ({
  comboCount,
  comboName,
  multiplier = 1,
  isActive,
}) => {
  if (!isActive || comboCount < 2) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-pink-900/80 to-purple-900/80 rounded-lg border border-pink-500/50 shadow-lg shadow-pink-500/30">
      <div className="flex items-center gap-2">
        <span className="text-2xl"><Link size={24} className="text-pink-300" /></span>
        <span className="text-2xl font-black text-pink-300">{comboCount}x</span>
      </div>
      {comboName && (
        <div className="border-l border-pink-500/50 pl-3">
          <div className="text-sm font-bold text-pink-200">{comboName}</div>
          <div className="text-xs text-pink-400">+{((multiplier - 1) * 100).toFixed(0)}% damage</div>
        </div>
      )}
    </div>
  );
};

// ============================================
// PASSIVE TRIGGER BANNER
// ============================================

interface PassiveTriggerBannerProps {
  passiveName: string;
  passiveEffect: string;
  element: string;
  isVisible: boolean;
  onHide: () => void;
}

export const PassiveTriggerBanner: React.FC<PassiveTriggerBannerProps> = ({
  passiveName,
  passiveEffect,
  element,
  isVisible,
  onHide,
}) => {
  const elemConfig = ELEMENT_CONFIG[element as keyof typeof ELEMENT_CONFIG] || ELEMENT_CONFIG.None;

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed top-20 left-1/2 -translate-x-1/2 z-50
        px-8 py-4 rounded-xl border-2
        backdrop-blur-md shadow-2xl
        animate-[slideDown_0.5s_ease-out]
      `}
      style={{
        background: `linear-gradient(135deg, ${elemConfig.bgColor}, rgba(0,0,0,0.8))`,
        borderColor: elemConfig.color,
        boxShadow: `0 0 30px ${elemConfig.color}40`,
      }}
    >
      <div className="flex items-center gap-4">
        <span className="text-4xl">{elemConfig.icon}</span>
        <div>
          <div className="text-xl font-black uppercase tracking-wide" style={{ color: elemConfig.color }}>
            {passiveName} Triggered!
          </div>
          <div className="text-sm text-slate-300">{passiveEffect}</div>
        </div>
        <Star size={36} className="text-amber-400 animate-pulse" />
      </div>
    </div>
  );
};

// ============================================
// ELEMENT EFFECTIVENESS POPUP
// ============================================

interface ElementEffectivenessPopupProps {
  type: 'super' | 'resisted' | 'immune';
  element: string;
  multiplier: number;
  isVisible: boolean;
  onHide: () => void;
}

export const ElementEffectivenessPopup: React.FC<ElementEffectivenessPopupProps> = ({
  type,
  element,
  multiplier,
  isVisible,
  onHide,
}) => {
  const elemConfig = ELEMENT_CONFIG[element as keyof typeof ELEMENT_CONFIG] || ELEMENT_CONFIG.None;

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onHide, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    super: { label: 'SUPER EFFECTIVE!', color: '#4ADE80', icon: <Sparkles size={32} className="text-green-400" /> },
    resisted: { label: 'RESISTED', color: '#9CA3AF', icon: <Shield size={32} className="text-gray-400" /> },
    immune: { label: 'IMMUNE', color: '#EF4444', icon: <XCircle size={32} className="text-red-400" /> },
  };

  const { label, color, icon } = config[type];

  return (
    <div 
      className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-[popIn_0.3s_ease-out]"
    >
      <div 
        className="flex items-center gap-3 px-6 py-4 rounded-xl border-2 backdrop-blur-md shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${elemConfig.bgColor}, rgba(0,0,0,0.9))`,
          borderColor: color,
          boxShadow: `0 0 40px ${color}50`,
        }}
      >
        <span className="text-4xl">{icon}</span>
        <div>
          <div className="text-xl font-black" style={{ color }}>
            {elemConfig.icon} {label}
          </div>
          <div className="text-sm text-slate-400">
            x{multiplier.toFixed(1)} damage
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CSS ANIMATIONS (Add to index.css)
// ============================================

export const combatUIAnimations = `
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translate(-50%, -100%); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes popIn {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  70% { transform: translate(-50%, -50%) scale(1.1); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
}

.animate-float-up {
  animation: floatUp 1.5s ease-out forwards;
}
`;

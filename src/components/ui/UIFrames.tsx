/**
 * ============================================
 * UI FRAME COMPONENTS - WuxiaMUD
 * ============================================
 * Styled frames using generated wuxia assets
 * All frame images from: /assets/icons/ui/
 */

import React from 'react';

// ============================================
// ASSET PATHS
// ============================================

export const UI_ASSETS = {
  frames: {
    tooltip: '/assets/icons/ui/tooltip_frame.png',
    modal: '/assets/icons/ui/modal_window_frame.png',
    dialog: '/assets/icons/ui/dialog_box_frame.png',
    panelHeader: '/assets/icons/ui/panel_header_frame.png',
    inventorySlot: '/assets/icons/ui/inventory_slot_frame.png',
    skillButton: '/assets/icons/ui/skill_button_frame.png',
    skillHotbarSlot: '/assets/icons/ui/skill_hotbar_slot.png',
    characterPortrait: '/assets/icons/ui/character_portrait_frame.png',
    hpBar: '/assets/icons/ui/hp_bar_frame.png',
    qiBar: '/assets/icons/ui/qi_bar_frame.png',
  },
  quests: {
    mainQuest: '/assets/icons/quests/main_quest.png',
    sideQuest: '/assets/icons/quests/side_quest.png',
    bounty: '/assets/icons/quests/bounty.png',
    questScroll: '/assets/icons/quests/quest_scroll.png',
    achievementStar: '/assets/icons/quests/achievement_star.png',
  },
  cultivation: {
    spiritStone: '/assets/icons/cultivation/spirit_stone_crystal.png',
    qiSwirl: '/assets/icons/cultivation/qi_energy_swirl.png',
    lotus: '/assets/icons/cultivation/medidation_lotus_pose.png',
    scroll: '/assets/icons/cultivation/bamboo_scroll.png',
    cauldron: '/assets/icons/cultivation/cultivation_cauldron.png',
    halo: '/assets/icons/cultivation/enlightment_halo.png',
    jadePendant: '/assets/icons/cultivation/jade_pendant.png',
    yinYang: '/assets/icons/cultivation/yin_yang_symbol.png',
  },
} as const;

// ============================================
// FRAMED TOOLTIP
// ============================================

interface FramedTooltipProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const FramedTooltip: React.FC<FramedTooltipProps> = ({ 
  children, 
  className = '', 
  style 
}) => {
  return (
    <div 
      className={`relative ${className}`}
      style={style}
    >
      {/* Frame background image */}
      <img 
        src={UI_ASSETS.frames.tooltip}
        alt=""
        className="absolute inset-0 w-full h-full object-fill pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Content */}
      <div className="relative z-10 p-4">
        {children}
      </div>
    </div>
  );
};

// ============================================
// FRAMED MODAL
// ============================================

interface FramedModalProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export const FramedModal: React.FC<FramedModalProps> = ({ 
  children, 
  className = '',
  onClose 
}) => {
  return (
    <div 
      className={`relative ${className}`}
      style={{
        backgroundImage: `url(${UI_ASSETS.frames.modal})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
};

// ============================================
// FRAMED PANEL HEADER
// ============================================

interface FramedHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const FramedHeader: React.FC<FramedHeaderProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{
        backgroundImage: `url(${UI_ASSETS.frames.panelHeader})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        minHeight: '48px',
      }}
    >
      <div className="relative z-10 px-6 py-2 text-amber-200 font-serif font-bold text-lg">
        {children}
      </div>
    </div>
  );
};

// ============================================
// FRAMED INVENTORY SLOT
// ============================================

interface FramedSlotProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  empty?: boolean;
}

export const FramedSlot: React.FC<FramedSlotProps> = ({ 
  children, 
  onClick, 
  className = '',
  size = 'md',
  selected = false,
  empty = false,
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  return (
    <div 
      className={`relative ${sizeClasses[size]} cursor-pointer transition-all hover:scale-105 
        ${selected ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-black' : ''} 
        ${className}`}
      onClick={onClick}
      style={{
        backgroundImage: `url(${UI_ASSETS.frames.inventorySlot})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-2 flex items-center justify-center">
        {children}
      </div>
      {empty && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-1/3 h-1/3 border border-dashed border-gray-600 rounded" />
        </div>
      )}
    </div>
  );
};

// ============================================
// FRAMED SKILL BUTTON
// ============================================

interface FramedSkillButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  cooldown?: number; // 0-100 percentage
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  hotkey?: string;
}

export const FramedSkillButton: React.FC<FramedSkillButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false,
  cooldown = 0,
  className = '',
  size = 'md',
  hotkey,
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  return (
    <button 
      className={`relative ${sizeClasses[size]} transition-all ${className}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:brightness-110 active:scale-95'}`}
      onClick={disabled ? undefined : onClick}
      style={{
        backgroundImage: `url(${UI_ASSETS.frames.skillButton})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Skill icon content */}
      <div className="absolute inset-2 flex items-center justify-center">
        {children}
      </div>
      
      {/* Cooldown overlay */}
      {cooldown > 0 && (
        <div 
          className="absolute inset-0 bg-black/70 flex items-center justify-center"
          style={{
            clipPath: `polygon(0 0, 100% 0, 100% ${cooldown}%, 0 ${cooldown}%)`,
          }}
        >
          <span className="text-xs font-bold text-white">{Math.ceil(cooldown / 10)}</span>
        </div>
      )}
      
      {/* Hotkey indicator */}
      {hotkey && (
        <div className="absolute -bottom-1 -right-1 bg-black/80 border border-amber-500/50 rounded px-1 text-[8px] text-amber-300 font-bold">
          {hotkey}
        </div>
      )}
    </button>
  );
};

// ============================================
// FRAMED HP BAR
// ============================================

interface FramedVitalBarProps {
  current: number;
  max: number;
  type: 'hp' | 'qi';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FramedVitalBar: React.FC<FramedVitalBarProps> = ({
  current,
  max,
  type,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const isLow = percentage < 25;

  const sizeClasses = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
  };

  const frameImage = type === 'hp' ? UI_ASSETS.frames.hpBar : UI_ASSETS.frames.qiBar;
  
  const fillColors = type === 'hp'
    ? isLow 
      ? 'from-red-800 via-red-600 to-red-500' 
      : 'from-red-600 via-red-500 to-orange-500'
    : 'from-cyan-600 via-cyan-500 to-blue-500';

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {showLabel && (
        <div className="flex justify-between text-xs mb-1 px-1">
          <span className={`font-bold drop-shadow-lg ${type === 'hp' ? 'text-red-400' : 'text-cyan-400'}`}>
            {type === 'hp' ? '❤️' : '✨'} {Math.ceil(current)}/{max}
          </span>
          <span className="text-gray-500">{percentage.toFixed(0)}%</span>
        </div>
      )}
      
      {/* Bar container with frame */}
      <div 
        className={`relative ${sizeClasses[size]} overflow-hidden`}
        style={{
          backgroundImage: `url(${frameImage})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Fill bar */}
        <div 
          className={`absolute top-1 bottom-1 left-1 right-1`}
        >
          <div 
            className={`h-full bg-gradient-to-r ${fillColors} transition-all duration-500 rounded-sm relative
              ${isLow && type === 'hp' ? 'animate-pulse' : ''}`}
            style={{ width: `${percentage}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// FRAMED CHARACTER PORTRAIT
// ============================================

interface FramedPortraitProps {
  src?: string;
  fallback?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const FramedPortrait: React.FC<FramedPortraitProps> = ({
  src,
  fallback,
  className = '',
  size = 'md',
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };

  return (
    <div 
      className={`relative ${sizeClasses[size]} ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${className}`}
      onClick={onClick}
      style={{
        backgroundImage: `url(${UI_ASSETS.frames.characterPortrait})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-2 flex items-center justify-center overflow-hidden rounded">
        {src ? (
          <img 
            src={src} 
            alt="Portrait" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : fallback}
      </div>
    </div>
  );
};

// ============================================
// QUEST ICON COMPONENT
// ============================================

interface QuestIconProps {
  type: 'main' | 'side' | 'bounty' | 'scroll' | 'achievement';
  size?: number;
  className?: string;
}

export const QuestIcon: React.FC<QuestIconProps> = ({ 
  type, 
  size = 24, 
  className = '' 
}) => {
  const iconMap = {
    main: UI_ASSETS.quests.mainQuest,
    side: UI_ASSETS.quests.sideQuest,
    bounty: UI_ASSETS.quests.bounty,
    scroll: UI_ASSETS.quests.questScroll,
    achievement: UI_ASSETS.quests.achievementStar,
  };

  return (
    <img 
      src={iconMap[type]}
      alt={`${type} quest`}
      className={className}
      style={{ width: size, height: size }}
    />
  );
};

// ============================================
// CULTIVATION ICON COMPONENT
// ============================================

interface CultivationIconProps {
  type: 'spiritStone' | 'qi' | 'lotus' | 'scroll' | 'cauldron' | 'halo' | 'jade' | 'yinYang';
  size?: number;
  className?: string;
}

export const CultivationIcon: React.FC<CultivationIconProps> = ({ 
  type, 
  size = 24, 
  className = '' 
}) => {
  const iconMap = {
    spiritStone: UI_ASSETS.cultivation.spiritStone,
    qi: UI_ASSETS.cultivation.qiSwirl,
    lotus: UI_ASSETS.cultivation.lotus,
    scroll: UI_ASSETS.cultivation.scroll,
    cauldron: UI_ASSETS.cultivation.cauldron,
    halo: UI_ASSETS.cultivation.halo,
    jade: UI_ASSETS.cultivation.jadePendant,
    yinYang: UI_ASSETS.cultivation.yinYang,
  };

  return (
    <img 
      src={iconMap[type]}
      alt={type}
      className={className}
      style={{ width: size, height: size }}
    />
  );
};

// ============================================
// SPIRIT STONE DISPLAY (replaces ⚡ emoji)
// ============================================

interface SpiritStoneDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SpiritStoneDisplay: React.FC<SpiritStoneDisplayProps> = ({
  amount,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { icon: 12, text: 'text-xs' },
    md: { icon: 16, text: 'text-sm' },
    lg: { icon: 20, text: 'text-base' },
  };

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <img 
        src={UI_ASSETS.cultivation.spiritStone}
        alt="Spirit Stones"
        style={{ width: sizes[size].icon, height: sizes[size].icon }}
        className="drop-shadow-lg"
      />
      <span className={`font-bold text-cyan-400 ${sizes[size].text}`}>
        {amount.toLocaleString()}
      </span>
    </span>
  );
};

export default {
  UI_ASSETS,
  FramedTooltip,
  FramedModal,
  FramedHeader,
  FramedSlot,
  FramedSkillButton,
  FramedVitalBar,
  FramedPortrait,
  QuestIcon,
  CultivationIcon,
  SpiritStoneDisplay,
};

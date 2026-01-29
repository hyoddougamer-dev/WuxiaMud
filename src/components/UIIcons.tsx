// ============================================
// UI ICON COMPONENTS - WuxiaMUD
// Reusable icon components for UI elements
// ============================================

import React from 'react';
import { questIcons, cultivationIcons, uiFrameIcons } from '../utils/iconSystem';

// ============================================
// QUEST ICON COMPONENT
// ============================================
interface QuestIconProps {
  type: 'main' | 'scroll' | 'side' | 'bounty' | 'achievement';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export const QuestIcon: React.FC<QuestIconProps> = ({ type, size = 'md', className = '' }) => {
  const iconPath = questIcons[type];
  
  return (
    <img 
      src={iconPath} 
      alt={`${type} quest`}
      className={`${sizeMap[size]} object-contain ${className}`}
      onError={(e) => {
        // Fallback to emoji if image fails
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
};

// ============================================
// CULTIVATION ICON COMPONENT
// ============================================
interface CultivationIconProps {
  type: 'meditation' | 'qiEnergy' | 'yinYang' | 'bambooScroll' | 'jadePendant' | 'spiritStone' | 'cauldron' | 'enlightenment';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CultivationIcon: React.FC<CultivationIconProps> = ({ type, size = 'md', className = '' }) => {
  const iconPath = cultivationIcons[type];
  
  return (
    <img 
      src={iconPath} 
      alt={type}
      className={`${sizeMap[size]} object-contain ${className}`}
    />
  );
};

// ============================================
// UI FRAME COMPONENT (for backgrounds)
// ============================================
interface UIFrameProps {
  type: keyof typeof uiFrameIcons;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const UIFrame: React.FC<UIFrameProps> = ({ type, children, className = '', style }) => {
  const framePath = uiFrameIcons[type];
  
  return (
    <div 
      className={`relative ${className}`}
      style={{
        backgroundImage: `url(${framePath})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ============================================
// QUEST TYPE INDICATOR (replaces emoji markers)
// ============================================
interface QuestMarkerProps {
  questType?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QuestMarker: React.FC<QuestMarkerProps> = ({ questType = 'main', size = 'md', className = '' }) => {
  // Map quest types to icon types
  const getIconType = (): 'main' | 'scroll' | 'side' | 'bounty' | 'achievement' => {
    const type = questType.toLowerCase();
    if (type.includes('main') || type.includes('story') || type.includes('tutorial')) return 'main';
    if (type.includes('bounty') || type.includes('hunt')) return 'bounty';
    if (type.includes('achievement') || type.includes('milestone')) return 'achievement';
    if (type.includes('daily') || type.includes('side')) return 'side';
    return 'scroll';
  };
  
  return <QuestIcon type={getIconType()} size={size} className={className} />;
};

// ============================================
// ACHIEVEMENT/MILESTONE ICON
// ============================================
interface AchievementIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

export const AchievementIcon: React.FC<AchievementIconProps> = ({ size = 'md', className = '', glow = false }) => {
  return (
    <div className={`relative ${glow ? 'animate-pulse' : ''}`}>
      <QuestIcon type="achievement" size={size} className={className} />
      {glow && (
        <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-md -z-10" />
      )}
    </div>
  );
};

// ============================================
// SCROLL ICON (for quest items, logs)
// ============================================
interface ScrollIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ScrollIcon: React.FC<ScrollIconProps> = ({ size = 'md', className = '' }) => {
  return <QuestIcon type="scroll" size={size} className={className} />;
};

// ============================================
// INLINE ICON WITH TEXT (helper for replacing emojis in text)
// ============================================
interface InlineIconProps {
  icon: 'quest' | 'achievement' | 'scroll' | 'meditation' | 'spirit';
  text: string;
  className?: string;
}

export const InlineIcon: React.FC<InlineIconProps> = ({ icon, text, className = '' }) => {
  const iconMap: Record<string, React.ReactNode> = {
    quest: <QuestIcon type="main" size="sm" />,
    achievement: <QuestIcon type="achievement" size="sm" />,
    scroll: <QuestIcon type="scroll" size="sm" />,
    meditation: <CultivationIcon type="meditation" size="sm" />,
    spirit: <CultivationIcon type="spiritStone" size="sm" />,
  };
  
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {iconMap[icon]}
      <span>{text}</span>
    </span>
  );
};

export default {
  QuestIcon,
  CultivationIcon,
  UIFrame,
  QuestMarker,
  AchievementIcon,
  ScrollIcon,
  InlineIcon,
};

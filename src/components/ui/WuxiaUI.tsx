/**
 * ============================================
 * WUXIA UI COMPONENTS - Premium Visual System
 * ============================================
 * Reusable styled components with wuxia aesthetics
 * Use these for consistent visual "BANG!" across the game
 */

import React from 'react';
import { RARITY_CONFIG, type ItemRarity } from '../../data/raritySystem';

// ============================================
// BUTTONS
// ============================================

interface WuxiaButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'spirit' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const WuxiaButton: React.FC<WuxiaButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon,
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'btn-wuxia',
    spirit: 'btn-spirit',
    danger: 'btn-danger',
    ghost: `
      bg-transparent border border-gray-600 text-gray-300
      hover:bg-gray-800 hover:border-gray-500
      transition-all duration-200
    `,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

// ============================================
// PANELS
// ============================================

interface WuxiaPanelProps {
  children: React.ReactNode;
  variant?: 'default' | 'spirit' | 'dark';
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  animate?: boolean;
}

export const WuxiaPanel: React.FC<WuxiaPanelProps> = ({
  children,
  variant = 'default',
  className = '',
  title,
  icon,
  animate = false,
}) => {
  const variantClasses = {
    default: 'panel-wuxia',
    spirit: 'panel-spirit',
    dark: 'bg-gray-900/95 border border-gray-700',
  };

  return (
    <div className={`${variantClasses[variant]} ${animate ? 'fade-in-up' : ''} ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-amber-500/20 flex items-center gap-2">
          {icon && <span className="text-amber-500">{icon}</span>}
          <h3 className="font-serif font-bold text-amber-400 uppercase tracking-wider">{title}</h3>
        </div>
      )}
      <div className={title ? 'p-4' : ''}>
        {children}
      </div>
    </div>
  );
};

// ============================================
// INVENTORY SLOT
// ============================================

interface InventorySlotProps {
  item?: any;
  rarity?: ItemRarity;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  selected?: boolean;
  locked?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const InventorySlot: React.FC<InventorySlotProps> = ({
  item,
  rarity,
  onClick,
  onMouseEnter,
  onMouseLeave,
  selected = false,
  locked = false,
  className = '',
  children,
}) => {
  // Determine rarity from item or prop
  const itemRarity = rarity || item?.rarity;
  
  const getRarityClass = () => {
    if (!itemRarity) return '';
    const normalized = itemRarity.toLowerCase();
    switch (normalized) {
      case 'mortal': case 'common': return 'inv-slot-mortal';
      case 'earth': case 'uncommon': return 'inv-slot-earth';
      case 'heaven': case 'rare': return 'inv-slot-heaven';
      case 'spirit': case 'epic': return 'inv-slot-spirit';
      case 'immortal': case 'legendary': return 'inv-slot-immortal';
      default: return '';
    }
  };

  const getShimmerClass = () => {
    if (!itemRarity) return '';
    const normalized = itemRarity.toLowerCase();
    if (['spirit', 'epic'].includes(normalized)) return 'shimmer-rare';
    if (['immortal', 'legendary'].includes(normalized)) return 'sparkle-legendary';
    return '';
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        inv-slot ${getRarityClass()} ${getShimmerClass()}
        ${selected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-gray-900' : ''}
        ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        flex items-center justify-center
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ============================================
// HP/QI BARS
// ============================================

interface ResourceBarProps {
  current: number;
  max: number;
  type: 'hp' | 'qi' | 'exp';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResourceBar: React.FC<ResourceBarProps> = ({
  current,
  max,
  type,
  showText = true,
  size = 'md',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const isLow = type === 'hp' && percentage <= 25;

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const barConfig = {
    hp: {
      containerClass: 'hp-bar',
      fillClass: `hp-bar-fill ${isLow ? 'hp-low' : ''}`,
      textColor: 'text-red-200',
    },
    qi: {
      containerClass: 'qi-bar',
      fillClass: 'qi-bar-fill',
      textColor: 'text-blue-200',
    },
    exp: {
      containerClass: 'bg-gradient-to-r from-yellow-900/80 to-amber-900/80 border border-amber-500/30 rounded-full',
      fillClass: 'bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-500',
      textColor: 'text-amber-200',
    },
  };

  const config = barConfig[type];

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className={`${config.containerClass} w-full h-full`}>
        <div
          className={`${config.fillClass} h-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showText && size !== 'sm' && (
        <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${config.textColor} drop-shadow-lg`}>
          {current} / {max}
        </div>
      )}
    </div>
  );
};

// ============================================
// RARITY TEXT
// ============================================

interface RarityTextProps {
  rarity: ItemRarity | string;
  children: React.ReactNode;
  glow?: boolean;
  className?: string;
}

export const RarityText: React.FC<RarityTextProps> = ({
  rarity,
  children,
  glow = true,
  className = '',
}) => {
  const getTextClass = () => {
    const normalized = rarity.toLowerCase();
    switch (normalized) {
      case 'mortal': case 'common': 
        return 'text-gray-400';
      case 'earth': case 'uncommon': 
        return glow ? 'text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'text-green-400';
      case 'heaven': case 'rare': 
        return glow ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-blue-400';
      case 'spirit': case 'epic': 
        return glow ? 'text-spirit-glow' : 'text-purple-400';
      case 'immortal': case 'legendary': 
        return glow ? 'text-legendary' : 'text-amber-400';
      default: 
        return 'text-gray-300';
    }
  };

  return (
    <span className={`font-bold ${getTextClass()} ${className}`}>
      {children}
    </span>
  );
};

// ============================================
// MODAL WRAPPER
// ============================================

interface WuxiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'spirit' | 'danger';
}

export const WuxiaModal: React.FC<WuxiaModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  size = 'md',
  variant = 'default',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const variantBorder = {
    default: 'border-amber-500/50',
    spirit: 'border-purple-500/50',
    danger: 'border-red-500/50',
  };

  const variantGlow = {
    default: 'shadow-[0_0_50px_rgba(245,158,11,0.2)]',
    spirit: 'shadow-[0_0_50px_rgba(168,85,247,0.2)]',
    danger: 'shadow-[0_0_50px_rgba(239,68,68,0.2)]',
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm fade-in-up"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          ${sizeClasses[size]} w-full mx-4
          bg-gradient-to-b from-gray-900 to-gray-950
          border-2 ${variantBorder[variant]}
          rounded-xl overflow-hidden
          ${variantGlow[variant]}
        `}
      >
        {/* Header */}
        {title && (
          <div className={`
            px-4 py-3 
            bg-gradient-to-r from-gray-800/50 via-gray-800/80 to-gray-800/50
            border-b ${variantBorder[variant]}
            flex items-center justify-between
          `}>
            <div className="flex items-center gap-2">
              {icon && <span className="text-amber-500">{icon}</span>}
              <h2 className="font-serif font-bold text-lg text-amber-400 uppercase tracking-wider">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================
// NOTIFICATION BADGE
// ============================================

interface NotificationBadgeProps {
  count: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  pulse?: boolean;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  variant = 'default',
  pulse = false,
  className = '',
}) => {
  if (count <= 0) return null;

  const variantClasses = {
    default: 'bg-amber-500 text-amber-950',
    success: 'bg-green-500 text-green-950',
    warning: 'bg-yellow-500 text-yellow-950',
    danger: 'bg-red-500 text-red-950',
  };

  return (
    <span className={`
      absolute -top-1 -right-1
      min-w-[18px] h-[18px] px-1
      flex items-center justify-center
      text-[10px] font-bold
      rounded-full
      ${variantClasses[variant]}
      ${pulse ? 'animate-pulse' : ''}
      ${className}
    `}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

// ============================================
// DIVIDER
// ============================================

interface WuxiaDividerProps {
  variant?: 'gold' | 'spirit' | 'subtle';
  className?: string;
}

export const WuxiaDivider: React.FC<WuxiaDividerProps> = ({
  variant = 'gold',
  className = '',
}) => {
  const variantClasses = {
    gold: 'from-transparent via-amber-500/50 to-transparent',
    spirit: 'from-transparent via-purple-500/50 to-transparent',
    subtle: 'from-transparent via-gray-600/50 to-transparent',
  };

  return (
    <div className={`h-px bg-gradient-to-r ${variantClasses[variant]} ${className}`} />
  );
};

// ============================================
// EXPORTS
// ============================================

export default {
  WuxiaButton,
  WuxiaPanel,
  InventorySlot,
  ResourceBar,
  RarityText,
  WuxiaModal,
  NotificationBadge,
  WuxiaDivider,
};

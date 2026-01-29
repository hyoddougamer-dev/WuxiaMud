/**
 * =========================================
 * GAME ICON COMPONENT
 * =========================================
 * 
 * Unified icon component that displays PNG icons with emoji fallbacks.
 * Use this throughout the app instead of hardcoded emojis.
 */

import React from 'react';
import { 
  ICONS, 
  EMOJI_FALLBACKS, 
  COMBAT_LOG_TO_ICON, 
  COMBAT_LOG_EMOJI_FALLBACK,
  STATUS_EFFECT_ICONS,
  ELEMENT_ICONS,
  ACTION_ICONS,
  RESOURCE_ICONS,
  type CombatLogType 
} from '../../data/iconSystem';

// ==========================================
// GAME ICON COMPONENT
// ==========================================

interface GameIconProps {
  /** Icon category and name, e.g., 'combat/player_attack' or 'ui/hp_bar' */
  icon: string;
  /** Fallback emoji if icon fails to load */
  fallback?: string;
  /** Size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
}

export const GameIcon: React.FC<GameIconProps> = ({
  icon,
  fallback = EMOJI_FALLBACKS.default,
  size = 16,
  className = '',
  alt = 'icon'
}) => {
  const [hasError, setHasError] = React.useState(false);
  
  // Parse icon path (e.g., 'combat/player_attack' -> ICONS.combat.player_attack)
  const getIconPath = (): string | null => {
    const [category, name] = icon.split('/');
    const categoryIcons = (ICONS as any)[category];
    return categoryIcons?.[name] || null;
  };
  
  const iconPath = getIconPath();
  
  if (!iconPath || hasError) {
    return (
      <span 
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.8 }}
        role="img"
        aria-label={alt}
      >
        {fallback}
      </span>
    );
  }
  
  return (
    <img
      src={iconPath}
      alt={alt}
      width={size}
      height={size}
      className={`inline-block object-contain ${className}`}
      onError={() => setHasError(true)}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

// ==========================================
// COMBAT LOG ICON COMPONENT
// ==========================================

interface CombatLogIconProps {
  type: CombatLogType;
  size?: number;
  className?: string;
}

export const CombatLogIcon: React.FC<CombatLogIconProps> = ({
  type,
  size = 14,
  className = ''
}) => {
  const [hasError, setHasError] = React.useState(false);
  
  const iconKey = COMBAT_LOG_TO_ICON[type];
  const iconPath = iconKey ? ICONS.combat[iconKey] : null;
  const fallback = COMBAT_LOG_EMOJI_FALLBACK[type] || EMOJI_FALLBACKS.default;
  
  if (!iconPath || hasError) {
    return (
      <span 
        className={`inline-flex items-center justify-center ${className}`}
        style={{ fontSize: size * 0.9 }}
      >
        {fallback}
      </span>
    );
  }
  
  return (
    <img
      src={iconPath}
      alt={type}
      width={size}
      height={size}
      className={`inline-block object-contain ${className}`}
      onError={() => setHasError(true)}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

// ==========================================
// STATUS EFFECT ICON COMPONENT (Uses images when available!)
// ==========================================

interface StatusEffectIconProps {
  effect: string;
  size?: number;
  showLabel?: boolean;
  duration?: number;
  className?: string;
  useImage?: boolean;
}

export const StatusEffectIcon: React.FC<StatusEffectIconProps> = ({
  effect,
  size = 16,
  showLabel = false,
  duration,
  className = '',
  useImage = true
}) => {
  const [hasError, setHasError] = React.useState(false);
  const effectInfo = STATUS_EFFECT_ICONS[effect.toLowerCase()] || { emoji: '✨', color: '#fbbf24', icon: '' };
  
  // Use image if available
  if (useImage && effectInfo.icon && !hasError) {
    return (
      <span 
        className={`inline-flex items-center gap-1 ${className}`}
      >
        <img
          src={effectInfo.icon}
          alt={effect}
          width={size}
          height={size}
          className="inline-block object-contain"
          onError={() => setHasError(true)}
          style={{ imageRendering: 'auto' }}
        />
        {showLabel && (
          <span className="text-xs uppercase font-bold" style={{ color: effectInfo.color }}>
            {effect}
            {duration !== undefined && `(${Math.ceil(duration)}s)`}
          </span>
        )}
      </span>
    );
  }
  
  // Fallback to emoji
  return (
    <span 
      className={`inline-flex items-center gap-1 ${className}`}
      style={{ color: effectInfo.color }}
    >
      <span style={{ fontSize: size }}>{effectInfo.emoji}</span>
      {showLabel && (
        <span className="text-xs uppercase font-bold">
          {effect}
          {duration !== undefined && `(${Math.ceil(duration)}s)`}
        </span>
      )}
    </span>
  );
};

// ==========================================
// ELEMENT ICON COMPONENT (Uses images!)
// ==========================================

interface ElementIconProps {
  element: string;
  size?: number;
  showLabel?: boolean;
  className?: string;
  useImage?: boolean;
}

export const ElementIcon: React.FC<ElementIconProps> = ({
  element,
  size = 16,
  showLabel = false,
  className = '',
  useImage = true
}) => {
  const [hasError, setHasError] = React.useState(false);
  const elementInfo = ELEMENT_ICONS[element.toLowerCase()] || { emoji: '✨', color: '#fbbf24', icon: '' };
  
  // Use image if available and useImage is true
  if (useImage && elementInfo.icon && !hasError) {
    return (
      <span 
        className={`inline-flex items-center gap-1 ${className}`}
      >
        <img
          src={elementInfo.icon}
          alt={element}
          width={size}
          height={size}
          className="inline-block object-contain"
          onError={() => setHasError(true)}
          style={{ imageRendering: 'auto' }}
        />
        {showLabel && (
          <span className="text-xs uppercase font-bold" style={{ color: elementInfo.color }}>{element}</span>
        )}
      </span>
    );
  }
  
  // Fallback to emoji
  return (
    <span 
      className={`inline-flex items-center gap-1 ${className}`}
      style={{ color: elementInfo.color }}
    >
      <span style={{ fontSize: size }}>{elementInfo.emoji}</span>
      {showLabel && (
        <span className="text-xs uppercase font-bold">{element}</span>
      )}
    </span>
  );
};

// ==========================================
// RESOURCE ICON COMPONENT (Uses images!)
// ==========================================

type ResourceType = 'hp' | 'qi' | 'gold' | 'spiritStone' | 'exp';

interface ResourceIconProps {
  type: ResourceType;
  value?: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
  useImage?: boolean;
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({
  type,
  value,
  size = 16,
  showLabel = false,
  className = '',
  useImage = true
}) => {
  const [hasError, setHasError] = React.useState(false);
  const config = RESOURCE_ICONS[type] || { emoji: '•', color: '#888', icon: '', label: type };
  
  // Use image if available
  if (useImage && config.icon && !hasError) {
    return (
      <span 
        className={`inline-flex items-center gap-1 ${className}`}
      >
        <img
          src={config.icon}
          alt={config.label}
          width={size}
          height={size}
          className="inline-block object-contain"
          onError={() => setHasError(true)}
          style={{ imageRendering: 'auto' }}
        />
        {value !== undefined && (
          <span className="font-bold" style={{ color: config.color }}>{value.toLocaleString()}</span>
        )}
        {showLabel && (
          <span className="text-xs opacity-80" style={{ color: config.color }}>{config.label}</span>
        )}
      </span>
    );
  }
  
  // Fallback to emoji
  return (
    <span 
      className={`inline-flex items-center gap-1 ${className}`}
      style={{ color: config.color }}
    >
      <span style={{ fontSize: size }}>{config.emoji}</span>
      {value !== undefined && (
        <span className="font-bold">{value.toLocaleString()}</span>
      )}
      {showLabel && (
        <span className="text-xs opacity-80">{config.label}</span>
      )}
    </span>
  );
};

// ==========================================
// ACTION ICON COMPONENT (NEW - Uses images!)
// ==========================================

type ActionType = 'dodge' | 'block' | 'counter' | 'parry';

interface ActionIconProps {
  action: ActionType;
  size?: number;
  showLabel?: boolean;
  className?: string;
  useImage?: boolean;
}

export const ActionIcon: React.FC<ActionIconProps> = ({
  action,
  size = 16,
  showLabel = false,
  className = '',
  useImage = true
}) => {
  const [hasError, setHasError] = React.useState(false);
  const config = ACTION_ICONS[action] || { emoji: '⚔️', color: '#888', icon: '' };
  
  // Use image if available
  if (useImage && config.icon && !hasError) {
    return (
      <span 
        className={`inline-flex items-center gap-1 ${className}`}
      >
        <img
          src={config.icon}
          alt={action}
          width={size}
          height={size}
          className="inline-block object-contain"
          onError={() => setHasError(true)}
          style={{ imageRendering: 'auto' }}
        />
        {showLabel && (
          <span className="text-xs uppercase font-bold" style={{ color: config.color }}>{action}</span>
        )}
      </span>
    );
  }
  
  // Fallback to emoji
  return (
    <span 
      className={`inline-flex items-center gap-1 ${className}`}
      style={{ color: config.color }}
    >
      <span style={{ fontSize: size }}>{config.emoji}</span>
      {showLabel && (
        <span className="text-xs uppercase font-bold">{action}</span>
      )}
    </span>
  );
};

// ==========================================
// QUEST ICON COMPONENT
// ==========================================

type QuestType = 'main' | 'side' | 'bounty' | 'achievement';

interface QuestIconProps {
  type: QuestType;
  size?: number;
  className?: string;
}

export const QuestIcon: React.FC<QuestIconProps> = ({
  type,
  size = 20,
  className = ''
}) => {
  const [hasError, setHasError] = React.useState(false);
  
  const iconMap: Record<QuestType, string> = {
    main: ICONS.quests.main_quest,
    side: ICONS.quests.side_quest,
    bounty: ICONS.quests.bounty,
    achievement: ICONS.quests.achievement,
  };
  
  const fallbackMap: Record<QuestType, string> = {
    main: '⭐',
    side: '📜',
    bounty: '🎯',
    achievement: '🏆',
  };
  
  const iconPath = iconMap[type];
  
  if (hasError) {
    return (
      <span style={{ fontSize: size }}>{fallbackMap[type]}</span>
    );
  }
  
  return (
    <img
      src={iconPath}
      alt={`${type} quest`}
      width={size}
      height={size}
      className={`inline-block object-contain ${className}`}
      onError={() => setHasError(true)}
    />
  );
};

// ==========================================
// CULTIVATION ICON COMPONENT
// ==========================================

type CultivationType = 'meditation' | 'qi_energy' | 'spirit_stone' | 'breakthrough' | 'cauldron' | 'yin_yang';

interface CultivationIconProps {
  type: CultivationType;
  size?: number;
  className?: string;
}

export const CultivationIcon: React.FC<CultivationIconProps> = ({
  type,
  size = 20,
  className = ''
}) => {
  const [hasError, setHasError] = React.useState(false);
  
  const iconMap: Record<CultivationType, string> = {
    meditation: ICONS.cultivation.meditation,
    qi_energy: ICONS.cultivation.qi_energy,
    spirit_stone: ICONS.cultivation.spirit_stone,
    breakthrough: ICONS.cultivation.enlightenment,
    cauldron: ICONS.cultivation.cauldron,
    yin_yang: ICONS.cultivation.yin_yang,
  };
  
  const fallbackMap: Record<CultivationType, string> = {
    meditation: '🧘',
    qi_energy: '✨',
    spirit_stone: '💎',
    breakthrough: '🌟',
    cauldron: '🔥',
    yin_yang: '☯️',
  };
  
  const iconPath = iconMap[type];
  
  if (hasError) {
    return (
      <span style={{ fontSize: size }}>{fallbackMap[type]}</span>
    );
  }
  
  return (
    <img
      src={iconPath}
      alt={type}
      width={size}
      height={size}
      className={`inline-block object-contain ${className}`}
      onError={() => setHasError(true)}
    />
  );
};

// ==========================================
// INLINE TEXT WITH ICON HELPER
// ==========================================

interface TextWithIconProps {
  icon: string;
  fallback?: string;
  children: React.ReactNode;
  iconSize?: number;
  className?: string;
}

/**
 * Helper component for inline text with icon prefix
 * Example: <TextWithIcon icon="combat/player_attack">You attack!</TextWithIcon>
 */
export const TextWithIcon: React.FC<TextWithIconProps> = ({
  icon,
  fallback,
  children,
  iconSize = 14,
  className = ''
}) => {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <GameIcon icon={icon} fallback={fallback} size={iconSize} />
      <span>{children}</span>
    </span>
  );
};

export default GameIcon;

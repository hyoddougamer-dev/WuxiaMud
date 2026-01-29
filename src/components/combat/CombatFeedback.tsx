// ============================================
// COMBAT FEEDBACK SYSTEM - 戰鬥反饋 (Zhàndòu Fǎnkuì)
// Visual feedback for combat: floating damage, element effects, passives
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Flame, Snowflake, Leaf, Zap, Moon, Sword, Shield, Sparkles } from 'lucide-react';
import type { ElementType } from '../../data/elementSystem';
import { ELEMENT_ICON_PATHS } from '../../data/elementSystem';

// ============================================
// COMBAT ICON PATHS - Using generated images
// ============================================

const COMBAT_ICONS = {
  player_attack: '/assets/icons/combat/player_attack.png',
  enemy_attack: '/assets/icons/combat/enemy_attack.png',
  player_crit: '/assets/icons/combat/player_crit.png',
  enemy_crit: '/assets/icons/combat/enemy_crit.png',
  heal: '/assets/icons/combat/heal.png',
  buff: '/assets/icons/combat/buff.png',
  debuff: '/assets/icons/combat/debuff.png',
  passive: '/assets/icons/combat/passive.png',
  victory: '/assets/icons/combat/victory.png',
  flee: '/assets/icons/combat/flee.png',
  warning: '/assets/icons/combat/warning.png',
  system: '/assets/icons/combat/system.png',
} as const;

// Combat Icon Component
interface CombatIconProps {
  type: keyof typeof COMBAT_ICONS;
  size?: number;
  className?: string;
}

export const CombatIcon: React.FC<CombatIconProps> = ({ type, size = 16, className = '' }) => (
  <img 
    src={COMBAT_ICONS[type]} 
    alt={type} 
    width={size} 
    height={size} 
    className={`inline-block ${className}`}
    style={{ imageRendering: 'pixelated' }}
  />
);

// ============================================
// TYPES
// ============================================

export interface FloatingNumber {
  id: number;
  value: number;
  type: 'damage' | 'heal' | 'critical' | 'miss' | 'block';
  element?: ElementType;
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  target: 'player' | 'enemy';
}

export interface ElementPopup {
  id: number;
  type: 'super_effective' | 'not_effective' | 'resisted' | 'critical';
  element: ElementType;
  multiplier: number;
}

export interface PassiveTrigger {
  id: number;
  name: string;
  icon: 'flame' | 'ice' | 'poison' | 'shield' | 'sword' | 'sparkle';
  effect: string;
}

// ============================================
// ELEMENT COLORS & ICONS
// ============================================

export const ELEMENT_COLORS: Record<ElementType, { primary: string; glow: string; text: string }> = {
  Fire: { primary: '#FF6B35', glow: 'rgba(255, 107, 53, 0.6)', text: 'text-orange-400' },
  Ice: { primary: '#5BC0EB', glow: 'rgba(91, 192, 235, 0.6)', text: 'text-cyan-400' },
  Wood: { primary: '#8BC34A', glow: 'rgba(139, 195, 74, 0.6)', text: 'text-green-400' },
  Lightning: { primary: '#FFD93D', glow: 'rgba(255, 217, 61, 0.6)', text: 'text-yellow-400' },
  Void: { primary: '#9B59B6', glow: 'rgba(155, 89, 182, 0.6)', text: 'text-purple-400' },
};

export const ELEMENT_ICONS: Record<ElementType, React.ReactNode> = {
  Fire: <img src={ELEMENT_ICON_PATHS.Fire} alt="Fire" className="w-4 h-4" />,
  Ice: <img src={ELEMENT_ICON_PATHS.Ice} alt="Ice" className="w-4 h-4" />,
  Wood: <img src={ELEMENT_ICON_PATHS.Wood} alt="Wood" className="w-4 h-4" />,
  Lightning: <img src={ELEMENT_ICON_PATHS.Lightning} alt="Lightning" className="w-4 h-4" />,
  Void: <img src={ELEMENT_ICON_PATHS.Void} alt="Void" className="w-4 h-4" />,
};

// ============================================
// FLOATING DAMAGE NUMBER COMPONENT
// ============================================

interface FloatingDamageProps {
  number: FloatingNumber;
  onComplete: (id: number) => void;
}

const FloatingDamage: React.FC<FloatingDamageProps> = ({ number, onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onComplete(number.id), 200);
    }, 1200);
    return () => clearTimeout(timer);
  }, [number.id, onComplete]);

  const getColor = () => {
    if (number.type === 'heal') return '#22C55E'; // Green
    if (number.type === 'miss') return '#9CA3AF'; // Gray
    if (number.type === 'block') return '#60A5FA'; // Blue
    if (number.type === 'critical') return '#FBBF24'; // Gold
    if (number.element) return ELEMENT_COLORS[number.element].primary;
    return '#EF4444'; // Default red
  };

  const getText = () => {
    if (number.type === 'miss') return 'MISS';
    if (number.type === 'block') return 'BLOCKED';
    if (number.type === 'heal') return `+${number.value}`;
    return number.value.toString();
  };

  const isCritical = number.type === 'critical';
  const isHeal = number.type === 'heal';
  
  // Position based on target
  const positionStyle = number.target === 'player' 
    ? { left: '25%', top: `${30 + number.y}%` }
    : { left: '75%', top: `${30 + number.y}%` };

  return (
    <div
      className={`absolute z-50 pointer-events-none transform -translate-x-1/2 
        ${visible ? 'animate-floating-damage' : 'opacity-0'}
        ${isCritical ? 'scale-150' : ''}
      `}
      style={{
        ...positionStyle,
        color: getColor(),
        textShadow: `0 0 10px ${getColor()}, 0 2px 4px rgba(0,0,0,0.8)`,
        filter: isCritical ? 'brightness(1.3)' : 'none',
      }}
    >
      <div className={`font-bold ${isCritical ? 'text-3xl' : 'text-xl'} flex items-center gap-1`}>
        {number.element && ELEMENT_ICONS[number.element]}
        <span>{getText()}</span>
        {isCritical && <Sparkles size={14} className="text-yellow-400 ml-1" />}
        {/* 
          PLACEHOLDER: 💥 = crit_icon.png
          Imagem recomendada: Explosão dourada/laranja com raios
          Prompt: "golden explosion burst icon martial arts critical hit effect transparent background pixel art"
        */}
      </div>
    </div>
  );
};

// ============================================
// ELEMENT POPUP COMPONENT
// ============================================

interface ElementPopupProps {
  popup: ElementPopup;
  onComplete: (id: number) => void;
}

const ElementPopupDisplay: React.FC<ElementPopupProps> = ({ popup, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(popup.id), 1500);
    return () => clearTimeout(timer);
  }, [popup.id, onComplete]);

  const getMessage = () => {
    switch (popup.type) {
      case 'super_effective': return '超級有效！'; // Super Effective!
      case 'not_effective': return '效果不佳...'; // Not Very Effective...
      case 'resisted': return '被抵抗！'; // Resisted!
      case 'critical': return '暴擊！'; // Critical Hit!
      default: return '';
    }
  };

  const getEnglish = () => {
    switch (popup.type) {
      case 'super_effective': return 'SUPER EFFECTIVE!';
      case 'not_effective': return 'NOT VERY EFFECTIVE';
      case 'resisted': return 'RESISTED!';
      case 'critical': return 'CRITICAL HIT!';
      default: return '';
    }
  };

  // Use combat icons instead of emojis
  const getIconElement = () => {
    switch (popup.type) {
      case 'super_effective': 
        return <CombatIcon type="buff" size={32} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />;
      case 'not_effective': 
        return <CombatIcon type="debuff" size={32} className="drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />;
      case 'resisted': 
        return <CombatIcon type="warning" size={32} className="drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />;
      case 'critical': 
        return <CombatIcon type="enemy_crit" size={32} className="drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />;
      default: 
        return null;
    }
  };

  const colors = ELEMENT_COLORS[popup.element];
  const isSuperEffective = popup.type === 'super_effective';
  const isWeakened = popup.type === 'not_effective' || popup.type === 'resisted';

  return (
    <div className="absolute inset-0 flex items-center justify-center z-[60] pointer-events-none animate-element-popup">
      <div 
        className={`
          px-6 py-3 rounded-xl border-2 backdrop-blur-sm
          ${isSuperEffective ? 'bg-gradient-to-r from-yellow-900/80 to-orange-900/80 border-yellow-500' : ''}
          ${isWeakened ? 'bg-gradient-to-r from-gray-900/80 to-blue-900/80 border-gray-500' : ''}
          ${popup.type === 'critical' ? 'bg-gradient-to-r from-red-900/80 to-orange-900/80 border-red-500' : ''}
        `}
        style={{
          boxShadow: `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}`,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center">{getIconElement()}</span>
          <div className="text-center">
            <div className={`text-lg font-bold ${colors.text}`}>
              {getEnglish()}
            </div>
            <div className="text-xs text-gray-400 font-serif">
              {getMessage()}
            </div>
            {popup.multiplier !== 1 && (
              <div className={`text-sm font-mono mt-1 ${isSuperEffective ? 'text-yellow-400' : 'text-gray-400'}`}>
                {popup.multiplier > 1 ? '+' : ''}{Math.round((popup.multiplier - 1) * 100)}% damage
              </div>
            )}
          </div>
          <div className={colors.text}>
            {ELEMENT_ICONS[popup.element]}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PASSIVE TRIGGER COMPONENT
// ============================================

interface PassiveTriggerProps {
  trigger: PassiveTrigger;
  onComplete: (id: number) => void;
}

const PassiveTriggerDisplay: React.FC<PassiveTriggerProps> = ({ trigger, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(trigger.id), 2000);
    return () => clearTimeout(timer);
  }, [trigger.id, onComplete]);

  const getIcon = () => {
    switch (trigger.icon) {
      case 'flame': return <Flame size={20} className="text-orange-400" />;
      // PLACEHOLDER: Usar flame.png quando disponível
      // Imagem recomendada: Chama estilizada wuxia
      // Prompt: "stylized fire flame icon martial arts wuxia style orange red glow transparent background"
      case 'ice': return <Snowflake size={20} className="text-cyan-400" />;
      // PLACEHOLDER: Usar ice.png quando disponível
      // Imagem recomendada: Cristal de gelo brilhante
      // Prompt: "ice crystal snowflake icon martial arts wuxia style blue cyan glow transparent background"
      case 'poison': return <Leaf size={20} className="text-green-400" />;
      // PLACEHOLDER: Usar poison.png quando disponível
      // Imagem recomendada: Gota de veneno a brilhar
      // Prompt: "poison drop toxic icon martial arts wuxia style green glow dripping transparent background"
      case 'shield': return <Shield size={20} className="text-blue-400" />;
      // PLACEHOLDER: Usar shield.png quando disponível
      // Imagem recomendada: Escudo qi a brilhar
      // Prompt: "qi energy shield icon martial arts wuxia style golden blue barrier transparent background"
      case 'sword': return <Sword size={20} className="text-red-400" />;
      // PLACEHOLDER: Usar sword_passive.png quando disponível
      // Imagem recomendada: Espada a brilhar com qi
      // Prompt: "glowing sword with qi energy martial arts wuxia style red aura transparent background"
      case 'sparkle': return <Sparkles size={20} className="text-yellow-400" />;
      // PLACEHOLDER: Usar sparkle.png quando disponível
      // Imagem recomendada: Partículas de qi douradas
      // Prompt: "golden qi sparkles particles martial arts wuxia style magical effect transparent background"
      default: return <Sparkles size={20} className="text-amber-400" />;
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[55] animate-passive-trigger">
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-900/90 to-yellow-900/90 
                      border border-amber-500/50 rounded-lg backdrop-blur-sm shadow-lg">
        <div className="animate-pulse">{getIcon()}</div>
        <div>
          <div className="text-amber-300 font-bold text-sm">{trigger.name}</div>
          <div className="text-amber-100/70 text-xs">{trigger.effect}</div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMBAT FEEDBACK MANAGER
// ============================================

interface CombatFeedbackProps {
  isActive: boolean;
}

export const CombatFeedback: React.FC<CombatFeedbackProps> = ({ isActive }) => {
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [elementPopups, setElementPopups] = useState<ElementPopup[]>([]);
  const [passiveTriggers, setPassiveTriggers] = useState<PassiveTrigger[]>([]);
  const [screenShake, setScreenShake] = useState(false);

  const removeFloatingNumber = useCallback((id: number) => {
    setFloatingNumbers(prev => prev.filter(n => n.id !== id));
  }, []);

  const removeElementPopup = useCallback((id: number) => {
    setElementPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  const removePassiveTrigger = useCallback((id: number) => {
    setPassiveTriggers(prev => prev.filter(t => t.id !== id));
  }, []);

  // Expor funções globais para o sistema de combate chamar
  useEffect(() => {
    if (!isActive) return;

    // Adicionar número flutuante
    (window as any).addFloatingDamage = (
      value: number,
      type: FloatingNumber['type'],
      target: 'player' | 'enemy',
      element?: ElementType
    ) => {
      const id = Date.now() + Math.random();
      const randomY = Math.random() * 20; // Variação vertical
      setFloatingNumbers(prev => [...prev, { id, value, type, element, x: 50, y: randomY, target }]);
    };

    // Adicionar popup de elemento
    (window as any).showElementPopup = (
      type: ElementPopup['type'],
      element: ElementType,
      multiplier: number
    ) => {
      const id = Date.now() + Math.random();
      setElementPopups(prev => [...prev, { id, type, element, multiplier }]);
    };

    // Adicionar trigger de passiva
    (window as any).showPassiveTrigger = (
      name: string,
      icon: PassiveTrigger['icon'],
      effect: string
    ) => {
      const id = Date.now() + Math.random();
      setPassiveTriggers(prev => [...prev, { id, name, icon, effect }]);
    };

    // Screen shake
    (window as any).triggerScreenShake = () => {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 400);
    };

    return () => {
      delete (window as any).addFloatingDamage;
      delete (window as any).showElementPopup;
      delete (window as any).showPassiveTrigger;
      delete (window as any).triggerScreenShake;
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${screenShake ? 'animate-screen-shake' : ''}`}>
      {/* Floating Damage Numbers */}
      {floatingNumbers.map(num => (
        <FloatingDamage key={num.id} number={num} onComplete={removeFloatingNumber} />
      ))}

      {/* Element Popups */}
      {elementPopups.map(popup => (
        <ElementPopupDisplay key={popup.id} popup={popup} onComplete={removeElementPopup} />
      ))}

      {/* Passive Triggers */}
      {passiveTriggers.map(trigger => (
        <PassiveTriggerDisplay key={trigger.id} trigger={trigger} onComplete={removePassiveTrigger} />
      ))}
    </div>
  );
};

// ============================================
// COMBAT LOG MESSAGE TYPES
// ============================================

export type CombatLogType = 
  | 'player_attack' 
  | 'enemy_attack' 
  | 'player_crit' 
  | 'enemy_crit'
  | 'heal' 
  | 'buff' 
  | 'debuff'
  | 'passive'
  | 'element_advantage'
  | 'element_disadvantage'
  | 'victory'
  | 'defeat'
  | 'flee'
  | 'info'
  | 'warning'
  | 'system';

export interface CombatLogMessage {
  id: number;
  text: string;
  type: CombatLogType;
  element?: ElementType;
  timestamp: number;
}

export const getCombatLogColor = (type: CombatLogType): string => {
  switch (type) {
    case 'player_attack': return 'text-green-400';
    case 'enemy_attack': return 'text-red-400';
    case 'player_crit': return 'text-yellow-400';
    case 'enemy_crit': return 'text-orange-400';
    case 'heal': return 'text-emerald-400';
    case 'buff': return 'text-cyan-400';
    case 'debuff': return 'text-purple-400';
    case 'passive': return 'text-amber-400';
    case 'element_advantage': return 'text-yellow-300';
    case 'element_disadvantage': return 'text-gray-400';
    case 'victory': return 'text-yellow-500';
    case 'defeat': return 'text-red-500';
    case 'flee': return 'text-blue-400';
    case 'warning': return 'text-orange-400';
    case 'system': return 'text-gray-500';
    default: return 'text-gray-300';
  }
};

// Returns the icon path for combat log entries
export const getCombatLogIconPath = (type: CombatLogType): string | null => {
  switch (type) {
    case 'player_attack': return COMBAT_ICONS.player_attack;
    case 'enemy_attack': return COMBAT_ICONS.enemy_attack;
    case 'player_crit': return COMBAT_ICONS.player_crit;
    case 'enemy_crit': return COMBAT_ICONS.enemy_crit;
    case 'heal': return COMBAT_ICONS.heal;
    case 'buff': return COMBAT_ICONS.buff;
    case 'debuff': return COMBAT_ICONS.debuff;
    case 'passive': return COMBAT_ICONS.passive;
    case 'victory': return COMBAT_ICONS.victory;
    case 'defeat': return COMBAT_ICONS.enemy_crit; // Use enemy_crit for defeat
    case 'flee': return COMBAT_ICONS.flee;
    case 'warning': return COMBAT_ICONS.warning;
    case 'system': return COMBAT_ICONS.system;
    case 'element_advantage': return COMBAT_ICONS.buff;
    case 'element_disadvantage': return COMBAT_ICONS.debuff;
    default: return null;
  }
};

// Legacy function for backwards compatibility - returns emoji fallback
export const getCombatLogIcon = (type: CombatLogType): string => {
  switch (type) {
    case 'player_attack': return '⚔️';
    case 'enemy_attack': return '💢';
    case 'player_crit': return '💥';
    case 'enemy_crit': return '☠️';
    case 'heal': return '💚';
    case 'buff': return '⬆️';
    case 'debuff': return '⬇️';
    case 'passive': return '✨';
    case 'element_advantage': return '🔥';
    case 'element_disadvantage': return '🛡️';
    case 'victory': return '🏆';
    case 'defeat': return '💀';
    case 'flee': return '🏃';
    case 'warning': return '⚠️';
    case 'system': return '📜';
    default: return '•';
  }
};

// React component for combat log icon - USE THIS for visual display
export const CombatLogIconComponent: React.FC<{ type: CombatLogType; size?: number; className?: string }> = ({ 
  type, 
  size = 14, 
  className = '' 
}) => {
  const iconPath = getCombatLogIconPath(type);
  
  if (iconPath) {
    return (
      <img 
        src={iconPath} 
        alt={type} 
        width={size} 
        height={size}
        className={`inline-block align-middle ${className}`}
        style={{ imageRendering: 'auto' }}
        onError={(e) => {
          // Fallback to emoji if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  }
  
  // Fallback to emoji
  return <span className={className}>{getCombatLogIcon(type)}</span>;
};

export default CombatFeedback;

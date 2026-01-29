// ============================================
// ENHANCED COMBAT LOG - 戰鬥記錄 (Zhàndòu Jìlù)
// Styled combat messages with icons and colors
// ============================================

import React, { useEffect, useRef } from 'react';
import { 
  Sword, Shield, Skull, 
  Trophy, Wind, AlertTriangle, Scroll,
  Flame, Snowflake, Leaf, Moon, Sparkles,
  ArrowUp, ArrowDown, Star
} from 'lucide-react';
import type { ElementType } from '../../data/elementSystem';
import { ELEMENT_COLORS, ELEMENT_ICONS } from './CombatFeedback';
import { ResourceIcon } from '../ui/GameIcon';

// ============================================
// TYPES
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
  | 'loot'
  | 'exp'
  | 'info'
  | 'warning'
  | 'danger'
  | 'success'
  | 'gold'
  | 'system';

export interface CombatLogEntry {
  id?: number;
  text: string;
  type: CombatLogType | string;
  element?: ElementType;
  value?: number;
  timestamp?: number;
}

// ============================================
// STYLING HELPERS
// ============================================

const getLogStyles = (type: string): { color: string; bg: string; border: string } => {
  switch (type) {
    case 'player_attack':
    case 'success':
      return { color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-700/30' };
    case 'enemy_attack':
    case 'danger':
      return { color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-700/30' };
    case 'player_crit':
      return { color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-600/40' };
    case 'enemy_crit':
      return { color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-600/40' };
    case 'heal':
      return { color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-700/30' };
    case 'buff':
      return { color: 'text-cyan-400', bg: 'bg-cyan-900/20', border: 'border-cyan-700/30' };
    case 'debuff':
      return { color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-700/30' };
    case 'passive':
      return { color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-700/30' };
    case 'element_advantage':
      return { color: 'text-yellow-300', bg: 'bg-yellow-900/30', border: 'border-yellow-500/40' };
    case 'element_disadvantage':
      return { color: 'text-gray-400', bg: 'bg-gray-800/30', border: 'border-gray-600/30' };
    case 'victory':
    case 'gold':
      return { color: 'text-yellow-500', bg: 'bg-yellow-900/30', border: 'border-yellow-500/50' };
    case 'defeat':
      return { color: 'text-red-500', bg: 'bg-red-900/30', border: 'border-red-500/50' };
    case 'flee':
      return { color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-700/30' };
    case 'loot':
      return { color: 'text-purple-300', bg: 'bg-purple-900/20', border: 'border-purple-600/30' };
    case 'exp':
      return { color: 'text-cyan-300', bg: 'bg-cyan-900/20', border: 'border-cyan-600/30' };
    case 'warning':
      return { color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-700/30' };
    case 'info':
      return { color: 'text-blue-300', bg: 'bg-blue-900/10', border: 'border-blue-700/20' };
    case 'system':
      return { color: 'text-gray-500', bg: 'bg-gray-900/10', border: 'border-gray-700/20' };
    default:
      return { color: 'text-gray-300', bg: 'bg-gray-900/10', border: 'border-gray-700/20' };
  }
};

const getLogIcon = (type: string): React.ReactNode => {
  const size = 12;
  switch (type) {
    case 'player_attack':
    case 'success':
      return <Sword size={size} className="text-green-400" />;
      // PLACEHOLDER: player_attack_icon.png
      // Prompt: "sword slash attack icon green glow martial arts 16px transparent"
    case 'enemy_attack':
    case 'danger':
      return <Sword size={size} className="text-red-400 rotate-45" />;
      // PLACEHOLDER: enemy_attack_icon.png
      // Prompt: "red sword attack icon aggressive slash martial arts 16px transparent"
    case 'player_crit':
      return <Star size={size} className="text-yellow-400 fill-yellow-400" />;
      // PLACEHOLDER: crit_icon.png
      // Prompt: "golden star critical hit icon explosion martial arts 16px transparent"
    case 'enemy_crit':
      return <Skull size={size} className="text-orange-400" />;
      // PLACEHOLDER: enemy_crit_icon.png  
      // Prompt: "skull danger icon orange glow enemy critical martial arts 16px transparent"
    case 'heal':
      return <ResourceIcon type="hp" size={size} />;
      // PLACEHOLDER: heal_icon.png
      // Prompt: "green heart healing icon qi energy martial arts 16px transparent"
    case 'buff':
      return <ArrowUp size={size} className="text-cyan-400" />;
      // PLACEHOLDER: buff_icon.png
      // Prompt: "arrow up buff stat increase icon cyan glow martial arts 16px transparent"
    case 'debuff':
      return <ArrowDown size={size} className="text-purple-400" />;
      // PLACEHOLDER: debuff_icon.png
      // Prompt: "arrow down debuff stat decrease icon purple glow martial arts 16px transparent"
    case 'passive':
      return <Sparkles size={size} className="text-amber-400" />;
      // PLACEHOLDER: passive_icon.png
      // Prompt: "sparkles passive ability trigger icon golden glow martial arts 16px transparent"
    case 'element_advantage':
      return <ResourceIcon type="qi" size={size} />;
      // PLACEHOLDER: element_advantage_icon.png
      // Prompt: "lightning bolt element advantage icon yellow glow martial arts 16px transparent"
    case 'element_disadvantage':
      return <Shield size={size} className="text-gray-400" />;
      // PLACEHOLDER: element_disadvantage_icon.png
      // Prompt: "shield resist icon gray muted martial arts 16px transparent"
    case 'victory':
    case 'gold':
      return <Trophy size={size} className="text-yellow-500" />;
      // PLACEHOLDER: victory_icon.png
      // Prompt: "golden trophy victory icon laurel wreath martial arts 16px transparent"
    case 'defeat':
      return <Skull size={size} className="text-red-500" />;
    case 'flee':
      return <Wind size={size} className="text-blue-400" />;
      // PLACEHOLDER: flee_icon.png
      // Prompt: "wind speed lines escape flee icon blue martial arts 16px transparent"
    case 'loot':
      return <Sparkles size={size} className="text-purple-300" />;
      // PLACEHOLDER: loot_icon.png
      // Prompt: "treasure sparkle loot drop icon purple glow martial arts 16px transparent"
    case 'exp':
      return <Star size={size} className="text-cyan-300" />;
      // PLACEHOLDER: exp_icon.png
      // Prompt: "experience star level up icon cyan glow martial arts 16px transparent"
    case 'warning':
      return <AlertTriangle size={size} className="text-orange-400" />;
    case 'system':
      return <Scroll size={size} className="text-gray-500" />;
      // PLACEHOLDER: system_icon.png
      // Prompt: "scroll paper system message icon tan parchment martial arts 16px transparent"
    default:
      return <span className="w-3 h-3 rounded-full bg-gray-500" />;
  }
};

// ============================================
// COMBAT LOG ENTRY COMPONENT
// ============================================

interface CombatLogEntryProps {
  entry: CombatLogEntry;
  isNew?: boolean;
}

const CombatLogEntryComponent: React.FC<CombatLogEntryProps> = ({ entry, isNew }) => {
  const styles = getLogStyles(entry.type);
  const icon = getLogIcon(entry.type);
  
  // Parse text for element highlighting
  const renderText = (text: string) => {
    // Highlight damage numbers
    const parts = text.split(/(\d+)/g);
    return parts.map((part, i) => {
      if (/^\d+$/.test(part)) {
        // It's a number - highlight it
        const isLarge = parseInt(part) >= 50;
        return (
          <span 
            key={i} 
            className={`font-bold ${isLarge ? 'text-lg' : ''}`}
            style={{ 
              textShadow: entry.type.includes('crit') 
                ? '0 0 8px rgba(255, 200, 0, 0.6)' 
                : undefined 
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div 
      className={`
        flex items-start gap-2 px-2 py-1.5 rounded text-xs font-mono
        ${styles.bg} ${styles.border} border
        ${isNew ? 'animate-log-slide-in' : ''}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className={`flex-1 ${styles.color} leading-relaxed`}>
        {renderText(entry.text)}
      </div>
      {entry.element && (
        <div 
          className="flex-shrink-0"
          style={{ color: ELEMENT_COLORS[entry.element].primary }}
        >
          {ELEMENT_ICONS[entry.element]}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMBAT LOG COMPONENT
// ============================================

interface EnhancedCombatLogProps {
  entries: CombatLogEntry[];
  maxEntries?: number;
  className?: string;
}

export const EnhancedCombatLog: React.FC<EnhancedCombatLogProps> = ({ 
  entries, 
  maxEntries = 8,
  className = '' 
}) => {
  const logRef = useRef<HTMLDivElement>(null);
  const lastEntryRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [entries.length]);

  const displayedEntries = entries.slice(-maxEntries);

  return (
    <div 
      ref={logRef}
      className={`flex flex-col gap-1 overflow-y-auto custom-scrollbar ${className}`}
    >
      {displayedEntries.length === 0 ? (
        <div className="text-gray-500 text-xs text-center py-4 italic">
          Combat started...
        </div>
      ) : (
        displayedEntries.map((entry, index) => (
          <div 
            key={entry.id || index} 
            ref={index === displayedEntries.length - 1 ? lastEntryRef : null}
          >
            <CombatLogEntryComponent 
              entry={entry} 
              isNew={index === displayedEntries.length - 1}
            />
          </div>
        ))
      )}
    </div>
  );
};

// ============================================
// HELPER: Convert old log format to new format
// ============================================

export const convertLegacyLog = (
  log: { text: string; type: string }
): CombatLogEntry => {
  let newType: CombatLogType = 'info';
  
  const text = log.text.toLowerCase();
  
  // Detect type from content
  if (text.includes('victory') || text.includes('won')) newType = 'victory';
  else if (text.includes('defeat') || text.includes('pass out')) newType = 'defeat';
  else if (text.includes('escaped') || text.includes('flee')) newType = 'flee';
  else if (text.includes('heal') || text.includes('+') && text.includes('hp')) newType = 'heal';
  else if (text.includes('crit')) {
    newType = text.includes('enemy') || text.includes('mob') ? 'enemy_crit' : 'player_crit';
  }
  else if (text.includes('you hit') || text.includes('dealt')) newType = 'player_attack';
  else if (text.includes('hits for') || text.includes('attacks')) newType = 'enemy_attack';
  else if (text.includes('loot') || text.includes('found')) newType = 'loot';
  else if (text.includes('exp')) newType = 'exp';
  else if (text.includes('buff') || text.includes('boost')) newType = 'buff';
  else if (text.includes('debuff') || text.includes('weaken')) newType = 'debuff';
  else if (text.includes('passive') || text.includes('trigger')) newType = 'passive';
  
  // Map old types to new
  if (log.type === 'success') newType = 'player_attack';
  else if (log.type === 'danger') newType = 'enemy_attack';
  else if (log.type === 'gold') newType = 'gold';
  else if (log.type === 'warning') newType = 'warning';
  else if (log.type === 'info') newType = 'info';
  
  return {
    id: Date.now() + Math.random(),
    text: log.text,
    type: newType,
    timestamp: Date.now(),
  };
};

export default EnhancedCombatLog;

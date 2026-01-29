import React from 'react';
import { createPortal } from 'react-dom';
import { getRarityColor, getTierColor, getStatLabel } from '../utils/helpers';
import { Heart, Zap, Sparkles, Star, Shield, Flame, Droplet, Scroll, Sword, CircleDot, Award, Wrench, Package, Ticket, BarChart3, Hammer, Coins, Layers, Lightbulb, TrendingUp } from 'lucide-react';
import { uiFrameIcons } from '../utils/iconSystem';
import { ResourceIcon } from './ui/GameIcon';
import { RARITY_CONFIG, type ItemRarity, type SecondaryStatRoll } from '../data/raritySystem';

interface TooltipProps {
  hoverItem: any;
  mousePos: { x: number; y: number };
}

// ============================================
// RARITY VISUAL STYLES - BANG! VISUAL SYSTEM
// ============================================
const RARITY_STYLES: Record<ItemRarity, {
  border: string;
  glow: string;
  bg: string;
  headerBg: string;
  animation: string;
}> = {
  Mortal: {
    border: 'border-gray-400/60',
    glow: 'shadow-lg shadow-gray-900/50',
    bg: 'bg-gradient-to-b from-gray-800/98 to-gray-950/98',
    headerBg: 'bg-gradient-to-r from-gray-700/60 to-gray-800/60',
    animation: '',
  },
  Earth: {
    border: 'border-green-400/70',
    glow: 'shadow-lg shadow-green-900/40',
    bg: 'bg-gradient-to-b from-green-900/95 to-gray-950/98',
    headerBg: 'bg-gradient-to-r from-green-800/60 to-green-900/60',
    animation: '',
  },
  Heaven: {
    border: 'border-blue-400/80',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.35),0_0_40px_rgba(59,130,246,0.15)]',
    bg: 'bg-gradient-to-b from-blue-900/95 to-gray-950/98',
    headerBg: 'bg-gradient-to-r from-blue-700/60 to-blue-800/60',
    animation: 'animate-pulse-subtle',
  },
  Spirit: {
    border: 'border-purple-400/80',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.45),0_0_50px_rgba(168,85,247,0.2)]',
    bg: 'bg-gradient-to-b from-purple-900/95 to-gray-950/98',
    headerBg: 'bg-gradient-to-r from-purple-700/70 to-violet-800/70',
    animation: 'animate-spirit-glow',
  },
  Immortal: {
    border: 'border-amber-400/90',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5),0_0_60px_rgba(245,158,11,0.25),0_0_90px_rgba(245,158,11,0.1)]',
    bg: 'bg-gradient-to-b from-amber-900/95 via-orange-900/95 to-gray-950/98',
    headerBg: 'bg-gradient-to-r from-amber-700/80 via-orange-700/80 to-yellow-700/80',
    animation: 'animate-immortal-shine',
  },
};

// Helper to get consumable effect display
const getConsumableEffectDisplay = (item: any) => {
  if (!item || item.type !== 'consumable') return null;
  
  // Try multiple sources for effect type
  const effectType = item.effect || item.iconType || '';
  const itemName = (item.name || '').toLowerCase();
  
  // Determine amount - default based on type
  let amount = item.amount;
  if (!amount) {
    if (itemName.includes('hp') || effectType.includes('hp')) amount = 50;
    else if (itemName.includes('qi') || effectType.includes('qi')) amount = 30;
    else amount = 50;
  }
  
  // Detect HP pills
  if (effectType === 'hp' || effectType === 'hp_pill' || itemName.includes('hp')) {
    return { icon: <ResourceIcon type="hp" size={12} />, text: `Restores ${amount} HP`, color: 'text-red-300', hint: 'Use via pill buttons in World tab header' };
  }
  // Detect QI pills  
  if (effectType === 'qi' || effectType === 'qi_pill' || itemName.includes('qi')) {
    return { icon: <ResourceIcon type="qi" size={12} />, text: `Restores ${amount} QI`, color: 'text-blue-300', hint: 'Use via pill buttons in World tab header' };
  }
  // Foundation pill
  if (effectType === 'foundation_pill' || itemName.includes('foundation')) {
    return { icon: <Star size={12} className="text-amber-400" />, text: `Required for realm breakthrough`, color: 'text-amber-300', hint: 'Used automatically during breakthrough' };
  }
  // Golden pill
  if (effectType === 'golden_pill' || itemName.includes('golden')) {
    return { icon: <Sparkles size={12} className="text-yellow-400" />, text: `Required for Golden Core realm`, color: 'text-yellow-300', hint: 'Used automatically during breakthrough' };
  }
  
  return null;
};

// Get item type label with icons
const getItemTypeLabel = (item: any) => {
  const iconProps = { size: 10, className: 'inline mr-1' };
  if (item.type === 'consumable') return <span className="flex items-center gap-1"><Scroll {...iconProps} className="text-green-400" /> Consumable</span>;
  if (item.type === 'weapon') return <span className="flex items-center gap-1"><Sword {...iconProps} className="text-red-400" /> Weapon</span>;
  if (item.type === 'ring') return <span className="flex items-center gap-1"><CircleDot {...iconProps} className="text-yellow-400" /> Ring</span>;
  if (item.type === 'necklace') return <span className="flex items-center gap-1"><Award {...iconProps} className="text-cyan-400" /> Necklace</span>;
  if (item.type === 'material') return <span className="flex items-center gap-1"><Wrench {...iconProps} className="text-amber-400" /> Material</span>;
  if (item.type === 'junk') return <span className="flex items-center gap-1"><Package {...iconProps} className="text-gray-400" /> Junk</span>;
  if (item.type === 'token') return <span className="flex items-center gap-1"><Ticket {...iconProps} className="text-purple-400" /> Token</span>;
  return item.subtype || item.type;
};

// Map legacy rarity names to new Wuxia names
const LEGACY_TO_WUXIA: Record<string, ItemRarity> = {
  'Common': 'Mortal',
  'Uncommon': 'Earth',
  'Rare': 'Heaven',
  'Epic': 'Spirit',
  'Legendary': 'Immortal',
};

// Get normalized rarity (convert legacy to Wuxia)
const getNormalizedRarity = (rarity: string | undefined): ItemRarity | null => {
  if (!rarity) return null;
  if (RARITY_CONFIG[rarity as ItemRarity]) return rarity as ItemRarity;
  return LEGACY_TO_WUXIA[rarity] || null;
};

const Tooltip: React.FC<TooltipProps> = ({ hoverItem, mousePos }) => {
    // Don't render if no item or if mouse position is invalid (0,0)
    if (!hoverItem || (mousePos.x === 0 && mousePos.y === 0)) return null;
    
    // Tooltip dimensions
    const tooltipWidth = 290;
    const tooltipHeight = 350;
    const offset = 20;
    
    // Simple positioning: offset from cursor, clamped to viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Start with cursor position + offset
    let left = mousePos.x + offset;
    let top = mousePos.y + offset;
    
    // Flip to left side if would overflow right
    if (left + tooltipWidth > viewportWidth - 10) {
      left = mousePos.x - tooltipWidth - offset;
    }
    
    // Flip to top if would overflow bottom
    if (top + tooltipHeight > viewportHeight - 10) {
      top = mousePos.y - tooltipHeight - offset;
    }
    
    // Final clamp to ensure visibility
    left = Math.max(10, Math.min(left, viewportWidth - tooltipWidth - 10));
    top = Math.max(10, Math.min(top, viewportHeight - tooltipHeight - 10));
    
    const style: React.CSSProperties = { 
      position: 'fixed',
      top: `${top}px`, 
      left: `${left}px`,
      zIndex: 99999,
    };

    const consumableEffect = getConsumableEffectDisplay(hoverItem);
    const isConsumable = hoverItem.type === 'consumable';
    const isEquipment = ['weapon', 'ring', 'necklace'].includes(hoverItem.type);
    const isMaterial = hoverItem.type === 'material';
    const isJunk = hoverItem.type === 'junk';
    
    // Normalize rarity to Wuxia system
    const normalizedRarity = getNormalizedRarity(hoverItem.rarity);
    const rarityConfig = normalizedRarity ? RARITY_CONFIG[normalizedRarity] : null;
    
    // Get visual styles based on rarity - BANG! VISUAL SYSTEM
    const rarityStyles = normalizedRarity ? RARITY_STYLES[normalizedRarity] : RARITY_STYLES.Mortal;
    
    // Rarity grade badge display with GLOW effect
    const getRarityBadge = () => {
      if (!rarityConfig || !normalizedRarity) return null;
      const badgeStyles: Record<ItemRarity, string> = {
        'Immortal': 'bg-gradient-to-r from-amber-800/80 to-orange-800/80 text-amber-200 border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
        'Spirit': 'bg-gradient-to-r from-purple-800/80 to-violet-800/80 text-purple-200 border-purple-400/60 shadow-[0_0_8px_rgba(168,85,247,0.4)]',
        'Heaven': 'bg-gradient-to-r from-blue-800/80 to-cyan-800/80 text-blue-200 border-blue-400/60 shadow-[0_0_6px_rgba(59,130,246,0.3)]',
        'Earth': 'bg-gradient-to-r from-green-800/80 to-emerald-800/80 text-green-200 border-green-400/60',
        'Mortal': 'bg-gray-800/60 text-gray-300 border-gray-500/50',
      };
      return (
        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${badgeStyles[normalizedRarity]}`}>
          {rarityConfig.displayName}
        </span>
      );
    };

    // Get corner decorations for higher rarities
    const getCornerDecorations = () => {
      if (!normalizedRarity || normalizedRarity === 'Mortal' || normalizedRarity === 'Earth') return null;
      
      const decorColor = {
        Heaven: 'bg-blue-400',
        Spirit: 'bg-purple-400',
        Immortal: 'bg-amber-400',
      }[normalizedRarity];
      
      return (
        <>
          {/* Top corners */}
          <div className={`absolute -top-0.5 -left-0.5 w-3 h-3 ${decorColor} opacity-60`} style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
          <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 ${decorColor} opacity-60`} style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />
          {/* Bottom corners */}
          <div className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 ${decorColor} opacity-60`} style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }} />
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${decorColor} opacity-60`} style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
        </>
      );
    };

    const tooltipContent = (
        <div 
            className={`w-72 pointer-events-none backdrop-blur-md border-2 rounded-xl overflow-hidden ${rarityStyles.border} ${rarityStyles.glow} ${rarityStyles.bg} ${rarityStyles.animation}`}
            style={style}
        >
            {/* Corner decorations for rare+ items */}
            {getCornerDecorations()}
            
            {/* Header section with gradient */}
            <div className={`px-4 py-2.5 ${rarityStyles.headerBg} border-b border-white/10`}>
                {/* Name & Rarity Badge */}
                <div className="flex items-center justify-between gap-2">
                    <div className={`text-sm font-serif font-bold ${getRarityColor(hoverItem.rarity)} drop-shadow-lg`}>
                      {hoverItem.name}
                    </div>
                    {getRarityBadge()}
                </div>
            
                {/* Type & Tier */}
                <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-gray-400 italic">{getItemTypeLabel(hoverItem)}</span>
                    {hoverItem.tier && (
                        <span className={`text-[10px] font-bold ${getTierColor(hoverItem.tier)} px-1.5 py-0.5 rounded bg-black/30`}>
                          Tier {hoverItem.tier}
                        </span>
                    )}
                </div>
            </div>
            
            {/* Content section */}
            <div className="p-4 flex flex-col gap-1.5">

            {/* Description */}
            <div className="text-[10px] text-gray-300 italic leading-relaxed">{hoverItem.desc}</div>

            {/* CONSUMABLE EFFECTS */}
            {isConsumable && consumableEffect && (
                <div className="mt-1 pt-2 border-t border-green-500/30 bg-green-900/20 rounded p-2">
                    <div className="text-[9px] text-green-400 uppercase font-bold mb-1 flex items-center gap-1">
                        <ResourceIcon type="hp" size={10} /> Use Effect
                    </div>
                    <div className="flex items-center gap-2">
                        {consumableEffect.icon}
                        <span className={`text-[11px] font-bold ${consumableEffect.color}`}>{consumableEffect.text}</span>
                    </div>
                    <div className="text-[9px] text-green-300 mt-2 bg-green-800/30 px-2 py-1 rounded border border-green-500/20 flex items-center gap-1">
                        <Lightbulb size={10} className="text-green-400" /> {consumableEffect.hint}
                    </div>
                </div>
            )}

            {/* EQUIPMENT STATS */}
            {isEquipment && hoverItem.stats && Object.keys(hoverItem.stats).length > 0 && (
                <div className="mt-1 pt-2 border-t border-cyan-500/30">
                    <div className="text-[9px] text-cyan-400 uppercase font-bold mb-1 flex items-center gap-1">
                        <BarChart3 size={10} className="text-cyan-400" /> Stats
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        {Object.entries(hoverItem.stats).map(([key, val]) => {
                            const statData = getStatLabel(key);
                            return (
                                <div key={key} className="flex justify-between text-[10px]">
                                    <span className={`uppercase font-bold ${statData.color}`}>{statData.name}</span>
                                    <span className="text-white">+{String(val)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SECONDARY STATS (from rarity system) */}
            {isEquipment && hoverItem.secondaryStats && hoverItem.secondaryStats.length > 0 && (
                <div className="mt-1 pt-2 border-t border-purple-500/30 bg-purple-900/10 rounded p-2">
                    <div className="text-[9px] text-purple-400 uppercase font-bold mb-1 flex items-center gap-1">
                        <TrendingUp size={10} className="text-purple-400" /> Bonus Stats
                    </div>
                    <div className="flex flex-col gap-0.5">
                        {hoverItem.secondaryStats.map((stat: SecondaryStatRoll, idx: number) => (
                            <div key={idx} className="flex justify-between text-[10px]">
                                <span className="text-purple-300">{stat.name}</span>
                                <span className="text-purple-200 font-bold">+{stat.value}{stat.suffix}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SET BONUS (for equipment with set bonus) */}
            {isEquipment && hoverItem.setBonus && (
                <div className="mt-1 text-[9px] text-amber-400 flex items-center gap-1">
                    <Zap size={10} className="text-amber-500" /> Set Bonus: +{hoverItem.setBonus}% damage
                </div>
            )}

            {/* SPECIAL EFFECTS for Epic/Legendary gear */}
            {hoverItem.specialEffects && hoverItem.specialEffects.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-500/30 bg-purple-900/10 rounded p-2">
                    <div className="text-[9px] text-purple-400 uppercase font-bold mb-1 flex items-center gap-1">
                        <Sparkles size={10} className="text-purple-400" /> Special Effects
                    </div>
                    {hoverItem.specialEffects.map((effect: string, idx: number) => (
                        <div key={idx} className="text-[10px] text-purple-300 flex items-start gap-1">
                            <span className="text-purple-500">•</span>
                            <span>{effect}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* MATERIAL INFO */}
            {isMaterial && (
                <div className="mt-1 pt-2 border-t border-amber-500/30">
                    <div className="text-[9px] text-amber-400 flex items-center gap-1">
                        <Hammer size={10} className="text-amber-500" /> Used in crafting
                    </div>
                </div>
            )}

            {/* JUNK INFO - Sell Value */}
            {isJunk && hoverItem.sellValue && (
                <div className="mt-2 pt-2 border-t border-gray-500/30 bg-gray-800/30 rounded p-2">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400 flex items-center gap-1"><Coins size={12} className="text-yellow-400" /> Sell Value:</span>
                        <span className="text-cyan-400 font-bold">{hoverItem.sellValue} Spirit Stones</span>
                    </div>
                </div>
            )}

            {/* Stack count if applicable */}
            {hoverItem.count && hoverItem.count > 1 && (
                <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-gray-400 flex items-center gap-1">
                    <Layers size={10} /> Stack: {hoverItem.count}/99
                </div>
            )}
            </div>
        </div>
    );
    
    // Use portal to render directly in document.body, avoiding any CSS container issues
    return createPortal(tooltipContent, document.body);
};

export default Tooltip;

import React from 'react';
import { Sword, Shield, CircleDot, Award, Hexagon } from 'lucide-react';
import { getItemById, getRarityColor } from '../utils/helpers';
import { RARITY_CONFIG, type ItemRarity } from '../data/raritySystem';

// Map legacy rarity names to new Wuxia names for styling
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

interface GearSlotProps {
  label: string;
  itemId: string | null | undefined;
  type: string;
  setHoverItem: (item: any) => void;
  setMousePos: (pos: { x: number; y: number }) => void;
}

const GearSlot: React.FC<GearSlotProps> = ({ label, itemId, type, setHoverItem, setMousePos }) => {
    const item = getItemById(itemId || "");
    const normalizedRarity = getNormalizedRarity(item?.rarity);
    const rarityConfig = normalizedRarity ? RARITY_CONFIG[normalizedRarity] : null;
    
    // Determine border and glow classes based on rarity
    const getBorderClass = () => {
      if (!item || !normalizedRarity) return 'border-white/5 hover:border-amber-500/50';
      switch (normalizedRarity) {
        case 'Immortal': return 'border-amber-500/60 hover:border-amber-400 shadow-lg shadow-amber-500/20 animate-pulse';
        case 'Spirit': return 'border-purple-500/50 hover:border-purple-400 shadow-lg shadow-purple-500/15';
        case 'Heaven': return 'border-blue-500/40 hover:border-blue-400';
        case 'Earth': return 'border-green-500/40 hover:border-green-400';
        case 'Mortal': return 'border-gray-500/30 hover:border-gray-400';
        default: return 'border-white/10 hover:border-gray-400';
      }
    };
    
    const getIconBorderClass = () => {
      if (!item || !normalizedRarity) return 'border-white/10 bg-black text-gray-500';
      switch (normalizedRarity) {
        case 'Immortal': return 'border-amber-500 bg-amber-500/20 text-amber-400';
        case 'Spirit': return 'border-purple-500 bg-purple-500/15 text-purple-400';
        case 'Heaven': return 'border-blue-500 bg-blue-500/10 text-blue-400';
        case 'Earth': return 'border-green-500 bg-green-500/10 text-green-400';
        case 'Mortal': return 'border-gray-500 bg-gray-500/10 text-gray-400';
        default: return 'border-gray-500 bg-gray-500/10 text-gray-400';
      }
    };
    
    return (
        <div 
          className={`flex items-center gap-3 bg-[#151820] p-2 rounded border relative group transition-all ${getBorderClass()}`}
          onMouseEnter={(e) => { if(item) { setHoverItem(item); setMousePos({x: e.clientX, y: e.clientY}); } }}
          onMouseMove={(e) => { if(item) { setMousePos({x: e.clientX, y: e.clientY}); } }}
          onMouseLeave={() => setHoverItem(null)}
        >
            <div className={`w-8 h-8 rounded flex items-center justify-center border ${getIconBorderClass()}`}>
                {type === 'weapon' ? <Sword size={14}/> : type === 'armor' ? <Shield size={14}/> : type==='ring'?<CircleDot size={14}/> : type==='amulet'?<Award size={14}/> : <Hexagon size={14}/>}
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] text-gray-500 uppercase font-bold">{label}</span>
                <span className={`text-xs font-bold ${item ? getRarityColor(item.rarity) : 'text-gray-600'}`}>{item ? item.name : "Empty"}</span>
            </div>
        </div>
    );
};

export default GearSlot;

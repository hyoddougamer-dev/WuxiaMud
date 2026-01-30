import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Heart, Zap, Shield, Swords, Activity, Star, Plus, Flame, Wind, Sparkles, Sword, RefreshCw, Award, Crown, Target, BookOpen, X, CircleDot, Package, Music, Trash2, Gem, Users, LogOut, Lock, Settings, AlertTriangle, TrendingUp } from 'lucide-react';
import { getLevelInfo, getStatAbbr } from '../../utils/helpers';
import { ItemIcon, SpiritStoneIcon } from '../ItemIcon';
import { getPlayerSprite } from '../../data/combatAssets';
import { getRarityMultiplier, RARITY_CONFIG, type ItemRarity } from '../../data/raritySystem';
import { ResourceIcon } from '../ui/GameIcon';

// Helper function to get skill icon image path
const getSkillIconPath = (skill: any): string => {
    if (!skill) return '';
    const elementFolderMap: Record<string, string> = {
        'Fire': 'fire',
        'Ice': 'ice',
        'Lightning': 'lightning',
        'Wood': 'wood',
        'Void': 'void',
        'None': 'universal'
    };
    const folder = elementFolderMap[skill.element] || 'fire';
    return `/assets/combat/skills/${folder}/${skill.id.toLowerCase()}.png`;
};

interface CharacterPageProps {
  player: any;
  totalStats: any;
  combatStats: any;
  skills: any[];
  allSkills: any[];
  selectedClass: string | null;
  hybridClassSystem: any[];
  inventory?: any[];
  onAllocateStat: (statId: string) => void;
  onOpenResetConfirm: () => void;
  onOpenClassSelector: () => void;
  onOpenSkillModal: () => void;
  onUnequip: (slot: string) => void;
  onEquip?: (item: any) => void;
  onHardReset?: () => void;
  onSwitchCharacter?: () => void;
  GearSlot: React.FC<any>;
  setHoverItem?: (item: any) => void;
  setMousePos?: (pos: {x: number, y: number}) => void;
}

const statsConfig = [
  { id: 'str', label: 'Ox Power', icon: <Sword size={14} className="text-red-400"/>, color: 'text-red-400', barColor: 'bg-red-500' },
  { id: 'dex', label: 'Wind Walk', icon: <Wind size={14} className="text-emerald-400"/>, color: 'text-emerald-400', barColor: 'bg-emerald-500' },
  { id: 'con', label: 'Golden Body', icon: <Shield size={14} className="text-yellow-400"/>, color: 'text-yellow-400', barColor: 'bg-yellow-500' },
  { id: 'spi', label: 'Dao Mind', icon: <Zap size={14} className="text-cyan-400"/>, color: 'text-cyan-400', barColor: 'bg-cyan-500' },
  { id: 'wil', label: 'Heart Demon', icon: <Flame size={14} className="text-purple-400"/>, color: 'text-purple-400', barColor: 'bg-purple-500' },
];

// Slot to gear type mapping (only 3 equipment slots)
const slotToGearType: Record<string, string[]> = {
  weapon: ['weapon'],
  ring: ['ring'],
  necklace: ['necklace', 'amulet'],
};

export const CharacterPage: React.FC<CharacterPageProps> = ({
  player,
  totalStats,
  combatStats,
  skills,
  allSkills,
  selectedClass,
  hybridClassSystem,
  inventory = [],
  onAllocateStat,
  onOpenResetConfirm,
  onOpenClassSelector,
  onOpenSkillModal,
  onUnequip,
  onEquip,
  onHardReset,
  onSwitchCharacter,
  GearSlot,
  setHoverItem: globalSetHoverItem,
  setMousePos: globalSetMousePos,
}) => {
  const currentClass = hybridClassSystem?.find(c => c.id === selectedClass);
  const equipment = player.equipment || {};
  
  // State for equipment selection modal
  const [equipmentModal, setEquipmentModal] = useState<{slot: string, label: string} | null>(null);
  
  // Use global hover handlers if provided, otherwise use local state (fallback)
  const [localHoverItem, setLocalHoverItem] = useState<any>(null);
  const [localMousePos, setLocalMousePos] = useState({ x: 0, y: 0 });
  
  const setHoverItem = globalSetHoverItem || setLocalHoverItem;
  const setMousePos = globalSetMousePos || setLocalMousePos;
  
  // Ref to track the equipment panel for better tooltip cleanup
  const equipmentPanelRef = useRef<HTMLDivElement>(null);
  
  // Clear tooltip when mouse leaves the document or moves outside equipment area
  useEffect(() => {
    const handleMouseLeaveDocument = () => {
      setHoverItem(null);
    };
    
    document.addEventListener('mouseleave', handleMouseLeaveDocument);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeaveDocument);
    };
  }, []);
  
  // Callback to safely clear hover item
  const clearHoverItem = useCallback(() => {
    setHoverItem(null);
  }, []);
  
  // Get available items for a slot
  const getAvailableItemsForSlot = (slot: string) => {
    const validTypes = slotToGearType[slot] || [];
    return inventory.filter(item => {
      const itemType = item.type?.toLowerCase() || '';
      const itemSlot = item.slot?.toLowerCase() || '';
      return validTypes.includes(itemType) || validTypes.includes(itemSlot);
    });
  };

  // Helper to get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'border-gray-500 bg-gray-900/50';
      case 'Uncommon': return 'border-green-500 bg-green-900/30';
      case 'Rare': return 'border-blue-500 bg-blue-900/30';
      case 'Epic': return 'border-purple-500 bg-purple-900/30';
      case 'Legendary': return 'border-amber-500 bg-amber-900/30';
      default: return 'border-gray-600 bg-gray-900/30';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'Epic': return 'shadow-purple-500/30 shadow-lg';
      case 'Legendary': return 'shadow-amber-500/50 shadow-xl animate-pulse';
      default: return '';
    }
  };

  // Equipment slot component
  const EquipmentSlot = ({ slot, label, icon, fullWidth = false }: { slot: string; label: string; icon: React.ReactNode; fullWidth?: boolean }) => {
    const item = equipment[slot];
    
    const handleMouseEnter = (e: React.MouseEvent) => {
      if (item) {
        setHoverItem(item);
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
      if (item) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    
    const handleMouseLeave = () => {
      setHoverItem(null);
    };
    
    return (
      <div 
        className="relative group"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className={`
            w-full ${fullWidth ? 'h-20' : 'h-24'} rounded-lg border-2 transition-all duration-200
            ${item 
              ? `${getRarityColor(item.rarity)} ${getRarityGlow(item.rarity)} cursor-pointer` 
              : 'border-dashed border-gray-600/50 bg-[#0a0c10] hover:border-gray-500'
            }
          `}
        >
          {item ? (
            <div className={`p-2 h-full flex ${fullWidth ? 'gap-2' : 'flex-col items-center justify-center gap-1'}`}>
              {/* Item Icon */}
              <div className={`${fullWidth ? 'w-14 h-14' : 'w-12 h-12'} flex items-center justify-center shrink-0`}>
                <ItemIcon item={item} size="xl" />
              </div>
              {/* Item Info */}
              <div className={`flex flex-col ${fullWidth ? 'flex-1 justify-between min-w-0' : 'items-center text-center'}`}>
                <div className={`flex ${fullWidth ? 'items-start justify-between' : 'flex-col items-center'}`}>
                  <div className={`${fullWidth ? 'flex-1 min-w-0' : 'w-full'}`}>
                    <div className={`text-[10px] font-bold ${fullWidth ? 'truncate' : 'line-clamp-2'} ${
                      item.rarity === 'Legendary' ? 'text-amber-400' :
                      item.rarity === 'Epic' ? 'text-purple-400' :
                      item.rarity === 'Rare' ? 'text-blue-400' :
                      item.rarity === 'Uncommon' ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {item.name}
                    </div>
                    {fullWidth && <div className="text-[8px] text-gray-500">{item.rarity}</div>}
                  </div>
                  {fullWidth && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onUnequip(slot); }}
                      className="w-5 h-5 rounded-full bg-red-900/50 border border-red-500/30 flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={10} className="text-red-300" />
                    </button>
                  )}
                </div>
                <div className={`flex gap-1 ${fullWidth ? 'flex-wrap' : 'flex-wrap justify-center mt-1'}`}>
                  {item.stats && Object.entries(item.stats).map(([stat, val]) => (
                    <span key={stat} className={`text-[8px] px-1 rounded ${
                      stat === 'str' ? 'bg-red-900/50 text-red-300' :
                      stat === 'dex' ? 'bg-emerald-900/50 text-emerald-300' :
                      stat === 'con' ? 'bg-yellow-900/50 text-yellow-300' :
                      stat === 'spi' ? 'bg-cyan-900/50 text-cyan-300' :
                      'bg-purple-900/50 text-purple-300'
                    }`}>
                      +{val as number} {getStatAbbr(stat)}
                    </span>
                  ))}
                </div>
                {/* Unequip button for non-fullWidth slots */}
                {!fullWidth && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onUnequip(slot); }}
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-900/50 border border-red-500/30 flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={8} className="text-red-300" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div 
              className="h-full flex flex-col items-center justify-center text-gray-600 cursor-pointer hover:text-gray-400"
              onClick={() => setEquipmentModal({ slot, label })}
            >
              {icon}
              <span className="text-[9px] mt-1">{label}</span>
              <span className="text-[8px] text-cyan-500 group-hover:text-cyan-400">Click to equip</span>
            </div>
          )}
        </div>
        <div className="absolute -top-2 left-2 px-2 py-0.5 bg-[#0a0c10] text-[8px] text-gray-500 uppercase tracking-wider">
          {label}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-auto">
      {/* LEFT: Base Attributes + Combat Stats */}
      <aside className="w-full md:w-72 lg:w-80 bg-[#0a0c10] border-b md:border-b-0 md:border-r border-[#2a2f3a] p-3 md:p-4 flex flex-col gap-3 md:gap-4 overflow-visible md:overflow-y-auto flex-shrink-0">
        {/* Player Header */}
        <div className="flex items-center gap-3 p-2 md:p-3 bg-[#151820] rounded-lg border border-[#2a2f3a]">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
            {player.avatar ? <img src={player.avatar} className="w-full h-full rounded-full object-cover" /> : <User size={24} className="text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base md:text-lg font-serif font-bold text-amber-400 truncate">{player.name}</h2>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span>Lv.{player.level}</span>
              <span>•</span>
              <span className="text-purple-300 truncate">{player.realm}</span>
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div className="bg-[#151820] p-3 rounded-lg border border-[#2a2f3a] space-y-2">
          <div className="flex items-center gap-2">
            <ResourceIcon type="hp" size={14} />
            <div className="flex-1 h-2 bg-[#1a1d24] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-600 to-red-400" style={{width: `${(player.hp / player.maxHp) * 100}%`}}></div>
            </div>
            <span className="text-[10px] text-red-400 font-mono w-16 text-right">{player.hp}/{player.maxHp}</span>
          </div>
          <div className="flex items-center gap-2">
            <ResourceIcon type="qi" size={14} />
            <div className="flex-1 h-2 bg-[#1a1d24] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400" style={{width: `${(player.qi / player.maxQi) * 100}%`}}></div>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono w-16 text-right">{player.qi}/{player.maxQi}</span>
          </div>
          <div className="flex items-center gap-2">
            <ResourceIcon type="exp" size={14} />
            <div className="flex-1 h-2 bg-[#1a1d24] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{width: `${(player.exp / (getLevelInfo(player.level)?.req || 2200)) * 100}%`}}></div>
            </div>
            <span className="text-[10px] text-amber-400 font-mono w-20 text-right">{player.exp}/{getLevelInfo(player.level)?.req || 2200}</span>
          </div>
        </div>

        {/* Base Attributes */}
        <div>
          <div className="flex justify-between items-end border-b border-[#2a2f3a] pb-2 mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Base Attributes</h3>
            <div className="flex items-center gap-2">
              {player.ap > 0 && <span className="text-[10px] text-amber-500 font-bold animate-pulse">{player.ap} AP</span>}
              <button onClick={onOpenResetConfirm} className="text-[10px] text-gray-500 hover:text-cyan-400 font-bold flex items-center gap-1">
                <RefreshCw size={10} /> Reset
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {statsConfig.map(stat => (
              <div key={stat.id} className="group">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-white transition-colors">
                    {stat.icon}
                    <span className="text-[11px] font-bold uppercase">{stat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm font-bold ${stat.color}`}>{totalStats[stat.id]}</span>
                    {player.ap > 0 && (
                      <button onClick={() => onAllocateStat(stat.id)} className="w-4 h-4 bg-amber-600 hover:bg-amber-500 text-black flex items-center justify-center rounded text-[10px]">
                        <Plus size={10} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-1 w-full bg-[#1a1d24] rounded-full overflow-hidden">
                  <div className={`h-full ${stat.barColor} opacity-50`} style={{width: `${Math.min(totalStats[stat.id] * 2, 100)}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Combat Stats */}
        <div>
          <div className="border-b border-[#2a2f3a] pb-2 mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Combat Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="flex justify-between px-2 py-1 bg-[#151820] rounded border border-white/5"><span className="text-gray-500">P.Atk</span><span className="text-red-300 font-bold">{combatStats.pAtk}</span></div>
            <div className="flex justify-between px-2 py-1 bg-[#151820] rounded border border-white/5"><span className="text-gray-500">M.Atk</span><span className="text-cyan-300 font-bold">{combatStats.mAtk}</span></div>
            <div className="flex justify-between px-2 py-1 bg-[#151820] rounded border border-white/5"><span className="text-gray-500">Def</span><span className="text-yellow-300 font-bold">{combatStats.def}</span></div>
            <div className="flex justify-between px-2 py-1 bg-[#151820] rounded border border-white/5"><span className="text-gray-500">Crit</span><span className="text-emerald-300 font-bold">{combatStats.crit}%</span></div>
            <div className="flex justify-between px-2 py-1 bg-[#151820] rounded border border-white/5"><span className="text-gray-500">Dodge</span><span className="text-white font-bold">{combatStats.dodge}%</span></div>
            <div className="flex justify-between px-2 py-1 bg-[#151820] rounded border border-white/5"><span className="text-gray-500">Acc</span><span className="text-purple-300 font-bold">{combatStats.accuracy}%</span></div>
          </div>
        </div>
      </aside>

      {/* CENTER: Martial Path + Skills */}
      <main className="flex-1 flex flex-col p-3 md:p-6 overflow-y-auto bg-gradient-to-b from-[#0a0c10] to-[#050608]">
        {/* Martial Path */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-wrap justify-between items-center border-b border-[#2a2f3a] pb-2 mb-3 md:mb-4 gap-2">
            <h3 className="flex items-center gap-2 text-base md:text-lg font-serif font-bold text-amber-400">
              <Sword size={18} /> Martial Path
            </h3>
            <button onClick={onOpenClassSelector} className="text-xs md:text-sm text-amber-500 hover:text-amber-300 font-bold px-2 md:px-3 py-1 bg-amber-600/10 border border-amber-500/30 rounded hover:bg-amber-600/20 transition-all">
              {currentClass ? 'Change Path' : 'Select Path'}
            </button>
          </div>
          
          {currentClass ? (
            <div className="bg-gradient-to-r from-amber-900/30 via-amber-900/10 to-transparent p-6 rounded-xl border border-amber-500/30 shadow-lg shadow-amber-500/5">
              <div className="flex items-start gap-4">
                {/* Class Sprite */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={getPlayerSprite(currentClass.id)}
                    alt={currentClass.name}
                    className="h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                    onError={(e) => { 
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  {/* Fallback icon if sprite fails */}
                  <div className="hidden w-20 h-20 bg-gradient-to-br from-amber-600/40 to-red-900/40 rounded-xl flex items-center justify-center text-4xl border border-amber-500/40 shadow-inner">
                    {currentClass.icon || <Sword size={32} className="text-amber-400" />}
                  </div>
                  {/* Glow under sprite */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-amber-500/20 rounded-full blur-lg" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-2xl font-serif font-bold text-amber-400">{currentClass.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      currentClass.element === 'Fire' ? 'bg-red-900/50 border-red-500/30 text-red-300' :
                      currentClass.element === 'Ice' ? 'bg-blue-900/50 border-blue-500/30 text-blue-300' :
                      currentClass.element === 'Lightning' ? 'bg-yellow-900/50 border-yellow-500/30 text-yellow-300' :
                      currentClass.element === 'Poison' ? 'bg-green-900/50 border-green-500/30 text-green-300' :
                      currentClass.element === 'Shadow' ? 'bg-purple-900/50 border-purple-500/30 text-purple-300' :
                      'bg-white/10 border-white/20 text-gray-300'
                    }`}>
                      {currentClass.element}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-4 leading-relaxed italic border-l-2 border-amber-500/30 pl-3">
                    "{currentClass.description || 'A path towards immortality through martial prowess and spiritual enlightenment.'}"
                  </p>
                  
                  {/* Class Info Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-black/40 p-3 rounded-lg border border-white/10">
                      <div className="text-[9px] text-gray-500 uppercase mb-1">Primary Weapon</div>
                      <div className="text-sm text-white font-bold">{currentClass.weapon}</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg border border-white/10">
                      <div className="text-[9px] text-gray-500 uppercase mb-1">Role</div>
                      <div className="text-sm text-amber-400 font-bold">{currentClass.role || 'DPS'}</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg border border-white/10">
                      <div className="text-[9px] text-gray-500 uppercase mb-1">Difficulty</div>
                      <div className={`text-sm font-bold ${
                        currentClass.difficulty === 'Easy' ? 'text-green-400' :
                        currentClass.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>{currentClass.difficulty || 'Medium'}</div>
                    </div>
                  </div>
                  
                  {/* Stat Template */}
                  {currentClass.statTemplate && (
                    <div className="mb-4">
                      <div className="text-[9px] text-gray-500 uppercase mb-2">Recommended Stat Distribution</div>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(currentClass.statTemplate).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([stat, val]) => {
                          const statNames = {
                            str: 'Ox Power',
                            dex: 'Wind Walk',
                            con: 'Golden Body',
                            spi: 'Dao Mind',
                            wil: 'Heart Demon'
                          };
                          return (
                            <span key={stat} className={`text-[10px] px-2 py-1 rounded border ${
                              stat === 'str' ? 'bg-red-900/30 border-red-500/30 text-red-300' :
                              stat === 'dex' ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300' :
                              stat === 'con' ? 'bg-yellow-900/30 border-yellow-500/30 text-yellow-300' :
                              stat === 'spi' ? 'bg-cyan-900/30 border-cyan-500/30 text-cyan-300' :
                              'bg-purple-900/30 border-purple-500/30 text-purple-300'
                            }`}>
                              {statNames[stat] || stat}: {val as number}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Passive Ability */}
                  {currentClass.passive && (
                    <div className="bg-gradient-to-r from-purple-900/30 to-transparent p-3 rounded-lg border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={12} className="text-purple-400" />
                        <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">
                          Passive: {currentClass.passive.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 leading-relaxed mb-2">
                        {currentClass.passive.description || 'Unique ability that enhances your cultivation.'}
                      </p>
                      {currentClass.passive.mechanic && (
                        <p className="text-[9px] text-gray-500 italic flex items-center gap-1">
                          <Settings size={10} /> {currentClass.passive.mechanic}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#151820] p-8 rounded-xl border-2 border-dashed border-gray-600 text-center">
              <div className="text-5xl mb-4 opacity-30 flex justify-center"><Sword size={48} className="text-gray-600" /></div>
              <p className="text-gray-400 text-lg font-serif mb-2">The Dao awaits...</p>
              <p className="text-gray-600 text-sm mb-4">Select a Martial Path to begin your journey towards immortality.</p>
              <button onClick={onOpenClassSelector} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded transition-all">
                Choose Your Destiny
              </button>
            </div>
          )}
        </div>

        {/* Active Skills */}
        <div>
          <div className="flex justify-between items-center border-b border-[#2a2f3a] pb-2 mb-4">
            <h3 className="flex items-center gap-2 text-lg font-serif font-bold text-cyan-400">
              <Sparkles size={18} /> Active Skills
            </h3>
            <button onClick={onOpenSkillModal} className="text-sm text-amber-500 hover:text-amber-300 font-bold px-3 py-1 bg-amber-600/10 border border-amber-500/30 rounded hover:bg-amber-600/20 transition-all">
              Manage Skills
            </button>
          </div>
          
          <div className="flex gap-3 justify-center flex-wrap">
            {skills.map((sid, idx) => {
              const skill = sid ? allSkills.find(s => s.id === sid) : null;
              return (
                <div 
                  key={idx} 
                  onClick={onOpenSkillModal}
                  className={`w-14 h-14 bg-[#151820] border-2 ${skill ? 'border-cyan-500/50' : 'border-gray-600/30 border-dashed'} rounded-xl flex flex-col items-center justify-center hover:border-amber-500 cursor-pointer group relative transition-all hover:scale-110 overflow-hidden`}
                >
                  {skill ? (
                    <>
                      <img 
                        src={getSkillIconPath(skill)} 
                        alt={skill.name} 
                        className="w-10 h-10 object-contain"
                        onError={(e) => { 
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <span className="hidden text-2xl items-center justify-center">{skill.icon || '⚔️'}</span>
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-black text-[8px] flex items-center justify-center rounded-full font-bold">{idx + 1}</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="text-gray-600" />
                      <span className="text-[8px] text-gray-600">{idx + 1}</span>
                    </>
                  )}
                  {skill && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 text-[10px] rounded border border-cyan-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 z-50 pointer-events-none">
                      <span className="text-cyan-300">{skill.name}</span>
                      <span className="text-gray-500 ml-1">({skill.qiCost || skill.cost} Qi)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Available Skills Preview */}
          {selectedClass && allSkills.length > 0 && (
            <div className="mt-6 p-3 bg-[#0f1115] rounded-lg border border-cyan-500/20">
              <div className="text-[10px] text-cyan-400 uppercase font-bold mb-3 flex items-center gap-2">
                <BookOpen size={12} /> Skills for this Path
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {allSkills.filter(s => s.classId === selectedClass).slice(0, 4).map(skill => (
                  <div key={skill.id} className="flex items-center gap-2 p-2 bg-[#1a1d24] rounded border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer" onClick={onOpenSkillModal}>
                    <div className="w-10 h-10 rounded overflow-hidden flex items-center justify-center bg-black/30 relative">
                      <img 
                        src={getSkillIconPath(skill)} 
                        alt={skill.name} 
                        className="w-9 h-9 object-contain"
                        onError={(e) => { 
                          e.currentTarget.style.display = 'none'; 
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <span className="hidden text-2xl items-center justify-center">{skill.icon || '⚔️'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-200 truncate">{skill.name}</span>
                        <span className="text-[8px] text-gray-500">Lv.{skill.unlockLevel}</span>
                      </div>
                      <div className="text-[9px] text-gray-500 truncate">{skill.description}</div>
                    </div>
                    <span className="text-[9px] text-cyan-400 font-bold whitespace-nowrap flex items-center gap-0.5">{skill.qiCost}<ResourceIcon type="qi" size={10} /></span>
                  </div>
                ))}                  
              </div>
              <button 
                onClick={onOpenSkillModal}
                className="w-full mt-2 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold py-1.5 border border-cyan-500/30 rounded hover:bg-cyan-500/10 transition-all"
              >
                View All Skills →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT: Equipped Gear & Set Info */}
      <aside className="w-80 bg-[#0a0c10] border-l border-[#2a2f3a] p-4 flex flex-col overflow-y-auto">
        <div className="border-b border-[#2a2f3a] pb-2 mb-4">
          <h3 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <Shield size={14} className="text-purple-500" /> Equipment
          </h3>
        </div>
        
        {/* Active Equipment Slots - wrapped with onMouseLeave to clear tooltip */}
        <div 
          ref={equipmentPanelRef}
          className="space-y-4 flex-1"
          onMouseLeave={clearHoverItem}
        >
          {/* Weapon Slot - Full Width */}
          <EquipmentSlot 
            slot="weapon" 
            label="Weapon" 
            icon={<Sword size={20} className="text-gray-600" />}
            fullWidth={true}
          />
          
          {/* Ring + Necklace Row */}
          <div className="grid grid-cols-2 gap-3">
            <EquipmentSlot 
              slot="ring" 
              label="Ring" 
              icon={<CircleDot size={18} className="text-gray-600" />} 
            />
            <EquipmentSlot 
              slot="necklace" 
              label="Necklace" 
              icon={<Star size={18} className="text-gray-600" />} 
            />
          </div>
          
          {/* Reserved Slots (Locked) */}
          <div className="mt-4 pt-4 border-t border-[#2a2f3a]/50">
            <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Lock size={10} /> Future Slots
            </div>
            <div className="grid grid-cols-3 gap-2 opacity-50">
              {['Chest', 'Legs', 'Boots'].map((slotName) => (
                <div key={slotName} className="h-12 rounded border border-dashed border-gray-700/30 bg-[#050608] flex flex-col items-center justify-center">
                  <span className="text-[8px] text-gray-700">{slotName}</span>
                  <span className="text-[7px] text-gray-800">Coming Soon</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Equipment Stats Summary */}
        <div className="mt-4 pt-4 border-t border-[#2a2f3a]">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Activity size={12} className="text-cyan-500" /> Equipment Bonus
            <span className="text-[8px] text-gray-600 ml-auto">(includes rarity multiplier)</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {['str', 'dex', 'con', 'spi', 'wil'].map(stat => {
              const statLabels: Record<string, string> = {
                str: 'OXP',
                dex: 'WND',
                con: 'GLD',
                spi: 'DAO',
                wil: 'HRT'
              };
              const statFullNames: Record<string, string> = {
                str: 'Ox Power',
                dex: 'Wind Walk',
                con: 'Golden Body',
                spi: 'Dao Mind',
                wil: 'Heart Demon'
              };
              // Calculate bonus with rarity multiplier
              const bonus = Object.values(equipment).reduce((sum: number, item: any) => {
                if (item?.stats?.[stat]) {
                  const multiplier = getRarityMultiplier(item.rarity || 'Mortal');
                  return sum + Math.floor(item.stats[stat] * multiplier);
                }
                return sum;
              }, 0);
              return (
                <div key={stat} className={`text-center p-1 rounded ${bonus > 0 ? 'bg-[#151820]' : 'bg-transparent'}`} title={statFullNames[stat]}>
                  <div className={`text-[10px] font-bold ${
                    stat === 'str' ? 'text-red-400' :
                    stat === 'dex' ? 'text-emerald-400' :
                    stat === 'con' ? 'text-yellow-400' :
                    stat === 'spi' ? 'text-cyan-400' : 'text-purple-400'
                  }`}>
                    {bonus > 0 ? `+${bonus}` : '-'}
                  </div>
                  <div className="text-[7px] text-gray-600 uppercase">{statLabels[stat]}</div>
                </div>
              );
            })}
          </div>
          
          {/* Secondary Stats from Equipment */}
          {(() => {
            const secondaryBonuses: Record<string, number> = {};
            Object.values(equipment).forEach((item: any) => {
              if (item?.secondaryStats && Array.isArray(item.secondaryStats)) {
                item.secondaryStats.forEach((stat: any) => {
                  secondaryBonuses[stat.type] = (secondaryBonuses[stat.type] || 0) + stat.value;
                });
              }
            });
            
            const hasSecondary = Object.keys(secondaryBonuses).length > 0;
            if (!hasSecondary) return null;
            
            const statNames: Record<string, string> = {
              critChance: 'Crit%',
              critDamage: 'Crit DMG',
              hpBonus: 'HP',
              qiBonus: 'QI',
              dodge: 'Dodge%',
              block: 'Block%',
              lifeSteal: 'Life Steal%',
              qiRegen: 'QI/Turn',
              damageReduction: 'DMG Red%',
            };
            
            return (
              <div className="mt-2 pt-2 border-t border-purple-500/20">
                <div className="text-[9px] text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <TrendingUp size={10} /> Bonus Stats
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {Object.entries(secondaryBonuses).map(([type, value]) => (
                    <div key={type} className="flex justify-between text-[9px] bg-purple-900/20 px-2 py-1 rounded">
                      <span className="text-purple-300">{statNames[type] || type}</span>
                      <span className="text-purple-200 font-bold">+{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Set Bonus Indicator */}
        {(() => {
          const ring = equipment.ring;
          const necklace = equipment.necklace;
          const setNames: Record<number, string> = {
            1: 'Novice Cultivator',
            2: 'Foundation Seeker',
            3: "Heaven's Chosen",
            4: 'Golden Immortal',
          };
          const setBonuses: Record<number, string> = {
            1: '+1 All Stats',
            2: '+2 All Stats, +5% EXP',
            3: '+3 All Stats, +10% Resistance',
            4: '+5 All Stats, +20% Damage',
          };
          
          // Show set info even if not complete
          const hasSet = ring && necklace && ring.tier === necklace.tier;
          
          return (
            <div className="mt-4 pt-4 border-t border-[#2a2f3a]">
              <div 
                className={`p-3 rounded-lg border ${hasSet ? 'bg-gradient-to-r from-amber-900/30 to-transparent border-amber-500/30' : 'bg-[#151820] border-gray-700/30'}`}
                title="Equip Ring and Necklace of the same tier to activate set bonuses. Higher tier sets provide stronger bonuses!"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Award size={12} className={hasSet ? 'text-amber-400' : 'text-gray-500'} />
                  <span className={`text-[10px] font-bold uppercase ${hasSet ? 'text-amber-400' : 'text-gray-500'}`}>
                    {hasSet ? 'Set Active!' : 'Set Bonus'}
                  </span>
                  <span className="text-[8px] text-gray-600 ml-auto cursor-help" title="Equip Ring + Necklace of same tier">ⓘ</span>
                </div>
                {hasSet ? (
                  <>
                    <div className="text-[11px] text-amber-300 font-serif">{setNames[ring.tier] || 'Unknown Set'}</div>
                    <div className="text-[9px] text-gray-400 mt-1">{setBonuses[ring.tier] || ''}</div>
                  </>
                ) : (
                  <div className="text-[9px] text-gray-500">
                    {!ring && !necklace ? 'No accessories equipped' :
                     !ring ? 'Need Ring to complete set' :
                     !necklace ? 'Need Necklace to complete set' :
                     'Ring and Necklace tiers must match'}
                  </div>
                )}
              </div>
              
              {/* Set Tiers Reference */}
              {!hasSet && (
                <div className="mt-2 text-[8px] text-gray-600 space-y-0.5">
                  <div className="font-bold text-gray-500 mb-1">Available Sets:</div>
                  {Object.entries(setNames).map(([tier, name]) => (
                    <div key={tier} className="flex justify-between">
                      <span>T{tier} {name}</span>
                      <span className="text-gray-500">{setBonuses[Number(tier)]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Resources */}
        <div className="mt-4 pt-4 border-t border-[#2a2f3a]">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Currency</div>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#151820] p-3 rounded-lg border border-white/5 text-center flex flex-col items-center">
              <SpiritStoneIcon size="md" className="mb-1" />
              <div className="text-lg font-bold text-cyan-400">{player.spiritStones?.toLocaleString() || 0}</div>
              <div className="text-[8px] text-gray-500 uppercase">Spirit Stones</div>
            </div>
            <div className="flex-1 bg-[#151820] p-3 rounded-lg border border-white/5 text-center">
              <Gem size={20} className="text-purple-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-purple-400">{player.contribution?.toLocaleString() || 0}</div>
              <div className="text-[8px] text-gray-500 uppercase">Contribution</div>
            </div>
          </div>
        </div>
        
        {/* Switch Character Button */}
        {onSwitchCharacter && (
          <div className="mt-4 pt-4 border-t border-cyan-900/30">
            <button 
              onClick={onSwitchCharacter}
              className="w-full bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 hover:text-cyan-300 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Users size={14} />
              Switch Character
            </button>
            <p className="text-[9px] text-gray-600 mt-2 text-center">Your progress is saved automatically</p>
          </div>
        )}
        
        {/* Danger Zone - Reset Progress */}
        {onHardReset && (
          <div className="mt-4 pt-4 border-t border-red-900/30">
            <div className="text-[10px] text-red-500 uppercase tracking-widest mb-3 flex items-center gap-1"><AlertTriangle size={12} /> Danger Zone</div>
            <button 
              onClick={onHardReset}
              className="w-full bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-300 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 size={14} />
              Delete Save & Restart
            </button>
            <p className="text-[9px] text-gray-600 mt-2 text-center">This will permanently delete all progress!</p>
          </div>
        )}
      </aside>
      
      {/* Equipment Selection Modal */}
      {equipmentModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setEquipmentModal(null)}
        >
          <div 
            className="bg-[#151820] border border-[#2a2f3a] rounded-xl p-6 shadow-2xl w-96 max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-amber-400">
                Select {equipmentModal.label}
              </h3>
              <button 
                onClick={() => setEquipmentModal(null)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {getAvailableItemsForSlot(equipmentModal.slot).length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto text-gray-600 mb-3" size={48} />
                  <p className="text-gray-500">No {equipmentModal.label.toLowerCase()} available</p>
                  <p className="text-xs text-gray-600 mt-1">Find gear by looting monsters or crafting!</p>
                </div>
              ) : (
                getAvailableItemsForSlot(equipmentModal.slot).map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    onClick={() => {
                      if (onEquip) onEquip(item);
                      setEquipmentModal(null);
                    }}
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02]
                      ${getRarityColor(item.rarity)} ${getRarityGlow(item.rarity)}
                      hover:border-amber-500
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0a0c10] rounded-lg flex items-center justify-center">
                        <ItemIcon item={item} size="lg" />
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-bold ${
                          item.rarity === 'Legendary' ? 'text-amber-400' :
                          item.rarity === 'Epic' ? 'text-purple-400' :
                          item.rarity === 'Rare' ? 'text-blue-400' :
                          item.rarity === 'Uncommon' ? 'text-green-400' : 'text-gray-300'
                        }`}>
                          {item.name}
                        </div>
                        <div className="text-[10px] text-gray-500">{item.rarity} {item.type}</div>
                      </div>
                    </div>
                    {item.stats && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {Object.entries(item.stats).map(([stat, val]) => (
                          <span key={stat} className={`text-[9px] px-1.5 py-0.5 rounded ${
                            stat === 'str' ? 'bg-red-900/50 text-red-300' :
                            stat === 'dex' ? 'bg-emerald-900/50 text-emerald-300' :
                            stat === 'con' ? 'bg-yellow-900/50 text-yellow-300' :
                            stat === 'spi' ? 'bg-cyan-900/50 text-cyan-300' :
                            'bg-purple-900/50 text-purple-300'
                          }`}>
                            +{val as number} {getStatAbbr(stat)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

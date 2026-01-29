import React, { useState } from 'react';
import { Hammer, Sparkles, ChevronRight, Wrench, AlertTriangle, Sword, Trash2 } from 'lucide-react';
import { CraftingModal } from '../CraftingModal';
import { ReforgingModal } from '../ReforgingModal';
import { RARITY_CONFIG, type ItemRarity } from '../../data/raritySystem';

interface ForgePageProps {
  playerClass: number;
  playerMaterials: Record<string, number>;
  playerSpiritStones: number;
  onCraft: (result: any) => void;
  onReforge: (result: any) => void;
  onSalvage?: (item: any) => void; // New: Salvage callback
  inventory: any[];
  equippedGear?: Record<string, any>;
  onOpenRepair?: () => void;
}

// Legacy to Wuxia rarity mapping
const LEGACY_TO_WUXIA: Record<string, ItemRarity> = {
  'Common': 'Mortal',
  'Uncommon': 'Earth',
  'Rare': 'Heaven',
  'Epic': 'Spirit',
  'Legendary': 'Immortal',
};

// Get normalized rarity
const getNormalizedRarity = (rarity: string | undefined): ItemRarity => {
  if (!rarity) return 'Mortal';
  if (RARITY_CONFIG[rarity as ItemRarity]) return rarity as ItemRarity;
  return LEGACY_TO_WUXIA[rarity] || 'Mortal';
};

// Wuxia rarity colors
const rarityColors: Record<string, string> = {
  Mortal: 'border-gray-500 text-gray-300',
  Earth: 'border-green-500 text-green-300',
  Heaven: 'border-blue-500 text-blue-300',
  Spirit: 'border-purple-500 text-purple-300',
  Immortal: 'border-amber-500 text-amber-300',
  // Legacy fallbacks
  Common: 'border-gray-500 text-gray-300',
  Uncommon: 'border-green-500 text-green-300',
  Rare: 'border-blue-500 text-blue-300',
  Epic: 'border-purple-500 text-purple-300',
  Legendary: 'border-amber-500 text-amber-300',
};

export const ForgePage: React.FC<ForgePageProps> = ({
  playerClass,
  playerMaterials,
  playerSpiritStones,
  onCraft,
  onReforge,
  onSalvage,
  inventory = [],
  equippedGear = {},
  onOpenRepair,
}) => {
  const [showCrafting, setShowCrafting] = useState(false);
  const [showReforging, setShowReforging] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [forgeTab, setForgeTab] = useState<'craft' | 'reforge' | 'salvage'>('craft');

  // Check if any gear is damaged
  const damagedGearCount = ['weapon', 'ring', 'necklace'].filter(slot => {
    const gear = equippedGear[slot];
    return gear && (gear.durability ?? 100) < (gear.maxDurability ?? 100);
  }).length;

  const handleSelectItemForReforge = (item: any) => {
    setSelectedItem(item);
    setShowReforging(true);
  };

  // Filter only gear items that have a rarity and are not already Immortal
  // Check for weapon, ring, necklace types or gear type (no armor in first release)
  const reforgableItems = inventory.filter(i => {
    if (!i.rarity) return false;
    if (!(i.type === 'weapon' || i.type === 'ring' || i.type === 'necklace' || i.type === 'gear')) return false;
    const normalized = getNormalizedRarity(i.rarity);
    return normalized !== 'Immortal';
  });

  // All gear items can be salvaged
  const salvageableItems = inventory.filter(i => 
    (i.type === 'weapon' || i.type === 'ring' || i.type === 'necklace' || i.type === 'gear')
  );

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border-2 border-yellow-600/40 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Hammer className="text-yellow-400" size={32} />
            <div>
              <h2 className="text-2xl font-bold text-yellow-400 font-serif">Divine Forge</h2>
              <p className="text-sm text-gray-400">Craft legendary weapons and reforge their power</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Crafting Section */}
          <div className="bg-black/60 border-2 border-yellow-600/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all flex flex-col h-[400px]">
            <div className="text-center flex-1 flex flex-col">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-600/40 to-orange-600/40 rounded-full flex items-center justify-center">
                <Hammer className="text-yellow-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-yellow-300 mb-2">Weapon Crafting</h3>
              <p className="text-gray-400 text-sm mb-4">
                Forge new weapons from gathered materials
              </p>

              <button
                onClick={() => setShowCrafting(true)}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-black font-bold py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50"
              >
                <div className="flex items-center justify-center gap-2">
                  <Hammer size={20} />
                  Open Crafting Station
                </div>
              </button>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-black/40 border border-yellow-600/20 rounded p-3">
                  <p className="text-gray-400 text-xs">Materials</p>
                  <p className="text-yellow-400 font-bold text-lg">{Object.keys(playerMaterials).length}</p>
                </div>
                <div className="bg-black/40 border border-yellow-600/20 rounded p-3">
                  <p className="text-gray-400 text-xs">Spirit Stones</p>
                  <p className="text-yellow-400 font-bold text-lg">{playerSpiritStones}</p>
                </div>
              </div>
              
              {/* Spacer to push content up */}
              <div className="flex-1"></div>
            </div>
          </div>

          {/* Reforging Section */}
          <div className="bg-black/60 border-2 border-purple-600/30 rounded-xl p-6 hover:border-purple-500/50 transition-all flex flex-col h-[400px]">
            <div className="text-center flex-1 flex flex-col">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-600/40 to-pink-600/40 rounded-full flex items-center justify-center">
                <Sparkles className="text-purple-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-purple-300 mb-2">Weapon Reforging</h3>
              <p className="text-gray-400 text-sm mb-3">
                Select a weapon below to upgrade its rarity
              </p>

              {/* Weapon List for Reforging */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
                {reforgableItems.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-sm">No weapons available for reforging</p>
                  </div>
                ) : (
                  reforgableItems.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      onClick={() => handleSelectItemForReforge(item)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border-2 ${rarityColors[item.rarity] || 'border-gray-600'} bg-black/40 hover:bg-black/60 transition-all group`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.icon || <Sword size={20} className="text-gray-400" />}</span>
                        <div className="text-left">
                          <p className="font-bold text-sm">{item.name}</p>
                          <p className="text-[10px] text-gray-400">{item.rarity} • T{item.tier}</p>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-500 group-hover:text-white transition-colors" size={18} />
                    </button>
                  ))
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-black/40 border border-purple-600/20 rounded p-2">
                  <p className="text-gray-400 text-xs">Weapons</p>
                  <p className="text-purple-400 font-bold">{inventory.length}</p>
                </div>
                <div className="bg-black/40 border border-purple-600/20 rounded p-2">
                  <p className="text-gray-400 text-xs">Reforgeable</p>
                  <p className="text-purple-400 font-bold">{reforgableItems.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Repair Station */}
        <div className={`bg-black/60 border-2 rounded-xl p-6 ${damagedGearCount > 0 ? 'border-amber-500/50 bg-amber-950/20' : 'border-amber-600/30'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${damagedGearCount > 0 ? 'bg-gradient-to-br from-amber-500/40 to-orange-600/40 animate-pulse' : 'bg-gradient-to-br from-amber-600/20 to-orange-600/20'}`}>
                <Wrench className="text-amber-400" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-300 flex items-center gap-2">
                  <Hammer size={18} /> Blacksmith Repair
                  {damagedGearCount > 0 && (
                    <span className="text-xs px-2 py-1 bg-amber-500/30 border border-amber-500/50 rounded-full text-amber-200 animate-pulse">
                      {damagedGearCount} damaged
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-400">
                  {damagedGearCount > 0 
                    ? 'Your equipment needs repair! Damaged gear has reduced effectiveness.'
                    : 'All equipment is in good condition.'}
                </p>
              </div>
            </div>
            
            <button
              onClick={onOpenRepair}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                damagedGearCount > 0
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/30 hover:scale-105'
                  : 'bg-amber-900/30 border border-amber-600/30 text-amber-400 hover:bg-amber-900/50'
              }`}
            >
              <Wrench size={18} />
              {damagedGearCount > 0 ? 'Repair Now' : 'Check Equipment'}
            </button>
          </div>
          
          {damagedGearCount > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-400/80 bg-amber-950/30 rounded-lg px-3 py-2">
              <AlertTriangle size={14} />
              <span>Tip: Equipment at 0% durability provides no stat bonuses!</span>
            </div>
          )}
        </div>

        {/* Salvage Section */}
        <div className="bg-black/60 border-2 border-red-600/30 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-600/40 to-orange-600/40 rounded-full flex items-center justify-center">
              <Trash2 className="text-red-400" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-300 flex items-center gap-2">
                <Hammer size={18} /> Salvage Equipment
              </h3>
              <p className="text-sm text-gray-400">
                Dismantle unwanted gear for materials and spirit stones
              </p>
            </div>
          </div>

          {salvageableItems.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No equipment available for salvage
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
              {salvageableItems.map((item, idx) => {
                const normalized = getNormalizedRarity(item.rarity);
                const displayName = RARITY_CONFIG[normalized]?.displayName || item.rarity;
                return (
                  <button
                    key={item.id || idx}
                    onClick={() => onSalvage && onSalvage(item)}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 ${rarityColors[normalized] || rarityColors[item.rarity] || 'border-gray-600'} bg-black/40 hover:bg-red-900/30 transition-all group`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon || <Sword size={18} className="text-gray-400" />}</span>
                      <div className="text-left">
                        <p className="font-bold text-xs truncate max-w-[120px]">{item.name}</p>
                        <p className="text-[9px] text-gray-400">{displayName} • T{item.tier || 1}</p>
                      </div>
                    </div>
                    <Trash2 className="text-gray-500 group-hover:text-red-400 transition-colors" size={16} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCrafting && (
        <CraftingModal
          onClose={() => setShowCrafting(false)}
          playerClass={playerClass}
          playerMaterials={playerMaterials}
          playerSpiritStones={playerSpiritStones}
          onCraft={(result) => {
            onCraft(result);
          }}
        />
      )}

      {showReforging && selectedItem && (
        <ReforgingModal
          selectedGear={selectedItem}
          onClose={() => {
            setShowReforging(false);
            setSelectedItem(null);
          }}
          playerMaterials={playerMaterials}
          playerSpiritStones={playerSpiritStones}
          onReforge={(result) => {
            onReforge(result);
            // Close modal after reforge attempt
            setShowReforging(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
};

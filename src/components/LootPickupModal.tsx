// ============================================
// LOOT PICKUP MODAL - WuxiaMUD
// Post-combat loot selection interface
// Enhanced visual design with animations
// ============================================

import React, { useState, useEffect } from 'react';
import { X, Package, Sparkles, Check, CheckCheck, Trophy, Swords, CircleDot, Award, Wrench, Ticket, Coins, FileText } from 'lucide-react';
import { getRarityColor, getTierColor, getStatAbbr } from '../utils/helpers';
import { ItemIcon, SpiritStoneIcon } from './ItemIcon';
import { uiFrameIcons } from '../utils/iconSystem';
import { ResourceIcon } from './ui/GameIcon';

interface LootItem {
  id: string;
  name: string;
  type: string;
  tier?: number;
  rarity?: string;
  desc?: string;
  iconType?: string;
  sellValue?: number;
  stats?: Record<string, number>;
  specialEffects?: string[];
  effect?: string;
  amount?: number;
  [key: string]: any;
}

interface LootPickupModalProps {
  isOpen: boolean;
  loot: LootItem[];
  spiritStones: number;
  mobName: string;
  onClose: () => void;
  onLootSelected: (selectedItems: LootItem[], ignoredItems: LootItem[]) => void;
}

export const LootPickupModal: React.FC<LootPickupModalProps> = ({
  isOpen,
  loot,
  spiritStones,
  mobName,
  onClose,
  onLootSelected
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(loot.map(item => item.id))
  );
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedItems(new Set(loot.map(item => item.id)));
      setTimeout(() => setAnimateIn(true), 50);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen, loot]);

  if (!isOpen) return null;

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(loot.map(item => item.id)));
  };

  const selectNone = () => {
    setSelectedItems(new Set());
  };

  const handleConfirm = () => {
    const selected = loot.filter(item => selectedItems.has(item.id));
    const ignored = loot.filter(item => !selectedItems.has(item.id));
    onLootSelected(selected, ignored);
    onClose();
  };

  const handleLootAll = () => {
    onLootSelected(loot, []);
    onClose();
  };

  // Group loot by type for better display
  const groupedLoot = loot.reduce((acc, item) => {
    const type = item.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, LootItem[]>);

  const typeOrder = ['weapon', 'ring', 'necklace', 'consumable', 'material', 'token', 'junk'];
  const sortedTypes = Object.keys(groupedLoot).sort((a, b) => {
    const aIdx = typeOrder.indexOf(a);
    const bIdx = typeOrder.indexOf(b);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  const getTypeLabel = (type: string) => {
    const iconClass = "inline-block mr-1";
    switch (type) {
      case 'weapon': return <span className="flex items-center gap-1"><Swords size={12} /> Weapons</span>;
      case 'ring': return <span className="flex items-center gap-1"><CircleDot size={12} /> Rings</span>;
      case 'necklace': return <span className="flex items-center gap-1"><Award size={12} /> Necklaces</span>;
      case 'consumable': return <span className="flex items-center gap-1"><ResourceIcon type="hp" size={12} /> Consumables</span>;
      case 'material': return <span className="flex items-center gap-1"><Wrench size={12} /> Materials</span>;
      case 'token': return <span className="flex items-center gap-1"><Ticket size={12} /> Class Tokens</span>;
      case 'junk': return <span className="flex items-center gap-1"><Coins size={12} /> Vendor Trash</span>;
      default: return <span className="flex items-center gap-1"><FileText size={12} /> Other</span>;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'weapon': return 'text-red-400 border-red-500/30 bg-red-900/20';
      case 'ring': return 'text-purple-400 border-purple-500/30 bg-purple-900/20';
      case 'necklace': return 'text-blue-400 border-blue-500/30 bg-blue-900/20';
      case 'consumable': return 'text-green-400 border-green-500/30 bg-green-900/20';
      case 'material': return 'text-amber-400 border-amber-500/30 bg-amber-900/20';
      case 'token': return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20';
      case 'junk': return 'text-gray-400 border-gray-500/30 bg-gray-900/20';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-900/20';
    }
  };

  const getItemSubtext = (item: LootItem) => {
    if (item.type === 'consumable') {
      if (item.effect === 'hp' || item.iconType?.includes('hp')) return `+${item.amount || 50} HP`;
      if (item.effect === 'qi' || item.iconType?.includes('qi')) return `+${item.amount || 30} QI`;
    }
    if (item.sellValue) return <span className="flex items-center gap-1"><Coins size={10} /> {item.sellValue} SS</span>;
    if (item.stats && Object.keys(item.stats).length > 0) {
      return Object.entries(item.stats).map(([k, v]) => `+${v} ${getStatAbbr(k)}`).join(' ');
    }
    return item.desc?.substring(0, 40) || '';
  };

  const selectedCount = selectedItems.size;
  const totalCount = loot.length;
  const totalSellValue = loot
    .filter(item => selectedItems.has(item.id) && item.sellValue)
    .reduce((sum, item) => sum + (item.sellValue || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      {/* Modal Container */}
      <div 
        className={`relative w-[540px] max-h-[85vh] transition-all duration-300 ${animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        {/* Main content container */}
        <div className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 rounded-lg overflow-hidden flex flex-col max-h-[85vh] border-2 border-amber-600/60 shadow-2xl shadow-amber-900/30 wuxia-glow wuxia-corners">
        
        {/* Header with Victory Theme */}
        <div className="relative overflow-hidden wuxia-header">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 via-orange-500/10 to-amber-600/20"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
          
          <div className="relative px-6 py-5 border-b border-amber-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Trophy className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-amber-100 font-serif tracking-wide">Victory!</h2>
                  <p className="text-sm text-amber-400/80 flex items-center gap-1">
                    <Swords size={12} />
                    <span>Defeated: <span className="text-amber-300">{mobName}</span></span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Spirit Stones Banner - Auto-collected */}
        {spiritStones > 0 && (
          <div className="mx-4 mt-4 bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-cyan-900/40 rounded-xl p-4 border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-900/50 flex items-center justify-center border border-cyan-500/30">
                <SpiritStoneIcon size="md" />
              </div>
              <div>
                <span className="text-cyan-200 text-sm font-medium">Spirit Stones</span>
                <p className="text-[10px] text-cyan-400/70">Auto-collected</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-300 font-bold text-2xl">+{spiritStones}</span>
              <span className="text-[9px] text-green-400 bg-green-900/40 px-2 py-1 rounded-full border border-green-500/30 font-bold flex items-center gap-1"><Check size={10} /> AUTO</span>
            </div>
          </div>
        )}

        {/* Selection Controls */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            <span className="text-amber-400 font-bold text-lg">{selectedCount}</span>
            <span className="text-gray-500">/{totalCount} items selected</span>
            {totalSellValue > 0 && (
              <span className="ml-2 text-[10px] text-gray-500">(~{totalSellValue} SS value)</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs px-3 py-1.5 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1.5 hover:scale-105"
            >
              <CheckCheck size={12} /> Select All
            </button>
            <button
              onClick={selectNone}
              className="text-xs px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 rounded-lg border border-gray-600/30 transition-all hover:scale-105"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Loot List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
          {loot.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <Package size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg">No items dropped</p>
              <p className="text-sm text-gray-600">Better luck next time!</p>
            </div>
          ) : (
            sortedTypes.map(type => (
              <div key={type} className="space-y-2">
                <h3 className={`text-xs uppercase tracking-widest font-bold px-2 py-1 rounded-lg border ${getTypeColor(type)}`}>
                  {getTypeLabel(type)} ({groupedLoot[type].length})
                </h3>
                <div className="space-y-1">
                  {groupedLoot[type].map((item, idx) => {
                    const isSelected = selectedItems.has(item.id);
                    const rarityBorder = 
                      item.rarity === 'Legendary' ? 'border-yellow-500/60 shadow-yellow-500/20' :
                      item.rarity === 'Epic' ? 'border-purple-500/60 shadow-purple-500/20' :
                      item.rarity === 'Rare' ? 'border-blue-500/60 shadow-blue-500/20' :
                      item.rarity === 'Uncommon' ? 'border-green-500/60 shadow-green-500/20' :
                      'border-gray-600/40';
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                          isSelected
                            ? `bg-gradient-to-r from-amber-900/30 to-amber-800/20 ${rarityBorder} shadow-lg`
                            : 'bg-[#1a1d24]/50 border-transparent hover:border-gray-600/30 opacity-50 hover:opacity-70'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 shadow-lg shadow-amber-500/30'
                            : 'bg-transparent border-gray-600 hover:border-gray-500'
                        }`}>
                          {isSelected && <Check size={14} className="text-black" strokeWidth={3} />}
                        </div>

                        {/* Item Icon */}
                        <div className={`w-12 h-12 flex-shrink-0 rounded-xl border-2 flex items-center justify-center overflow-hidden bg-black/30 ${rarityBorder}`}>
                          <ItemIcon item={item} size="md" />
                        </div>

                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-bold truncate ${getRarityColor(item.rarity || 'Common')}`}>
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] mt-0.5">
                            {item.tier && (
                              <span className={`${getTierColor(item.tier)} font-bold`}>T{item.tier}</span>
                            )}
                            <span className="text-gray-400">{getItemSubtext(item)}</span>
                          </div>
                        </div>

                        {/* Rarity Badge */}
                        {item.rarity && (
                          <div className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${
                            item.rarity === 'Legendary' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/30' :
                            item.rarity === 'Epic' ? 'bg-purple-900/50 text-purple-400 border border-purple-500/30' :
                            item.rarity === 'Rare' ? 'bg-blue-900/50 text-blue-400 border border-blue-500/30' :
                            item.rarity === 'Uncommon' ? 'bg-green-900/50 text-green-400 border border-green-500/30' :
                            'bg-gray-800/50 text-gray-400 border border-gray-600/30'
                          }`}>
                            {item.rarity}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#0a0c10] flex gap-3">
          <button
            onClick={handleLootAll}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:via-orange-400 hover:to-amber-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02]"
          >
            <Sparkles size={18} />
            Loot All ({totalCount})
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className={`flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              selectedCount > 0
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]'
                : 'bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-700/30'
            }`}
          >
            <Check size={18} />
            Take Selected ({selectedCount})
          </button>
        </div>
        </div>{/* Close main content container */}
      </div>{/* Close modal container */}
    </div>
  );
};

export default LootPickupModal;

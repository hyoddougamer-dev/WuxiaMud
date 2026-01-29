// ============================================
// REPAIR MODAL - WuxiaMUD
// Blacksmith repair interface for gear durability
// ============================================

import React, { useState } from 'react';
import { X, Wrench, Hammer, AlertTriangle, CheckCircle, Coins, Shield, Sword, CircleDot, Award } from 'lucide-react';
import { SpiritStoneIcon } from './ItemIcon';
import { getRarityColor, getTierColor } from '../utils/helpers';
import { uiFrameIcons } from '../utils/iconSystem';

interface GearItem {
  id: string;
  name: string;
  type: string;
  tier: number;
  rarity?: string;
  durability: number;
  maxDurability: number;
  slot?: string;
}

interface RepairModalProps {
  isOpen: boolean;
  equippedGear: Record<string, GearItem | null>;
  playerSpiritStones: number;
  onClose: () => void;
  onRepair: (slot: string, cost: number) => void;
  onRepairAll: (totalCost: number) => void;
}

// Calculate repair cost based on tier, rarity, and damage
export const calculateRepairCost = (item: GearItem): number => {
  if (!item || item.durability >= item.maxDurability) return 0;
  
  const damagePercent = 100 - item.durability;
  const tierMultiplier = [1, 2.5, 6, 15][item.tier - 1] || 1;
  const rarityMultiplier = {
    'Common': 1,
    'Uncommon': 1.5,
    'Rare': 2.5,
    'Epic': 4,
    'Legendary': 8
  }[item.rarity || 'Common'] || 1;
  
  // Base cost: 5 SS per 10% damage, scaled by tier and rarity
  const baseCost = Math.ceil((damagePercent / 10) * 5 * tierMultiplier * rarityMultiplier);
  return Math.max(1, baseCost);
};

export const RepairModal: React.FC<RepairModalProps> = ({
  isOpen,
  equippedGear,
  playerSpiritStones,
  onClose,
  onRepair,
  onRepairAll
}) => {
  const [repairing, setRepairing] = useState<string | null>(null);

  if (!isOpen) return null;

  const gearSlots = ['weapon', 'ring', 'necklace'];
  const damagedGear = gearSlots
    .map(slot => ({ slot, item: equippedGear[slot] }))
    .filter(({ item }) => item && item.durability < item.maxDurability);

  const totalRepairCost = damagedGear.reduce((sum, { item }) => 
    sum + (item ? calculateRepairCost(item) : 0), 0
  );

  const canAffordAll = playerSpiritStones >= totalRepairCost;

  const getSlotIcon = (slot: string) => {
    switch (slot) {
      case 'weapon': return <Sword size={16} className="text-red-400" />;
      case 'ring': return <CircleDot size={16} className="text-purple-400" />;
      case 'necklace': return <Award size={16} className="text-cyan-400" />;
      default: return <Shield size={16} className="text-gray-400" />;
    }
  };

  const getDurabilityColor = (percent: number) => {
    if (percent > 75) return 'bg-green-500';
    if (percent > 50) return 'bg-lime-500';
    if (percent > 25) return 'bg-yellow-500';
    if (percent > 0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getDurabilityTextColor = (percent: number) => {
    if (percent > 75) return 'text-green-400';
    if (percent > 50) return 'text-lime-400';
    if (percent > 25) return 'text-yellow-400';
    if (percent > 0) return 'text-orange-400';
    return 'text-red-400';
  };

  const handleRepair = async (slot: string, cost: number) => {
    setRepairing(slot);
    await new Promise(resolve => setTimeout(resolve, 300));
    onRepair(slot, cost);
    setRepairing(null);
  };

  const handleRepairAll = async () => {
    setRepairing('all');
    await new Promise(resolve => setTimeout(resolve, 500));
    onRepairAll(totalRepairCost);
    setRepairing(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-[500px] max-h-[80vh]">
        {/* Main content container */}
        <div className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 rounded-lg overflow-hidden max-h-[80vh] flex flex-col border-2 border-amber-600/60 shadow-2xl shadow-amber-900/30 wuxia-glow wuxia-corners">
        
        {/* Header */}
        <div className="relative wuxia-header">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 via-orange-800/10 to-amber-900/20"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          
          <div className="relative px-6 py-5 border-b border-amber-600/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Wrench className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-100 font-serif">Blacksmith</h2>
                <p className="text-sm text-amber-400/70">Repair damaged equipment</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Player Balance */}
        <div className="px-6 py-3 bg-[#0d0f14] border-b border-white/5 flex items-center justify-between">
          <span className="text-sm text-gray-400">Your Balance:</span>
          <div className="flex items-center gap-2">
            <SpiritStoneIcon size="sm" />
            <span className="text-cyan-400 font-bold text-lg">{playerSpiritStones.toLocaleString()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {damagedGear.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500/50" />
              <p className="text-lg text-gray-300">All Equipment in Good Condition</p>
              <p className="text-sm text-gray-500 mt-1">No repairs needed at this time.</p>
            </div>
          ) : (
            <>
              {/* Gear List */}
              {gearSlots.map(slot => {
                const item = equippedGear[slot];
                if (!item) return null;

                const durabilityPercent = Math.round((item.durability / item.maxDurability) * 100);
                const repairCost = calculateRepairCost(item);
                const needsRepair = item.durability < item.maxDurability;
                const canAfford = playerSpiritStones >= repairCost;
                const isBroken = item.durability <= 0;
                const isRepairing = repairing === slot;

                return (
                  <div
                    key={slot}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isBroken 
                        ? 'bg-red-950/30 border-red-700/50' 
                        : needsRepair 
                          ? 'bg-[#1a1d24] border-amber-700/30' 
                          : 'bg-[#1a1d24] border-green-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Slot Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                        isBroken ? 'bg-red-900/30 border-red-700/50' : 'bg-gray-800/50 border-gray-700/30'
                      }`}>
                        {getSlotIcon(slot)}
                      </div>

                      {/* Item Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${getRarityColor(item.rarity || 'Common')}`}>
                            {item.name}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${getTierColor(item.tier)} bg-gray-800/50`}>
                            T{item.tier}
                          </span>
                          {isBroken && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-900/50 text-red-400 border border-red-700/50 font-bold animate-pulse">
                              BROKEN
                            </span>
                          )}
                        </div>

                        {/* Durability Bar */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${getDurabilityColor(durabilityPercent)}`}
                              style={{ width: `${durabilityPercent}%` }}
                            />
                          </div>
                          <span className={`text-xs font-mono w-12 text-right ${getDurabilityTextColor(durabilityPercent)}`}>
                            {item.durability}/{item.maxDurability}
                          </span>
                        </div>
                      </div>

                      {/* Repair Button */}
                      {needsRepair ? (
                        <button
                          onClick={() => handleRepair(slot, repairCost)}
                          disabled={!canAfford || isRepairing || repairing === 'all'}
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                            isRepairing || repairing === 'all'
                              ? 'bg-amber-800/50 text-amber-300 cursor-wait'
                              : canAfford
                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:scale-105'
                                : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isRepairing ? (
                            <Hammer size={14} className="animate-bounce" />
                          ) : (
                            <Wrench size={14} />
                          )}
                          <SpiritStoneIcon size="sm" />
                          <span>{repairCost}</span>
                        </button>
                      ) : (
                        <div className="px-4 py-2 rounded-lg bg-green-900/30 border border-green-700/30 text-green-400 text-sm flex items-center gap-2">
                          <CheckCircle size={14} />
                          <span>OK</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer - Repair All */}
        {damagedGear.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-[#0d0f14]">
            <button
              onClick={handleRepairAll}
              disabled={!canAffordAll || totalRepairCost === 0 || repairing !== null}
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${
                repairing === 'all'
                  ? 'bg-amber-800/50 text-amber-300 cursor-wait'
                  : canAffordAll && totalRepairCost > 0
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:via-orange-400 hover:to-amber-400 text-black shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
                    : 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700/30'
              }`}
            >
              {repairing === 'all' ? (
                <>
                  <Hammer size={20} className="animate-bounce" />
                  Repairing...
                </>
              ) : (
                <>
                  <Hammer size={20} />
                  Repair All Equipment
                  <div className="flex items-center gap-1 px-2 py-1 bg-black/20 rounded-lg">
                    <SpiritStoneIcon size="sm" />
                    <span>{totalRepairCost.toLocaleString()}</span>
                  </div>
                </>
              )}
            </button>
            {!canAffordAll && totalRepairCost > 0 && (
              <p className="text-center text-xs text-red-400 mt-2 flex items-center justify-center gap-1">
                <AlertTriangle size={12} />
                Not enough Spirit Stones
              </p>
            )}
          </div>
        )}
        </div>{/* Close main content container */}
      </div>{/* Close modal container */}
    </div>
  );
};

export default RepairModal;

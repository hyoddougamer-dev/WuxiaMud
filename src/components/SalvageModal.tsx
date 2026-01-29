import React, { useState, useMemo } from 'react';
import { X, Hammer, AlertCircle, CheckCircle, Coins, Package, Sparkles } from 'lucide-react';
import { getSalvageReturns, RARITY_CONFIG, type ItemRarity, type SalvageReturn } from '../data/raritySystem';
import { materials as allMaterials } from '../data/materials';
import { MaterialIcon, SpiritStoneIcon } from './ItemIcon';
import { getStatAbbr } from '../utils/helpers';

// Legacy to Wuxia rarity mapping
const LEGACY_TO_WUXIA: Record<string, ItemRarity> = {
  'Common': 'Mortal',
  'Uncommon': 'Earth',
  'Rare': 'Heaven',
  'Epic': 'Spirit',
  'Legendary': 'Immortal',
};

// Convert legacy rarity to Wuxia if needed
const getNormalizedRarity = (rarity: string | undefined): ItemRarity => {
  if (!rarity) return 'Mortal';
  if (RARITY_CONFIG[rarity as ItemRarity]) return rarity as ItemRarity;
  return LEGACY_TO_WUXIA[rarity] || 'Mortal';
};

interface SalvageModalProps {
  onClose: () => void;
  selectedItem: any | null;
  onSalvage: (result: SalvageResult) => void;
}

export interface SalvageResult {
  success: boolean;
  itemId: string;
  itemName: string;
  spiritStones: number;
  materials: { materialId: string; name: string; quantity: number }[];
  specialMaterial?: { materialId: string; name: string };
}

export const SalvageModal: React.FC<SalvageModalProps> = ({
  onClose,
  selectedItem,
  onSalvage,
}) => {
  const [isSalvaging, setIsSalvaging] = useState(false);
  const [salvageResult, setSalvageResult] = useState<SalvageResult | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);

  // Normalize item rarity
  const normalizedRarity = selectedItem ? getNormalizedRarity(selectedItem.rarity) : 'Mortal';
  const itemTier = selectedItem?.tier || 1;

  // Calculate expected returns
  const expectedReturns = useMemo(() => {
    if (!selectedItem) return null;
    return getSalvageReturns(normalizedRarity, itemTier);
  }, [selectedItem, normalizedRarity, itemTier]);

  // Get material info by tier
  const getMaterialByTier = (tier: number) => {
    const tierMaterialMap: Record<number, string> = {
      1: 'MAT_T1_001', // Spirit Iron
      2: 'MAT_T2_001', // Azure Crystal
      3: 'MAT_T3_001', // Thunder Essence
      4: 'MAT_T4_001', // Golden Core Fragment
    };
    const matId = tierMaterialMap[tier] || tierMaterialMap[1];
    const mat = allMaterials.find(m => m.id === matId);
    return { id: matId, name: mat?.name || `Tier ${tier} Material` };
  };

  // Handle salvage
  const handleSalvage = () => {
    if (!selectedItem || !expectedReturns) return;

    setIsSalvaging(true);
    setSalvageResult(null);

    setTimeout(() => {
      // Roll spirit stones
      const spiritStones = Math.floor(
        expectedReturns.spiritStones.min + 
        Math.random() * (expectedReturns.spiritStones.max - expectedReturns.spiritStones.min)
      );

      // Get materials
      const materialsReceived = expectedReturns.materials.map(m => {
        const matInfo = getMaterialByTier(m.tier);
        return {
          materialId: matInfo.id,
          name: matInfo.name,
          quantity: m.quantity,
        };
      });

      // Check for special material
      let specialMat: { materialId: string; name: string } | undefined;
      if (expectedReturns.specialMaterial) {
        const roll = Math.random() * 100;
        if (roll < expectedReturns.specialMaterial.chance) {
          const specialMatInfo = allMaterials.find(m => m.id === expectedReturns.specialMaterial?.id);
          specialMat = {
            materialId: expectedReturns.specialMaterial.id,
            name: specialMatInfo?.name || 'Rare Essence',
          };
        }
      }

      const result: SalvageResult = {
        success: true,
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        spiritStones,
        materials: materialsReceived,
        specialMaterial: specialMat,
      };

      setSalvageResult(result);
      onSalvage(result);
      setIsSalvaging(false);
    }, 1500);
  };

  // Rarity colors
  const getRarityColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'Mortal': return 'text-gray-400';
      case 'Earth': return 'text-green-400';
      case 'Heaven': return 'text-blue-400';
      case 'Spirit': return 'text-purple-400';
      case 'Immortal': return 'text-amber-400';
      default: return 'text-gray-400';
    }
  };

  const getRarityBg = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'Mortal': return 'bg-gray-900/20 border-gray-500/30';
      case 'Earth': return 'bg-green-900/20 border-green-500/30';
      case 'Heaven': return 'bg-blue-900/20 border-blue-500/30';
      case 'Spirit': return 'bg-purple-900/20 border-purple-500/30';
      case 'Immortal': return 'bg-amber-900/20 border-amber-500/30';
      default: return 'bg-gray-900/20 border-gray-500/30';
    }
  };

  if (!selectedItem) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-b from-red-900/90 to-black/90 border-4 border-red-600 rounded-lg p-8 max-w-md">
          <p className="text-red-400 text-center">No item selected for salvage.</p>
          <button onClick={onClose} className="w-full mt-4 py-2 bg-gray-700 rounded">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-amber-900/90 to-black/90 border-4 border-amber-600 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-amber-600/50">
          <div className="flex items-center gap-2">
            <Hammer className="text-amber-400" size={24} />
            <h2 className="text-2xl font-bold text-amber-400">Salvage Equipment</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Selected Item Display */}
          <div className={`p-4 rounded border-2 ${getRarityBg(normalizedRarity)}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">{selectedItem.name}</h3>
              <span className={`text-sm font-bold ${getRarityColor(normalizedRarity)}`}>
                {RARITY_CONFIG[normalizedRarity].displayName} Grade
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Tier {itemTier}</span>
              {selectedItem.stats && (
                <span className="flex gap-1">
                  {Object.entries(selectedItem.stats).map(([stat, value]) => (
                    <span key={stat} className="px-1 bg-black/30 rounded">
                      +{String(value)} {getStatAbbr(stat)}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>

          {/* Expected Returns */}
          {expectedReturns && !salvageResult && (
            <div className="bg-black/40 p-4 rounded border border-amber-600/30">
              <h4 className="text-amber-300 font-bold mb-3 flex items-center gap-2">
                <Package size={16} /> Expected Returns
              </h4>
              
              <div className="space-y-3">
                {/* Spirit Stones */}
                <div className="flex items-center justify-between p-2 bg-amber-900/20 rounded">
                  <div className="flex items-center gap-2">
                    <SpiritStoneIcon size="md" />
                    <span className="text-gray-200">Spirit Stones</span>
                  </div>
                  <span className="text-amber-400 font-bold">
                    {expectedReturns.spiritStones.min} - {expectedReturns.spiritStones.max}
                  </span>
                </div>

                {/* Materials */}
                {expectedReturns.materials.map((mat, idx) => {
                  const matInfo = getMaterialByTier(mat.tier);
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 bg-blue-900/20 rounded">
                      <div className="flex items-center gap-2">
                        <MaterialIcon materialId={matInfo.id} size="md" />
                        <span className="text-gray-200">{matInfo.name}</span>
                      </div>
                      <span className="text-blue-400 font-bold">x{mat.quantity}</span>
                    </div>
                  );
                })}

                {/* Special Material Chance */}
                {expectedReturns.specialMaterial && (
                  <div className="flex items-center justify-between p-2 bg-purple-900/20 rounded border border-purple-500/30">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-400" />
                      <span className="text-gray-200">Rare Material</span>
                    </div>
                    <span className="text-purple-400 font-bold">
                      {expectedReturns.specialMaterial.chance}% chance
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Salvage Result */}
          {salvageResult && (
            <div className="bg-green-900/20 border-2 border-green-500 p-4 rounded">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-green-400" size={24} />
                <p className="text-green-400 font-bold">Salvage Complete!</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Spirit Stones:</span>
                  <span className="text-amber-400 font-bold">+{salvageResult.spiritStones}</span>
                </div>
                
                {salvageResult.materials.map((mat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-gray-300">{mat.name}:</span>
                    <span className="text-blue-400 font-bold">+{mat.quantity}</span>
                  </div>
                ))}
                
                {salvageResult.specialMaterial && (
                  <div className="flex items-center justify-between border-t border-purple-500/30 pt-2 mt-2">
                    <span className="text-purple-300 flex items-center gap-1">
                      <Sparkles size={14} /> {salvageResult.specialMaterial.name}
                    </span>
                    <span className="text-purple-400 font-bold">+1 (Lucky!)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          {!salvageResult && !confirmStep && (
            <div className="bg-red-900/20 border border-red-500/50 p-3 rounded flex items-start gap-2">
              <AlertCircle className="text-red-400 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="text-red-400 font-bold">Warning!</p>
                <p className="text-red-300 text-sm">
                  Salvaging will permanently destroy this item. This action cannot be undone.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {salvageResult ? (
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition"
              >
                Close
              </button>
            ) : confirmStep ? (
              <>
                <button
                  onClick={() => setConfirmStep(false)}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSalvage}
                  disabled={isSalvaging}
                  className={`flex-1 py-3 font-bold rounded-lg transition ${
                    isSalvaging
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {isSalvaging ? (
                    <span className="flex items-center justify-center gap-2">
                      <Hammer className="animate-bounce" size={20} />
                      Salvaging...
                    </span>
                  ) : (
                    'Confirm Salvage'
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setConfirmStep(true)}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg transition"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Hammer size={20} />
                    Salvage Item
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalvageModal;

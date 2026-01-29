import React, { useState, useMemo } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle, XCircle, TrendingUp, Skull } from 'lucide-react';
import { reforgeRecipes, type ReforgeRecipe } from '../data/craftingSystem';
import { materials } from '../data/materials';
import { RARITY_CONFIG, type ItemRarity } from '../data/raritySystem';
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

interface ReforgingModalProps {
  onClose: () => void;
  selectedGear: any | null; // The gear item to reforge
  playerMaterials: Record<string, number>;
  playerSpiritStones: number;
  onReforge: (result: ReforgeResult) => void;
}

interface ReforgeResult {
  success: boolean;
  newRarity?: ItemRarity;
  destroyed?: boolean;
  message: string;
  outcome?: 'success' | 'downgrade' | 'destroy' | 'keep';
  originalId?: string;
  newItem?: any;
  cost?: number;
}

export const ReforgingModal: React.FC<ReforgingModalProps> = ({
  onClose,
  selectedGear,
  playerMaterials,
  playerSpiritStones,
  onReforge,
}) => {
  const [reforgeResult, setReforgeResult] = useState<ReforgeResult | null>(null);
  const [isReforging, setIsReforging] = useState(false);

  // Normalize gear rarity to Wuxia system
  const normalizedRarity = selectedGear ? getNormalizedRarity(selectedGear.rarity) : 'Mortal';

  // Get available reforge recipe for this gear
  const availableReforge = useMemo(() => {
    if (!selectedGear || !normalizedRarity) return null;
    
    // Wuxia rarity order
    const rarityOrder: ItemRarity[] = ['Mortal', 'Earth', 'Heaven', 'Spirit', 'Immortal'];
    const currentIndex = rarityOrder.indexOf(normalizedRarity);
    
    if (currentIndex === -1 || currentIndex >= rarityOrder.length - 1) return null;
    
    const nextRarity = rarityOrder[currentIndex + 1];
    // Find recipe using normalized rarity
    return reforgeRecipes.find(r => 
      r.fromRarity === normalizedRarity && r.toRarity === nextRarity
    );
  }, [selectedGear, normalizedRarity]);

  // Check if player can reforge
  const canReforge = useMemo(() => {
    if (!availableReforge) return { can: false, missing: ['Max rarity reached'] };
    
    const missing: string[] = [];
    
    for (const cost of availableReforge.costs) {
      const mat = materials.find(m => m.id === cost.materialId);
      const hasAmount = playerMaterials[mat?.name || cost.materialId] || playerMaterials[cost.materialId] || 0;
      if (hasAmount < cost.quantity) {
        missing.push(`${mat?.name || cost.materialId} (need ${cost.quantity}, have ${hasAmount})`);
      }
    }
    
    if (playerSpiritStones < availableReforge.spiritStones) {
      missing.push(`Spirit Stones (need ${availableReforge.spiritStones}, have ${playerSpiritStones})`);
    }
    
    return {
      can: missing.length === 0,
      missing,
    };
  }, [availableReforge, playerMaterials, playerSpiritStones]);

  // Handle reforge attempt
  const handleReforge = () => {
    if (!availableReforge || !canReforge.can) return;

    setIsReforging(true);
    setReforgeResult(null);

    setTimeout(() => {
      const successRoll = Math.random() * 100;
      const isSuccess = successRoll < availableReforge.successRate;

      if (isSuccess) {
        const result: ReforgeResult = {
          success: true,
          newRarity: availableReforge.toRarity,
          message: `Success! Gear upgraded to ${RARITY_CONFIG[availableReforge.toRarity].displayName} Grade!`,
          outcome: 'success',
          originalId: selectedGear.id,
          newItem: { ...selectedGear, rarity: availableReforge.toRarity },
          cost: availableReforge.spiritStones,
        };
        setReforgeResult(result);
        onReforge(result);
      } else {
        // Handle failure
        if (availableReforge.onFailure === 'destroy') {
          const result: ReforgeResult = {
            success: false,
            destroyed: true,
            message: 'Reforging failed! Your gear has been destroyed...',
            outcome: 'destroy',
            originalId: selectedGear.id,
          };
          setReforgeResult(result);
          onReforge(result);
        } else if (availableReforge.onFailure === 'downgrade') {
          // Wuxia rarity order for downgrade
          const rarityOrder: ItemRarity[] = ['Mortal', 'Earth', 'Heaven', 'Spirit', 'Immortal'];
          const currentIndex = rarityOrder.indexOf(normalizedRarity);
          const downgradedRarity: ItemRarity = currentIndex > 0 ? rarityOrder[currentIndex - 1] : 'Mortal';
          
          const result: ReforgeResult = {
            success: false,
            newRarity: downgradedRarity,
            message: `Reforging failed! Gear downgraded to ${RARITY_CONFIG[downgradedRarity].displayName} Grade.`,
            outcome: 'downgrade',
            originalId: selectedGear.id,
          };
          setReforgeResult(result);
          onReforge(result);
        } else {
          const result: ReforgeResult = {
            success: false,
            message: 'Reforging failed! Gear remains unchanged.',
            outcome: 'keep',
            originalId: selectedGear.id,
          };
          setReforgeResult(result);
          onReforge(result);
        }
      }

      setIsReforging(false);
    }, 2000);
  };

  // Wuxia rarity colors
  const getRarityColor = (rarity: ItemRarity | string) => {
    const normalized = getNormalizedRarity(rarity);
    switch (normalized) {
      case 'Mortal': return 'text-gray-400';
      case 'Earth': return 'text-green-400';
      case 'Heaven': return 'text-blue-400';
      case 'Spirit': return 'text-purple-400';
      case 'Immortal': return 'text-amber-400';
      default: return 'text-gray-400';
    }
  };

  const getRarityBg = (rarity: ItemRarity | string) => {
    const normalized = getNormalizedRarity(rarity);
    switch (normalized) {
      case 'Mortal': return 'bg-gray-900/20 border-gray-500/30';
      case 'Earth': return 'bg-green-900/20 border-green-500/30';
      case 'Heaven': return 'bg-blue-900/20 border-blue-500/30';
      case 'Spirit': return 'bg-purple-900/20 border-purple-500/30';
      case 'Immortal': return 'bg-amber-900/20 border-amber-500/30';
      default: return 'bg-gray-900/20 border-gray-500/30';
    }
  };

  // Get display name for rarity
  const getRarityDisplayName = (rarity: ItemRarity | string) => {
    const normalized = getNormalizedRarity(rarity);
    return RARITY_CONFIG[normalized]?.displayName || normalized;
  };

  if (!selectedGear) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-b from-red-900/90 to-black/90 border-4 border-red-600 rounded-lg p-8 max-w-md">
          <p className="text-red-400 text-center">No gear selected for reforging.</p>
          <button onClick={onClose} className="w-full mt-4 py-2 bg-gray-700 rounded">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-purple-900/90 to-black/90 border-4 border-purple-600 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-purple-600/50">
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={24} />
            <h2 className="text-2xl font-bold text-purple-400">Gear Reforging</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Current Gear Display */}
          <div className={`p-4 rounded border-2 ${getRarityBg(normalizedRarity)}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">{selectedGear.name}</h3>
              <span className={`text-sm font-bold ${getRarityColor(normalizedRarity)}`}>
                {getRarityDisplayName(normalizedRarity)} Grade
              </span>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              {selectedGear.stats && Object.entries(selectedGear.stats).map(([stat, value]) => (
                <div key={stat} className="flex justify-between">
                  <span className="uppercase">{getStatAbbr(stat)}:</span>
                  <span className="text-white">+{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reforge Path */}
          {availableReforge ? (
            <>
              <div className="bg-black/40 p-4 rounded border border-purple-600/30">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className={`px-4 py-2 rounded ${getRarityBg(availableReforge.fromRarity)}`}>
                    <span className={`font-bold ${getRarityColor(availableReforge.fromRarity)}`}>
                      {availableReforge.fromRarity}
                    </span>
                  </div>
                  <TrendingUp className="text-purple-400" size={24} />
                  <div className={`px-4 py-2 rounded ${getRarityBg(availableReforge.toRarity)}`}>
                    <span className={`font-bold ${getRarityColor(availableReforge.toRarity)}`}>
                      {availableReforge.toRarity}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Success Rate:</span>
                    <span className={availableReforge.successRate >= 50 ? 'text-green-400' : 'text-yellow-400'}>
                      {availableReforge.successRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">On Failure:</span>
                    <span className={
                      availableReforge.onFailure === 'destroy' ? 'text-red-400' :
                      availableReforge.onFailure === 'downgrade' ? 'text-yellow-400' :
                      'text-gray-400'
                    }>
                      {availableReforge.onFailure === 'destroy' && <span className="flex items-center gap-1"><Skull size={14}/>DESTROYED</span>}
                      {availableReforge.onFailure === 'downgrade' && 'Downgrade 1 tier'}
                      {availableReforge.onFailure === 'keep' && 'No penalty'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Material Requirements */}
              <div className="bg-black/40 p-3 rounded border border-purple-600/30">
                <h4 className="text-purple-300 font-bold mb-2">Required Materials:</h4>
                <div className="space-y-2">
                  {availableReforge.costs.map((cost) => {
                    const mat = materials.find(m => m.id === cost.materialId);
                    const hasAmount = playerMaterials[mat?.name || cost.materialId] || 0;
                    const isSufficient = hasAmount >= cost.quantity;

                    return (
                      <div
                        key={cost.materialId}
                        className={`flex items-center justify-between p-2 rounded ${
                          isSufficient ? 'bg-green-900/20' : 'bg-red-900/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MaterialIcon materialId={cost.materialId} size="md" />
                          <span className="text-gray-200">{mat?.name || cost.materialId}</span>
                        </div>
                        <span className={isSufficient ? 'text-green-400' : 'text-red-400'}>
                          {hasAmount} / {cost.quantity}
                        </span>
                      </div>
                    );
                  })}

                  {/* Spirit Stones */}
                  <div
                    className={`flex items-center justify-between p-2 rounded ${
                      playerSpiritStones >= availableReforge.spiritStones ? 'bg-green-900/20' : 'bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <SpiritStoneIcon size="md" />
                      <span className="text-gray-200">Spirit Stones</span>
                    </div>
                    <span className={playerSpiritStones >= availableReforge.spiritStones ? 'text-green-400' : 'text-red-400'}>
                      {playerSpiritStones} / {availableReforge.spiritStones}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning for high-risk reforges */}
              {availableReforge.onFailure === 'destroy' && (
                <div className="bg-red-900/30 border-2 border-red-500 p-4 rounded flex items-start gap-2">
                  <Skull className="text-red-400 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-red-400 font-bold">EXTREME RISK!</p>
                    <p className="text-red-300 text-sm mt-1">
                      Your gear will be PERMANENTLY DESTROYED if this reforge fails ({100 - availableReforge.successRate}% chance).
                      Only attempt if you're willing to lose this item!
                    </p>
                  </div>
                </div>
              )}

              {/* Reforge Result */}
              {reforgeResult && (
                <div className={`p-4 rounded border-2 ${
                  reforgeResult.success 
                    ? 'bg-green-900/20 border-green-500' 
                    : reforgeResult.destroyed
                    ? 'bg-red-900/20 border-red-500'
                    : 'bg-yellow-900/20 border-yellow-500'
                }`}>
                  <div className="flex items-center gap-2">
                    {reforgeResult.success ? (
                      <CheckCircle className="text-green-400" size={24} />
                    ) : (
                      <XCircle className={reforgeResult.destroyed ? 'text-red-400' : 'text-yellow-400'} size={24} />
                    )}
                    <p className={reforgeResult.success ? 'text-green-400' : reforgeResult.destroyed ? 'text-red-400' : 'text-yellow-400'}>
                      {reforgeResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Missing Requirements */}
              {!canReforge.can && canReforge.missing.length > 0 && (
                <div className="bg-red-900/20 border border-red-500/50 p-3 rounded">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="text-red-400 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-red-400 font-bold">Missing Requirements:</p>
                      <ul className="text-red-300 text-sm mt-1 space-y-1">
                        {canReforge.missing.map((msg, idx) => (
                          <li key={idx}>• {msg}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Reforge Button */}
              <button
                onClick={handleReforge}
                disabled={!canReforge.can || isReforging}
                className={`w-full py-3 rounded-lg font-bold text-lg transition ${
                  canReforge.can && !isReforging
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isReforging ? (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="animate-spin" size={20} />
                    Reforging...
                  </span>
                ) : (
                  `Reforge ({availableReforge.successRate}% Success)`
                )}
              </button>
            </>
          ) : (
            <div className="bg-amber-900/20 border border-amber-500/50 p-4 rounded text-center">
              <p className="text-amber-400 font-bold">Maximum Rarity Reached!</p>
              <p className="text-amber-300 text-sm mt-2">This gear is already at Immortal Grade - the highest tier.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

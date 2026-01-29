import React, { useState, useMemo } from 'react';
import { X, Hammer, Sparkles, AlertCircle, CheckCircle, XCircle, Package, TrendingUp, User, Star, AlertTriangle, Settings, Swords, Music, Check, Gem, Link, Info } from 'lucide-react';
import { getRecipeByTier, canCraft, rollCraftingRarity, tier1Recipes, tier2Recipes, tier3Recipes, tier4Recipes, type CraftingRecipe, type CraftingCategory } from '../data/craftingSystem';
import { materials } from '../data/materials';
import { getClassGearByTier, applyWuxiaRarityBonus, type ItemRarity } from '../data/gearItems';
import { getRingByTier, getNecklaceByTier, applyAccessoryRarityBonus } from '../data/accessoryItems';
import { WeaponPreview, MaterialIcon, SpiritStoneIcon } from './ItemIcon';
import { getStatAbbr } from '../utils/helpers';
import { cultivationIcons, accessoryIcons } from '../utils/iconSystem';
import { NEW_TO_LEGACY_RARITY, type LegacyRarity, rollSecondaryStats, RARITY_CONFIG } from '../data/raritySystem';

// Rarity bonus descriptions for tooltips
const RARITY_BONUS_INFO: Record<ItemRarity, { multiplier: string; secondary: string }> = {
  'Mortal': { multiplier: '1.0x stats', secondary: 'No bonus stats' },
  'Earth': { multiplier: '1.2x stats', secondary: '+1 bonus stat' },
  'Heaven': { multiplier: '1.45x stats', secondary: '+2 bonus stats' },
  'Spirit': { multiplier: '1.75x stats', secondary: '+3 bonus stats' },
  'Immortal': { multiplier: '2.2x stats', secondary: '+4 bonus stats' },
};

interface CraftingModalProps {
  onClose: () => void;
  playerClass: number;
  playerMaterials: Record<string, number>;
  playerSpiritStones: number;
  onCraft: (result: CraftResult) => void;
}

interface CraftResult {
  success: boolean;
  item?: any;
  rarity?: ItemRarity;
  message: string;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  onClose,
  playerClass,
  playerMaterials,
  playerSpiritStones,
  onCraft,
}) => {
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | 4>(1);
  const [selectedClass, setSelectedClass] = useState<number>(playerClass || 1);
  const [selectedCategory, setSelectedCategory] = useState<CraftingCategory>('weapon');
  const [craftResult, setCraftResult] = useState<CraftResult | null>(null);
  const [isCrafting, setIsCrafting] = useState(false);

  // Get recipe for selected tier and category
  const recipe = useMemo(() => getRecipeByTier(selectedTier, selectedCategory), [selectedTier, selectedCategory]);

  // Get current item preview based on category
  const currentItem = useMemo(() => {
    if (selectedCategory === 'weapon') {
      return getClassGearByTier(selectedClass, selectedTier);
    } else if (selectedCategory === 'ring') {
      return getRingByTier(selectedTier);
    } else {
      return getNecklaceByTier(selectedTier);
    }
  }, [selectedClass, selectedTier, selectedCategory]);

  // Check if player can craft
  const craftCheck = useMemo(() => {
    if (!recipe) return { canCraft: false, missing: ['Recipe not found'] };
    return canCraft(recipe, playerMaterials, playerSpiritStones);
  }, [recipe, playerMaterials, playerSpiritStones]);

  // Determine if crafting is possible
  const canCraftNow = craftCheck.canCraft && !isCrafting;

  // Get material details
  const getMaterialDetails = (materialId: string) => {
    return materials.find(m => m.id === materialId);
  };

  // Early return if no recipe or item
  if (!recipe || !currentItem) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-b from-amber-900/95 to-black/95 border-4 border-yellow-600 rounded-xl p-8 max-w-md">
          <div className="flex items-center gap-4 mb-4">
            <AlertCircle className="text-red-400" size={32} />
            <h2 className="text-2xl font-bold text-red-400">Error</h2>
          </div>
          <p className="text-gray-300 mb-6">
            {!recipe ? 'Recipe not found for selected tier.' : 'Item not found for selected tier.'}
          </p>
          <button
            onClick={onClose}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Handle crafting attempt
  const handleCraft = () => {
    if (!craftCheck.canCraft) return;

    setIsCrafting(true);
    setCraftResult(null);

    // Simulate crafting delay
    setTimeout(() => {
      const successRoll = Math.random() * 100;
      const isSuccess = successRoll < recipe.successRate;

      if (isSuccess) {
        // Roll for rarity
        const rarity = rollCraftingRarity(recipe.rarityTable);
        
        // Roll for secondary stats based on rarity
        const secondaryStats = rollSecondaryStats(rarity);
        
        let baseItem: any = null;
        let finalItem: any = null;
        
        if (selectedCategory === 'weapon') {
          // Get base weapon for selected class and tier
          baseItem = getClassGearByTier(selectedClass, selectedTier);
          if (baseItem) {
            finalItem = {
              ...baseItem,
              rarity,
              stats: applyWuxiaRarityBonus(baseItem.stats, rarity),
              secondaryStats,
            };
          }
        } else if (selectedCategory === 'ring') {
          // Get ring for tier
          baseItem = getRingByTier(selectedTier);
          if (baseItem) {
            // Convert to legacy for accessory function, then use new rarity
            const legacyRarity = NEW_TO_LEGACY_RARITY[rarity];
            finalItem = {
              ...baseItem,
              rarity,
              stats: applyAccessoryRarityBonus(baseItem.stats, legacyRarity),
              secondaryStats,
            };
          }
        } else {
          // Get necklace for tier
          baseItem = getNecklaceByTier(selectedTier);
          if (baseItem) {
            // Convert to legacy for accessory function, then use new rarity
            const legacyRarity = NEW_TO_LEGACY_RARITY[rarity];
            finalItem = {
              ...baseItem,
              rarity,
              stats: applyAccessoryRarityBonus(baseItem.stats, legacyRarity),
              secondaryStats,
            };
          }
        }
        
        if (!baseItem || !finalItem) {
          const result = {
            success: false,
            message: 'Error: Could not find item for this tier.',
          };
          setCraftResult(result);
          onCraft(result);
          return;
        }

        const result = {
          success: true,
          item: finalItem,
          rarity,
          message: `Success! Crafted ${rarity} ${baseItem.name}!`,
          cost: recipe.spiritStones,
          materialsConsumed: recipe.costs,
          tier: selectedTier,
          category: selectedCategory,
        };

        setCraftResult(result);
        onCraft(result);
      } else {
        const result = {
          success: false,
          failed: true, // Flag for App.tsx to know this is a failure
          message: recipe.failPenalty === 'half' 
            ? 'Crafting failed! 50% materials lost...' 
            : 'Crafting failed! No materials lost.',
          cost: recipe.spiritStones,
          materialsConsumed: recipe.costs, // Pass materials for partial consumption
          failPenalty: recipe.failPenalty,
          tier: selectedTier,
        };

        setCraftResult(result);
        onCraft(result);
      }

      setIsCrafting(false);
    }, 1500);
  };

  // Get rarity color - updated for Wuxia system
  const getRarityColor = (rarity: ItemRarity | string) => {
    switch (rarity) {
      case 'Mortal':
      case 'Common': return 'text-gray-400';
      case 'Earth':
      case 'Uncommon': return 'text-green-400';
      case 'Heaven':
      case 'Rare': return 'text-blue-400';
      case 'Spirit':
      case 'Epic': return 'text-purple-400';
      case 'Immortal':
      case 'Legendary': return 'text-amber-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-amber-900/95 to-black/95 border-4 border-yellow-600 rounded-xl max-w-7xl w-full h-[90vh] overflow-hidden shadow-2xl flex flex-col wuxia-glow wuxia-corners">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-yellow-600/50 bg-gradient-to-r from-amber-900/50 to-black/50 wuxia-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-600/20 rounded-lg border-2 border-yellow-500 w-14 h-14 flex items-center justify-center">
              <img 
                src={cultivationIcons.cauldron}
                alt=""
                className="w-10 h-10 object-contain drop-shadow-lg"
                onError={(e) => { 
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const icon = document.createElement('span');
                    icon.innerHTML = '🔥';
                    icon.className = 'text-2xl';
                    parent.appendChild(icon);
                  }
                }}
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-yellow-400 font-serif wuxia-title">Divine Forge</h2>
              <p className="text-sm text-yellow-200/70 mt-1">Craft weapons and accessories for your cultivation journey</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-2 hover:bg-white/10 rounded"
          >
            <X size={28} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-6 py-3 border-b border-yellow-600/30 bg-black/40">
          <button
            onClick={() => setSelectedCategory('weapon')}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
              selectedCategory === 'weapon' 
                ? 'bg-gradient-to-r from-yellow-600 to-amber-500 text-black' 
                : 'bg-black/40 text-gray-400 hover:text-yellow-300 border border-yellow-600/30'
            }`}
          >
            <Swords size={16} />
            Weapons
          </button>
          <button
            onClick={() => setSelectedCategory('ring')}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
              selectedCategory === 'ring' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' 
                : 'bg-black/40 text-gray-400 hover:text-purple-300 border border-purple-600/30'
            }`}
          >
            <Gem size={16} />
            Rings
          </button>
          <button
            onClick={() => setSelectedCategory('necklace')}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
              selectedCategory === 'necklace' 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-500 text-white' 
                : 'bg-black/40 text-gray-400 hover:text-cyan-300 border border-cyan-600/30'
            }`}
          >
            <Link size={16} />
            Necklaces
          </button>
        </div>

        {/* Main Content - Single Row Layout */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="grid grid-cols-3 gap-4 h-full">
            
            {/* LEFT: Item Preview & Rarity Table */}
            <div className="space-y-4 overflow-y-auto pr-2">
              {/* Item Preview Card */}
              <div className={`bg-gradient-to-br from-black/60 to-amber-900/20 border-2 rounded-xl p-4 ${
                selectedCategory === 'weapon' ? 'border-yellow-600/40' :
                selectedCategory === 'ring' ? 'border-purple-600/40' : 'border-cyan-600/40'
              }`}>
                <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${
                  selectedCategory === 'weapon' ? 'text-yellow-300' :
                  selectedCategory === 'ring' ? 'text-purple-300' : 'text-cyan-300'
                }`}>
                  <Sparkles size={16} />
                  {selectedCategory === 'weapon' ? 'Weapon' : selectedCategory === 'ring' ? 'Ring' : 'Necklace'} Preview
                </h3>
                
                {/* Preview Image/Icon Area */}
                <div className={`relative bg-gradient-to-br from-yellow-900/20 to-black/40 border-2 rounded-lg p-6 mb-3 ${
                  selectedCategory === 'weapon' ? 'border-yellow-600/30' :
                  selectedCategory === 'ring' ? 'border-purple-600/30' : 'border-cyan-600/30'
                }`}>
                  <div className="flex items-center justify-center h-40">
                    {selectedCategory === 'weapon' ? (
                      <WeaponPreview 
                        weaponType={selectedClass <= 4 ? 'sword' : selectedClass <= 8 ? 'saber' : 'zither'} 
                        tier={selectedTier}
                        className="drop-shadow-lg"
                      />
                    ) : (
                      <img 
                        src={selectedCategory === 'ring' ? accessoryIcons.ring[selectedTier] : accessoryIcons.necklace[selectedTier]}
                        alt={selectedCategory}
                        className="w-24 h-24 object-contain drop-shadow-lg"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                  {/* Tier Badge */}
                  <div className="absolute top-2 right-2">
                    <div className={`px-3 py-1 rounded font-bold text-xs border ${
                      selectedTier === 1 ? 'bg-gray-800 border-gray-500 text-gray-300' :
                      selectedTier === 2 ? 'bg-blue-900 border-blue-500 text-blue-300' :
                      selectedTier === 3 ? 'bg-purple-900 border-purple-500 text-purple-300' :
                      'bg-yellow-900 border-yellow-500 text-yellow-300'
                    }`}>
                      TIER {selectedTier}
                    </div>
                  </div>
                </div>

                {/* Item Name & Stats */}
                <div className="bg-black/40 border border-yellow-600/30 rounded p-3 mb-2">
                  <p className={`text-lg font-bold ${
                    selectedCategory === 'weapon' ? 'text-yellow-300' :
                    selectedCategory === 'ring' ? 'text-purple-300' : 'text-cyan-300'
                  }`}>{currentItem.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(currentItem.stats).map(([stat, value]) => (
                    <div key={stat} className="flex justify-between items-center bg-black/30 px-2 py-1 rounded text-xs">
                      <span className="uppercase text-gray-400">{getStatAbbr(stat)}:</span>
                      <span className="text-yellow-400 font-bold">+{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rarity Table with Bonus Info */}
              <div className="bg-black/40 border-2 border-yellow-600/30 rounded-xl p-4">
                <h4 className="text-sm text-yellow-300 font-bold mb-2 flex items-center gap-2">
                  <TrendingUp size={14} />
                  Possible Rarity Outcomes
                  <span className="text-[10px] text-gray-500 font-normal">(hover for bonuses)</span>
                </h4>
                <div className="space-y-1">
                  {Object.entries(recipe.rarityTable).map(([rarity, chance]) => {
                    const bonusInfo = RARITY_BONUS_INFO[rarity as ItemRarity];
                    return (
                    <div 
                      key={rarity} 
                      className="flex items-center gap-2 bg-black/30 p-2 rounded text-xs group relative cursor-help"
                      title={bonusInfo ? `${bonusInfo.multiplier} | ${bonusInfo.secondary}` : ''}
                    >
                      <span className={`${getRarityColor(rarity)} font-bold w-20`}>{rarity}</span>
                      <div className="flex-1 bg-black/60 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full ${
                          rarity === 'Immortal' ? 'bg-amber-500' :
                          rarity === 'Spirit' ? 'bg-purple-500' :
                          rarity === 'Heaven' ? 'bg-blue-500' :
                          rarity === 'Earth' ? 'bg-green-500' : 'bg-gray-500'
                        }`} style={{ width: `${chance}%` }}></div>
                      </div>
                      <span className="text-gray-300 font-bold w-10 text-right">{chance}%</span>
                      
                      {/* Bonus Tooltip on Hover */}
                      {bonusInfo && (
                        <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 bg-black/95 border border-yellow-500/50 rounded-lg p-3 z-50 w-48 shadow-xl">
                          <div className={`text-xs font-bold mb-1 ${getRarityColor(rarity)}`}>{rarity} Grade Bonus</div>
                          <div className="text-[10px] text-cyan-300 flex items-center gap-1">
                            <TrendingUp size={10} /> {bonusInfo.multiplier}
                          </div>
                          <div className="text-[10px] text-purple-300 flex items-center gap-1 mt-1">
                            <Sparkles size={10} /> {bonusInfo.secondary}
                          </div>
                        </div>
                      )}
                    </div>
                  );})}
                </div>
              </div>
            </div>

            {/* CENTER: Class & Tier Selection + Materials */}
            <div className="space-y-4 overflow-y-auto pr-2">
              {/* Class Selection - Only for weapons */}
              {selectedCategory === 'weapon' && (
                <div className="bg-black/40 border-2 border-yellow-600/30 rounded-xl p-4">
                  <label className="text-sm text-yellow-300 font-bold mb-2 block flex items-center gap-2">
                    <User size={14} />
                    Select Weapon Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(Number(e.target.value))}
                    className="w-full bg-black/80 text-yellow-100 border border-yellow-600/50 rounded p-2 focus:border-yellow-500 focus:outline-none text-sm"
                  >
                    <optgroup label="SWORD CLASSES">
                      <option value={1}>Blazing Sword Immortal (Fire)</option>
                      <option value={2}>Glacial Shadow (Ice)</option>
                      <option value={3}>Spellfire Duelist (Fire/Lightning)</option>
                      <option value={4}>Toxic Viper (Poison)</option>
                    </optgroup>
                    <optgroup label="SABER CLASSES">
                      <option value={5}>Asura of War (Fire Tank)</option>
                      <option value={6}>Frozen Steel Guard (Ice Tank)</option>
                      <option value={7}>Verdant Blade Monarch (Wood)</option>
                      <option value={8}>Wilderness Stalker (Wood Speed)</option>
                    </optgroup>
                    <optgroup label="ZITHER CLASSES">
                      <option value={9}>Phoenix Cry Cultivator (Fire)</option>
                      <option value={10}>Divine Melody Healer (Lightning)</option>
                      <option value={11}>Phantom Musician (Void)</option>
                      <option value={12}>Unbreakable Spirit Sage (Void)</option>
                    </optgroup>
                  </select>
                </div>
              )}

              {/* Accessory Info - For rings/necklaces */}
              {selectedCategory !== 'weapon' && (
                <div className={`border-2 rounded-xl p-4 ${
                  selectedCategory === 'ring' ? 'bg-purple-900/20 border-purple-600/30' : 'bg-cyan-900/20 border-cyan-600/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedCategory === 'ring' ? <Gem size={16} className="text-purple-400" /> : <Link size={16} className="text-cyan-400" />}
                    <span className={`text-sm font-bold ${selectedCategory === 'ring' ? 'text-purple-300' : 'text-cyan-300'}`}>
                      {selectedCategory === 'ring' ? 'Ring Crafting' : 'Necklace Crafting'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Accessories are universal and can be equipped by all classes. They provide stat bonuses and set effects when worn together.
                  </p>
                </div>
              )}

              {/* Tier Selection */}
              <div className="bg-black/40 border-2 border-yellow-600/30 rounded-xl p-4">
                <label className="text-sm text-yellow-300 font-bold mb-2 block">Select Tier</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier as 1 | 2 | 3 | 4)}
                      className={`py-2 rounded font-bold text-sm transition-all ${
                        selectedTier === tier
                          ? 'bg-gradient-to-br from-yellow-600 to-yellow-700 text-black border-2 border-yellow-400'
                          : 'bg-black/50 text-yellow-400 border border-yellow-600/30 hover:bg-yellow-900/30'
                      }`}
                    >
                      Tier {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Required Materials */}
              <div className="bg-black/40 border-2 border-yellow-600/30 rounded-xl p-4">
                <h4 className="text-sm text-yellow-300 font-bold mb-2 flex items-center gap-2">
                  <Package size={14} />
                  Required Materials
                </h4>
                <div className="space-y-1 max-h-[180px] overflow-y-auto">
                  {recipe.costs.map((cost) => {
                    const mat = getMaterialDetails(cost.materialId);
                    const hasAmount = playerMaterials[cost.materialId] || 0;
                    const isSufficient = hasAmount >= cost.quantity;
                    return (
                      <div key={cost.materialId} className={`flex items-center justify-between p-2 rounded border text-xs ${
                        isSufficient ? 'bg-green-900/10 border-green-600/30' : 'bg-red-900/10 border-red-600/30'
                      }`}>
                        <div className="flex items-center gap-2">
                          <MaterialIcon materialId={cost.materialId} size="md" />
                          <span className={isSufficient ? 'text-green-200' : 'text-red-200'}>{mat?.name || cost.materialId}</span>
                        </div>
                        <span className={`font-bold flex items-center gap-1 ${isSufficient ? 'text-green-400' : 'text-red-400'}`}>
                          {hasAmount}/{cost.quantity} {isSufficient ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        </span>
                      </div>
                    );
                  })}
                  {/* Spirit Stones */}
                  <div className={`flex items-center justify-between p-2 rounded border text-xs ${
                    playerSpiritStones >= recipe.spiritStones ? 'bg-green-900/10 border-green-600/30' : 'bg-red-900/10 border-red-600/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      <SpiritStoneIcon size="md" />
                      <span className={playerSpiritStones >= recipe.spiritStones ? 'text-green-200' : 'text-red-200'}>Spirit Stones</span>
                    </div>
                    <span className={`font-bold flex items-center gap-1 ${playerSpiritStones >= recipe.spiritStones ? 'text-green-400' : 'text-red-400'}`}>
                      {playerSpiritStones}/{recipe.spiritStones} {playerSpiritStones >= recipe.spiritStones ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Recipe Info & Craft Button */}
            <div className="space-y-4 flex flex-col">
              {/* Recipe Success Rate */}
              <div className={`bg-gradient-to-r from-black/60 p-4 rounded-xl border-2 ${
                selectedCategory === 'weapon' ? 'to-amber-900/20 border-yellow-600/30' :
                selectedCategory === 'ring' ? 'to-purple-900/20 border-purple-600/30' : 'to-cyan-900/20 border-cyan-600/30'
              }`}>
                <p className="text-xs text-yellow-200/60 mb-1">CRAFTING RECIPE</p>
                <h3 className={`text-lg font-bold mb-2 ${
                  selectedCategory === 'weapon' ? 'text-yellow-300' :
                  selectedCategory === 'ring' ? 'text-purple-300' : 'text-cyan-300'
                }`}>{recipe.name}</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/40 rounded-full h-2 overflow-hidden border border-yellow-600/30">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${recipe.successRate}%` }}></div>
                  </div>
                  <span className="text-green-400 font-bold text-sm">{recipe.successRate}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  {recipe.successRate >= 80 
                    ? <><Star size={12} className="text-green-400" /> High Success</> 
                    : recipe.successRate >= 70 
                      ? <><AlertTriangle size={12} className="text-yellow-400" /> Moderate Risk</> 
                      : <><XCircle size={12} className="text-red-400" /> High Risk!</>}
                </p>
              </div>

              {/* Warning */}
              {recipe.failPenalty !== 'none' && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle size={14} />
                    On failure: 50% materials lost!
                  </p>
                </div>
              )}

              {/* Special Effects Preview */}
              {currentItem.specialEffects && currentItem.specialEffects.length > 0 && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                  <p className="text-xs text-purple-300 mb-1 flex items-center gap-1">
                    <Sparkles size={12} />
                    SPECIAL EFFECTS (Epic/Legendary)
                  </p>
                  {currentItem.specialEffects.map((effect: string, idx: number) => (
                    <p key={idx} className="text-[10px] text-purple-200">• {effect}</p>
                  ))}
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1"></div>

              {/* Craft Button */}
              <button
                onClick={handleCraft}
                disabled={!canCraftNow}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform flex items-center justify-center gap-2 ${
                  canCraftNow
                    ? selectedCategory === 'weapon' 
                      ? 'bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-black shadow-lg shadow-yellow-500/50 hover:scale-105'
                      : selectedCategory === 'ring'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-lg shadow-purple-500/50 hover:scale-105'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/50 hover:scale-105'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isCrafting ? (
                  <><Settings size={20} className="animate-spin" /> Forging...</>
                ) : canCraftNow ? (
                  <><Hammer size={20} /> Forge {selectedCategory === 'weapon' ? 'Weapon' : selectedCategory === 'ring' ? 'Ring' : 'Necklace'} <Sparkles size={16} /></>
                ) : (
                  <><Hammer size={20} /> Insufficient Materials <Sparkles size={16} /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Craft Result Notification */}
        {craftResult && (
          <div className="p-6 border-t-2 border-yellow-600/30">
            <div className={`p-6 rounded-xl border-2 ${
              craftResult.success 
                ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-500' 
                : 'bg-gradient-to-r from-red-900/40 to-orange-900/40 border-red-500'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  craftResult.success ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {craftResult.success ? (
                    <CheckCircle className="text-green-400" size={32} />
                  ) : (
                    <XCircle className="text-red-400" size={32} />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-lg flex items-center gap-2 ${craftResult.success ? 'text-green-300' : 'text-red-300'}`}>
                    {craftResult.success ? <><Sparkles size={16} /> Forging Successful!</> : <><XCircle size={16} /> Forging Failed</>}
                  </p>
                  <p className={`text-sm mt-1 ${craftResult.success ? 'text-green-200' : 'text-red-200'}`}>
                    {craftResult.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

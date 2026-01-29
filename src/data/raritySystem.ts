// ============================================
// RARITY SYSTEM - Wuxia-themed Item Grades
// ============================================
// Mortal → Earth → Heaven → Spirit → Immortal
// ============================================

// ============================================
// RARITY TYPES & CONSTANTS
// ============================================

export type ItemRarity = 'Mortal' | 'Earth' | 'Heaven' | 'Spirit' | 'Immortal';

export interface RarityConfig {
  name: ItemRarity;
  displayName: string;           // Wuxia-themed display name
  color: string;                 // Hex color
  bgColor: string;               // Background color (subtle)
  borderColor: string;           // Border color
  glowColor: string;             // Glow/shadow color
  textClass: string;             // Tailwind text class
  statMultiplier: number;        // Stat multiplier (1.0 = base)
  secondarySlots: number;        // Number of bonus stat slots
  cssClass: string;              // CSS class name
  tier: number;                  // Numeric tier (1-5)
}

export const RARITY_CONFIG: Record<ItemRarity, RarityConfig> = {
  Mortal: {
    name: 'Mortal',
    displayName: 'Mortal Grade',
    color: '#9CA3AF',
    bgColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.4)',
    glowColor: 'rgba(156, 163, 175, 0.2)',
    textClass: 'text-gray-400',
    statMultiplier: 1.0,
    secondarySlots: 0,
    cssClass: 'rarity-mortal',
    tier: 1,
  },
  Earth: {
    name: 'Earth',
    displayName: 'Earth Grade',
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    glowColor: 'rgba(34, 197, 94, 0.3)',
    textClass: 'text-green-400',
    statMultiplier: 1.2,
    secondarySlots: 1,
    cssClass: 'rarity-earth',
    tier: 2,
  },
  Heaven: {
    name: 'Heaven',
    displayName: 'Heaven Grade',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    textClass: 'text-blue-400',
    statMultiplier: 1.45,
    secondarySlots: 2,
    cssClass: 'rarity-heaven',
    tier: 3,
  },
  Spirit: {
    name: 'Spirit',
    displayName: 'Spirit Grade',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    textClass: 'text-purple-400',
    statMultiplier: 1.75,
    secondarySlots: 3,
    cssClass: 'rarity-spirit',
    tier: 4,
  },
  Immortal: {
    name: 'Immortal',
    displayName: 'Immortal Grade',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    textClass: 'text-amber-400',
    statMultiplier: 2.2,
    secondarySlots: 4,
    cssClass: 'rarity-immortal',
    tier: 5,
  },
};

// Ordered rarity list (lowest to highest)
export const RARITY_ORDER: ItemRarity[] = ['Mortal', 'Earth', 'Heaven', 'Spirit', 'Immortal'];

// ============================================
// SECONDARY STATS SYSTEM
// ============================================

export type SecondaryStatType = 
  | 'critChance'
  | 'critDamage'
  | 'hpBonus'
  | 'qiBonus'
  | 'dodge'
  | 'block'
  | 'lifeSteal'
  | 'qiRegen'
  | 'damageReduction';

export interface SecondaryStatConfig {
  type: SecondaryStatType;
  name: string;
  suffix: string;           // %, flat, /turn
  minValue: number;
  maxValue: number;
  weight: number;           // Drop weight (higher = more common)
}

export const SECONDARY_STATS: SecondaryStatConfig[] = [
  { type: 'critChance', name: 'Critical Chance', suffix: '%', minValue: 2, maxValue: 12, weight: 15 },
  { type: 'critDamage', name: 'Critical Damage', suffix: '%', minValue: 8, maxValue: 35, weight: 12 },
  { type: 'hpBonus', name: 'HP Bonus', suffix: '', minValue: 15, maxValue: 80, weight: 18 },
  { type: 'qiBonus', name: 'QI Bonus', suffix: '', minValue: 10, maxValue: 50, weight: 15 },
  { type: 'dodge', name: 'Dodge', suffix: '%', minValue: 2, maxValue: 8, weight: 10 },
  { type: 'block', name: 'Block', suffix: '%', minValue: 3, maxValue: 10, weight: 10 },
  { type: 'lifeSteal', name: 'Life Steal', suffix: '%', minValue: 1, maxValue: 6, weight: 8 },
  { type: 'qiRegen', name: 'QI Regen', suffix: '/turn', minValue: 2, maxValue: 12, weight: 7 },
  { type: 'damageReduction', name: 'Damage Reduction', suffix: '%', minValue: 2, maxValue: 10, weight: 5 },
];

export interface SecondaryStatRoll {
  type: SecondaryStatType;
  name: string;
  value: number;
  suffix: string;
}

// ============================================
// DROP RATE TABLES
// ============================================

// Normal mobs - Spirit/Immortal NOT available from normal mobs
export interface RarityDropTable {
  Mortal: number;
  Earth: number;
  Heaven: number;
  Spirit: number;
  Immortal: number;
}

// Regular mobs by zone tier - NO Spirit/Immortal from regular mobs
export const MOB_RARITY_DROPS: Record<1 | 2 | 3 | 4, RarityDropTable> = {
  1: { Mortal: 80, Earth: 18, Heaven: 2, Spirit: 0, Immortal: 0 },
  2: { Mortal: 65, Earth: 28, Heaven: 7, Spirit: 0, Immortal: 0 },
  3: { Mortal: 50, Earth: 35, Heaven: 15, Spirit: 0, Immortal: 0 },
  4: { Mortal: 40, Earth: 38, Heaven: 22, Spirit: 0, Immortal: 0 },
};

// Boss types - ONLY source of Spirit/Immortal drops
export type BossType = 'elite' | 'miniBoss' | 'zoneBoss' | 'worldBoss';

export const BOSS_RARITY_DROPS: Record<BossType, RarityDropTable> = {
  elite:     { Mortal: 50, Earth: 35, Heaven: 14, Spirit: 1, Immortal: 0 },
  miniBoss:  { Mortal: 25, Earth: 40, Heaven: 28, Spirit: 6, Immortal: 1 },
  zoneBoss:  { Mortal: 5, Earth: 25, Heaven: 40, Spirit: 25, Immortal: 5 },
  worldBoss: { Mortal: 0, Earth: 10, Heaven: 30, Spirit: 45, Immortal: 15 },
};

// ============================================
// CRAFTING RARITY TABLES
// Primary method to obtain high-rarity items
// ============================================

export interface CraftingRarityTable {
  tierBonus: number;              // Bonus % to higher rarities based on material tier
  baseTable: RarityDropTable;     // Base chances before modifiers
}

// Base crafting tables by recipe tier
// Higher tier recipes = better chance for high rarity
export const CRAFTING_RARITY_TABLES: Record<1 | 2 | 3 | 4, RarityDropTable> = {
  1: { Mortal: 50, Earth: 35, Heaven: 13, Spirit: 2, Immortal: 0 },
  2: { Mortal: 30, Earth: 40, Heaven: 22, Spirit: 7, Immortal: 1 },
  3: { Mortal: 15, Earth: 30, Heaven: 35, Spirit: 17, Immortal: 3 },
  4: { Mortal: 5, Earth: 15, Heaven: 35, Spirit: 35, Immortal: 10 },
};

// Material quality bonuses (applied when using higher rarity materials)
export const MATERIAL_RARITY_BONUS: Record<ItemRarity, number> = {
  Mortal: 0,
  Earth: 5,      // +5% to next tier chances
  Heaven: 12,    // +12% to next tier
  Spirit: 20,    // +20% to next tier
  Immortal: 35,  // +35% to next tier
};

// ============================================
// REFORGE/UPGRADE SYSTEM
// ============================================

export interface ReforgeConfig {
  fromRarity: ItemRarity;
  toRarity: ItemRarity;
  spiritStoneCost: number;
  successRate: number;           // 0-100
  failureResult: 'maintain' | 'downgrade';
  downgradeChance: number;       // If failureResult is 'downgrade', % chance to lose tier
  requiredMaterials?: { materialId: string; quantity: number }[];
}

export const REFORGE_CONFIG: ReforgeConfig[] = [
  {
    fromRarity: 'Mortal',
    toRarity: 'Earth',
    spiritStoneCost: 500,
    successRate: 70,
    failureResult: 'maintain',
    downgradeChance: 0,
    requiredMaterials: [{ materialId: 'MAT_T1_001', quantity: 5 }],
  },
  {
    fromRarity: 'Earth',
    toRarity: 'Heaven',
    spiritStoneCost: 2000,
    successRate: 45,
    failureResult: 'maintain',
    downgradeChance: 0,
    requiredMaterials: [{ materialId: 'MAT_T2_001', quantity: 8 }],
  },
  {
    fromRarity: 'Heaven',
    toRarity: 'Spirit',
    spiritStoneCost: 8000,
    successRate: 25,
    failureResult: 'downgrade',
    downgradeChance: 20,
    requiredMaterials: [{ materialId: 'MAT_T3_001', quantity: 12 }],
  },
  {
    fromRarity: 'Spirit',
    toRarity: 'Immortal',
    spiritStoneCost: 35000,
    successRate: 10,
    failureResult: 'downgrade',
    downgradeChance: 30,
    requiredMaterials: [{ materialId: 'MAT_T4_001', quantity: 20 }],
  },
];

// ============================================
// SALVAGE/DISMANTLE RETURNS
// ============================================

export interface SalvageReturn {
  spiritStones: { min: number; max: number };
  materials: { tier: number; quantity: number }[];
  specialMaterial?: { id: string; chance: number };
}

export const SALVAGE_RETURNS: Record<ItemRarity, SalvageReturn> = {
  Mortal: {
    spiritStones: { min: 5, max: 15 },
    materials: [{ tier: 1, quantity: 1 }],
  },
  Earth: {
    spiritStones: { min: 30, max: 60 },
    materials: [{ tier: 1, quantity: 2 }, { tier: 2, quantity: 1 }],
  },
  Heaven: {
    spiritStones: { min: 150, max: 250 },
    materials: [{ tier: 2, quantity: 2 }, { tier: 3, quantity: 1 }],
  },
  Spirit: {
    spiritStones: { min: 500, max: 800 },
    materials: [{ tier: 3, quantity: 2 }, { tier: 4, quantity: 1 }],
    specialMaterial: { id: 'MAT_RARE_ESSENCE', chance: 15 },
  },
  Immortal: {
    spiritStones: { min: 2000, max: 3500 },
    materials: [{ tier: 4, quantity: 3 }],
    specialMaterial: { id: 'MAT_IMMORTAL_SHARD', chance: 50 },
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get rarity configuration
 */
export function getRarityConfig(rarity: ItemRarity): RarityConfig {
  return RARITY_CONFIG[rarity];
}

/**
 * Get rarity color for display
 */
export function getRarityColor(rarity: ItemRarity): string {
  return RARITY_CONFIG[rarity].color;
}

/**
 * Get rarity text CSS class
 */
export function getRarityTextClass(rarity: ItemRarity): string {
  const config = RARITY_CONFIG[rarity];
  if (!config) return 'text-gray-400';
  return config.textClass;
}

// Map legacy rarity names to new Wuxia names
const LEGACY_TO_WUXIA: Record<string, ItemRarity> = {
  'Common': 'Mortal',
  'Uncommon': 'Earth',
  'Rare': 'Heaven',
  'Epic': 'Spirit',
  'Legendary': 'Immortal',
};

/**
 * Get stat multiplier for a rarity (supports both old and new rarity names)
 */
export function getRarityMultiplier(rarity: string): number {
  // Try direct lookup first
  if (RARITY_CONFIG[rarity as ItemRarity]) {
    return RARITY_CONFIG[rarity as ItemRarity].statMultiplier;
  }
  // Try legacy rarity conversion
  const wuxiaRarity = LEGACY_TO_WUXIA[rarity];
  if (wuxiaRarity && RARITY_CONFIG[wuxiaRarity]) {
    return RARITY_CONFIG[wuxiaRarity].statMultiplier;
  }
  // Default fallback
  return 1.0;
}

/**
 * Roll for item rarity from a drop table
 */
export function rollRarity(table: RarityDropTable): ItemRarity {
  const roll = Math.random() * 100;
  let cumulative = 0;
  
  for (const rarity of RARITY_ORDER) {
    cumulative += table[rarity];
    if (roll < cumulative) {
      return rarity;
    }
  }
  
  return 'Mortal'; // Fallback
}

/**
 * Roll secondary stats for an item
 */
export function rollSecondaryStats(rarity: ItemRarity): SecondaryStatRoll[] {
  const config = RARITY_CONFIG[rarity];
  const slots = config.secondarySlots;
  
  if (slots === 0) return [];
  
  const stats: SecondaryStatRoll[] = [];
  const usedTypes: Set<SecondaryStatType> = new Set();
  
  // Calculate total weight
  const totalWeight = SECONDARY_STATS.reduce((sum, s) => sum + s.weight, 0);
  
  for (let i = 0; i < slots; i++) {
    // Roll for stat type (weighted)
    let roll = Math.random() * totalWeight;
    let selectedStat: SecondaryStatConfig | null = null;
    
    for (const stat of SECONDARY_STATS) {
      if (usedTypes.has(stat.type)) continue;
      
      roll -= stat.weight;
      if (roll <= 0) {
        selectedStat = stat;
        break;
      }
    }
    
    // Fallback to first unused stat
    if (!selectedStat) {
      selectedStat = SECONDARY_STATS.find(s => !usedTypes.has(s.type)) || SECONDARY_STATS[0];
    }
    
    usedTypes.add(selectedStat.type);
    
    // Roll value based on rarity (higher rarity = higher rolls)
    const rarityBonus = config.tier / 5; // 0.2 to 1.0
    const range = selectedStat.maxValue - selectedStat.minValue;
    const minRoll = selectedStat.minValue + (range * (rarityBonus - 0.2));
    const value = Math.floor(minRoll + Math.random() * (selectedStat.maxValue - minRoll));
    
    stats.push({
      type: selectedStat.type,
      name: selectedStat.name,
      value,
      suffix: selectedStat.suffix,
    });
  }
  
  return stats;
}

/**
 * Apply stat multiplier to base stats
 */
export function applyRarityMultiplier(
  baseStats: Record<string, number>,
  rarity: ItemRarity
): Record<string, number> {
  const multiplier = getRarityMultiplier(rarity);
  const result: Record<string, number> = {};
  
  for (const [key, value] of Object.entries(baseStats)) {
    result[key] = Math.floor(value * multiplier);
  }
  
  return result;
}

/**
 * Get reforge config for a rarity upgrade
 */
export function getReforgeConfig(fromRarity: ItemRarity): ReforgeConfig | null {
  return REFORGE_CONFIG.find(c => c.fromRarity === fromRarity) || null;
}

/**
 * Attempt reforge upgrade
 */
export function attemptReforge(
  currentRarity: ItemRarity,
  pityBonus: number = 0
): { success: boolean; newRarity: ItemRarity; downgraded: boolean } {
  const config = getReforgeConfig(currentRarity);
  
  if (!config) {
    return { success: false, newRarity: currentRarity, downgraded: false };
  }
  
  const successChance = Math.min(config.successRate + pityBonus, 95);
  const roll = Math.random() * 100;
  
  if (roll < successChance) {
    return { success: true, newRarity: config.toRarity, downgraded: false };
  }
  
  // Check for downgrade on failure
  if (config.failureResult === 'downgrade') {
    const downgradeRoll = Math.random() * 100;
    if (downgradeRoll < config.downgradeChance) {
      const currentIndex = RARITY_ORDER.indexOf(currentRarity);
      const newRarity = currentIndex > 0 ? RARITY_ORDER[currentIndex - 1] : currentRarity;
      return { success: false, newRarity, downgraded: true };
    }
  }
  
  return { success: false, newRarity: currentRarity, downgraded: false };
}

/**
 * Get salvage returns for an item
 */
export function getSalvageReturns(rarity: ItemRarity, itemTier: number): SalvageReturn {
  const baseReturns = SALVAGE_RETURNS[rarity];
  
  // Scale returns by item tier
  const tierMultiplier = itemTier;
  
  return {
    spiritStones: {
      min: Math.floor(baseReturns.spiritStones.min * tierMultiplier),
      max: Math.floor(baseReturns.spiritStones.max * tierMultiplier),
    },
    materials: baseReturns.materials.map(m => ({
      ...m,
      quantity: Math.max(1, Math.floor(m.quantity * (itemTier / 2))),
    })),
    specialMaterial: baseReturns.specialMaterial,
  };
}

/**
 * Get crafting rarity chances with material bonuses applied
 */
export function getCraftingRarityTable(
  recipeTier: 1 | 2 | 3 | 4,
  materialQualities: ItemRarity[]
): RarityDropTable {
  const baseTable = { ...CRAFTING_RARITY_TABLES[recipeTier] };
  
  // Calculate bonus from materials
  let totalBonus = 0;
  for (const quality of materialQualities) {
    totalBonus += MATERIAL_RARITY_BONUS[quality];
  }
  
  // Average bonus
  const avgBonus = materialQualities.length > 0 
    ? totalBonus / materialQualities.length 
    : 0;
  
  // Apply bonus by shifting probabilities up
  if (avgBonus > 0) {
    // Reduce Mortal/Earth, increase Spirit/Immortal
    const shift = avgBonus / 100;
    baseTable.Mortal = Math.max(0, baseTable.Mortal - (avgBonus * 0.5));
    baseTable.Earth = Math.max(0, baseTable.Earth - (avgBonus * 0.3));
    baseTable.Heaven += avgBonus * 0.2;
    baseTable.Spirit += avgBonus * 0.4;
    baseTable.Immortal += avgBonus * 0.2;
  }
  
  return baseTable;
}

/**
 * Compare two rarities
 * Returns: negative if a < b, 0 if equal, positive if a > b
 */
export function compareRarity(a: ItemRarity, b: ItemRarity): number {
  return RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b);
}

/**
 * Check if rarity A is higher than rarity B
 */
export function isRarityHigher(a: ItemRarity, b: ItemRarity): boolean {
  return compareRarity(a, b) > 0;
}

/**
 * Get next rarity tier (or null if max)
 */
export function getNextRarity(current: ItemRarity): ItemRarity | null {
  const index = RARITY_ORDER.indexOf(current);
  return index < RARITY_ORDER.length - 1 ? RARITY_ORDER[index + 1] : null;
}

/**
 * Get previous rarity tier (or null if min)
 */
export function getPreviousRarity(current: ItemRarity): ItemRarity | null {
  const index = RARITY_ORDER.indexOf(current);
  return index > 0 ? RARITY_ORDER[index - 1] : null;
}

// ============================================
// LEGACY COMPATIBILITY
// Map old rarity names to new system
// ============================================

export type LegacyRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export const LEGACY_TO_NEW_RARITY: Record<LegacyRarity, ItemRarity> = {
  Common: 'Mortal',
  Uncommon: 'Earth',
  Rare: 'Heaven',
  Epic: 'Spirit',
  Legendary: 'Immortal',
};

export const NEW_TO_LEGACY_RARITY: Record<ItemRarity, LegacyRarity> = {
  Mortal: 'Common',
  Earth: 'Uncommon',
  Heaven: 'Rare',
  Spirit: 'Epic',
  Immortal: 'Legendary',
};

export function convertLegacyRarity(legacy: LegacyRarity | string): ItemRarity {
  if (legacy in LEGACY_TO_NEW_RARITY) {
    return LEGACY_TO_NEW_RARITY[legacy as LegacyRarity];
  }
  // Already new format or unknown
  if (RARITY_ORDER.includes(legacy as ItemRarity)) {
    return legacy as ItemRarity;
  }
  return 'Mortal';
}

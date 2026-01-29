// ============================================
// ACCESSORY ITEMS - Rings & Necklaces (Generic - All Classes)
// 4 Tiers × 2 Types = 8 Base Items
// ============================================

import type { GearRarity } from './gearItems';

export interface AccessoryItem {
  id: string;
  tier: 1 | 2 | 3 | 4;
  name: string;
  type: 'ring' | 'necklace';
  slot: 'ring' | 'necklace';
  stats: {
    str?: number;
    dex?: number;
    con?: number;
    spi?: number;
    wil?: number;
  };
  rarity: GearRarity;
  desc: string;
  specialEffects?: string[];
}

export const accessoryItems: AccessoryItem[] = [
  // ============================================
  // TIER 1: QI CONDENSATION (Lv 1-9)
  // Simple stat boosts, no special effects
  // ============================================
  {
    id: 'RING_T1_001',
    tier: 1,
    name: 'Jade Spirit Ring',
    type: 'ring',
    slot: 'ring',
    stats: { str: 1, dex: 1, con: 1 },
    rarity: 'Uncommon',
    desc: 'A simple jade ring imbued with minor spiritual energy. Favored by new cultivators.',
  },
  {
    id: 'NECK_T1_001',
    tier: 1,
    name: 'Qi Gathering Pendant',
    type: 'necklace',
    slot: 'necklace',
    stats: { spi: 2, wil: 1 },
    rarity: 'Uncommon',
    desc: 'A small pendant that helps concentrate spiritual energy during meditation.',
  },

  // ============================================
  // TIER 2: FOUNDATION ESTABLISHMENT EARLY (Lv 10-14)
  // Improved stats, minor effects
  // ============================================
  {
    id: 'RING_T2_001',
    tier: 2,
    name: 'Azure Cloud Ring',
    type: 'ring',
    slot: 'ring',
    stats: { str: 2, dex: 2, con: 2 },
    rarity: 'Rare',
    desc: 'Forged within the Azure Cloud Sect. Grants clarity and balance to the wearer.',
  },
  {
    id: 'NECK_T2_001',
    tier: 2,
    name: 'Foundation Jade Amulet',
    type: 'necklace',
    slot: 'necklace',
    stats: { spi: 4, wil: 2 },
    rarity: 'Rare',
    desc: 'An amulet carved from foundation-grade jade. Strengthens the cultivator\'s spiritual foundation.',
  },

  // ============================================
  // TIER 3: FOUNDATION ESTABLISHMENT LATE (Lv 15-19)
  // Strong stats, moderate effects
  // ============================================
  {
    id: 'RING_T3_001',
    tier: 3,
    name: 'Heavenly Thunder Ring',
    type: 'ring',
    slot: 'ring',
    stats: { str: 4, dex: 3, con: 3 },
    rarity: 'Epic',
    desc: 'Crafted from metals struck by tribulation lightning. Crackles with latent power.',
    specialEffects: ['Lightning Surge: 10% chance to deal bonus lightning damage on attack'],
  },
  {
    id: 'NECK_T3_001',
    tier: 3,
    name: 'Nine Yang Pendant',
    type: 'necklace',
    slot: 'necklace',
    stats: { spi: 6, wil: 4 },
    rarity: 'Epic',
    desc: 'Contains the essence of nine suns. Radiates warmth and spiritual fortitude.',
    specialEffects: ['Yang Protection: Reduces incoming cold/ice damage by 15%'],
  },

  // ============================================
  // TIER 4: GOLDEN CORE (Lv 20-29)
  // Maximum stats, powerful effects
  // ============================================
  {
    id: 'RING_T4_001',
    tier: 4,
    name: 'Golden Core Immortal Ring',
    type: 'ring',
    slot: 'ring',
    stats: { str: 6, dex: 5, con: 4 },
    rarity: 'Legendary',
    desc: 'A ring forged from golden core essence. Worn only by true cultivators who have formed their core.',
    specialEffects: [
      'Core Resonance: +8% to all stats when HP above 70%',
      'Immortal Will: Immune to instant death effects'
    ],
  },
  {
    id: 'NECK_T4_001',
    tier: 4,
    name: 'Celestial Jade Necklace',
    type: 'necklace',
    slot: 'necklace',
    stats: { spi: 8, wil: 6, con: 2 },
    rarity: 'Legendary',
    desc: 'Jade blessed by celestial immortals. Connects the wearer to the heavenly dao.',
    specialEffects: [
      'Heavenly Insight: +15% success rate on all skill checks',
      'Dao Heart: Regenerate 2% max HP per turn in combat'
    ],
  },
];

// ============================================
// ACCESSORY SET BONUSES
// Wearing matching tier ring + necklace
// ============================================
export interface AccessorySetBonus {
  tier: 1 | 2 | 3 | 4;
  name: string;
  desc: string;
  bonusStats: {
    str?: number;
    dex?: number;
    con?: number;
    spi?: number;
    wil?: number;
  };
  bonusEffect?: string;
}

export const accessorySetBonuses: AccessorySetBonus[] = [
  {
    tier: 1,
    name: 'Novice Cultivator Set',
    desc: 'Complete Tier 1 accessories',
    bonusStats: { str: 1, dex: 1, con: 1, spi: 1, wil: 1 },
  },
  {
    tier: 2,
    name: 'Foundation Seeker Set',
    desc: 'Complete Tier 2 accessories',
    bonusStats: { str: 2, dex: 2, con: 2, spi: 2, wil: 2 },
    bonusEffect: 'Spiritual Clarity: +5% EXP gain',
  },
  {
    tier: 3,
    name: 'Heaven\'s Chosen Set',
    desc: 'Complete Tier 3 accessories',
    bonusStats: { str: 3, dex: 3, con: 3, spi: 3, wil: 3 },
    bonusEffect: 'Tribulation Survivor: +10% damage resistance',
  },
  {
    tier: 4,
    name: 'Golden Immortal Set',
    desc: 'Complete Tier 4 accessories',
    bonusStats: { str: 5, dex: 5, con: 5, spi: 5, wil: 5 },
    bonusEffect: 'Immortal Aura: +20% to all damage dealt',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getAccessoryByTier = (tier: 1 | 2 | 3 | 4) =>
  accessoryItems.filter(item => item.tier === tier);

export const getAccessoryById = (id: string) =>
  accessoryItems.find(item => item.id === id);

export const getRingByTier = (tier: 1 | 2 | 3 | 4) =>
  accessoryItems.find(item => item.tier === tier && item.type === 'ring');

export const getNecklaceByTier = (tier: 1 | 2 | 3 | 4) =>
  accessoryItems.find(item => item.tier === tier && item.type === 'necklace');

export const getSetBonus = (tier: 1 | 2 | 3 | 4) =>
  accessorySetBonuses.find(bonus => bonus.tier === tier);

// Check if player has complete set
export const hasCompleteSet = (
  equippedRing: AccessoryItem | null,
  equippedNecklace: AccessoryItem | null
): AccessorySetBonus | null => {
  if (!equippedRing || !equippedNecklace) return null;
  if (equippedRing.tier !== equippedNecklace.tier) return null;
  
  return getSetBonus(equippedRing.tier) || null;
};

// Apply rarity multiplier to accessory stats
export const ACCESSORY_RARITY_MULTIPLIERS: Record<GearRarity, number> = {
  'Common': 0.7,
  'Uncommon': 1.0,
  'Rare': 1.3,
  'Epic': 1.6,
  'Legendary': 2.0,
};

export const applyAccessoryRarityBonus = (
  baseStats: AccessoryItem['stats'],
  rarity: GearRarity
) => {
  const multiplier = ACCESSORY_RARITY_MULTIPLIERS[rarity];
  const result: AccessoryItem['stats'] = {};
  
  for (const [stat, value] of Object.entries(baseStats)) {
    if (value) {
      result[stat as keyof AccessoryItem['stats']] = Math.floor(value * multiplier);
    }
  }
  
  return result;
};

// ============================================
// CRAFTING MATERIALS SYSTEM
// Semi-Hardcore Economy for Level 29 Cap
// ============================================

export type MaterialTier = 1 | 2 | 3 | 4 | 'special';
export type MaterialRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface Material {
  id: string;
  name: string;
  tier: MaterialTier;
  rarity: MaterialRarity;
  desc: string;
  dropRate: number; // Base drop percentage
  sourceLevel: string; // Which mobs drop this
  iconType: string; // For rendering
}

// Material Database
export const materials: Material[] = [
  // ============================================
  // TIER 1 MATERIALS (Qi Condensation - Lv 1-9)
  // ============================================
  {
    id: 'MAT_T1_001',
    name: 'Spirit Iron Ore',
    tier: 1,
    rarity: 'Common',
    desc: 'Basic crafting material. Used for Tier 1 gear.',
    dropRate: 15,
    sourceLevel: 'Lv 1-9 mobs',
    iconType: 'material_ore'
  },
  {
    id: 'MAT_T1_002',
    name: 'Qi Fragment',
    tier: 1,
    rarity: 'Common',
    desc: 'Condensed spiritual energy. Basic crafting material.',
    dropRate: 12,
    sourceLevel: 'Lv 1-9 mobs',
    iconType: 'material_essence'
  },

  // ============================================
  // TIER 2 MATERIALS (Foundation Est. - Lv 10-14)
  // ============================================
  {
    id: 'MAT_T2_001',
    name: 'Azure Crystal',
    tier: 2,
    rarity: 'Uncommon',
    desc: 'Refined spiritual crystal. Used for Tier 2 gear.',
    dropRate: 15,
    sourceLevel: 'Lv 10-14 mobs',
    iconType: 'material_crystal'
  },
  {
    id: 'MAT_T2_002',
    name: 'Foundation Stone',
    tier: 2,
    rarity: 'Uncommon',
    desc: 'Solidified cultivation base. Strengthens equipment.',
    dropRate: 10,
    sourceLevel: 'Lv 10-14 mobs',
    iconType: 'material_stone'
  },

  // ============================================
  // TIER 3 MATERIALS (Foundation Est. - Lv 15-19)
  // ============================================
  {
    id: 'MAT_T3_001',
    name: 'Thunder Essence',
    tier: 3,
    rarity: 'Rare',
    desc: 'Condensed heavenly energy. Used for Tier 3 gear.',
    dropRate: 15,
    sourceLevel: 'Lv 15-19 mobs',
    iconType: 'material_essence'
  },
  {
    id: 'MAT_T3_002',
    name: 'Sky Iron Ingot',
    tier: 3,
    rarity: 'Rare',
    desc: 'Metal forged with tribulation lightning.',
    dropRate: 8,
    sourceLevel: 'Lv 15-19 mobs',
    iconType: 'material_ore'
  },

  // ============================================
  // TIER 4 MATERIALS (Golden Core - Lv 20-29)
  // ============================================
  {
    id: 'MAT_T4_001',
    name: 'Golden Core Fragment',
    tier: 4,
    rarity: 'Epic',
    desc: 'Piece of shattered cultivation core. Tier 4 crafting.',
    dropRate: 10,
    sourceLevel: 'Lv 20-29 mobs',
    iconType: 'material_core'
  },
  {
    id: 'MAT_T4_002',
    name: 'Core Qi Essence',
    tier: 4,
    rarity: 'Epic',
    desc: 'Pure concentrated spiritual energy from Golden Core cultivators.',
    dropRate: 7,
    sourceLevel: 'Lv 20-29 mobs',
    iconType: 'material_essence'
  },

  // ============================================
  // SPECIAL MATERIALS (Boss/Elite drops)
  // ============================================
  {
    id: 'MAT_SP_001',
    name: 'Bloodsteel',
    tier: 'special',
    rarity: 'Epic',
    desc: 'Crimson metal forged in ancient battles. Used for reforging.',
    dropRate: 5,
    sourceLevel: 'Boss mobs (All tiers)',
    iconType: 'material_special'
  },
  {
    id: 'MAT_SP_002',
    name: 'Immortal Jade',
    tier: 'special',
    rarity: 'Legendary',
    desc: 'Precious jade from ancient immortals. Legendary crafting.',
    dropRate: 2,
    sourceLevel: 'Legendary mobs (Lv 20+)',
    iconType: 'material_jade'
  },
  // ============================================
  // CLASS TOKENS - Only 3 for 1st Release (Sword, Saber, Zither)
  // Drop from tagged mobs with matching weapon type
  // ============================================
  {
    id: 'MAT_SP_003',
    name: 'Sword Dao Token',
    tier: 'special',
    rarity: 'Rare',
    desc: 'A token infused with the essence of sword mastery. Required for Tier 4 sword crafting.',
    dropRate: 5,
    sourceLevel: 'Sword-wielding bosses (Soul Reaver, Undead Emperor)',
    iconType: 'token_sword'
  },
  {
    id: 'MAT_SP_004',
    name: 'Saber Intent Fragment',
    tier: 'special',
    rarity: 'Rare',
    desc: 'A fragment containing fierce saber intent. Required for Tier 4 saber crafting.',
    dropRate: 5,
    sourceLevel: 'Saber-wielding bosses (Bandit Captain, Flame Demon)',
    iconType: 'token_saber'
  },
  {
    id: 'MAT_SP_005',
    name: 'Harmonic Zither String',
    tier: 'special',
    rarity: 'Rare',
    desc: 'A celestial string that resonates with dao. Required for Tier 4 zither crafting.',
    dropRate: 5,
    sourceLevel: 'Celestial Phoenix, Infernal Phoenix',
    iconType: 'token_zither'
  },
];

// Helper: Get materials by tier
export const getMaterialsByTier = (tier: MaterialTier) => 
  materials.filter(mat => mat.tier === tier);

// Helper: Get special materials
export const getSpecialMaterials = () => 
  materials.filter(mat => mat.tier === 'special');

// Helper: Get material by ID
export const getMaterialById = (id: string) => 
  materials.find(mat => mat.id === id);

// Drop rate tables by mob level
export const getDropTableForLevel = (mobLevel: number) => {
  if (mobLevel <= 9) {
    return {
      materials: getMaterialsByTier(1),
      dropRate: 15,
    };
  } else if (mobLevel <= 14) {
    return {
      materials: getMaterialsByTier(2),
      dropRate: 15,
    };
  } else if (mobLevel <= 19) {
    return {
      materials: getMaterialsByTier(3),
      dropRate: 15,
    };
  } else {
    return {
      materials: getMaterialsByTier(4),
      dropRate: 10,
    };
  }
};

// Boss drop table (includes special materials)
export const getBossDropTable = (mobLevel: number) => {
  const baseTable = getDropTableForLevel(mobLevel);
  return {
    materials: [...baseTable.materials, ...getSpecialMaterials()],
    dropRate: 25, // Bosses have better drop rate
  };
};

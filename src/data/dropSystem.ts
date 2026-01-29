// ============================================
// COMPLETE DROP SYSTEM - WuxiaMUD
// Thematic Wuxia/Xianxia drops with balanced progression
// Uses Wuxia Rarity: Mortal → Earth → Heaven → Spirit → Immortal
// ============================================

import { 
  type ItemRarity, 
  rollRarity as rollRarityFromTable,
  MOB_RARITY_DROPS,
  BOSS_RARITY_DROPS,
  type BossType,
  type RarityDropTable 
} from './raritySystem';

// ============================================
// VENDOR TRASH (Generic Junk Items)
// Sold to vendors for Spirit Stones
// ============================================

export interface VendorItem {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  sellValue: number; // Spirit Stones
  desc: string;
  iconType: string;
  tags?: MobTag[]; // Which mob types can drop this
}

// ============================================
// JUNK ICON TYPES (12 total - matches available assets):
// junk_rat_tail, junk_spider_silk, junk_poison_fang, junk_phoenix_feather,
// junk_dragon_scale, junk_bone, junk_cloth, junk_crystal, junk_coin,
// junk_scroll, junk_demon_core, currency_spirit_stone
// ============================================

export const vendorItems: VendorItem[] = [
  // ============================================
  // TIER 1 - Qi Condensation (Lv 1-9) - 5-25 stones
  // ============================================
  { id: 'JUNK_T1_001', name: 'Tattered Cultivation Manual', tier: 1, sellValue: 8, desc: 'A worn manual with faded techniques. Worth little.', iconType: 'junk_scroll', tags: ['human'] },
  { id: 'JUNK_T1_002', name: 'Cracked Spirit Stone', tier: 1, sellValue: 5, desc: 'A damaged spirit stone. Its energy has mostly dissipated.', iconType: 'junk_crystal', tags: ['elemental', 'nature'] },
  { id: 'JUNK_T1_003', name: 'Rusted Copper Coin', tier: 1, sellValue: 6, desc: 'An ancient coin from a forgotten dynasty.', iconType: 'junk_coin', tags: ['human'] },
  { id: 'JUNK_T1_004', name: 'Rat Tail', tier: 1, sellValue: 10, desc: 'A severed tail from a spirit rat. Common but useful.', iconType: 'junk_rat_tail', tags: ['beast'] },
  { id: 'JUNK_T1_005', name: 'Spider Silk Thread', tier: 1, sellValue: 7, desc: 'Sticky silk from a garden spider.', iconType: 'junk_spider_silk', tags: ['beast'] },
  { id: 'JUNK_T1_006', name: 'Beast Bone Fragment', tier: 1, sellValue: 12, desc: 'A piece of bone from a low-level spirit beast.', iconType: 'junk_bone', tags: ['beast', 'undead'] },
  { id: 'JUNK_T1_007', name: 'Torn Disciple Robe', tier: 1, sellValue: 15, desc: 'A damaged outer sect disciple robe.', iconType: 'junk_cloth', tags: ['human'] },
  { id: 'JUNK_T1_008', name: 'Poison Fang', tier: 1, sellValue: 18, desc: 'A venomous fang from a pestilent worm.', iconType: 'junk_poison_fang', tags: ['beast'] },
  { id: 'JUNK_T1_009', name: 'Faded Sect Token', tier: 1, sellValue: 20, desc: 'An old token from a minor sect.', iconType: 'junk_coin', tags: ['human'] },
  { id: 'JUNK_T1_010', name: 'Chipped Jade Piece', tier: 1, sellValue: 25, desc: 'Low-quality jade with visible cracks.', iconType: 'junk_crystal', tags: ['elemental', 'nature'] },

  // ============================================
  // TIER 2 - Foundation Establishment Early (Lv 10-14) - 30-80 stones
  // ============================================
  { id: 'JUNK_T2_001', name: 'Depleted Qi Crystal', tier: 2, sellValue: 35, desc: 'A crystal drained of its spiritual energy.', iconType: 'junk_crystal', tags: ['elemental', 'nature'] },
  { id: 'JUNK_T2_002', name: 'Venomous Spider Fang', tier: 2, sellValue: 40, desc: 'A large poison fang from a deadly spider.', iconType: 'junk_poison_fang', tags: ['beast'] },
  { id: 'JUNK_T2_003', name: 'Worn Leather Pouch', tier: 2, sellValue: 30, desc: 'An old storage pouch with holes.', iconType: 'junk_cloth', tags: ['human'] },
  { id: 'JUNK_T2_004', name: 'Serpent Scale', tier: 2, sellValue: 55, desc: 'A tough scale from a rock serpent.', iconType: 'junk_dragon_scale', tags: ['beast', 'dragon'] },
  { id: 'JUNK_T2_005', name: 'Demonic Beast Hide', tier: 2, sellValue: 45, desc: 'Damaged beast hide. Too torn to craft.', iconType: 'junk_cloth', tags: ['beast', 'demon'] },
  { id: 'JUNK_T2_006', name: 'Fractured Spirit Bone', tier: 2, sellValue: 50, desc: 'A cracked bone from a foundation beast.', iconType: 'junk_bone', tags: ['beast', 'undead'] },
  { id: 'JUNK_T2_007', name: 'Dusty Technique Scroll', tier: 2, sellValue: 60, desc: 'A scroll with illegible instructions.', iconType: 'junk_scroll', tags: ['human'] },
  { id: 'JUNK_T2_008', name: 'Tarnished Silver Ingot', tier: 2, sellValue: 70, desc: 'Impure silver from a failed refinement.', iconType: 'junk_coin', tags: ['human', 'elemental'] },
  { id: 'JUNK_T2_009', name: 'Spider Silk Bundle', tier: 2, sellValue: 32, desc: 'A bundle of strong spider silk.', iconType: 'junk_spider_silk', tags: ['beast'] },
  { id: 'JUNK_T2_010', name: 'Ancient Scroll Fragment', tier: 2, sellValue: 80, desc: 'A fragment of an ancient cultivation manual.', iconType: 'junk_scroll', tags: ['human', 'undead'] },

  // ============================================
  // TIER 3 - Foundation Establishment Late (Lv 15-19) - 100-200 stones
  // ============================================
  { id: 'JUNK_T3_001', name: 'Unstable Thunder Crystal', tier: 3, sellValue: 120, desc: 'A crystal with chaotic energy patterns.', iconType: 'junk_crystal', tags: ['elemental'] },
  { id: 'JUNK_T3_002', name: 'Demon Core Shard', tier: 3, sellValue: 150, desc: 'A fragment of a demon\'s power core.', iconType: 'junk_demon_core', tags: ['demon'] },
  { id: 'JUNK_T3_003', name: 'Lich Bone Fragment', tier: 3, sellValue: 110, desc: 'An ancient bone from an undead cultivator.', iconType: 'junk_bone', tags: ['undead'] },
  { id: 'JUNK_T3_004', name: 'Corrupted Jade', tier: 3, sellValue: 140, desc: 'Beautiful jade tainted by dark energy.', iconType: 'junk_crystal', tags: ['demon', 'elemental'] },
  { id: 'JUNK_T3_005', name: 'Phoenix Feather (Damaged)', tier: 3, sellValue: 180, desc: 'A once-majestic feather now brittle and dull.', iconType: 'junk_phoenix_feather', tags: ['divine', 'beast'] },
  { id: 'JUNK_T3_006', name: 'Cracked Phoenix Feather', tier: 3, sellValue: 130, desc: 'A feather from a celestial phoenix.', iconType: 'junk_phoenix_feather', tags: ['divine', 'beast'] },
  { id: 'JUNK_T3_007', name: 'Shadow Assassin Cloak', tier: 3, sellValue: 100, desc: 'Torn cloth from a shadow assassin.', iconType: 'junk_cloth', tags: ['human'] },
  { id: 'JUNK_T3_008', name: 'Elemental Core Fragment', tier: 3, sellValue: 170, desc: 'A fragment of elemental essence.', iconType: 'junk_demon_core', tags: ['elemental'] },
  { id: 'JUNK_T3_009', name: 'Cursed Cultivation Scroll', tier: 3, sellValue: 200, desc: 'A scroll with forbidden techniques.', iconType: 'junk_scroll', tags: ['human', 'undead'] },
  { id: 'JUNK_T3_010', name: 'Sealed Demon Heart', tier: 3, sellValue: 160, desc: 'A container that once held demonic essence.', iconType: 'junk_demon_core', tags: ['demon'] },

  // ============================================
  // TIER 4 - Golden Core (Lv 20-29) - 250-500 stones
  // ============================================
  { id: 'JUNK_T4_001', name: 'Fractured Golden Core', tier: 4, sellValue: 350, desc: 'Remnants of a shattered cultivator\'s core.', iconType: 'junk_demon_core', tags: ['human', 'divine'] },
  { id: 'JUNK_T4_002', name: 'Void-Touched Fragment', tier: 4, sellValue: 400, desc: 'A piece of matter corrupted by the void.', iconType: 'junk_demon_core', tags: ['demon'] },
  { id: 'JUNK_T4_003', name: 'Dragon Scale (Chipped)', tier: 4, sellValue: 300, desc: 'A damaged scale from a lesser dragon.', iconType: 'junk_dragon_scale', tags: ['dragon'] },
  { id: 'JUNK_T4_004', name: 'Phoenix Ember', tier: 4, sellValue: 450, desc: 'A cold ember that once burned with divine fire.', iconType: 'junk_phoenix_feather', tags: ['divine'] },
  { id: 'JUNK_T4_005', name: 'Thunder Dragon Scale', tier: 4, sellValue: 380, desc: 'A scale from the legendary thunder dragon.', iconType: 'junk_dragon_scale', tags: ['dragon', 'elemental'] },
  { id: 'JUNK_T4_006', name: 'Void Beast Bone', tier: 4, sellValue: 420, desc: 'A bone from a creature of the void.', iconType: 'junk_bone', tags: ['demon', 'beast'] },
  { id: 'JUNK_T4_007', name: 'Celestial Phoenix Plume', tier: 4, sellValue: 500, desc: 'A radiant feather from a divine phoenix.', iconType: 'junk_phoenix_feather', tags: ['divine'] },
  { id: 'JUNK_T4_008', name: 'Infernal Core', tier: 4, sellValue: 360, desc: 'A core from a flame demon.', iconType: 'junk_demon_core', tags: ['demon', 'elemental'] },
  { id: 'JUNK_T4_009', name: 'Divine Beast Fang', tier: 4, sellValue: 280, desc: 'A fang from a divine beast.', iconType: 'junk_bone', tags: ['divine', 'beast'] },
  { id: 'JUNK_T4_010', name: 'Emperor Dragon Scale', tier: 4, sellValue: 480, desc: 'A legendary scale from the undead emperor.', iconType: 'junk_dragon_scale', tags: ['dragon', 'undead'] },
];

// ============================================
// MOB TAGS - Determine thematic drops
// Only sword, saber, zither for 1st release
// ============================================

export type MobTag = 
  | 'beast'      // Animals, monsters
  | 'undead'     // Ghosts, liches, zombies
  | 'demon'      // Demons, corrupted beings
  | 'elemental'  // Fire, ice, lightning, etc.
  | 'human'      // Cultivators, bandits, monks
  | 'nature'     // Trees, plants, spirits
  | 'dragon'     // Dragon-type creatures
  | 'divine'     // Celestial beings
  | 'sword'      // Sword users (for token)
  | 'saber'      // Saber users
  | 'zither';    // Zither users

// ============================================
// MOB DROP TABLE OVERRIDES
// Maps mob ID to specific drop configuration
// Only sword, saber, zither tokens for 1st release
// ============================================

export interface MobDropConfig {
  tags: MobTag[];
  junkBonus?: string[];      // Extra junk items this mob can drop
  materialBonus?: string[];  // Extra materials (beyond tier-based)
  classToken?: string;       // Which class token (if any) - only sword/saber/zither
  bossOnly?: boolean;        // Only drops from boss version
}

export const mobDropConfigs: Record<number, MobDropConfig> = {
  // ============================================
  // TIER 1 MOBS (Lv 1-9)
  // ============================================
  1:  { tags: ['beast'] },                           // Spirit Rat
  2:  { tags: ['beast'] },                           // Garden Spider
  3:  { tags: ['human'] },                           // Sect Servant
  4:  { tags: [] },                                  // Training Dummy
  5:  { tags: ['beast'] },                           // Pestilent Worm
  6:  { tags: ['nature'] },                          // Herb Spirit
  7:  { tags: ['human', 'sword'] },                  // Novice Cultivator
  8:  { tags: ['human'] },                           // Meditation Monk
  9:  { tags: ['human'] },                           // Sect Guard
  10: { tags: ['human', 'sword'] },                  // Junior Disciple
  11: { tags: ['human', 'saber'] },                  // Bandit Thug
  12: { tags: ['human'] },                           // Bandit Archer
  13: { tags: ['beast'] },                           // Mountain Ape
  14: { tags: ['beast'] },                           // Poison Spider
  15: { tags: ['beast'] },                           // Rock Serpent
  16: { tags: ['human', 'saber'], classToken: 'MAT_SP_004' }, // Bandit Captain
  17: { tags: ['human', 'sword'] },                  // Corrupted Disciple
  18: { tags: ['elemental'], classToken: 'MAT_SP_003' },  // Crystal Golem (ELITE) - drops Sword token
  19: { tags: ['nature'] },                          // Forest Guardian (ELITE)
  20: { tags: ['beast'] },                           // Frost Wolf (ELITE)
  
  // ============================================
  // TIER 2 MOBS (Lv 10-14)
  // ============================================
  21: { tags: ['undead'] },                          // Ghost Cultivator (ELITE)
  22: { tags: ['human'] },                           // Corrupted Monk (ELITE)
  23: { tags: ['human'] },                           // Iron Claw Chief (ELITE)
  24: { tags: ['human'] },                           // Shadow Assassin (ELITE)
  25: { tags: ['elemental'] },                       // Stone Guardian (ELITE)
  26: { tags: ['beast', 'demon'] },                  // Abyssal Serpent (ELITE)
  27: { tags: ['undead'], classToken: 'MAT_SP_003' }, // Ancient Lich (EPIC) - drops Sword token
  28: { tags: ['divine', 'zither'], classToken: 'MAT_SP_005' }, // Celestial Phoenix (EPIC) - drops Zither token
  29: { tags: ['nature'] },                          // Corrupted Elder Tree (ELITE)
  30: { tags: ['elemental', 'sword'], classToken: 'MAT_SP_003' }, // Cursed Jade Guardian (EPIC)
  
  // ============================================
  // TIER 3 MOBS (Lv 15-19)
  // ============================================
  31: { tags: ['demon', 'saber'], classToken: 'MAT_SP_004' },  // Flame Demon (EPIC) - drops Saber token
  32: { tags: ['elemental'] },                       // Ice Queen (EPIC)
  33: { tags: ['elemental'] },                       // Lightning Elemental (EPIC)
  34: { tags: ['divine'] },                          // Divine Beast (EPIC)
  35: { tags: ['demon'] },                           // Shadow Lord (EPIC)
  36: { tags: ['undead', 'sword'], classToken: 'MAT_SP_003' }, // Soul Reaver (EPIC) - drops Sword token
  
  // ============================================
  // TIER 4 MOBS (Lv 20-29) - LEGENDARY BOSSES
  // ============================================
  37: { tags: ['demon'] },                           // Void Beast (LEGENDARY)
  38: { tags: ['elemental'] },                       // Stone Colossus (LEGENDARY)
  39: { tags: ['dragon'], classToken: 'MAT_SP_004' }, // Thunder Dragon Whelp (EPIC) - drops Saber token
  40: { tags: ['divine', 'zither'], classToken: 'MAT_SP_005' }, // Infernal Phoenix (LEGENDARY) - drops Zither token
  41: { tags: ['divine'] },                          // Eternal Guardian (LEGENDARY)
  42: { tags: ['demon'] },                           // Void Sovereign (LEGENDARY)
  43: { tags: ['dragon', 'saber'], classToken: 'MAT_SP_004' }, // Three-Headed Thunder Dragon (LEGENDARY) - drops Saber token
  44: { tags: ['undead', 'sword'], classToken: 'MAT_SP_003' }, // Undead Emperor (LEGENDARY) - drops Sword token
};

// ============================================
// CLASS TOKENS - Only 3 classes for 1st release (Sword, Saber, Zither)
// ============================================

export interface ClassToken {
  id: string;
  name: string;
  classId: number;
  className: string;
  dropRate: number; // Base % from tagged mobs
  desc: string;
  iconType: string;
}

export const classTokens: ClassToken[] = [
  // Only Sword, Saber, Zither for 1st release
  { id: 'MAT_SP_003', name: 'Sword Dao Token', classId: 1, className: 'Sword Master', dropRate: 5, desc: 'A token infused with the essence of sword mastery. Required for Tier 4 sword crafting.', iconType: 'token_sword' },
  { id: 'MAT_SP_004', name: 'Saber Intent Fragment', classId: 2, className: 'Blade Dancer', dropRate: 5, desc: 'A fragment containing fierce saber intent. Required for Tier 4 saber crafting.', iconType: 'token_saber' },
  { id: 'MAT_SP_005', name: 'Harmonic Zither String', classId: 3, className: 'Melody Weaver', dropRate: 5, desc: 'A celestial string that resonates with dao. Required for Tier 4 zither crafting.', iconType: 'token_zither' },
];

// ============================================
// DROP RATE CONFIGURATION
// ============================================

export const DROP_RATES = {
  // Junk drops (vendor trash)
  junk: {
    normal: 0.40,     // 40% chance from normal mobs
    elite: 0.60,      // 60% chance from elites
    epic: 0.75,       // 75% chance from epic mobs
    legendary: 0.90,  // 90% chance from legendary bosses
  },
  
  // Material drops
  material: {
    normal: 0.12,     // 12% base (was 15%)
    elite: 0.20,      // 20% from elites
    epic: 0.25,       // 25% from epic mobs
    legendary: 0.35,  // 35% from legendary bosses
  },
  
  // Gear drops (balanced for semi-hardcore)
  gear: {
    normal: 0.02,     // 2% from normal mobs
    elite: 0.08,      // 8% from elites
    epic: 0.12,       // 12% from epic mobs (was 35% boss)
    legendary: 0.15,  // 15% from legendary bosses
  },
  
  // Class token drops (only from tagged mobs)
  classToken: {
    elite: 0.03,      // 3% from tagged elite
    epic: 0.05,       // 5% from tagged epic
    legendary: 0.10,  // 10% from tagged legendary
  },
  
  // Consumable drops
  consumable: {
    normal: 0.10,     // 10% chance
    elite: 0.15,      // 15% from elites
    epic: 0.20,       // 20% from epic
    legendary: 0.25,  // 25% from legendary
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get junk items for a specific tier
 */
export const getJunkByTier = (tier: 1 | 2 | 3 | 4): VendorItem[] => 
  vendorItems.filter(item => item.tier === tier);

/**
 * Get tier from mob level
 */
export const getTierFromLevel = (level: number): 1 | 2 | 3 | 4 => {
  if (level <= 9) return 1;
  if (level <= 14) return 2;
  if (level <= 19) return 3;
  return 4;
};

/**
 * Get drop rates based on mob quality
 */
export const getDropRates = (quality: string) => {
  switch (quality) {
    case 'Elite': return {
      junk: DROP_RATES.junk.elite,
      material: DROP_RATES.material.elite,
      gear: DROP_RATES.gear.elite,
      classToken: DROP_RATES.classToken.elite,
      consumable: DROP_RATES.consumable.elite,
    };
    case 'Epic': return {
      junk: DROP_RATES.junk.epic,
      material: DROP_RATES.material.epic,
      gear: DROP_RATES.gear.epic,
      classToken: DROP_RATES.classToken.epic,
      consumable: DROP_RATES.consumable.epic,
    };
    case 'Legendary': return {
      junk: DROP_RATES.junk.legendary,
      material: DROP_RATES.material.legendary,
      gear: DROP_RATES.gear.legendary,
      classToken: DROP_RATES.classToken.legendary,
      consumable: DROP_RATES.consumable.legendary,
    };
    default: return {
      junk: DROP_RATES.junk.normal,
      material: DROP_RATES.material.normal,
      gear: DROP_RATES.gear.normal,
      classToken: 0,
      consumable: DROP_RATES.consumable.normal,
    };
  }
};

/**
 * Get mob drop config (with defaults)
 */
export const getMobDropConfig = (mobId: number): MobDropConfig => {
  return mobDropConfigs[mobId] || { tags: [] };
};

/**
 * Get class token by ID
 */
export const getClassTokenById = (tokenId: string): ClassToken | undefined => {
  return classTokens.find(t => t.id === tokenId);
};

/**
 * Get class token for player's class
 */
export const getClassTokenForClass = (classId: number): ClassToken | undefined => {
  return classTokens.find(t => t.classId === classId);
};

/**
 * Get all mobs that can drop a specific class token
 */
export const getMobsWithToken = (tokenId: string): number[] => {
  return Object.entries(mobDropConfigs)
    .filter(([_, config]) => config.classToken === tokenId)
    .map(([id, _]) => parseInt(id));
};

/**
 * Roll for junk drop - now filters by mob tags
 */
export const rollJunkDrop = (mobLevel: number, mobQuality: string, mobId?: number): VendorItem | null => {
  const rates = getDropRates(mobQuality);
  if (Math.random() > rates.junk) return null;
  
  const tier = getTierFromLevel(mobLevel);
  let junkPool = getJunkByTier(tier);
  
  // Filter by mob tags if we have a mob ID
  if (mobId !== undefined) {
    const mobConfig = getMobDropConfig(mobId);
    if (mobConfig.tags && mobConfig.tags.length > 0) {
      // Filter items that share at least one tag with the mob
      const filteredPool = junkPool.filter(item => {
        if (!item.tags || item.tags.length === 0) return true; // Items without tags can drop from anyone
        return item.tags.some(tag => mobConfig.tags.includes(tag));
      });
      // Use filtered pool if we have matching items, otherwise fallback to full pool
      if (filteredPool.length > 0) {
        junkPool = filteredPool;
      }
    }
  }
  
  if (junkPool.length === 0) return null;
  return junkPool[Math.floor(Math.random() * junkPool.length)];
};

/**
 * Roll for class token drop
 */
export const rollClassTokenDrop = (mobId: number, quality: string): ClassToken | null => {
  const config = getMobDropConfig(mobId);
  if (!config.classToken) return null;
  
  const rates = getDropRates(quality);
  if (Math.random() > rates.classToken) return null;
  
  return getClassTokenById(config.classToken) || null;
};

// ============================================
// COMPLETE DROP CALCULATION
// Returns all drops from a mob kill
// ============================================

export interface DropResult {
  junk: VendorItem | null;
  materials: { id: string; name: string; count: number }[];
  gear: { id: string; name: string } | null;
  classToken: ClassToken | null;
  consumable: { id: string; name: string } | null;
  spiritStones: number;
}

/**
 * Calculate all drops from a mob kill
 * This is the main function to use in combat
 */
export const calculateMobDrops = (
  mob: { id: number; level: number; quality: string; stones: number },
  pityBonus: number = 0
): DropResult => {
  const rates = getDropRates(mob.quality);
  const tier = getTierFromLevel(mob.level);
  
  const result: DropResult = {
    junk: null,
    materials: [],
    gear: null,
    classToken: null,
    consumable: null,
    spiritStones: mob.stones,
  };
  
  // 1) JUNK DROP
  result.junk = rollJunkDrop(mob.level, mob.quality);
  
  // 2) CLASS TOKEN DROP (only from configured mobs)
  result.classToken = rollClassTokenDrop(mob.id, mob.quality);
  
  // Note: Materials, Gear, and Consumables are handled in App.tsx
  // This function provides the junk and class token logic
  
  return result;
};

// ============================================
// EXPORT ALL ITEMS FOR MATERIALS.TS INTEGRATION
// ============================================

export const getAllVendorItems = () => vendorItems;
export const getAllClassTokens = () => classTokens;

// ============================================
// RARITY DROP SYSTEM
// Spirit/Immortal ONLY from bosses
// Normal mobs: Mortal, Earth, Heaven only
// ============================================

/**
 * Determine boss type from mob quality
 */
export const getBossType = (quality: string): BossType | null => {
  switch (quality) {
    case 'Elite': return 'elite';
    case 'Epic': return 'miniBoss';
    case 'Legendary': return 'worldBoss';
    default: return null;
  }
};

/**
 * Check if a mob quality counts as a "boss" for drop purposes
 */
export const isBossMob = (quality: string): boolean => {
  return ['Elite', 'Epic', 'Legendary'].includes(quality);
};

/**
 * Roll rarity for a dropped item based on mob level and quality
 * Spirit and Immortal grades ONLY drop from bosses
 */
export const rollItemRarity = (
  mobLevel: number,
  mobQuality: string,
  pityBonus: number = 0
): ItemRarity => {
  const tier = getTierFromLevel(mobLevel);
  const bossType = getBossType(mobQuality);
  
  let dropTable: RarityDropTable;
  
  if (bossType) {
    // Boss mob - can drop Spirit/Immortal
    dropTable = { ...BOSS_RARITY_DROPS[bossType] };
  } else {
    // Normal mob - NO Spirit/Immortal possible
    dropTable = { ...MOB_RARITY_DROPS[tier] };
  }
  
  // Apply pity bonus (increases higher rarity chances slightly)
  if (pityBonus > 0) {
    const bonusPercent = Math.min(pityBonus * 2, 20); // Max 20% bonus
    dropTable.Mortal = Math.max(0, dropTable.Mortal - bonusPercent);
    dropTable.Earth += bonusPercent * 0.3;
    dropTable.Heaven += bonusPercent * 0.4;
    if (bossType) {
      dropTable.Spirit += bonusPercent * 0.2;
      dropTable.Immortal += bonusPercent * 0.1;
    }
  }
  
  return rollRarityFromTable(dropTable);
};

/**
 * Get rarity display info
 */
export const getRarityDisplayName = (rarity: ItemRarity): string => {
  const names: Record<ItemRarity, string> = {
    Mortal: 'Mortal Grade',
    Earth: 'Earth Grade',
    Heaven: 'Heaven Grade',
    Spirit: 'Spirit Grade',
    Immortal: 'Immortal Grade'
  };
  return names[rarity];
};

/**
 * Check if rarity can drop from this mob type
 */
export const canRarityDropFrom = (rarity: ItemRarity, mobQuality: string): boolean => {
  if (rarity === 'Spirit' || rarity === 'Immortal') {
    return isBossMob(mobQuality);
  }
  return true;
};

// Re-export rarity type
export type { ItemRarity } from './raritySystem';

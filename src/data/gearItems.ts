// ============================================
// 48 GEAR ITEMS - All Classes, 4 Tiers (Level 29 Cap)
// 12 Classes × 4 Tiers = 48 Items
// Tier 5 removed (Nascent Soul Realm - Level 30+ not in scope)
// ============================================

// Import new rarity system
import { 
  type ItemRarity, 
  RARITY_CONFIG, 
  getRarityMultiplier,
  convertLegacyRarity,
  type LegacyRarity 
} from './raritySystem';

// Re-export for backwards compatibility
export type GearRarity = LegacyRarity;

export interface GearItem {
  id: string;
  classId: number;
  tier: 1 | 2 | 3 | 4; // Max tier 4 for Level 29 cap
  name: string;
  type: 'weapon'; // Only weapons in gearItems, accessories in accessoryItems.ts
  desc: string; // Flavor text description for tooltips
  stats: {
    str?: number;
    dex?: number;
    con?: number;
    spi?: number;
    wil?: number;
  };
  setBonus: number; // Damage/Defense % boost
  rarity: GearRarity; // Base rarity (can drop in all 5 rarities)
  specialEffects?: string[]; // Epic/Legendary only
}

export const gearItems: GearItem[] = [
  // ============================================
  // SWORD CLASSES (1-4)
  // ============================================
  
  // Class 1: Blazing Sword Immortal (Fire, DPS)
  { id: 'SW_T1_001', classId: 1, tier: 1, name: 'Ember Novice Blade', type: 'weapon', desc: 'A training sword imbued with faint fire qi. Warm to the touch.', stats: { str: 3, dex: 2 }, setBonus: 5, rarity: 'Uncommon' },
  { id: 'SW_T2_001', classId: 1, tier: 2, name: 'Crimson Flame Sword', type: 'weapon', desc: 'Forged in volcanic forges. The blade glows with inner heat.', stats: { str: 5, dex: 4 }, setBonus: 10, rarity: 'Rare' },
  { id: 'SW_T3_001', classId: 1, tier: 3, name: 'Vermillion Immortal Blade', type: 'weapon', desc: 'A sword blessed by fire immortals. Flames dance along its edge.', stats: { str: 8, dex: 6 }, setBonus: 15, rarity: 'Epic', specialEffects: ['15% chance to ignite enemy (20 dmg/turn for 3 turns)'] },
  { id: 'SW_T4_001', classId: 1, tier: 4, name: 'Golden Flame Core Blade', type: 'weapon', desc: 'Legendary blade containing a phoenix feather core. Burns with golden fire.', stats: { str: 12, dex: 9 }, setBonus: 22, rarity: 'Legendary', specialEffects: ['25% chance to ignite enemy', 'Phoenix Rebirth: Revive once per combat at 30% HP'] },

  // Class 2: Glacial Shadow (Ice, Speed)
  { id: 'SW_T1_002', classId: 2, tier: 1, name: 'Azure Shadow Blade', type: 'weapon', desc: 'A light blade that seems to blur when swung. Cold to the touch.', stats: { dex: 4, wil: 1 }, setBonus: 5, rarity: 'Uncommon' },
  { id: 'SW_T2_002', classId: 2, tier: 2, name: 'Frostbite Dancer', type: 'weapon', desc: 'Elegant sword that leaves trails of frost in its wake.', stats: { dex: 6, wil: 3 }, setBonus: 10, rarity: 'Rare' },
  { id: 'SW_T3_002', classId: 2, tier: 3, name: 'Winter Moon Shadow', type: 'weapon', desc: 'Forged under a winter moon. Its blade reflects moonlight even in darkness.', stats: { dex: 9, wil: 5 }, setBonus: 15, rarity: 'Epic', specialEffects: ['20% chance to freeze enemy for 1 turn'] },
  { id: 'SW_T4_002', classId: 2, tier: 4, name: 'Golden Ice Shadow Sword', type: 'weapon', desc: 'Legendary blade of the Shadow Ice Sect. Freezes the very air around it.', stats: { dex: 13, wil: 8 }, setBonus: 22, rarity: 'Legendary', specialEffects: ['30% freeze chance', 'Shadow Step: Dodge next attack after landing critical hit'] },

  // Class 3: Spellfire Duelist (Fire/Lightning, Hybrid)
  { id: 'SW_T1_003', classId: 3, tier: 1, name: 'Qi Spark Blade', type: 'weapon', desc: 'A blade that channels spiritual energy. Sparks occasionally arc from its surface.', stats: { str: 2, spi: 3 }, setBonus: 5, rarity: 'Uncommon' },
  { id: 'SW_T2_003', classId: 3, tier: 2, name: 'Mystical Flame Dancer', type: 'weapon', desc: 'Enchanted sword that enhances spell casting. Flames and lightning intertwine.', stats: { str: 4, spi: 5 }, setBonus: 10, rarity: 'Rare' },
  { id: 'SW_T3_003', classId: 3, tier: 3, name: 'Thunder Flame Duelist', type: 'weapon', desc: 'Master weapon of dual-element cultivators. Crackles with arcane power.', stats: { str: 6, spi: 8 }, setBonus: 15, rarity: 'Epic', specialEffects: ['Spell Echo: 15% chance to cast spell twice'] },
  { id: 'SW_T4_003', classId: 3, tier: 4, name: 'Golden Spellfire Core Sword', type: 'weapon', desc: 'Legendary blade infused with a thunder-flame core. Reality bends around it.', stats: { str: 9, spi: 12 }, setBonus: 22, rarity: 'Legendary', specialEffects: ['Spell Echo: 25% double cast', 'Lightning Reflexes: +20% dodge chance'] },

  // Class 4: Toxic Viper (Poison, Debuff)
  { id: 'SW_T1_004', classId: 4, tier: 1, name: 'Venom Snake Blade', type: 'weapon', desc: 'A serpentine blade coated with mild toxins. Handle with care.', stats: { dex: 3, wil: 2 }, setBonus: 5, rarity: 'Uncommon' },
  { id: 'SW_T2_004', classId: 4, tier: 2, name: 'Poison Serpent Fang', type: 'weapon', desc: 'Curved blade that delivers venomous strikes. The poison lingers.', stats: { dex: 5, wil: 4 }, setBonus: 10, rarity: 'Rare' },
  { id: 'SW_T3_004', classId: 4, tier: 3, name: 'Vipers Curse Blade', type: 'weapon', desc: 'Cursed sword of the Venom Sect. Its poison corrodes body and soul.', stats: { dex: 8, wil: 6 }, setBonus: 15, rarity: 'Epic', specialEffects: ['Poison Cloud: 18% chance to apply stacking poison (5 dmg/stack)'] },
  { id: 'SW_T4_004', classId: 4, tier: 4, name: 'Golden Venom Core Sword', type: 'weapon', desc: 'Legendary blade containing a thousand-year viper core. Instantly lethal.', stats: { dex: 12, wil: 9 }, setBonus: 22, rarity: 'Legendary', specialEffects: ['Poison Cloud: 30% proc chance', 'Venom Mastery: Poison damage increased by 100%'] },

  // ============================================
  // SABER CLASSES (5-8)
  // ============================================

  // Class 5: Asura of War (Fire, Tank)
  { id: 'SB_T1_005', classId: 5, tier: 1, name: 'Asura Novice Saber', type: 'weapon', desc: 'A heavy saber favored by war cultivators. Radiates fierce battle intent.', stats: { str: 4, con: 2 }, setBonus: 5, rarity: 'Uncommon' },
  { id: 'SB_T2_005', classId: 5, tier: 2, name: 'Demon King Saber', type: 'weapon', desc: 'Forged with demon blood. The blade hungers for combat.', stats: { str: 6, con: 4 }, setBonus: 10, rarity: 'Rare' },
  { id: 'SB_T3_005', classId: 5, tier: 3, name: 'Asura War Blade', type: 'weapon', desc: 'Weapon of the ancient Asura clan. Grows stronger as you bleed.', stats: { str: 9, con: 6 }, setBonus: 15, rarity: 'Epic', specialEffects: ['Asura Rage: Gain +30% ATK when HP below 40%'] },
  { id: 'SB_T4_005', classId: 5, tier: 4, name: 'Golden Asura Core Saber', type: 'weapon', desc: 'Legendary blade of the War God. Its wielder becomes an avatar of destruction.', stats: { str: 13, con: 9 }, setBonus: 22, rarity: 'Legendary', specialEffects: ['Asura Rage: +50% ATK at low HP', 'War God Blessing: Lifesteal 15% of damage dealt'] },

  // Class 6: Frozen Steel Guard (Ice, Tank)
  { id: 'SB_T1_006', classId: 6, tier: 1, name: 'Frost Wall Saber', type: 'weapon', desc: 'A defensive saber coated with frost. Sturdy and reliable.', stats: { con: 4, wil: 1 }, setBonus: 5, rarity: 'Uncommon' },
  { id: 'SB_T2_006', classId: 6, tier: 2, name: 'Azure Guardian Saber', type: 'weapon', desc: 'Wielded by sect guardians. Creates barriers of ice.', stats: { con: 6, wil: 2 }, setBonus: 10, rarity: 'Rare' },
  { id: 'SB_T3_006', classId: 6, tier: 3, name: 'Frozen Steel Fortress', type: 'weapon', desc: 'Legendary guardian weapon. An unbreakable wall of ice and steel.', stats: { con: 9, wil: 4 }, setBonus: 15, rarity: 'Epic', specialEffects: ['Glacial Barrier: 25% chance to gain shield (absorbs 50 damage)'] },
  { id: 'SB_T4_006', classId: 6, tier: 4, name: 'Golden Ice Guardian Core', type: 'weapon', desc: 'The ultimate defensive weapon. Encases its wielder in eternal ice armor.', stats: { con: 13, wil: 6 }, setBonus: 22, rarity: 'Legendary', specialEffects: ['Glacial Barrier: 40% shield proc', 'Fortress Stance: Reduce all damage by 20%'] },

  // Class 7: Verdant Blade Monarch (Wood, Balanced)
  { id: 'SB_T1_007', classId: 7, tier: 1, name: 'Forest Novice Saber', type: 'weapon', desc: 'Carved from sacred wood. Pulses with nature qi.', stats: { str: 2, spi: 3 }, setBonus: 5, rarity: 'Uncommon' },
  { id: 'SB_T2_007', classId: 7, tier: 2, name: 'Green Sovereign Blade', type: 'weapon', desc: 'Blessed by forest spirits. Heals the wielder with each strike.', stats: { str: 4, spi: 5 }, setBonus: 10, rarity: 'Rare' },
  { id: 'SB_T3_007', classId: 7, tier: 3, name: 'Verdant Monarch Saber', type: 'weapon', desc: 'Weapon of the Wood Monarch. Life energy flows through its veins.', stats: { str: 6, spi: 8 }, setBonus: 15, rarity: 'Epic', specialEffects: ['Natures Blessing: Heal 15 HP every 2 turns'] },
  { id: 'SB_T4_007', classId: 7, tier: 4, name: 'Golden Nature Core Blade', type: 'weapon', desc: 'Legendary blade containing the World Tree core. Commands life itself.', stats: { str: 9, spi: 12 }, setBonus: 22, rarity: 'Legendary', specialEffects: ['Natures Blessing: Heal 30 HP/turn', 'Nature Affinity: +30% healing received'] },

  // Class 8: Wilderness Stalker (Wood, Speed)
  { id: 'SB_T1_008', classId: 8, tier: 1, name: 'Beast Hunter Saber', type: 'weapon', desc: 'A swift blade designed for hunting beasts. Light and deadly.', stats: { dex: 4, con: 1 }, setBonus: 5, rarity: 'Uncommon' },
  { id: 'SB_T2_008', classId: 8, tier: 2, name: 'Wilderness Predator', type: 'weapon', desc: 'Favored by wilderness trackers. Strikes with predator instinct.', stats: { dex: 6, con: 2 }, setBonus: 10, rarity: 'Rare' },
  { id: 'SB_T3_008', classId: 8, tier: 3, name: 'Wild Stalker Saber', type: 'weapon', desc: 'Weapon of apex predators. Senses weakness in prey.', stats: { dex: 9, con: 4 }, setBonus: 15, rarity: 'Epic', specialEffects: ['Beast Hunt: Deal 50% more damage to mobs below 30% HP'] },
  { id: 'SB_T4_008', classId: 8, tier: 4, name: 'Golden Beast Core King', type: 'weapon', desc: 'Legendary blade of the Beast King. The ultimate predator weapon.', stats: { dex: 13, con: 6 }, setBonus: 22, rarity: 'Legendary', specialEffects: ['Beast Hunt: 100% damage to low HP', 'Hunter Instinct: Critical strikes heal you for 25 HP'] },

  // ============================================
  // ZITHER CLASSES (9-12)
  // ============================================

  // Class 9: Phoenix Cry Cultivator (Fire, Caster)
  { id: 'ZT_T1_009', classId: 9, tier: 1, name: 'Flame Song Zither', type: 'weapon', desc: 'A zither that produces fiery melodies. Warm strings glow softly.', stats: { spi: 4, wil: 2 }, setBonus: 5, rarity: 'Uncommon' },
  { id: 'ZT_T2_009', classId: 9, tier: 2, name: 'Phoenix Cry Instrument', type: 'weapon', desc: 'Crafted with phoenix feathers. Each note carries burning power.', stats: { spi: 6, wil: 4 }, setBonus: 10, rarity: 'Rare' },
  { id: 'ZT_T3_009', classId: 9, tier: 3, name: 'Fire Phoenix Zither', type: 'weapon', desc: 'Blessed by the Fire Phoenix. Music becomes flames.', stats: { spi: 9, wil: 6 }, setBonus: 15, rarity: 'Epic', specialEffects: ['Phoenix Rebirth: Heal to 40% HP when HP reaches 0 (once per combat)'] },
  { id: 'ZT_T4_009', classId: 9, tier: 4, name: 'Golden Phoenix Core Zither', type: 'weapon', desc: 'Legendary instrument containing an immortal phoenix core. Death is merely temporary.', stats: { spi: 13, wil: 9 }, setBonus: 22, rarity: 'Legendary', specialEffects: ['Phoenix Rebirth: 60% HP resurrection', 'Flame Aura: Deal 10 damage to enemy each turn'] },

  // Class 10: Divine Melody Healer (Lightning, Healer)
  { id: 'ZT_T1_010', classId: 10, tier: 1, name: 'Healing Hymn Zither', type: 'weapon', desc: 'A gentle zither whose music soothes wounds. Favored by healers.', stats: { spi: 4, con: 2 }, setBonus: 5, rarity: 'Uncommon' },
  { id: 'ZT_T2_010', classId: 10, tier: 2, name: 'Divine Grace Melody', type: 'weapon', desc: 'Blessed by divine healers. Each note restores vitality.', stats: { spi: 6, con: 4 }, setBonus: 10, rarity: 'Rare' },
  { id: 'ZT_T3_010', classId: 10, tier: 3, name: 'Celestial Healer Zither', type: 'weapon', desc: 'Instrument of celestial physicians. Cures any ailment with music.', stats: { spi: 9, con: 6 }, setBonus: 15, rarity: 'Epic', specialEffects: ['Divine Grace: All healing effects increased by 50%'] },
  { id: 'ZT_T4_010', classId: 10, tier: 4, name: 'Golden Divine Core Melody', type: 'weapon', desc: 'Legendary zither of the Divine Healer. Its music transcends mortality.', stats: { spi: 13, con: 9 }, setBonus: 22, rarity: 'Legendary', specialEffects: ['Divine Grace: +80% healing', 'Celestial Protection: Damage reduced by 15%'] },

  // Class 11: Phantom Musician (Void, Control)
  { id: 'ZT_T1_011', classId: 11, tier: 1, name: 'Shadow Song Zither', type: 'weapon', desc: 'A mysterious zither that plays haunting melodies. Shadows seem to dance.', stats: { dex: 3, wil: 3 }, setBonus: 5, rarity: 'Uncommon' },
  { id: 'ZT_T2_011', classId: 11, tier: 2, name: 'Phantom Dance Melody', type: 'weapon', desc: 'An ethereal instrument. Its music makes reality blur.', stats: { dex: 5, wil: 5 }, setBonus: 10, rarity: 'Rare' },
  { id: 'ZT_T3_011', classId: 11, tier: 3, name: 'Void Phantom Zither', type: 'weapon', desc: 'Crafted in the void realm. Notes can phase through reality.', stats: { dex: 8, wil: 8 }, setBonus: 15, rarity: 'Epic', specialEffects: ['Shadow Step: 20% chance to evade all damage for 1 turn'] },
  { id: 'ZT_T4_011', classId: 11, tier: 4, name: 'Golden Shadow Core Phantom', type: 'weapon', desc: 'Legendary void instrument. Its wielder exists between dimensions.', stats: { dex: 12, wil: 12 }, setBonus: 22, rarity: 'Legendary', specialEffects: ['Shadow Step: 35% evasion', 'Void Strike: Ignore 50% of enemy defense'] },

  // Class 12: Unbreakable Spirit Sage (Void, Tank)
  { id: 'ZT_T1_012', classId: 12, tier: 1, name: 'Spirit Guardian Zither', type: 'weapon', desc: 'A protective zither that shields its player. Sturdy and reassuring.', stats: { con: 4, wil: 2 }, setBonus: 5, rarity: 'Uncommon' },
  { id: 'ZT_T2_012', classId: 12, tier: 2, name: 'Sage Spirit Shield', type: 'weapon', desc: 'Used by sage protectors. Music becomes a barrier.', stats: { con: 6, wil: 4 }, setBonus: 10, rarity: 'Rare' },
  { id: 'ZT_T3_012', classId: 12, tier: 3, name: 'Unbreakable Sage Zither', type: 'weapon', desc: 'The ultimate defensive instrument. Cannot be silenced.', stats: { con: 9, wil: 6 }, setBonus: 15, rarity: 'Epic', specialEffects: ['Spirit Fortitude: Maximum HP increased by 20%'] },
  { id: 'ZT_T4_012', classId: 12, tier: 4, name: 'Golden Spirit Core Fortress', type: 'weapon', desc: 'Legendary zither of the Spirit Sage. An impenetrable fortress of sound.', stats: { con: 13, wil: 9 }, setBonus: 22, rarity: 'Legendary', specialEffects: ['Spirit Fortitude: +35% max HP', 'Unbreakable Will: Immune to stun and freeze effects'] },
];

// Legacy rarity multipliers (for backwards compatibility)
// New system uses getRarityMultiplier from raritySystem.ts
export const RARITY_MULTIPLIERS: Record<GearRarity, number> = {
  'Common': 1.0,     // Mortal
  'Uncommon': 1.2,   // Earth
  'Rare': 1.45,      // Heaven
  'Epic': 1.75,      // Spirit
  'Legendary': 2.2   // Immortal
};

// New Wuxia rarity multipliers
export const WUXIA_RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  'Mortal': 1.0,
  'Earth': 1.2,
  'Heaven': 1.45,
  'Spirit': 1.75,
  'Immortal': 2.2
};

// Helper: Get items for a class
export const getClassGearItems = (classId: number) => gearItems.filter(item => item.classId === classId);

// Helper: Get item by tier (now only 1-4)
export const getClassGearByTier = (classId: number, tier: 1 | 2 | 3 | 4) => 
  gearItems.find(item => item.classId === classId && item.tier === tier);

// Helper: Apply rarity multiplier to gear stats (legacy - uses old rarity names)
export const applyRarityBonus = (baseStats: GearItem['stats'], rarity: GearRarity) => {
  const multiplier = RARITY_MULTIPLIERS[rarity];
  const result: GearItem['stats'] = {};
  
  for (const [stat, value] of Object.entries(baseStats)) {
    if (value) {
      result[stat as keyof GearItem['stats']] = Math.floor(value * multiplier);
    }
  }
  
  return result;
};

// Helper: Apply Wuxia rarity multiplier to gear stats (new system)
export const applyWuxiaRarityBonus = (baseStats: GearItem['stats'], rarity: ItemRarity) => {
  const multiplier = getRarityMultiplier(rarity);
  const result: GearItem['stats'] = {};
  
  for (const [stat, value] of Object.entries(baseStats)) {
    if (value) {
      result[stat as keyof GearItem['stats']] = Math.floor(value * multiplier);
    }
  }
  
  return result;
};

// Helper: Convert legacy rarity to new system
export { convertLegacyRarity } from './raritySystem';
export type { ItemRarity } from './raritySystem';

// ============================================
// STARTER KITS - 凌云道 (Língyún Dào)
// Equipment and items for new players by class type
// ============================================

import { hybridClassSystem } from './hybridClasses';

// ============================================
// TYPES
// ============================================

export interface StarterWeapon {
  id: string;
  name: string;
  type: 'weapon';
  subtype: 'Sword' | 'Saber' | 'Zither';
  tier: 1;
  rarity: 'Common';
  atk: number;
  stats?: Record<string, number>;
  desc: string;
  durability: number;
  maxDurability: number;
}

export interface StarterKit {
  weapon: StarterWeapon;
  consumables: Array<{
    id: string;
    name: string;
    type: 'consumable';
    count: number;
    effect: string;
    amount: number;
    iconType: string;
    desc: string;
    rarity: string;
    tier: number;
  }>;
  spiritStones: number;
}

// ============================================
// STARTER WEAPONS BY TYPE
// Uses game-consistent stat names (str, dex, con, spi, wil)
// These map to: Ox Power, Wind Walk, Golden Body, Dao Mind, Heart Demon
// ============================================

const STARTER_WEAPONS: Record<'Sword' | 'Saber' | 'Zither', StarterWeapon> = {
  Sword: {
    id: 'starter_iron_sword',
    name: "Disciple's Iron Sword",
    type: 'weapon',
    subtype: 'Sword',
    tier: 1,
    rarity: 'Common',
    atk: 8,
    stats: { dex: 2 },
    desc: 'A simple iron sword issued to outer disciples. Well-balanced and reliable.',
    durability: 100,
    maxDurability: 100,
  },
  Saber: {
    id: 'starter_steel_saber',
    name: "Initiate's Steel Saber",
    type: 'weapon',
    subtype: 'Saber',
    tier: 1,
    rarity: 'Common',
    atk: 10,
    stats: { str: 2 },
    desc: 'A heavy saber favored by those who prefer raw power over finesse.',
    durability: 100,
    maxDurability: 100,
  },
  Zither: {
    id: 'starter_wooden_guqin',
    name: "Apprentice's Wooden Guqin",
    type: 'weapon',
    subtype: 'Zither',
    tier: 1,
    rarity: 'Common',
    atk: 5,
    stats: { spi: 4, wil: 2 },
    desc: 'A modest guqin that resonates with spiritual energy. Perfect for cultivation arts.',
    durability: 100,
    maxDurability: 100,
  },
};

// ============================================
// STARTER CONSUMABLES (Same for all classes)
// Uses real game consumable IDs from constants.ts
// Improved for better early game experience
// ============================================

const STARTER_CONSUMABLES = [
  {
    id: 'CONS_HP_001',
    name: 'HP Restoring Pill',
    type: 'consumable' as const,
    count: 8, // Increased from 5 - more forgiving start
    effect: 'hp',
    amount: 50,
    iconType: 'hp_pill',
    desc: 'Restores 50 HP instantly.',
    rarity: 'Common',
    tier: 1,
  },
  {
    id: 'CONS_QI_001',
    name: 'QI Restoring Pill',
    type: 'consumable' as const,
    count: 5, // Increased from 3 - allows more skill usage
    effect: 'qi',
    amount: 30,
    iconType: 'qi_pill',
    desc: 'Restores 30 QI instantly.',
    rarity: 'Common',
    tier: 1,
  },
];

// ============================================
// GET STARTER KIT BY CLASS ID
// ============================================

export const getStarterKitByClassId = (classId: number): StarterKit => {
  const classData = hybridClassSystem.find(c => c.id === classId);
  
  if (!classData) {
    // Default to Sword if class not found
    return {
      weapon: STARTER_WEAPONS.Sword,
      consumables: STARTER_CONSUMABLES,
      spiritStones: 50,
    };
  }
  
  const weaponType = classData.weapon;
  
  return {
    weapon: STARTER_WEAPONS[weaponType],
    consumables: STARTER_CONSUMABLES,
    spiritStones: 100, // Increased from 50 - allows buying 1-2 items from NPC
  };
};

// ============================================
// GET WEAPON TYPE BY CLASS ID
// ============================================

export const getWeaponTypeByClassId = (classId: number): 'Sword' | 'Saber' | 'Zither' => {
  const classData = hybridClassSystem.find(c => c.id === classId);
  return classData?.weapon || 'Sword';
};

// ============================================
// CLASS TO WEAPON TYPE MAPPING
// ============================================

export const CLASS_WEAPON_MAP: Record<number, 'Sword' | 'Saber' | 'Zither'> = {
  1: 'Sword',  // Blazing Sword Immortal
  2: 'Saber',  // Glacial Shadow
  3: 'Sword',  // Spellfire Duelist
  4: 'Saber',  // Toxic Viper
  5: 'Saber',  // Asura of War
  6: 'Saber',  // Frozen Steel Guard
  7: 'Zither', // Verdant Blade Monarch
  8: 'Saber',  // Wilderness Stalker
  9: 'Sword',  // Phoenix Cry
  10: 'Zither', // Divine Melody
  11: 'Zither', // Phantom Musician
  12: 'Zither', // Unbreakable Sage
};

// ============================================
// STARTER ACCESSORIES - Same for all classes (T1)
// ============================================

export const STARTER_RING = {
  id: 'starter_jade_ring',
  name: 'Jade Spirit Ring',
  type: 'ring' as const,
  slot: 'ring' as const,
  tier: 1,
  rarity: 'Common' as const,
  stats: { str: 1, dex: 1, con: 1 },
  desc: 'A simple jade ring imbued with minor spiritual energy. Favored by new cultivators.',
};

export const STARTER_NECKLACE = {
  id: 'starter_qi_pendant',
  name: 'Qi Gathering Pendant',
  type: 'necklace' as const,
  slot: 'necklace' as const,
  tier: 1,
  rarity: 'Common' as const,
  stats: { spi: 2, wil: 1 },
  desc: 'A small pendant that helps concentrate spiritual energy during meditation.',
};

// ============================================
// APPLY STARTER KIT TO PLAYER STATE
// ============================================

export const applyStarterKit = (playerState: any, classId: number): any => {
  const kit = getStarterKitByClassId(classId);
  
  // Build inventory from kit consumables only (no fake materials)
  const inventory = [
    ...kit.consumables.map((item, index) => ({
      ...item,
      id: `${item.id}_${Date.now()}_${index}`,
    })),
  ];
  
  return {
    ...playerState,
    equipment: {
      weapon: {
        ...kit.weapon,
        id: `${kit.weapon.id}_${Date.now()}`,
      },
      ring: {
        ...STARTER_RING,
        id: `${STARTER_RING.id}_${Date.now()}`,
      },
      necklace: {
        ...STARTER_NECKLACE,
        id: `${STARTER_NECKLACE.id}_${Date.now()}`,
      },
    },
    inventory,
    spiritStones: kit.spiritStones,
  };
};

// ============================================
// STARTER KIT DESCRIPTION (for UI)
// ============================================

export const getStarterKitDescription = (classId: number): string => {
  const kit = getStarterKitByClassId(classId);
  return `
🗡️ Weapon: ${kit.weapon.name} (ATK +${kit.weapon.atk})
💍 Ring: ${STARTER_RING.name} (+1 STR/DEX/CON)
📿 Necklace: ${STARTER_NECKLACE.name} (+2 SPI, +1 WIL)
💊 ${kit.consumables[0].count}x ${kit.consumables[0].name}
💠 ${kit.consumables[1].count}x ${kit.consumables[1].name}
💰 ${kit.spiritStones} Spirit Stones
  `.trim();
};

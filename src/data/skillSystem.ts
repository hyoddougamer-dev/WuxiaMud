// ============================================
// SKILL SYSTEM - Complete 51 Skills
// 48 Class Skills (4 per class) + 3 Universal
// Balanced for 1v1 combat with tick-based cooldowns
// ============================================

export type SkillType = 'attack' | 'heal' | 'buff' | 'debuff' | 'defense' | 'utility';
export type SkillElement = 'Fire' | 'Ice' | 'Wood' | 'Lightning' | 'Void' | 'None';

export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'shield' | 'dot' | 'stun' | 'freeze' | 'cleanse' | 'reflect' | 'dodge' | 'block' | 'lifesteal' | 'invulnerable' | 'rebirth';
  value: number; // Percentage or flat value
  duration?: number; // In combat ticks (1 tick = 1.5s)
  stat?: string; // Which stat is affected (atk, def, crit, etc.)
}

export interface Skill {
  id: string;
  name: string;
  classId: number | null; // null = universal
  tier: 1 | 2 | 3 | 4; // 1-3 = auto unlock, 4 = ultimate (quest/drop)
  unlockLevel: number;
  element: SkillElement;
  type: SkillType;
  qiCost: number;
  cooldown: number; // In combat ticks
  icon: string; // Emoji
  description: string;
  effects: SkillEffect[];
}

// ============================================
// UNIVERSAL SKILLS (Available to all classes)
// ============================================

export const universalSkills: Skill[] = [
  {
    id: 'UNI_001',
    name: 'Inner Focus',
    classId: null,
    tier: 1,
    unlockLevel: 5,
    element: 'None',
    type: 'utility',
    qiCost: 0,
    cooldown: 20,
    icon: '🧘',
    description: 'Channel your inner energy. Recover 20% Qi instantly.',
    effects: [{ type: 'heal', value: 20, stat: 'qi' }]
  },
  {
    id: 'UNI_002',
    name: 'Meditative Stance',
    classId: null,
    tier: 2,
    unlockLevel: 10,
    element: 'None',
    type: 'heal',
    qiCost: 10,
    cooldown: 15,
    icon: '💚',
    description: 'Enter a healing trance. Heal 15% HP.',
    effects: [{ type: 'heal', value: 15 }]
  },
  {
    id: 'UNI_003',
    name: 'Qi Burst',
    classId: null,
    tier: 3,
    unlockLevel: 15,
    element: 'None',
    type: 'attack',
    qiCost: 25,
    cooldown: 12,
    icon: '💥',
    description: 'Release concentrated Qi. Deal 180% damage, ignoring 15% DEF.',
    effects: [{ type: 'damage', value: 180 }, { type: 'debuff', value: 15, stat: 'defIgnore' }]
  }
];

// ============================================
// CLASS SKILLS - SWORD CLASSES (1-4)
// ============================================

// Class 1: Blazing Sword Immortal (Fire/Sword)
export const blazingSwordSkills: Skill[] = [
  {
    id: 'BSI_001',
    name: 'Ember Slash',
    classId: 1,
    tier: 1,
    unlockLevel: 1,
    element: 'Fire',
    type: 'attack',
    qiCost: 8,
    cooldown: 4,
    icon: '🔥',
    description: 'A swift fiery slash. Deal 130% Fire damage.',
    effects: [{ type: 'damage', value: 130 }]
  },
  {
    id: 'BSI_002',
    name: 'Flame Dance',
    classId: 1,
    tier: 2,
    unlockLevel: 5,
    element: 'Fire',
    type: 'attack',
    qiCost: 15,
    cooldown: 6,
    icon: '💃',
    description: 'Dance with flames. Deal 150% damage + Burn for 2 ticks.',
    effects: [{ type: 'damage', value: 150 }, { type: 'dot', value: 20, duration: 2 }]
  },
  {
    id: 'BSI_003',
    name: 'Blazing Aura',
    classId: 1,
    tier: 3,
    unlockLevel: 10,
    element: 'Fire',
    type: 'buff',
    qiCost: 20,
    cooldown: 10,
    icon: '🌟',
    description: 'Ignite your spirit. +25% ATK for 8 ticks.',
    effects: [{ type: 'buff', value: 25, duration: 8, stat: 'atk' }]
  },
  {
    id: 'BSI_004',
    name: 'Phoenix Strike',
    classId: 1,
    tier: 4,
    unlockLevel: 20,
    element: 'Fire',
    type: 'attack',
    qiCost: 40,
    cooldown: 25,
    icon: '🦅',
    description: 'Ultimate: Channel the phoenix. Deal 220% Fire damage + Ignite (50% damage over 5 ticks).',
    effects: [{ type: 'damage', value: 220 }, { type: 'dot', value: 50, duration: 5 }]
  }
];

// Class 2: Glacial Shadow (Ice/Sword)
export const glacialShadowSkills: Skill[] = [
  {
    id: 'GS_001',
    name: 'Frost Cut',
    classId: 2,
    tier: 1,
    unlockLevel: 1,
    element: 'Ice',
    type: 'attack',
    qiCost: 8,
    cooldown: 4,
    icon: '❄️',
    description: 'A chilling blade strike. Deal 125% Ice damage + Chill.',
    effects: [{ type: 'damage', value: 125 }, { type: 'debuff', value: 10, duration: 3, stat: 'speed' }]
  },
  {
    id: 'GS_002',
    name: 'Frozen Mirror',
    classId: 2,
    tier: 2,
    unlockLevel: 5,
    element: 'Ice',
    type: 'defense',
    qiCost: 15,
    cooldown: 8,
    icon: '🪞',
    description: 'Create an ice mirror. Reflect 25% damage for 3 ticks.',
    effects: [{ type: 'reflect', value: 25, duration: 3 }]
  },
  {
    id: 'GS_003',
    name: 'Blizzard Step',
    classId: 2,
    tier: 3,
    unlockLevel: 10,
    element: 'Ice',
    type: 'attack',
    qiCost: 18,
    cooldown: 6,
    icon: '🌨️',
    description: 'Flash freeze dash. +50% Dodge for 2 ticks + 140% damage.',
    effects: [{ type: 'dodge', value: 50, duration: 2 }, { type: 'damage', value: 140 }]
  },
  {
    id: 'GS_004',
    name: 'Absolute Zero',
    classId: 2,
    tier: 4,
    unlockLevel: 20,
    element: 'Ice',
    type: 'attack',
    qiCost: 45,
    cooldown: 30,
    icon: '🧊',
    description: 'Ultimate: Freeze everything. Deal 200% Ice damage + Freeze enemy for 2 ticks.',
    effects: [{ type: 'damage', value: 200 }, { type: 'freeze', value: 100, duration: 2 }]
  }
];

// Class 3: Spellfire Duelist (Lightning/Sword)
export const spellfireDuelistSkills: Skill[] = [
  {
    id: 'SD_001',
    name: 'Arc Blade',
    classId: 3,
    tier: 1,
    unlockLevel: 1,
    element: 'Lightning',
    type: 'attack',
    qiCost: 10,
    cooldown: 4,
    icon: '⚡',
    description: 'Electrified sword strike. Deal 135% Lightning damage.',
    effects: [{ type: 'damage', value: 135 }]
  },
  {
    id: 'SD_002',
    name: 'Thunder Barrier',
    classId: 3,
    tier: 2,
    unlockLevel: 5,
    element: 'Lightning',
    type: 'defense',
    qiCost: 18,
    cooldown: 10,
    icon: '🛡️',
    description: 'Create a lightning shield. Absorb damage equal to 20% Max HP.',
    effects: [{ type: 'shield', value: 20, duration: 5 }]
  },
  {
    id: 'SD_003',
    name: 'Static Surge',
    classId: 3,
    tier: 3,
    unlockLevel: 10,
    element: 'Lightning',
    type: 'attack',
    qiCost: 20,
    cooldown: 7,
    icon: '💫',
    description: 'Surge of electricity. Deal 160% damage + Stun for 1 tick.',
    effects: [{ type: 'damage', value: 160 }, { type: 'stun', value: 100, duration: 1 }]
  },
  {
    id: 'SD_004',
    name: 'Tempest Blade',
    classId: 3,
    tier: 4,
    unlockLevel: 20,
    element: 'Lightning',
    type: 'attack',
    qiCost: 45,
    cooldown: 25,
    icon: '⛈️',
    description: 'Ultimate: Summon the tempest. Deal 3 hits of 90% = 270% total damage.',
    effects: [{ type: 'damage', value: 270 }]
  }
];

// Class 4: Toxic Viper (Void/Sword)
export const toxicViperSkills: Skill[] = [
  {
    id: 'TV_001',
    name: 'Venom Strike',
    classId: 4,
    tier: 1,
    unlockLevel: 1,
    element: 'Void',
    type: 'attack',
    qiCost: 8,
    cooldown: 4,
    icon: '🐍',
    description: 'Venomous blade attack. Deal 120% damage + Poison for 3 ticks.',
    effects: [{ type: 'damage', value: 120 }, { type: 'dot', value: 15, duration: 3 }]
  },
  {
    id: 'TV_002',
    name: 'Shadow Fang',
    classId: 4,
    tier: 2,
    unlockLevel: 5,
    element: 'Void',
    type: 'attack',
    qiCost: 15,
    cooldown: 6,
    icon: '🦷',
    description: 'Strike from shadows. Deal 170% damage vs Poisoned targets, else 120%.',
    effects: [{ type: 'damage', value: 170 }]
  },
  {
    id: 'TV_003',
    name: 'Toxic Mist',
    classId: 4,
    tier: 3,
    unlockLevel: 10,
    element: 'Void',
    type: 'debuff',
    qiCost: 20,
    cooldown: 10,
    icon: '☁️',
    description: 'Release toxic gas. -20% enemy ATK for 6 ticks.',
    effects: [{ type: 'debuff', value: 20, duration: 6, stat: 'atk' }]
  },
  {
    id: 'TV_004',
    name: "Death's Embrace",
    classId: 4,
    tier: 4,
    unlockLevel: 20,
    element: 'Void',
    type: 'attack',
    qiCost: 42,
    cooldown: 28,
    icon: '💀',
    description: 'Ultimate: Lethal toxin. Deal 200% Void damage + Double all poison stacks.',
    effects: [{ type: 'damage', value: 200 }, { type: 'dot', value: 30, duration: 4 }]
  }
];

// ============================================
// CLASS SKILLS - SABER CLASSES (5-8)
// ============================================

// Class 5: Asura of War (Fire/Saber)
export const asuraOfWarSkills: Skill[] = [
  {
    id: 'AW_001',
    name: 'Berserker Slash',
    classId: 5,
    tier: 1,
    unlockLevel: 1,
    element: 'Fire',
    type: 'attack',
    qiCost: 10,
    cooldown: 4,
    icon: '💢',
    description: 'Reckless attack. Deal 140% damage (+20% if HP<50%).',
    effects: [{ type: 'damage', value: 140 }]
  },
  {
    id: 'AW_002',
    name: 'War Cry',
    classId: 5,
    tier: 2,
    unlockLevel: 5,
    element: 'Fire',
    type: 'buff',
    qiCost: 15,
    cooldown: 12,
    icon: '📢',
    description: 'Battle shout. +30% ATK for 6 ticks.',
    effects: [{ type: 'buff', value: 30, duration: 6, stat: 'atk' }]
  },
  {
    id: 'AW_003',
    name: 'Blood Frenzy',
    classId: 5,
    tier: 3,
    unlockLevel: 10,
    element: 'Fire',
    type: 'attack',
    qiCost: 22,
    cooldown: 8,
    icon: '🩸',
    description: 'Savage strike. Deal 180% damage + Heal 15% of damage dealt.',
    effects: [{ type: 'damage', value: 180 }, { type: 'lifesteal', value: 15 }]
  },
  {
    id: 'AW_004',
    name: "Asura's Wrath",
    classId: 5,
    tier: 4,
    unlockLevel: 20,
    element: 'Fire',
    type: 'attack',
    qiCost: 50,
    cooldown: 30,
    icon: '👹',
    description: 'Ultimate: Unleash the Asura. Deal 250% damage + +50% ATK while HP<30%.',
    effects: [{ type: 'damage', value: 250 }, { type: 'buff', value: 50, duration: 10, stat: 'atk' }]
  }
];

// Class 6: Frozen Steel Guard (Ice/Saber)
export const frozenSteelGuardSkills: Skill[] = [
  {
    id: 'FSG_001',
    name: 'Glacial Strike',
    classId: 6,
    tier: 1,
    unlockLevel: 1,
    element: 'Ice',
    type: 'attack',
    qiCost: 8,
    cooldown: 4,
    icon: '🗡️',
    description: 'Frozen blade attack. Deal 120% Ice damage + Chill.',
    effects: [{ type: 'damage', value: 120 }, { type: 'debuff', value: 10, duration: 2, stat: 'speed' }]
  },
  {
    id: 'FSG_002',
    name: 'Iron Fortress',
    classId: 6,
    tier: 2,
    unlockLevel: 5,
    element: 'Ice',
    type: 'defense',
    qiCost: 18,
    cooldown: 12,
    icon: '🏰',
    description: 'Fortify your stance. +50% DEF for 5 ticks.',
    effects: [{ type: 'buff', value: 50, duration: 5, stat: 'def' }]
  },
  {
    id: 'FSG_003',
    name: 'Frost Guard',
    classId: 6,
    tier: 3,
    unlockLevel: 10,
    element: 'Ice',
    type: 'defense',
    qiCost: 25,
    cooldown: 15,
    icon: '🛡️',
    description: 'Ice barrier. Block the next attack completely.',
    effects: [{ type: 'block', value: 100, duration: 3 }]
  },
  {
    id: 'FSG_004',
    name: 'Frozen Colossus',
    classId: 6,
    tier: 4,
    unlockLevel: 20,
    element: 'Ice',
    type: 'defense',
    qiCost: 48,
    cooldown: 30,
    icon: '🗿',
    description: 'Ultimate: Become ice incarnate. +80% DEF for 8 ticks + Counter 150% Ice damage.',
    effects: [{ type: 'buff', value: 80, duration: 8, stat: 'def' }, { type: 'reflect', value: 150, duration: 8 }]
  }
];

// Class 7: Verdant Blade Monarch (Wood/Saber)
export const verdantBladeMonarchSkills: Skill[] = [
  {
    id: 'VBM_001',
    name: "Nature's Cut",
    classId: 7,
    tier: 1,
    unlockLevel: 1,
    element: 'Wood',
    type: 'attack',
    qiCost: 8,
    cooldown: 4,
    icon: '🌿',
    description: 'Vine-wrapped blade. Deal 125% Wood damage + Entangle.',
    effects: [{ type: 'damage', value: 125 }, { type: 'debuff', value: 15, duration: 2, stat: 'speed' }]
  },
  {
    id: 'VBM_002',
    name: 'Regrowth',
    classId: 7,
    tier: 2,
    unlockLevel: 5,
    element: 'Wood',
    type: 'heal',
    qiCost: 18,
    cooldown: 10,
    icon: '🌱',
    description: 'Natural regeneration. Heal 25% HP over 5 ticks.',
    effects: [{ type: 'heal', value: 5, duration: 5 }]
  },
  {
    id: 'VBM_003',
    name: 'Thorns Aura',
    classId: 7,
    tier: 3,
    unlockLevel: 10,
    element: 'Wood',
    type: 'buff',
    qiCost: 20,
    cooldown: 12,
    icon: '🌹',
    description: 'Thorn barrier. Attacker takes 10% damage when hitting you.',
    effects: [{ type: 'reflect', value: 10, duration: 6 }]
  },
  {
    id: 'VBM_004',
    name: 'Forest King',
    classId: 7,
    tier: 4,
    unlockLevel: 20,
    element: 'Wood',
    type: 'attack',
    qiCost: 45,
    cooldown: 28,
    icon: '🌳',
    description: 'Ultimate: Become one with nature. Deal 200% damage + Heal 30% HP.',
    effects: [{ type: 'damage', value: 200 }, { type: 'heal', value: 30 }]
  }
];

// Class 8: Wilderness Stalker (Wood/Saber)
export const wildernessStalkerSkills: Skill[] = [
  {
    id: 'WS_001',
    name: 'Predator Lunge',
    classId: 8,
    tier: 1,
    unlockLevel: 1,
    element: 'Wood',
    type: 'attack',
    qiCost: 10,
    cooldown: 4,
    icon: '🐆',
    description: 'Swift predator attack. Deal 130% damage + +15% Crit next hit.',
    effects: [{ type: 'damage', value: 130 }, { type: 'buff', value: 15, duration: 1, stat: 'crit' }]
  },
  {
    id: 'WS_002',
    name: "Hunter's Mark",
    classId: 8,
    tier: 2,
    unlockLevel: 5,
    element: 'Wood',
    type: 'debuff',
    qiCost: 12,
    cooldown: 10,
    icon: '🎯',
    description: 'Mark your prey. Target takes +20% damage for 6 ticks.',
    effects: [{ type: 'debuff', value: 20, duration: 6, stat: 'damageTaken' }]
  },
  {
    id: 'WS_003',
    name: 'Wild Instinct',
    classId: 8,
    tier: 3,
    unlockLevel: 10,
    element: 'Wood',
    type: 'buff',
    qiCost: 18,
    cooldown: 12,
    icon: '👁️',
    description: 'Sharpen your senses. +40% Crit for 5 ticks.',
    effects: [{ type: 'buff', value: 40, duration: 5, stat: 'crit' }]
  },
  {
    id: 'WS_004',
    name: 'Beast Within',
    classId: 8,
    tier: 4,
    unlockLevel: 20,
    element: 'Wood',
    type: 'buff',
    qiCost: 45,
    cooldown: 30,
    icon: '🐺',
    description: 'Ultimate: Unleash the beast. +60% ATK +30% Speed for 8 ticks.',
    effects: [{ type: 'buff', value: 60, duration: 8, stat: 'atk' }, { type: 'buff', value: 30, duration: 8, stat: 'speed' }]
  }
];

// ============================================
// CLASS SKILLS - ZITHER CLASSES (9-12)
// ============================================

// Class 9: Phoenix Cry Cultivator (Fire/Zither)
export const phoenixCryCultivatorSkills: Skill[] = [
  {
    id: 'PCC_001',
    name: 'Blazing Note',
    classId: 9,
    tier: 1,
    unlockLevel: 1,
    element: 'Fire',
    type: 'attack',
    qiCost: 10,
    cooldown: 4,
    icon: '🎵',
    description: 'Fire-infused melody. Deal 130% Fire Magic damage.',
    effects: [{ type: 'damage', value: 130 }]
  },
  {
    id: 'PCC_002',
    name: 'Phoenix Song',
    classId: 9,
    tier: 2,
    unlockLevel: 5,
    element: 'Fire',
    type: 'heal',
    qiCost: 20,
    cooldown: 10,
    icon: '🎶',
    description: 'Healing melody. Heal 30% HP.',
    effects: [{ type: 'heal', value: 30 }]
  },
  {
    id: 'PCC_003',
    name: 'Rebirth Flame',
    classId: 9,
    tier: 3,
    unlockLevel: 10,
    element: 'Fire',
    type: 'utility',
    qiCost: 30,
    cooldown: 30,
    icon: '🔄',
    description: 'Phoenix protection. Next fatal hit leaves you at 1 HP instead.',
    effects: [{ type: 'rebirth', value: 1, duration: 10 }]
  },
  {
    id: 'PCC_004',
    name: 'Phoenix Ascension',
    classId: 9,
    tier: 4,
    unlockLevel: 20,
    element: 'Fire',
    type: 'attack',
    qiCost: 50,
    cooldown: 35,
    icon: '🔥',
    description: 'Ultimate: Rise like the phoenix. Deal 220% Fire damage + Cleanse + Heal 25% HP.',
    effects: [{ type: 'damage', value: 220 }, { type: 'cleanse', value: 100 }, { type: 'heal', value: 25 }]
  }
];

// Class 10: Divine Melody Healer (Lightning/Zither)
export const divineMelodyHealerSkills: Skill[] = [
  {
    id: 'DMH_001',
    name: 'Healing Chord',
    classId: 10,
    tier: 1,
    unlockLevel: 1,
    element: 'Lightning',
    type: 'heal',
    qiCost: 12,
    cooldown: 5,
    icon: '💚',
    description: 'Soothing melody. Heal 20% HP.',
    effects: [{ type: 'heal', value: 20 }]
  },
  {
    id: 'DMH_002',
    name: 'Protective Melody',
    classId: 10,
    tier: 2,
    unlockLevel: 5,
    element: 'Lightning',
    type: 'defense',
    qiCost: 20,
    cooldown: 12,
    icon: '🎼',
    description: 'Barrier of sound. Shield for 18% Max HP.',
    effects: [{ type: 'shield', value: 18, duration: 5 }]
  },
  {
    id: 'DMH_003',
    name: 'Purifying Note',
    classId: 10,
    tier: 3,
    unlockLevel: 10,
    element: 'Lightning',
    type: 'utility',
    qiCost: 15,
    cooldown: 8,
    icon: '✨',
    description: 'Cleansing sound. Remove all debuffs.',
    effects: [{ type: 'cleanse', value: 100 }]
  },
  {
    id: 'DMH_004',
    name: 'Divine Resonance',
    classId: 10,
    tier: 4,
    unlockLevel: 20,
    element: 'Lightning',
    type: 'buff',
    qiCost: 55,
    cooldown: 35,
    icon: '👼',
    description: 'Ultimate: Divine harmony. Heal 50% HP + +30% all stats for 8 ticks.',
    effects: [{ type: 'heal', value: 50 }, { type: 'buff', value: 30, duration: 8, stat: 'all' }]
  }
];

// Class 11: Phantom Musician (Void/Zither)
export const phantomMusicianSkills: Skill[] = [
  {
    id: 'PM_001',
    name: 'Haunting Note',
    classId: 11,
    tier: 1,
    unlockLevel: 1,
    element: 'Void',
    type: 'attack',
    qiCost: 10,
    cooldown: 4,
    icon: '👻',
    description: 'Spectral melody. Deal 130% Void Magic damage.',
    effects: [{ type: 'damage', value: 130 }]
  },
  {
    id: 'PM_002',
    name: 'Soul Drain',
    classId: 11,
    tier: 2,
    unlockLevel: 5,
    element: 'Void',
    type: 'attack',
    qiCost: 18,
    cooldown: 8,
    icon: '💜',
    description: 'Drain life force. Deal 150% damage + Heal 40% of damage dealt.',
    effects: [{ type: 'damage', value: 150 }, { type: 'lifesteal', value: 40 }]
  },
  {
    id: 'PM_003',
    name: 'Phantom Veil',
    classId: 11,
    tier: 3,
    unlockLevel: 10,
    element: 'Void',
    type: 'defense',
    qiCost: 15,
    cooldown: 10,
    icon: '🌫️',
    description: 'Become ethereal. +60% Dodge for 3 ticks.',
    effects: [{ type: 'dodge', value: 60, duration: 3 }]
  },
  {
    id: 'PM_004',
    name: 'Requiem of Shadows',
    classId: 11,
    tier: 4,
    unlockLevel: 20,
    element: 'Void',
    type: 'attack',
    qiCost: 50,
    cooldown: 32,
    icon: '🎭',
    description: 'Ultimate: Song of death. Deal 210% Void damage + Stun for 2 ticks.',
    effects: [{ type: 'damage', value: 210 }, { type: 'stun', value: 100, duration: 2 }]
  }
];

// Class 12: Unbreakable Spirit Sage (Void/Zither)
export const unbreakableSpiritSageSkills: Skill[] = [
  {
    id: 'USS_001',
    name: 'Spirit Bolt',
    classId: 12,
    tier: 1,
    unlockLevel: 1,
    element: 'Void',
    type: 'attack',
    qiCost: 8,
    cooldown: 4,
    icon: '🔮',
    description: 'Pure spirit energy. Deal 120% Void Magic damage.',
    effects: [{ type: 'damage', value: 120 }]
  },
  {
    id: 'USS_002',
    name: 'Willpower Shield',
    classId: 12,
    tier: 2,
    unlockLevel: 5,
    element: 'Void',
    type: 'defense',
    qiCost: 18,
    cooldown: 10,
    icon: '🧠',
    description: 'Mental fortitude. -35% damage taken for 5 ticks.',
    effects: [{ type: 'buff', value: 35, duration: 5, stat: 'damageReduction' }]
  },
  {
    id: 'USS_003',
    name: 'Mental Fortress',
    classId: 12,
    tier: 3,
    unlockLevel: 10,
    element: 'Void',
    type: 'buff',
    qiCost: 22,
    cooldown: 15,
    icon: '🏛️',
    description: 'Unshakeable mind. Immune to CC for 5 ticks.',
    effects: [{ type: 'buff', value: 100, duration: 5, stat: 'ccImmune' }]
  },
  {
    id: 'USS_004',
    name: 'Transcendence',
    classId: 12,
    tier: 4,
    unlockLevel: 20,
    element: 'Void',
    type: 'buff',
    qiCost: 55,
    cooldown: 35,
    icon: '🌌',
    description: 'Ultimate: Ascend beyond. Deal 180% damage + Invulnerable for 2 ticks.',
    effects: [{ type: 'damage', value: 180 }, { type: 'invulnerable', value: 100, duration: 2 }]
  }
];

// ============================================
// SKILL DATABASE - All Skills Combined
// ============================================

export const allSkillsDatabase: Skill[] = [
  ...universalSkills,
  ...blazingSwordSkills,
  ...glacialShadowSkills,
  ...spellfireDuelistSkills,
  ...toxicViperSkills,
  ...asuraOfWarSkills,
  ...frozenSteelGuardSkills,
  ...verdantBladeMonarchSkills,
  ...wildernessStalkerSkills,
  ...phoenixCryCultivatorSkills,
  ...divineMelodyHealerSkills,
  ...phantomMusicianSkills,
  ...unbreakableSpiritSageSkills
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get skills available for a specific class and level
 */
export const getAvailableSkills = (classId: number, playerLevel: number): Skill[] => {
  return allSkillsDatabase.filter(skill => 
    (skill.classId === classId || skill.classId === null) && 
    skill.unlockLevel <= playerLevel &&
    skill.tier <= 3 // Tier 4 (Ultimates) require special unlock
  );
};

/**
 * Get all skills for a class (including locked ones for preview)
 */
export const getClassSkills = (classId: number): Skill[] => {
  return allSkillsDatabase.filter(skill => skill.classId === classId);
};

/**
 * Get universal skills
 */
export const getUniversalSkills = (): Skill[] => {
  return universalSkills;
};

/**
 * Get skill by ID
 */
export const getSkillById = (skillId: string): Skill | undefined => {
  return allSkillsDatabase.find(skill => skill.id === skillId);
};

/**
 * Check if player has unlocked a skill
 */
export const isSkillUnlocked = (skill: Skill, playerLevel: number, unlockedUltimates: string[] = []): boolean => {
  if (skill.tier === 4) {
    return unlockedUltimates.includes(skill.id);
  }
  return skill.unlockLevel <= playerLevel;
};

/**
 * Get default hotbar for a class at a given level
 */
export const getDefaultHotbar = (classId: number, playerLevel: number): string[] => {
  const classSkills = getClassSkills(classId);
  const hotbar: string[] = [];
  
  // Add class skills based on level
  classSkills.forEach(skill => {
    if (skill.unlockLevel <= playerLevel && skill.tier <= 3 && hotbar.length < 4) {
      hotbar.push(skill.id);
    }
  });
  
  // Fill remaining slots with null
  while (hotbar.length < 4) {
    hotbar.push('');
  }
  
  return hotbar;
};

/**
 * Calculate skill damage based on player stats
 */
export const calculateSkillDamage = (
  skill: Skill, 
  baseDamage: number, 
  element: string,
  targetElement: string = 'None'
): number => {
  const damageEffect = skill.effects.find(e => e.type === 'damage');
  if (!damageEffect) return 0;
  
  const skillMultiplier = damageEffect.value / 100;
  return Math.floor(baseDamage * skillMultiplier);
};

/**
 * Get skill damage description with calculated values
 * Returns a string showing: "Base X (+Y from STR)"
 */
export const getSkillDamageDescription = (
  skill: Skill,
  pAtk: number,
  mAtk: number,
  primaryStat: string,
  primaryBonus: number
): string => {
  const damageEffect = skill.effects.find(e => e.type === 'damage');
  if (!damageEffect) return skill.description;
  
  const skillMultiplier = damageEffect.value / 100;
  
  // Determine if skill uses physical or magical attack based on element
  const isMagical = ['Fire', 'Ice', 'Lightning', 'Void'].includes(skill.element);
  const baseAtk = isMagical ? mAtk : pAtk;
  const estimatedDamage = Math.floor(baseAtk * skillMultiplier);
  
  // Calculate the bonus portion from primary stat
  const bonusFromStat = Math.floor(primaryBonus * skillMultiplier);
  
  // Format stat name
  const statNames: Record<string, string> = {
    str: 'STR', dex: 'DEX', con: 'CON', spi: 'SPI', wil: 'WIL'
  };
  const statName = statNames[primaryStat] || 'Primary';
  
  return `${skill.description} [~${estimatedDamage} dmg${bonusFromStat > 0 ? ` (+${bonusFromStat} from ${statName})` : ''}]`;
};

// ============================================
// LEVEL SCALING SYSTEM - WuxiaMUD
// Auto-scaling stats on level up
// Level Cap: 29
// ============================================

// Class scaling multipliers for HP/QI per level
export interface ClassLevelScaling {
  hp: number;      // Multiplier for HP per level
  qi: number;      // Multiplier for QI per level
  str: number;     // Multiplier for STR gain
  dex: number;     // Multiplier for DEX gain
  con: number;     // Multiplier for CON gain
  spi: number;     // Multiplier for SPI gain
  wil: number;     // Multiplier for WIL gain
}

// Class IDs mapping (from hybridClasses.ts)
// 1: Blazing Sword Immortal (Fire DPS)
// 2: Glacial Shadow (Ice Assassin)
// 3: Spellfire Duelist (Hybrid Mage)
// 4: Toxic Viper (Poison Assassin)
// 5: Asura of War (Pure Warrior)
// 6: Frozen Steel Guard (Tank)
// 7: Verdant Blade Monarch (Wood Warrior)
// 8: Wilderness Stalker (Hunter)
// 9: Phoenix Cry Cultivator (Fire Mage)
// 10: Divine Melody Healer (Support)
// 11: Phantom Musician (Hybrid Support)
// 12: Unbreakable Spirit Sage (Tank/Support)

export const CLASS_LEVEL_SCALING: Record<number, ClassLevelScaling> = {
  // Sword Classes
  1: { hp: 1.2, qi: 0.9, str: 1.3, dex: 1.4, con: 1.0, spi: 1.0, wil: 0.8 },  // Blazing Sword Immortal
  2: { hp: 1.0, qi: 1.0, str: 1.2, dex: 1.5, con: 1.0, spi: 0.8, wil: 1.0 },  // Glacial Shadow
  3: { hp: 0.9, qi: 1.3, str: 0.9, dex: 1.2, con: 0.9, spi: 1.4, wil: 0.9 },  // Spellfire Duelist
  4: { hp: 1.0, qi: 1.1, str: 1.0, dex: 1.4, con: 0.9, spi: 0.9, wil: 1.2 },  // Toxic Viper
  
  // Saber Classes
  5: { hp: 1.3, qi: 0.7, str: 1.6, dex: 1.1, con: 1.1, spi: 0.8, wil: 0.8 },  // Asura of War
  6: { hp: 1.5, qi: 0.7, str: 1.2, dex: 0.8, con: 1.6, spi: 0.7, wil: 1.1 },  // Frozen Steel Guard
  7: { hp: 1.3, qi: 0.9, str: 1.4, dex: 0.9, con: 1.1, spi: 1.2, wil: 0.8 },  // Verdant Blade Monarch
  8: { hp: 1.1, qi: 0.9, str: 1.3, dex: 1.4, con: 1.0, spi: 0.8, wil: 1.0 },  // Wilderness Stalker
  
  // Zither Classes
  9:  { hp: 0.8, qi: 1.4, str: 0.7, dex: 0.9, con: 0.9, spi: 1.5, wil: 1.1 }, // Phoenix Cry Cultivator
  10: { hp: 0.9, qi: 1.4, str: 0.6, dex: 0.8, con: 0.9, spi: 1.3, wil: 1.5 }, // Divine Melody Healer
  11: { hp: 0.9, qi: 1.3, str: 0.7, dex: 1.3, con: 0.9, spi: 1.3, wil: 1.1 }, // Phantom Musician
  12: { hp: 1.2, qi: 1.2, str: 0.7, dex: 0.8, con: 1.3, spi: 1.1, wil: 1.4 }, // Unbreakable Spirit Sage
  
  // Default (no class selected)
  0: { hp: 1.0, qi: 1.0, str: 1.0, dex: 1.0, con: 1.0, spi: 1.0, wil: 1.0 },
};

// Base scaling values (before class multipliers)
export const BASE_SCALING = {
  HP_PER_LEVEL: 12,
  QI_PER_LEVEL: 6,
  
  // Stats gain every N levels
  STAT_GAIN_EVERY: 3,         // Gain +1 to all stats every 3 levels
  STAT_BONUS_AMOUNT: 1,       // Amount gained per interval
  
  // Base starting values (Level 1)
  BASE_HP: 100,
  BASE_QI: 50,
  
  // Contribution from stats
  HP_PER_CON: 5,
  QI_PER_SPI: 3,
  
  // Level cap
  MAX_LEVEL: 29,
};

// ============================================
// CORE SCALING FUNCTIONS
// ============================================

/**
 * Get class scaling multipliers
 */
export function getClassScaling(classId: number): ClassLevelScaling {
  return CLASS_LEVEL_SCALING[classId] || CLASS_LEVEL_SCALING[0];
}

/**
 * Calculate max HP based on level, class, and CON
 * Formula: baseHP + (level * hpPerLevel * classMultiplier) + (con * hpPerCon)
 */
export function calculateMaxHP(level: number, con: number, classId: number): number {
  const scaling = getClassScaling(classId);
  const hpFromLevel = (level - 1) * BASE_SCALING.HP_PER_LEVEL * scaling.hp;
  const hpFromCon = con * BASE_SCALING.HP_PER_CON;
  return Math.floor(BASE_SCALING.BASE_HP + hpFromLevel + hpFromCon);
}

/**
 * Calculate max QI based on level, class, and SPI
 * Formula: baseQI + (level * qiPerLevel * classMultiplier) + (spi * qiPerSpi)
 */
export function calculateMaxQI(level: number, spi: number, classId: number): number {
  const scaling = getClassScaling(classId);
  const qiFromLevel = (level - 1) * BASE_SCALING.QI_PER_LEVEL * scaling.qi;
  const qiFromSpi = spi * BASE_SCALING.QI_PER_SPI;
  return Math.floor(BASE_SCALING.BASE_QI + qiFromLevel + qiFromSpi);
}

/**
 * Calculate bonus stats from level progression
 * Returns the total bonus for each stat based on level
 */
export function calculateLevelBonusStats(level: number, classId: number): {
  str: number;
  dex: number;
  con: number;
  spi: number;
  wil: number;
} {
  const scaling = getClassScaling(classId);
  const intervals = Math.floor((level - 1) / BASE_SCALING.STAT_GAIN_EVERY);
  
  return {
    str: Math.floor(intervals * BASE_SCALING.STAT_BONUS_AMOUNT * scaling.str),
    dex: Math.floor(intervals * BASE_SCALING.STAT_BONUS_AMOUNT * scaling.dex),
    con: Math.floor(intervals * BASE_SCALING.STAT_BONUS_AMOUNT * scaling.con),
    spi: Math.floor(intervals * BASE_SCALING.STAT_BONUS_AMOUNT * scaling.spi),
    wil: Math.floor(intervals * BASE_SCALING.STAT_BONUS_AMOUNT * scaling.wil),
  };
}

/**
 * Calculate the stats gained from a specific level up
 */
export function getStatsGainedOnLevelUp(newLevel: number, classId: number): {
  hpGain: number;
  qiGain: number;
  statGains: { str: number; dex: number; con: number; spi: number; wil: number };
} {
  const scaling = getClassScaling(classId);
  
  // HP/QI gained this level
  const hpGain = Math.floor(BASE_SCALING.HP_PER_LEVEL * scaling.hp);
  const qiGain = Math.floor(BASE_SCALING.QI_PER_LEVEL * scaling.qi);
  
  // Check if this level grants stat bonuses
  const grantsBonusStats = newLevel % BASE_SCALING.STAT_GAIN_EVERY === 0;
  
  const statGains = grantsBonusStats ? {
    str: Math.floor(BASE_SCALING.STAT_BONUS_AMOUNT * scaling.str),
    dex: Math.floor(BASE_SCALING.STAT_BONUS_AMOUNT * scaling.dex),
    con: Math.floor(BASE_SCALING.STAT_BONUS_AMOUNT * scaling.con),
    spi: Math.floor(BASE_SCALING.STAT_BONUS_AMOUNT * scaling.spi),
    wil: Math.floor(BASE_SCALING.STAT_BONUS_AMOUNT * scaling.wil),
  } : { str: 0, dex: 0, con: 0, spi: 0, wil: 0 };
  
  return { hpGain, qiGain, statGains };
}

/**
 * Get expected stats for a player at a given level (for migration)
 */
export function getExpectedStats(level: number, classId: number, baseStats: { str: number; dex: number; con: number; spi: number; wil: number }): {
  maxHp: number;
  maxQi: number;
  bonusStats: { str: number; dex: number; con: number; spi: number; wil: number };
} {
  const bonusStats = calculateLevelBonusStats(level, classId);
  const totalCon = baseStats.con + bonusStats.con;
  const totalSpi = baseStats.spi + bonusStats.spi;
  
  return {
    maxHp: calculateMaxHP(level, totalCon, classId),
    maxQi: calculateMaxQI(level, totalSpi, classId),
    bonusStats,
  };
}

/**
 * Migrate an existing player save to the new scaling system
 */
export function migratePlayerStats(player: any): any {
  const classId = player.selectedClass || 0;
  const level = player.level || 1;
  const baseStats = player.baseStats || { str: 10, dex: 10, con: 10, spi: 10, wil: 10 };
  
  const expected = getExpectedStats(level, classId, baseStats);
  
  // Calculate what the player should have
  const newMaxHp = expected.maxHp;
  const newMaxQi = expected.maxQi;
  
  // Add level bonus stats to the player's stats
  const newStats = {
    str: baseStats.str + expected.bonusStats.str,
    dex: baseStats.dex + expected.bonusStats.dex,
    con: baseStats.con + expected.bonusStats.con,
    spi: baseStats.spi + expected.bonusStats.spi,
    wil: baseStats.wil + expected.bonusStats.wil,
  };
  
  // Only update if new values are higher (don't nerf existing characters)
  return {
    ...player,
    maxHp: Math.max(player.maxHp || BASE_SCALING.BASE_HP, newMaxHp),
    maxQi: Math.max(player.maxQi || BASE_SCALING.BASE_QI, newMaxQi),
    hp: Math.min(player.hp || player.maxHp, Math.max(player.maxHp || BASE_SCALING.BASE_HP, newMaxHp)),
    qi: Math.min(player.qi || player.maxQi, Math.max(player.maxQi || BASE_SCALING.BASE_QI, newMaxQi)),
    levelBonusStats: expected.bonusStats, // Track level bonus stats separately
    // Note: We DON'T modify player.stats directly as those include AP allocation
  };
}

// ============================================
// MONSTER SCALING (for fair 1v1 combat)
// ============================================

/**
 * Calculate monster stats that scale with level for fair 1v1 combat
 */
export function calculateMonsterStats(monsterLevel: number, isBoss: boolean = false): {
  hp: number;
  damage: number;
  defense: number;
} {
  const bossMultiplier = isBoss ? 2.5 : 1.0;
  
  return {
    hp: Math.floor((80 + (monsterLevel * 10)) * bossMultiplier),
    damage: Math.floor((8 + (monsterLevel * 1.5)) * bossMultiplier),
    defense: Math.floor(2 + (monsterLevel * 0.4)),
  };
}

/**
 * Get level difference modifiers for combat
 */
export function getLevelDiffModifiers(playerLevel: number, monsterLevel: number): {
  playerDmgMod: number;
  monsterDmgMod: number;
  expMod: number;
  dropMod: number;
} {
  const diff = monsterLevel - playerLevel;
  
  if (diff <= -5) return { playerDmgMod: 1.0, monsterDmgMod: 0.5, expMod: 0.2, dropMod: 0.3 };   // Trivial
  if (diff <= -3) return { playerDmgMod: 1.0, monsterDmgMod: 0.7, expMod: 0.5, dropMod: 0.6 };   // Easy
  if (diff <= -1) return { playerDmgMod: 1.0, monsterDmgMod: 0.9, expMod: 0.9, dropMod: 0.9 };   // Slightly Easy
  if (diff <= 0)  return { playerDmgMod: 1.0, monsterDmgMod: 1.0, expMod: 1.0, dropMod: 1.0 };   // Fair
  if (diff <= 2)  return { playerDmgMod: 0.95, monsterDmgMod: 1.15, expMod: 1.2, dropMod: 1.1 }; // Hard
  if (diff <= 4)  return { playerDmgMod: 0.85, monsterDmgMod: 1.4, expMod: 1.5, dropMod: 1.3 };  // Very Hard
  return { playerDmgMod: 0.7, monsterDmgMod: 1.8, expMod: 2.0, dropMod: 1.5 };                   // Deadly (5+ above)
}

/**
 * Calculate combat difficulty indicator based on LEVEL DIFFERENCE
 * Uses the same logic as getLevelDiffModifiers for consistency
 */
export function getCombatDifficulty(playerLevel: number, playerMaxHp: number, monsterLevel: number, monsterHp: number): {
  label: string;
  color: string;
  viability: number;
} {
  const diff = monsterLevel - playerLevel;
  
  // Use level difference as primary indicator (matches getLevelDiffModifiers logic)
  // diff <= -5: Trivial, diff <= -3: Easy, diff <= -1: Easy, diff <= 0: Normal
  // diff <= 2: Hard, diff <= 4: Very Hard, diff >= 5: Deadly
  
  // Calculate rough viability for display purposes
  const playerDamagePerTurn = 10 + (playerLevel * 1.2);
  const monsterDamagePerTurn = 8 + (monsterLevel * 1.5);
  const turnsToKillMonster = Math.ceil(monsterHp / playerDamagePerTurn);
  const turnsToKillPlayer = Math.ceil(playerMaxHp / monsterDamagePerTurn);
  const viability = turnsToKillPlayer / turnsToKillMonster;
  
  // Primary classification by level difference (consistent with getLevelDiffModifiers)
  if (diff <= -3) return { label: 'Easy', color: '#22c55e', viability };          // Green - much lower level
  if (diff <= 0) return { label: 'Normal', color: '#eab308', viability };         // Yellow - same level or slightly lower
  if (diff <= 2) return { label: 'Hard', color: '#f97316', viability };           // Orange - 1-2 levels higher
  if (diff <= 4) return { label: 'Very Hard', color: '#ef4444', viability };      // Red - 3-4 levels higher
  return { label: 'Deadly', color: '#7c2d12', viability };                        // Dark Red - 5+ levels higher
}

// ============================================
// PROGRESSION TABLE (for display/debugging)
// ============================================

/**
 * Generate a progression table for a class
 */
export function generateProgressionTable(classId: number): Array<{
  level: number;
  maxHp: number;
  maxQi: number;
  bonusStr: number;
  bonusDex: number;
  bonusCon: number;
  bonusSpi: number;
  bonusWil: number;
}> {
  const baseStats = { str: 10, dex: 10, con: 10, spi: 10, wil: 10 };
  const table = [];
  
  for (let level = 1; level <= BASE_SCALING.MAX_LEVEL; level++) {
    const expected = getExpectedStats(level, classId, baseStats);
    table.push({
      level,
      maxHp: expected.maxHp,
      maxQi: expected.maxQi,
      bonusStr: expected.bonusStats.str,
      bonusDex: expected.bonusStats.dex,
      bonusCon: expected.bonusStats.con,
      bonusSpi: expected.bonusStats.spi,
      bonusWil: expected.bonusStats.wil,
    });
  }
  
  return table;
}

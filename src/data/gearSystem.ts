// ============================================
// GEAR SYSTEM - Detection & Bonus Application
// ============================================

import { gearItems, GearItem } from './gearItems';
import { hybridClassSystem } from './hybridClasses';

// Player's equipped gear
export interface EquippedGear {
  classId: number;
  tier: 1 | 2 | 3 | 4 | 5;
  gearItem?: GearItem;
}

// Detect which gear set player has equipped
export const detectGearSet = (playerGear: EquippedGear | null): GearItem | null => {
  if (!playerGear || !playerGear.gearItem) return null;
  return playerGear.gearItem;
};

// Apply gear stat bonuses to player stats
export const applyGearBonuses = (
  playerStats: { str: number; dex: number; con: number; spi: number; wil: number },
  equippedGear: EquippedGear | null
): { str: number; dex: number; con: number; spi: number; wil: number } => {
  if (!equippedGear?.gearItem) return playerStats;

  const gear = equippedGear.gearItem;
  
  return {
    str: playerStats.str + (gear.stats.str || 0),
    dex: playerStats.dex + (gear.stats.dex || 0),
    con: playerStats.con + (gear.stats.con || 0),
    spi: playerStats.spi + (gear.stats.spi || 0),
    wil: playerStats.wil + (gear.stats.wil || 0),
  };
};

// Get gear set damage/defense bonus
export const getGearSetBonus = (equippedGear: EquippedGear | null): number => {
  if (!equippedGear?.gearItem) return 0;
  return equippedGear.gearItem.setBonus;
};

// Get all items for class
export const getClassItems = (classId: number): GearItem[] => {
  return gearItems.filter(item => item.classId === classId);
};

// Get item by ID
export const getItemById = (itemId: string): GearItem | undefined => {
  return gearItems.find(item => item.id === itemId);
};

// Get recommended gear for level
export const getRecommendedGearByLevel = (level: number, classId: number): GearItem | null => {
  let targetTier: 1 | 2 | 3 | 4 | 5 = 1;
  
  if (level >= 50) targetTier = 5;
  else if (level >= 40) targetTier = 4;
  else if (level >= 30) targetTier = 3;
  else if (level >= 20) targetTier = 2;
  
  return gearItems.find(item => item.classId === classId && item.tier === targetTier) || null;
};

// Format gear info for UI
export const formatGearInfo = (gear: GearItem | null): string => {
  if (!gear) return 'No gear equipped';
  return `${gear.name} (${gear.rarity}) - Set Bonus: +${gear.setBonus}%`;
};

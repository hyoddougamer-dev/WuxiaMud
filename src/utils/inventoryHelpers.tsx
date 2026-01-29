// ============================================
// INVENTORY HELPERS - 凌云道 (Língyún Dào)
// Utility functions for inventory management
// ============================================

import { Sword, Plus, CircleDot, Box, Music, Award } from 'lucide-react';

// Maximum stack size for stackable items
export const MAX_STACK = 99;

// Auto-Combat System Constants
export const DAILY_AUTO_COMBAT_MINUTES = 30;
export const DAILY_AUTO_COMBAT_SECONDS = DAILY_AUTO_COMBAT_MINUTES * 60;

// ============================================
// DEV MODE - EXP MULTIPLIER
// ============================================
export const DEV_EXP_MULTIPLIER = { value: 1 };

// Expose to window for dev testing
if (typeof window !== 'undefined') {
  (window as any).setExpMultiplier = (multiplier: number) => {
    DEV_EXP_MULTIPLIER.value = multiplier;
    console.log(`🔥 EXP Multiplier set to ${multiplier}x`);
    return `EXP Multiplier: ${multiplier}x`;
  };
  (window as any).getExpMultiplier = () => DEV_EXP_MULTIPLIER.value;
}

// ============================================
// UNIQUE ID GENERATOR
// ============================================
let itemIdCounter = 0;
export const generateUniqueId = (): string => {
  itemIdCounter++;
  return `item_${Date.now()}_${itemIdCounter}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================
// STACKABLE ITEM DETECTION
// ============================================
export const isStackableType = (type: string): boolean => {
  const nonStackableTypes = ['weapon', 'armor', 'ring', 'necklace', 'amulet', 'accessory', 'helmet', 'chest', 'legs', 'boots', 'gloves'];
  return !nonStackableTypes.includes(type?.toLowerCase());
};

// ============================================
// ADD ITEM TO INVENTORY (with stacking)
// ============================================
export const addItemToInventory = (
  inventory: any[], 
  newItem: any, 
  quantity: number = 1
): any[] => {
  const newInv = [...inventory];
  
  // Equipment items don't stack - add individually
  if (!isStackableType(newItem.type)) {
    for (let i = 0; i < quantity; i++) {
      newInv.push({ 
        ...newItem, 
        id: generateUniqueId(),
        count: 1 
      });
    }
    return newInv;
  }
  
  // Stackable items - find existing stack
  const existing = newInv.find(inv => 
    (inv.materialId && inv.materialId === newItem.materialId) ||
    (inv.itemId && inv.itemId === newItem.itemId) ||
    (inv.name && inv.name === newItem.name && inv.type === newItem.type)
  );
  
  if (existing) {
    const currentCount = existing.count || 1;
    const spaceInStack = MAX_STACK - currentCount;
    const toAdd = Math.min(quantity, spaceInStack);
    
    existing.count = currentCount + toAdd;
    
    // If there's overflow, create new stack(s)
    let overflow = quantity - toAdd;
    while (overflow > 0) {
      const stackSize = Math.min(overflow, MAX_STACK);
      newInv.push({ 
        ...newItem, 
        id: generateUniqueId(),
        count: stackSize 
      });
      overflow -= stackSize;
    }
  } else {
    // New item - create stack(s)
    let remaining = quantity;
    while (remaining > 0) {
      const stackSize = Math.min(remaining, MAX_STACK);
      newInv.push({ 
        ...newItem, 
        id: generateUniqueId(),
        count: stackSize 
      });
      remaining -= stackSize;
    }
  }
  
  return newInv;
};

// ============================================
// LEGACY HELPER (compatibility)
// ============================================
export const addToStackableInventory = (
  inventory: any[], 
  newItem: any, 
  matchFn: (inv: any) => boolean
): { newInv: any[], overflow: number } => {
  const existing = inventory.find(matchFn);
  if (existing) {
    const spaceInStack = MAX_STACK - (existing.count || 1);
    if (spaceInStack >= 1) {
      existing.count = Math.min((existing.count || 1) + 1, MAX_STACK);
      return { newInv: inventory, overflow: spaceInStack < 1 ? 1 : 0 };
    }
    return { newInv: inventory, overflow: 1 };
  }
  inventory.push({ ...newItem, count: 1 });
  return { newInv: inventory, overflow: 0 };
};

// ============================================
// WEAPON/ITEM ICON HELPERS
// ============================================
export const getWeaponIconType = (item: any): string => {
  const subtype = item?.subtype?.toLowerCase() || '';
  const name = item?.name?.toLowerCase() || '';
  const type = item?.type?.toLowerCase() || '';
  
  if (subtype === 'sword' || name.includes('sword') || name.includes('blade')) return 'weapon_sword';
  if (subtype === 'saber' || name.includes('saber')) return 'weapon_saber';
  if (subtype === 'zither' || name.includes('zither') || name.includes('melody')) return 'weapon_zither';
  if (type === 'ring' || name.includes('ring')) return 'accessory_ring';
  if (type === 'necklace' || name.includes('pendant') || name.includes('amulet') || name.includes('necklace')) return 'accessory_necklace';
  
  return 'weapon_sword';
};

export const getIcon = (type: string, className: string = "") => {
  switch(type) {
    case 'healing_pill': return <Plus size={14} className={className || "text-red-400"}/>;
    case 'foundation_pill': return <CircleDot size={14} className={className || "text-cyan-400"}/>;
    case 'monster_drop': return <Box size={14} className={className || "text-amber-500"}/>;
    case 'weapon_sword': return <Sword size={14} className={className || "text-blue-400"}/>;
    case 'weapon_saber': return <Sword size={14} className={className || "text-red-400"}/>;
    case 'weapon_zither': return <Music size={14} className={className || "text-purple-400"}/>;
    case 'accessory_ring': return <CircleDot size={14} className={className || "text-yellow-400"}/>;
    case 'accessory_necklace': return <Award size={14} className={className || "text-cyan-400"}/>;
    default: return <Box size={14} className={className || "text-gray-500"}/>;
  }
};

// ============================================
// SKILL ICON HELPERS
// ============================================
export const getSkillIconPath = (skill: any): string => {
  if (!skill) return '';
  const elementFolderMap: Record<string, string> = {
    'Fire': 'fire',
    'Ice': 'ice',
    'Lightning': 'lightning',
    'Wood': 'wood',
    'Void': 'void',
    'None': 'universal'
  };
  const folder = elementFolderMap[skill.element] || 'universal';
  return `/assets/combat/skills/${folder}/${skill.id.toLowerCase()}.png`;
};

export const getSkillIcon = (skill: any) => {
  if (!skill) return '?';
  return skill.icon;
};

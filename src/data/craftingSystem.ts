// ============================================
// CRAFTING SYSTEM - Recipes & Success Rates
// Semi-Hardcore Progression
// Supports: Weapons (class-specific) + Accessories (generic)
// Uses Wuxia Rarity System: Mortal → Earth → Heaven → Spirit → Immortal
// ============================================

import type { ItemRarity } from './raritySystem';

export interface CraftingCost {
  materialId: string;
  quantity: number;
}

export type CraftingCategory = 'weapon' | 'ring' | 'necklace';

export interface RarityChanceTable {
  Mortal: number;
  Earth: number;
  Heaven: number;
  Spirit: number;
  Immortal: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  category: CraftingCategory; // What type of item this crafts
  outputItemId: string; // The base gear item to craft (empty for class-specific weapons)
  costs: CraftingCost[];
  spiritStones: number;
  successRate: number; // Base success rate (0-100)
  rarityTable: RarityChanceTable; // What rarity you get on success
  failPenalty: 'none' | 'half' | 'destroy'; // What happens on failure
}

// ============================================
// TIER 1 RECIPES (Qi Condensation)
// ============================================

export const tier1Recipes: CraftingRecipe[] = [
  {
    id: 'CRAFT_T1_WEAPON',
    name: 'Tier 1 Weapon Forging',
    tier: 1,
    category: 'weapon',
    outputItemId: '', // Will be class-specific
    costs: [
      { materialId: 'MAT_T1_001', quantity: 10 }, // Spirit Iron
      { materialId: 'MAT_T1_002', quantity: 5 },  // Qi Fragment
    ],
    spiritStones: 500,
    successRate: 85,
    rarityTable: {
      Mortal: 50,
      Earth: 35,
      Heaven: 13,
      Spirit: 2,
      Immortal: 0,
    },
    failPenalty: 'none',
  },
];

// ============================================
// TIER 2 RECIPES (Foundation Establishment)
// ============================================

export const tier2Recipes: CraftingRecipe[] = [
  {
    id: 'CRAFT_T2_WEAPON',
    name: 'Tier 2 Weapon Forging',
    tier: 2,
    category: 'weapon',
    outputItemId: '',
    costs: [
      { materialId: 'MAT_T2_001', quantity: 15 }, // Azure Crystal
      { materialId: 'MAT_T2_002', quantity: 8 },  // Foundation Stone
      { materialId: 'MAT_T1_001', quantity: 5 },  // Spirit Iron (upgrade)
    ],
    spiritStones: 2500,
    successRate: 75,
    rarityTable: {
      Mortal: 30,
      Earth: 40,
      Heaven: 22,
      Spirit: 7,
      Immortal: 1,
    },
    failPenalty: 'half',
  },
];

// ============================================
// TIER 3 RECIPES (Foundation Establishment Late)
// ============================================

export const tier3Recipes: CraftingRecipe[] = [
  {
    id: 'CRAFT_T3_WEAPON',
    name: 'Tier 3 Weapon Forging',
    tier: 3,
    category: 'weapon',
    outputItemId: '',
    costs: [
      { materialId: 'MAT_T3_001', quantity: 20 }, // Thunder Essence
      { materialId: 'MAT_T3_002', quantity: 10 }, // Sky Iron
      { materialId: 'MAT_T2_001', quantity: 8 },  // Azure Crystal
    ],
    spiritStones: 10000,
    successRate: 65,
    rarityTable: {
      Mortal: 15,
      Earth: 30,
      Heaven: 35,
      Spirit: 17,
      Immortal: 3,
    },
    failPenalty: 'half',
  },
];

// ============================================
// TIER 4 RECIPES (Golden Core - END GAME)
// ============================================

export const tier4Recipes: CraftingRecipe[] = [
  {
    id: 'CRAFT_T4_WEAPON',
    name: 'Golden Core Weapon Forging',
    tier: 4,
    category: 'weapon',
    outputItemId: '',
    costs: [
      { materialId: 'MAT_T4_001', quantity: 35 }, // Golden Core Fragment (+75%)
      { materialId: 'MAT_T4_002', quantity: 20 }, // Core Qi Essence (+100%)
      { materialId: 'MAT_SP_001', quantity: 5 },  // Bloodsteel (+150%)
      { materialId: 'MAT_SP_003', quantity: 1 },  // Class Token (varies)
    ],
    spiritStones: 80000, // +60%
    successRate: 50, // -10% (balanced for 60-70h BiS)
    rarityTable: {
      Mortal: 5,
      Earth: 15,
      Heaven: 35,
      Spirit: 35,
      Immortal: 10,
    },
    failPenalty: 'half',
  },
];

// ============================================
// ACCESSORY RECIPES (Rings & Necklaces)
// Generic items - All classes can use
// ============================================

export const accessoryRecipes: CraftingRecipe[] = [
  // TIER 1 ACCESSORIES
  {
    id: 'CRAFT_T1_RING',
    name: 'Jade Spirit Ring Crafting',
    tier: 1,
    category: 'ring',
    outputItemId: 'RING_T1_001',
    costs: [
      { materialId: 'MAT_T1_001', quantity: 8 },  // Spirit Iron
      { materialId: 'MAT_T1_002', quantity: 4 },  // Qi Fragment
    ],
    spiritStones: 400,
    successRate: 90,
    rarityTable: {
      Mortal: 50,
      Earth: 35,
      Heaven: 13,
      Spirit: 2,
      Immortal: 0,
    },
    failPenalty: 'none',
  },
  {
    id: 'CRAFT_T1_NECK',
    name: 'Qi Gathering Pendant Crafting',
    tier: 1,
    category: 'necklace',
    outputItemId: 'NECK_T1_001',
    costs: [
      { materialId: 'MAT_T1_002', quantity: 8 },  // Qi Fragment
      { materialId: 'MAT_T1_001', quantity: 4 },  // Spirit Iron
    ],
    spiritStones: 400,
    successRate: 90,
    rarityTable: {
      Mortal: 50,
      Earth: 35,
      Heaven: 13,
      Spirit: 2,
      Immortal: 0,
    },
    failPenalty: 'none',
  },
  
  // TIER 2 ACCESSORIES
  {
    id: 'CRAFT_T2_RING',
    name: 'Azure Cloud Ring Crafting',
    tier: 2,
    category: 'ring',
    outputItemId: 'RING_T2_001',
    costs: [
      { materialId: 'MAT_T2_001', quantity: 12 }, // Azure Crystal
      { materialId: 'MAT_T2_002', quantity: 6 },  // Foundation Stone
    ],
    spiritStones: 2000,
    successRate: 80,
    rarityTable: {
      Mortal: 30,
      Earth: 40,
      Heaven: 22,
      Spirit: 7,
      Immortal: 1,
    },
    failPenalty: 'half',
  },
  {
    id: 'CRAFT_T2_NECK',
    name: 'Foundation Jade Amulet Crafting',
    tier: 2,
    category: 'necklace',
    outputItemId: 'NECK_T2_001',
    costs: [
      { materialId: 'MAT_T2_002', quantity: 12 }, // Foundation Stone
      { materialId: 'MAT_T2_001', quantity: 6 },  // Azure Crystal
    ],
    spiritStones: 2000,
    successRate: 80,
    rarityTable: {
      Mortal: 30,
      Earth: 40,
      Heaven: 22,
      Spirit: 7,
      Immortal: 1,
    },
    failPenalty: 'half',
  },
  
  // TIER 3 ACCESSORIES
  {
    id: 'CRAFT_T3_RING',
    name: 'Heavenly Thunder Ring Crafting',
    tier: 3,
    category: 'ring',
    outputItemId: 'RING_T3_001',
    costs: [
      { materialId: 'MAT_T3_001', quantity: 15 }, // Thunder Essence
      { materialId: 'MAT_T3_002', quantity: 8 },  // Sky Iron
    ],
    spiritStones: 8000,
    successRate: 70,
    rarityTable: {
      Mortal: 15,
      Earth: 30,
      Heaven: 35,
      Spirit: 17,
      Immortal: 3,
    },
    failPenalty: 'half',
  },
  {
    id: 'CRAFT_T3_NECK',
    name: 'Nine Yang Pendant Crafting',
    tier: 3,
    category: 'necklace',
    outputItemId: 'NECK_T3_001',
    costs: [
      { materialId: 'MAT_T3_002', quantity: 15 }, // Sky Iron
      { materialId: 'MAT_T3_001', quantity: 8 },  // Thunder Essence
    ],
    spiritStones: 8000,
    successRate: 70,
    rarityTable: {
      Mortal: 15,
      Earth: 30,
      Heaven: 35,
      Spirit: 17,
      Immortal: 3,
    },
    failPenalty: 'half',
  },
  
  // TIER 4 ACCESSORIES (END GAME)
  {
    id: 'CRAFT_T4_RING',
    name: 'Golden Core Immortal Ring Crafting',
    tier: 4,
    category: 'ring',
    outputItemId: 'RING_T4_001',
    costs: [
      { materialId: 'MAT_T4_001', quantity: 25 }, // Golden Core Fragment (+67%)
      { materialId: 'MAT_T4_002', quantity: 15 }, // Core Qi Essence (+88%)
      { materialId: 'MAT_SP_002', quantity: 2 },  // Immortal Jade (+100%)
    ],
    spiritStones: 65000, // +62%
    successRate: 55, // -10% (balanced)
    rarityTable: {
      Mortal: 5,
      Earth: 15,
      Heaven: 35,
      Spirit: 35,
      Immortal: 10,
    },
    failPenalty: 'half',
  },
  {
    id: 'CRAFT_T4_NECK',
    name: 'Celestial Jade Necklace Crafting',
    tier: 4,
    category: 'necklace',
    outputItemId: 'NECK_T4_001',
    costs: [
      { materialId: 'MAT_T4_002', quantity: 25 }, // Core Qi Essence (+67%)
      { materialId: 'MAT_T4_001', quantity: 15 }, // Golden Core Fragment (+88%)
      { materialId: 'MAT_SP_002', quantity: 2 },  // Immortal Jade (+100%)
    ],
    spiritStones: 65000, // +62%
    successRate: 55, // -10% (balanced)
    rarityTable: {
      Mortal: 5,
      Earth: 15,
      Heaven: 35,
      Spirit: 35,
      Immortal: 10,
    },
    failPenalty: 'half',
  },
];

// ============================================
// REFORGING SYSTEM (Upgrade Rarity)
// Uses Wuxia naming: Mortal → Earth → Heaven → Spirit → Immortal
// ============================================

export interface ReforgeRecipe {
  id: string;
  name: string;
  fromRarity: ItemRarity;
  toRarity: ItemRarity;
  costs: CraftingCost[];
  spiritStones: number;
  successRate: number;
  onFailure: 'keep' | 'downgrade' | 'destroy';
}

export const reforgeRecipes: ReforgeRecipe[] = [
  {
    id: 'REFORGE_MORTAL_EARTH',
    name: 'Reforge: Mortal → Earth',
    fromRarity: 'Mortal',
    toRarity: 'Earth',
    costs: [
      { materialId: 'MAT_T1_001', quantity: 5 }, // Spirit Iron
    ],
    spiritStones: 500,
    successRate: 70,
    onFailure: 'keep',
  },
  {
    id: 'REFORGE_EARTH_HEAVEN',
    name: 'Reforge: Earth → Heaven',
    fromRarity: 'Earth',
    toRarity: 'Heaven',
    costs: [
      { materialId: 'MAT_T2_001', quantity: 8 }, // Azure Crystal
    ],
    spiritStones: 2000,
    successRate: 45,
    onFailure: 'keep',
  },
  {
    id: 'REFORGE_HEAVEN_SPIRIT',
    name: 'Reforge: Heaven → Spirit',
    fromRarity: 'Heaven',
    toRarity: 'Spirit',
    costs: [
      { materialId: 'MAT_T3_001', quantity: 12 }, // Thunder Essence
      { materialId: 'MAT_SP_001', quantity: 3 },  // Bloodsteel
    ],
    spiritStones: 8000,
    successRate: 25,
    onFailure: 'downgrade', // 20% chance back to Earth
  },
  {
    id: 'REFORGE_SPIRIT_IMMORTAL',
    name: 'Reforge: Spirit → Immortal',
    fromRarity: 'Spirit',
    toRarity: 'Immortal',
    costs: [
      { materialId: 'MAT_T4_001', quantity: 20 }, // Golden Core Fragment
      { materialId: 'MAT_SP_001', quantity: 10 }, // Bloodsteel
      { materialId: 'MAT_SP_002', quantity: 3 },  // Immortal Jade
    ],
    spiritStones: 35000,
    successRate: 10,
    onFailure: 'downgrade', // 30% chance back to Heaven
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getAllRecipes = () => [
  ...tier1Recipes,
  ...tier2Recipes,
  ...tier3Recipes,
  ...tier4Recipes,
  ...accessoryRecipes,
];

export const getWeaponRecipes = () => [
  ...tier1Recipes,
  ...tier2Recipes,
  ...tier3Recipes,
  ...tier4Recipes,
];

export const getAccessoryRecipes = () => accessoryRecipes;

export const getRecipesByCategory = (category: CraftingCategory) => 
  getAllRecipes().filter(r => r.category === category);

export const getRecipeByTier = (tier: 1 | 2 | 3 | 4, category: CraftingCategory = 'weapon') => {
  const recipes = getAllRecipes().filter(r => r.tier === tier && r.category === category);
  return recipes[0] || null;
};

export const getWeaponRecipeByTier = (tier: 1 | 2 | 3 | 4) => {
  switch (tier) {
    case 1: return tier1Recipes[0];
    case 2: return tier2Recipes[0];
    case 3: return tier3Recipes[0];
    case 4: return tier4Recipes[0];
  }
};

export const getReforgeRecipe = (fromRarity: ItemRarity, toRarity: ItemRarity) => {
  return reforgeRecipes.find(r => r.fromRarity === fromRarity && r.toRarity === toRarity);
};

// Get reforge recipe for upgrading from a specific rarity
export const getReforgeRecipeFrom = (fromRarity: ItemRarity) => {
  return reforgeRecipes.find(r => r.fromRarity === fromRarity);
};

// Roll rarity based on table
export const rollCraftingRarity = (table: RarityChanceTable): ItemRarity => {
  const roll = Math.random() * 100;
  let cumulative = 0;
  
  const rarityOrder: ItemRarity[] = ['Mortal', 'Earth', 'Heaven', 'Spirit', 'Immortal'];
  
  for (const rarity of rarityOrder) {
    cumulative += table[rarity];
    if (roll < cumulative) {
      return rarity;
    }
  }
  
  return 'Mortal'; // Fallback
};

// Check if player has materials
export const canCraft = (
  recipe: CraftingRecipe,
  playerMaterials: Record<string, number>,
  playerSpiritStones: number
): { canCraft: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  for (const cost of recipe.costs) {
    const hasAmount = playerMaterials[cost.materialId] || 0;
    if (hasAmount < cost.quantity) {
      missing.push(`${cost.materialId} (need ${cost.quantity}, have ${hasAmount})`);
    }
  }
  
  if (playerSpiritStones < recipe.spiritStones) {
    missing.push(`Spirit Stones (need ${recipe.spiritStones}, have ${playerSpiritStones})`);
  }
  
  return {
    canCraft: missing.length === 0,
    missing,
  };
};

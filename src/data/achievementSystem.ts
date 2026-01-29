// Achievement System for Língyún Dào
import { Trophy, Sword, Shield, Star, Crown, Skull, Gem, Package, Flame, Zap, Heart, Award, Target, Clock, Map, BookOpen, Users, Coins } from 'lucide-react';

// Achievement Categories
export type AchievementCategory = 
  | 'combat' 
  | 'exploration' 
  | 'crafting' 
  | 'cultivation' 
  | 'collection' 
  | 'social'
  | 'mastery';

// Achievement Rarity/Difficulty
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Achievement Definition
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name from lucide
  category: AchievementCategory;
  rarity: AchievementRarity;
  requirement: {
    type: 'kills' | 'level' | 'zones' | 'items' | 'craft' | 'reforge' | 'quests' | 'gold' | 'damage' | 'boss' | 'deaths' | 'streak';
    target: number;
    mobId?: number; // For specific mob kills
    zoneId?: string; // For specific zone visits
    itemRarity?: string; // For item collection
  };
  rewards?: {
    exp?: number;
    spiritStones?: number;
    title?: string;
  };
  hidden?: boolean; // Hidden until unlocked
}

// Player Achievement Progress
export interface AchievementProgress {
  id: string;
  current: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

// Player Achievement State
export interface PlayerAchievements {
  progress: Record<string, AchievementProgress>;
  totalUnlocked: number;
  lastUnlocked?: string;
}

// All Achievements Database
export const achievementsDatabase: Achievement[] = [
  // ============ COMBAT ACHIEVEMENTS ============
  {
    id: 'first_blood',
    name: 'First Step on the Path',
    description: 'Defeat your first enemy - every journey begins with a single step',
    icon: 'Sword',
    category: 'combat',
    rarity: 'common',
    requirement: { type: 'kills', target: 1 },
    rewards: { exp: 50, title: 'Outer Disciple' }
  },
  {
    id: 'monster_hunter_10',
    name: 'Spirit Beast Hunter',
    description: 'Defeat 10 spirit beasts',
    icon: 'Skull',
    category: 'combat',
    rarity: 'common',
    requirement: { type: 'kills', target: 10 },
    rewards: { exp: 100 }
  },
  {
    id: 'monster_slayer_25',
    name: 'Demon Slayer',
    description: 'Defeat 25 demonic creatures',
    icon: 'Skull',
    category: 'combat',
    rarity: 'common',
    requirement: { type: 'kills', target: 25 },
    rewards: { exp: 150, spiritStones: 50 }
  },
  {
    id: 'monster_crusher_50',
    name: 'Path of Carnage',
    description: 'Defeat 50 enemies - your blade knows no mercy',
    icon: 'Skull',
    category: 'combat',
    rarity: 'uncommon',
    requirement: { type: 'kills', target: 50 },
    rewards: { exp: 250, spiritStones: 100, title: 'Inner Disciple' }
  },
  {
    id: 'monster_annihilator_100',
    name: 'Crimson Blade',
    description: 'Defeat 100 enemies - your weapon drips with the blood of your foes',
    icon: 'Skull',
    category: 'combat',
    rarity: 'uncommon',
    requirement: { type: 'kills', target: 100 },
    rewards: { exp: 400, spiritStones: 150 }
  },
  {
    id: 'monster_executioner_200',
    name: 'Asura\'s Wrath',
    description: 'Defeat 200 enemies - you walk the path of the war god',
    icon: 'Skull',
    category: 'combat',
    rarity: 'rare',
    requirement: { type: 'kills', target: 200 },
    rewards: { exp: 600, spiritStones: 250, title: 'Asura Disciple' }
  },
  {
    id: 'demon_conqueror_350',
    name: 'Heavenly Demon',
    description: 'Defeat 350 enemies - demons whisper your name in fear',
    icon: 'Flame',
    category: 'combat',
    rarity: 'rare',
    requirement: { type: 'kills', target: 350 },
    rewards: { exp: 900, spiritStones: 400 }
  },
  {
    id: 'immortal_warrior_500',
    name: 'Sword Immortal',
    description: 'Defeat 500 enemies - your blade has reached the realm of immortals',
    icon: 'Crown',
    category: 'combat',
    rarity: 'epic',
    requirement: { type: 'kills', target: 500 },
    rewards: { exp: 1200, spiritStones: 600, title: 'Sword Immortal' }
  },
  {
    id: 'legend_of_slaughter_800',
    name: 'Peerless Slaughter King',
    description: 'Defeat 800 enemies - none can match your killing intent',
    icon: 'Crown',
    category: 'combat',
    rarity: 'legendary',
    requirement: { type: 'kills', target: 800 },
    rewards: { exp: 2000, spiritStones: 1000, title: 'Slaughter King' }
  },
  {
    id: 'boss_slayer_1',
    name: 'Ancient Beast Slayer',
    description: 'Defeat your first boss - you have faced a true ancient power',
    icon: 'Target',
    category: 'combat',
    rarity: 'uncommon',
    requirement: { type: 'boss', target: 1 },
    rewards: { exp: 200, spiritStones: 100, title: 'Beast Slayer' }
  },
  {
    id: 'boss_hunter_3',
    name: 'Apex Predator',
    description: 'Defeat 3 boss monsters - you hunt the hunters',
    icon: 'Target',
    category: 'combat',
    rarity: 'rare',
    requirement: { type: 'boss', target: 3 },
    rewards: { exp: 400, spiritStones: 200 }
  },
  {
    id: 'boss_dominator_7',
    name: 'Demon Lord Vanquisher',
    description: 'Defeat 7 boss monsters - demon lords tremble at your approach',
    icon: 'Target',
    category: 'combat',
    rarity: 'epic',
    requirement: { type: 'boss', target: 7 },
    rewards: { exp: 800, spiritStones: 400, title: 'Demon Vanquisher' }
  },
  {
    id: 'supreme_boss_hunter_15',
    name: 'Heavenly Beast Conqueror',
    description: 'Defeat 15 boss monsters - even heavenly beasts bow before you',
    icon: 'Crown',
    category: 'combat',
    rarity: 'legendary',
    requirement: { type: 'boss', target: 15 },
    rewards: { exp: 1500, spiritStones: 750, title: 'Beast Conqueror' }
  },
  
  // ============ CULTIVATION/LEVEL ACHIEVEMENTS ============
  {
    id: 'qi_awakening',
    name: 'Qi Awakening',
    description: 'Reach level 3 - Begin your cultivation journey',
    icon: 'Zap',
    category: 'cultivation',
    rarity: 'common',
    requirement: { type: 'level', target: 3 },
    rewards: { spiritStones: 25, title: 'Initiate' }
  },
  {
    id: 'qi_condensation_mid',
    name: 'Qi Condensation Adept',
    description: 'Reach level 5 - Qi flows through your meridians',
    icon: 'Zap',
    category: 'cultivation',
    rarity: 'common',
    requirement: { type: 'level', target: 5 },
    rewards: { spiritStones: 50 }
  },
  {
    id: 'qi_condensation_peak',
    name: 'Qi Condensation Peak',
    description: 'Reach level 9 - Ready for Foundation breakthrough',
    icon: 'Zap',
    category: 'cultivation',
    rarity: 'uncommon',
    requirement: { type: 'level', target: 9 },
    rewards: { spiritStones: 100, title: 'Qi Condensation Master' }
  },
  {
    id: 'foundation_builder',
    name: 'Foundation Establishment',
    description: 'Reach level 10 - Your foundation is solid',
    icon: 'Shield',
    category: 'cultivation',
    rarity: 'uncommon',
    requirement: { type: 'level', target: 10 },
    rewards: { spiritStones: 150, title: 'Foundation Disciple' }
  },
  {
    id: 'foundation_mid',
    name: 'Foundation Consolidation',
    description: 'Reach level 14 - Your foundation grows stronger',
    icon: 'Shield',
    category: 'cultivation',
    rarity: 'rare',
    requirement: { type: 'level', target: 14 },
    rewards: { spiritStones: 200 }
  },
  {
    id: 'foundation_peak',
    name: 'Foundation Peak',
    description: 'Reach level 19 - Ready for Golden Core formation',
    icon: 'Shield',
    category: 'cultivation',
    rarity: 'rare',
    requirement: { type: 'level', target: 19 },
    rewards: { spiritStones: 300, title: 'Foundation Elder' }
  },
  {
    id: 'golden_core_formation',
    name: 'Golden Core Formation',
    description: 'Reach level 20 - Your golden core has formed!',
    icon: 'Star',
    category: 'cultivation',
    rarity: 'epic',
    requirement: { type: 'level', target: 20 },
    rewards: { spiritStones: 500, title: 'Golden Core Cultivator' }
  },
  {
    id: 'golden_core_mid',
    name: 'Golden Core Consolidation',
    description: 'Reach level 24 - Your core grows more radiant',
    icon: 'Star',
    category: 'cultivation',
    rarity: 'epic',
    requirement: { type: 'level', target: 24 },
    rewards: { spiritStones: 750 }
  },
  {
    id: 'golden_core_peak',
    name: 'Golden Core Peak',
    description: 'Reach level 29 - Maximum cultivation in this realm!',
    icon: 'Crown',
    category: 'cultivation',
    rarity: 'legendary',
    requirement: { type: 'level', target: 29 },
    rewards: { spiritStones: 1500, title: 'Golden Core Sovereign' }
  },
  
  // ============ EXPLORATION ACHIEVEMENTS ============
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Visit 3 different zones',
    icon: 'Map',
    category: 'exploration',
    rarity: 'common',
    requirement: { type: 'zones', target: 3 },
    rewards: { exp: 50 }
  },
  {
    id: 'adventurer',
    name: 'Adventurer',
    description: 'Visit 10 different zones',
    icon: 'Map',
    category: 'exploration',
    rarity: 'uncommon',
    requirement: { type: 'zones', target: 10 },
    rewards: { exp: 200, spiritStones: 100 }
  },
  {
    id: 'world_explorer',
    name: 'World Explorer',
    description: 'Visit 20 different zones',
    icon: 'Map',
    category: 'exploration',
    rarity: 'rare',
    requirement: { type: 'zones', target: 20 },
    rewards: { exp: 500, spiritStones: 250, title: 'Explorer' }
  },
  
  // ============ CRAFTING ACHIEVEMENTS ============
  {
    id: 'apprentice_smith',
    name: 'Apprentice Smith',
    description: 'Craft your first weapon',
    icon: 'Sword',
    category: 'crafting',
    rarity: 'common',
    requirement: { type: 'craft', target: 1 },
    rewards: { exp: 50 }
  },
  {
    id: 'skilled_artisan',
    name: 'Skilled Artisan',
    description: 'Craft 10 items',
    icon: 'Sword',
    category: 'crafting',
    rarity: 'uncommon',
    requirement: { type: 'craft', target: 10 },
    rewards: { exp: 150, spiritStones: 100 }
  },
  {
    id: 'master_forger',
    name: 'Master Forger',
    description: 'Craft 50 items',
    icon: 'Flame',
    category: 'crafting',
    rarity: 'rare',
    requirement: { type: 'craft', target: 50 },
    rewards: { spiritStones: 300, title: 'Master Forger' }
  },
  {
    id: 'reforge_initiate',
    name: 'Reforge Initiate',
    description: 'Successfully reforge an item',
    icon: 'Flame',
    category: 'crafting',
    rarity: 'uncommon',
    requirement: { type: 'reforge', target: 1 },
    rewards: { exp: 100 }
  },
  
  // ============ COLLECTION ACHIEVEMENTS ============
  {
    id: 'treasure_hunter',
    name: 'Treasure Hunter',
    description: 'Collect 100 items',
    icon: 'Package',
    category: 'collection',
    rarity: 'uncommon',
    requirement: { type: 'items', target: 100 },
    rewards: { spiritStones: 150 }
  },
  {
    id: 'hoarder',
    name: 'Hoarder',
    description: 'Collect 500 items',
    icon: 'Package',
    category: 'collection',
    rarity: 'rare',
    requirement: { type: 'items', target: 500 },
    rewards: { spiritStones: 500 }
  },
  {
    id: 'fortune_seeker',
    name: 'Fortune Seeker',
    description: 'Earn 10,000 Spirit Stones total',
    icon: 'Gem',
    category: 'collection',
    rarity: 'rare',
    requirement: { type: 'gold', target: 10000 },
    rewards: { spiritStones: 500 }
  },
  {
    id: 'wealthy_cultivator',
    name: 'Wealthy Cultivator',
    description: 'Earn 100,000 Spirit Stones total',
    icon: 'Coins',
    category: 'collection',
    rarity: 'epic',
    requirement: { type: 'gold', target: 100000 },
    rewards: { spiritStones: 2000, title: 'Wealthy' }
  },
  
  // ============ QUEST ACHIEVEMENTS ============
  {
    id: 'quest_beginner',
    name: 'Quest Beginner',
    description: 'Complete your first quest',
    icon: 'BookOpen',
    category: 'mastery',
    rarity: 'common',
    requirement: { type: 'quests', target: 1 },
    rewards: { exp: 50 }
  },
  {
    id: 'quest_adept',
    name: 'Quest Adept',
    description: 'Complete 10 quests',
    icon: 'BookOpen',
    category: 'mastery',
    rarity: 'uncommon',
    requirement: { type: 'quests', target: 10 },
    rewards: { exp: 200, spiritStones: 150 }
  },
  {
    id: 'quest_master',
    name: 'Quest Master',
    description: 'Complete 25 quests',
    icon: 'Award',
    category: 'mastery',
    rarity: 'rare',
    requirement: { type: 'quests', target: 25 },
    rewards: { spiritStones: 400, title: 'Quest Master' }
  },
  
  // ============ HIDDEN/SECRET ACHIEVEMENTS ============
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Die for the first time',
    icon: 'Heart',
    category: 'combat',
    rarity: 'common',
    requirement: { type: 'deaths', target: 1 },
    hidden: true,
    rewards: { exp: 25 }
  },
  {
    id: 'resilient',
    name: 'Resilient',
    description: 'Die 10 times and keep going',
    icon: 'Shield',
    category: 'combat',
    rarity: 'uncommon',
    requirement: { type: 'deaths', target: 10 },
    hidden: true,
    rewards: { exp: 100, title: 'Resilient' }
  },
];

// Helper functions
export function getAchievementById(id: string): Achievement | undefined {
  return achievementsDatabase.find(a => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return achievementsDatabase.filter(a => a.category === category);
}

export function getUnlockedAchievements(playerAchievements: PlayerAchievements): Achievement[] {
  return achievementsDatabase.filter(a => playerAchievements.progress[a.id]?.unlocked);
}

export function getAchievementProgress(
  achievement: Achievement, 
  playerAchievements: PlayerAchievements
): { current: number; target: number; percent: number } {
  const progress = playerAchievements.progress[achievement.id];
  const current = progress?.current || 0;
  const target = achievement.requirement.target;
  const percent = Math.min((current / target) * 100, 100);
  return { current, target, percent };
}

export function getRarityColor(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'common': return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
    case 'uncommon': return 'text-green-400 border-green-500/50 bg-green-500/10';
    case 'rare': return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
    case 'epic': return 'text-purple-400 border-purple-500/50 bg-purple-500/10';
    case 'legendary': return 'text-orange-400 border-orange-500/50 bg-orange-500/10';
  }
}

export function getCategoryLabel(category: AchievementCategory): string {
  switch (category) {
    case 'combat': return 'Combat';
    case 'exploration': return 'Exploration';
    case 'crafting': return 'Crafting';
    case 'cultivation': return 'Cultivation';
    case 'collection': return 'Collection';
    case 'social': return 'Social';
    case 'mastery': return 'Mastery';
  }
}

// Initialize empty player achievements
export function createInitialAchievements(): PlayerAchievements {
  return {
    progress: {},
    totalUnlocked: 0
  };
}

// Update achievement progress and check for unlocks
export function updateAchievementProgress(
  playerAchievements: PlayerAchievements,
  type: Achievement['requirement']['type'],
  amount: number = 1
): { achievements: PlayerAchievements; newUnlocks: Achievement[] } {
  const newProgress = { ...playerAchievements.progress };
  const newUnlocks: Achievement[] = [];
  
  // Find all achievements matching this type
  const matchingAchievements = achievementsDatabase.filter(a => a.requirement.type === type);
  
  for (const achievement of matchingAchievements) {
    const currentProgress = newProgress[achievement.id] || { id: achievement.id, current: 0, unlocked: false };
    
    // Skip if already unlocked
    if (currentProgress.unlocked) continue;
    
    // Update progress
    const updatedProgress = {
      ...currentProgress,
      current: currentProgress.current + amount
    };
    
    // Check if now complete
    if (updatedProgress.current >= achievement.requirement.target) {
      updatedProgress.unlocked = true;
      updatedProgress.unlockedAt = new Date();
      newUnlocks.push(achievement);
    }
    
    newProgress[achievement.id] = updatedProgress;
  }
  
  return {
    achievements: {
      ...playerAchievements,
      progress: newProgress,
      totalUnlocked: playerAchievements.totalUnlocked + newUnlocks.length,
      lastUnlocked: newUnlocks.length > 0 ? newUnlocks[newUnlocks.length - 1].id : playerAchievements.lastUnlocked
    },
    newUnlocks
  };
}

// Check specific achievement by ID
export function checkAchievement(
  playerAchievements: PlayerAchievements,
  achievementId: string,
  currentValue: number
): { achievements: PlayerAchievements; unlocked: boolean } {
  const achievement = getAchievementById(achievementId);
  if (!achievement) return { achievements: playerAchievements, unlocked: false };
  
  const currentProgress = playerAchievements.progress[achievementId] || { id: achievementId, current: 0, unlocked: false };
  if (currentProgress.unlocked) return { achievements: playerAchievements, unlocked: false };
  
  const newProgress = { ...currentProgress, current: currentValue };
  
  if (newProgress.current >= achievement.requirement.target) {
    newProgress.unlocked = true;
    newProgress.unlockedAt = new Date();
    
    return {
      achievements: {
        ...playerAchievements,
        progress: { ...playerAchievements.progress, [achievementId]: newProgress },
        totalUnlocked: playerAchievements.totalUnlocked + 1,
        lastUnlocked: achievementId
      },
      unlocked: true
    };
  }
  
  return {
    achievements: {
      ...playerAchievements,
      progress: { ...playerAchievements.progress, [achievementId]: newProgress }
    },
    unlocked: false
  };
}

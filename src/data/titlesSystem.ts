// ============================================
// TITLES SYSTEM - Wuxia Cultivation Titles
// ============================================
// Unlockable titles based on achievements
// ============================================

// ============================================
// TYPES
// ============================================

export type TitleRarity = 'gray' | 'green' | 'blue' | 'purple' | 'gold';
export type TitleCategory = 'combat' | 'cultivation' | 'exploration' | 'crafting' | 'collection' | 'special';

export interface TitleDefinition {
  id: string;
  name: string;
  namePT: string;              // Portuguese name
  description: string;
  descriptionPT: string;       // Portuguese description
  category: TitleCategory;
  rarity: TitleRarity;
  requirement: TitleRequirement;
  special?: boolean;           // Special visual effects
}

export interface TitleRequirement {
  type: 'kills' | 'boss_kills' | 'level' | 'zones_visited' | 'crafts' | 'items_collected' | 
        'spirit_stones_earned' | 'deaths' | 'craft_immortal' | 'guild_create' | 'ranking';
  value: number;
}

export interface UnlockedTitle {
  titleId: string;
  unlockedAt: Date;
}

export interface PlayerTitleState {
  unlockedTitles: UnlockedTitle[];
  activeTitle: string | null;  // ID of equipped title
}

// ============================================
// RARITY STYLING
// ============================================

export const TITLE_RARITY_STYLES: Record<TitleRarity, {
  text: string;
  bg: string;
  border: string;
  glow: string;
}> = {
  gray: {
    text: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/40',
    glow: '',
  },
  green: {
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/40',
    glow: 'shadow-green-500/20',
  },
  blue: {
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/40',
    glow: 'shadow-blue-500/30',
  },
  purple: {
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/40',
    glow: 'shadow-purple-500/40',
  },
  gold: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    glow: 'shadow-amber-500/50',
  },
};

// ============================================
// CATEGORY INFO
// ============================================

export const TITLE_CATEGORIES: Record<TitleCategory, {
  name: string;
  namePT: string;
  icon: string;  // Lucide icon name
}> = {
  combat: { name: 'Combat', namePT: 'Combate', icon: 'Sword' },
  cultivation: { name: 'Cultivation', namePT: 'Cultivação', icon: 'Sparkles' },
  exploration: { name: 'Exploration', namePT: 'Exploração', icon: 'Map' },
  crafting: { name: 'Crafting', namePT: 'Fabricação', icon: 'Hammer' },
  collection: { name: 'Collection', namePT: 'Colecção', icon: 'Package' },
  special: { name: 'Special', namePT: 'Especial', icon: 'Star' },
};

// ============================================
// ALL TITLES DEFINITIONS
// ============================================

export const ALL_TITLES: TitleDefinition[] = [
  // ===== COMBAT TITLES =====
  {
    id: 'outer_disciple',
    name: 'Outer Disciple',
    namePT: 'Discípulo Externo',
    description: 'Defeat your first enemy',
    descriptionPT: 'Derrotar o primeiro inimigo',
    category: 'combat',
    rarity: 'gray',
    requirement: { type: 'kills', value: 1 },
  },
  {
    id: 'inner_disciple',
    name: 'Inner Disciple',
    namePT: 'Discípulo Interno',
    description: 'Defeat 50 enemies',
    descriptionPT: 'Derrotar 50 inimigos',
    category: 'combat',
    rarity: 'green',
    requirement: { type: 'kills', value: 50 },
  },
  {
    id: 'asura_disciple',
    name: 'Asura Disciple',
    namePT: 'Discípulo Asura',
    description: 'Defeat 200 enemies',
    descriptionPT: 'Derrotar 200 inimigos',
    category: 'combat',
    rarity: 'blue',
    requirement: { type: 'kills', value: 200 },
  },
  {
    id: 'sword_immortal',
    name: 'Sword Immortal',
    namePT: 'Imortal da Espada',
    description: 'Defeat 500 enemies',
    descriptionPT: 'Derrotar 500 inimigos',
    category: 'combat',
    rarity: 'purple',
    requirement: { type: 'kills', value: 500 },
  },
  {
    id: 'slaughter_king',
    name: 'Slaughter King',
    namePT: 'Rei do Massacre',
    description: 'Defeat 800 enemies',
    descriptionPT: 'Derrotar 800 inimigos',
    category: 'combat',
    rarity: 'gold',
    requirement: { type: 'kills', value: 800 },
  },
  {
    id: 'beast_slayer',
    name: 'Beast Slayer',
    namePT: 'Caçador de Bestas',
    description: 'Defeat your first boss',
    descriptionPT: 'Derrotar o primeiro boss',
    category: 'combat',
    rarity: 'green',
    requirement: { type: 'boss_kills', value: 1 },
  },
  {
    id: 'demon_vanquisher',
    name: 'Demon Vanquisher',
    namePT: 'Exterminador de Demónios',
    description: 'Defeat 7 bosses',
    descriptionPT: 'Derrotar 7 bosses',
    category: 'combat',
    rarity: 'purple',
    requirement: { type: 'boss_kills', value: 7 },
  },
  {
    id: 'beast_conqueror',
    name: 'Beast Conqueror',
    namePT: 'Conquistador de Bestas',
    description: 'Defeat 15 bosses',
    descriptionPT: 'Derrotar 15 bosses',
    category: 'combat',
    rarity: 'gold',
    requirement: { type: 'boss_kills', value: 15 },
  },

  // ===== CULTIVATION TITLES =====
  {
    id: 'initiate',
    name: 'Initiate',
    namePT: 'Iniciante',
    description: 'Reach level 3',
    descriptionPT: 'Alcançar nível 3',
    category: 'cultivation',
    rarity: 'gray',
    requirement: { type: 'level', value: 3 },
  },
  {
    id: 'qi_condensation_master',
    name: 'Qi Condensation Master',
    namePT: 'Mestre da Condensação de Qi',
    description: 'Reach level 9',
    descriptionPT: 'Alcançar nível 9',
    category: 'cultivation',
    rarity: 'green',
    requirement: { type: 'level', value: 9 },
  },
  {
    id: 'foundation_disciple',
    name: 'Foundation Disciple',
    namePT: 'Discípulo da Fundação',
    description: 'Reach level 10',
    descriptionPT: 'Alcançar nível 10',
    category: 'cultivation',
    rarity: 'green',
    requirement: { type: 'level', value: 10 },
  },
  {
    id: 'foundation_elder',
    name: 'Foundation Elder',
    namePT: 'Ancião da Fundação',
    description: 'Reach level 19',
    descriptionPT: 'Alcançar nível 19',
    category: 'cultivation',
    rarity: 'blue',
    requirement: { type: 'level', value: 19 },
  },
  {
    id: 'golden_core_cultivator',
    name: 'Golden Core Cultivator',
    namePT: 'Cultivador do Core Dourado',
    description: 'Reach level 20',
    descriptionPT: 'Alcançar nível 20',
    category: 'cultivation',
    rarity: 'purple',
    requirement: { type: 'level', value: 20 },
  },
  {
    id: 'golden_core_sovereign',
    name: 'Golden Core Sovereign',
    namePT: 'Soberano do Core Dourado',
    description: 'Reach level 29',
    descriptionPT: 'Alcançar nível 29',
    category: 'cultivation',
    rarity: 'gold',
    requirement: { type: 'level', value: 29 },
  },

  // ===== EXPLORATION TITLES =====
  {
    id: 'wanderer',
    name: 'Wanderer',
    namePT: 'Andarilho',
    description: 'Visit 5 different zones',
    descriptionPT: 'Visitar 5 zonas diferentes',
    category: 'exploration',
    rarity: 'gray',
    requirement: { type: 'zones_visited', value: 5 },
  },
  {
    id: 'explorer',
    name: 'Explorer',
    namePT: 'Explorador',
    description: 'Visit 15 different zones',
    descriptionPT: 'Visitar 15 zonas diferentes',
    category: 'exploration',
    rarity: 'green',
    requirement: { type: 'zones_visited', value: 15 },
  },
  {
    id: 'realm_walker',
    name: 'Realm Walker',
    namePT: 'Caminhante dos Reinos',
    description: 'Visit all zones',
    descriptionPT: 'Visitar todas as zonas',
    category: 'exploration',
    rarity: 'gold',
    requirement: { type: 'zones_visited', value: 50 }, // All zones
  },

  // ===== CRAFTING TITLES =====
  {
    id: 'apprentice_smith',
    name: 'Apprentice Smith',
    namePT: 'Aprendiz de Ferreiro',
    description: 'Craft your first item',
    descriptionPT: 'Fabricar o primeiro item',
    category: 'crafting',
    rarity: 'gray',
    requirement: { type: 'crafts', value: 1 },
  },
  {
    id: 'master_forger',
    name: 'Master Forger',
    namePT: 'Mestre Forjador',
    description: 'Craft 50 items',
    descriptionPT: 'Fabricar 50 items',
    category: 'crafting',
    rarity: 'blue',
    requirement: { type: 'crafts', value: 50 },
  },
  {
    id: 'divine_artisan',
    name: 'Divine Artisan',
    namePT: 'Artesão Divino',
    description: 'Craft an Immortal grade item',
    descriptionPT: 'Fabricar um item de grade Imortal',
    category: 'crafting',
    rarity: 'gold',
    requirement: { type: 'craft_immortal', value: 1 },
  },

  // ===== COLLECTION TITLES =====
  {
    id: 'treasure_hunter',
    name: 'Treasure Hunter',
    namePT: 'Caçador de Tesouros',
    description: 'Collect 100 items',
    descriptionPT: 'Colectar 100 items',
    category: 'collection',
    rarity: 'green',
    requirement: { type: 'items_collected', value: 100 },
  },
  {
    id: 'fortune_seeker',
    name: 'Fortune Seeker',
    namePT: 'Buscador de Fortuna',
    description: 'Earn 50,000 Spirit Stones total',
    descriptionPT: 'Ganhar 50.000 Spirit Stones no total',
    category: 'collection',
    rarity: 'blue',
    requirement: { type: 'spirit_stones_earned', value: 50000 },
  },
  {
    id: 'wealthy_cultivator',
    name: 'Wealthy Cultivator',
    namePT: 'Cultivador Rico',
    description: 'Earn 200,000 Spirit Stones total',
    descriptionPT: 'Ganhar 200.000 Spirit Stones no total',
    category: 'collection',
    rarity: 'purple',
    requirement: { type: 'spirit_stones_earned', value: 200000 },
  },

  // ===== SPECIAL TITLES =====
  {
    id: 'resilient',
    name: 'Resilient',
    namePT: 'Resiliente',
    description: 'Die 10 times',
    descriptionPT: 'Morrer 10 vezes',
    category: 'special',
    rarity: 'gray',
    requirement: { type: 'deaths', value: 10 },
  },
  {
    id: 'first_of_the_realm',
    name: 'First of the Realm',
    namePT: 'Primeiro do Reino',
    description: 'Reach #1 in weekly ranking',
    descriptionPT: 'Alcançar #1 no ranking semanal',
    category: 'special',
    rarity: 'gold',
    requirement: { type: 'ranking', value: 1 },
    special: true,
  },
  {
    id: 'sect_founder',
    name: 'Sect Founder',
    namePT: 'Fundador de Seita',
    description: 'Create a guild',
    descriptionPT: 'Criar uma guilda',
    category: 'special',
    rarity: 'purple',
    requirement: { type: 'guild_create', value: 1 },
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a title definition by ID
 */
export const getTitleById = (id: string): TitleDefinition | undefined => {
  return ALL_TITLES.find(t => t.id === id);
};

/**
 * Get all titles in a category
 */
export const getTitlesByCategory = (category: TitleCategory): TitleDefinition[] => {
  return ALL_TITLES.filter(t => t.category === category);
};

/**
 * Check if a player meets the requirement for a title
 */
export const checkTitleRequirement = (
  title: TitleDefinition,
  playerStats: PlayerStats
): boolean => {
  const { type, value } = title.requirement;
  
  switch (type) {
    case 'kills':
      return (playerStats.totalKills || 0) >= value;
    case 'boss_kills':
      return (playerStats.bossKills || 0) >= value;
    case 'level':
      return (playerStats.level || 1) >= value;
    case 'zones_visited':
      return (playerStats.zonesVisited || 0) >= value;
    case 'crafts':
      return (playerStats.totalCrafts || 0) >= value;
    case 'items_collected':
      return (playerStats.itemsCollected || 0) >= value;
    case 'spirit_stones_earned':
      return (playerStats.totalSpiritStonesEarned || 0) >= value;
    case 'deaths':
      return (playerStats.deaths || 0) >= value;
    case 'craft_immortal':
      return (playerStats.immortalCrafts || 0) >= value;
    case 'guild_create':
      return playerStats.hasGuild || false;
    case 'ranking':
      return (playerStats.bestRanking || Infinity) <= value;
    default:
      return false;
  }
};

/**
 * Player stats interface for title checking
 */
export interface PlayerStats {
  level?: number;
  totalKills?: number;
  bossKills?: number;
  zonesVisited?: number;
  totalCrafts?: number;
  itemsCollected?: number;
  totalSpiritStonesEarned?: number;
  deaths?: number;
  immortalCrafts?: number;
  hasGuild?: boolean;
  bestRanking?: number;
}

/**
 * Get all titles a player has unlocked
 */
export const getUnlockedTitles = (
  playerStats: PlayerStats,
  existingUnlocks: UnlockedTitle[]
): UnlockedTitle[] => {
  const unlocked = [...existingUnlocks];
  const unlockedIds = new Set(unlocked.map(u => u.titleId));
  
  for (const title of ALL_TITLES) {
    if (!unlockedIds.has(title.id) && checkTitleRequirement(title, playerStats)) {
      unlocked.push({
        titleId: title.id,
        unlockedAt: new Date(),
      });
    }
  }
  
  return unlocked;
};

/**
 * Get newly unlocked titles (for notifications)
 */
export const getNewlyUnlockedTitles = (
  playerStats: PlayerStats,
  existingUnlocks: UnlockedTitle[]
): TitleDefinition[] => {
  const unlockedIds = new Set(existingUnlocks.map(u => u.titleId));
  const newTitles: TitleDefinition[] = [];
  
  for (const title of ALL_TITLES) {
    if (!unlockedIds.has(title.id) && checkTitleRequirement(title, playerStats)) {
      newTitles.push(title);
    }
  }
  
  return newTitles;
};

/**
 * Get the active title name for display
 */
export const getActiveTitle = (titleState: PlayerTitleState | undefined): TitleDefinition | null => {
  if (!titleState?.activeTitle) return null;
  return getTitleById(titleState.activeTitle) || null;
};

/**
 * Get progress towards a title (0-100%)
 */
export const getTitleProgress = (
  title: TitleDefinition,
  playerStats: PlayerStats
): number => {
  const { type, value } = title.requirement;
  let current = 0;
  
  switch (type) {
    case 'kills':
      current = playerStats.totalKills || 0;
      break;
    case 'boss_kills':
      current = playerStats.bossKills || 0;
      break;
    case 'level':
      current = playerStats.level || 1;
      break;
    case 'zones_visited':
      current = playerStats.zonesVisited || 0;
      break;
    case 'crafts':
      current = playerStats.totalCrafts || 0;
      break;
    case 'items_collected':
      current = playerStats.itemsCollected || 0;
      break;
    case 'spirit_stones_earned':
      current = playerStats.totalSpiritStonesEarned || 0;
      break;
    case 'deaths':
      current = playerStats.deaths || 0;
      break;
    case 'craft_immortal':
      current = playerStats.immortalCrafts || 0;
      break;
    case 'guild_create':
      current = playerStats.hasGuild ? 1 : 0;
      break;
    case 'ranking':
      // Ranking is inverted (lower is better)
      if (!playerStats.bestRanking) return 0;
      if (playerStats.bestRanking <= value) return 100;
      return Math.max(0, 100 - ((playerStats.bestRanking - value) * 10));
    default:
      return 0;
  }
  
  return Math.min(100, Math.floor((current / value) * 100));
};

/**
 * Create default player title state
 */
export const createDefaultTitleState = (): PlayerTitleState => ({
  unlockedTitles: [],
  activeTitle: null,
});

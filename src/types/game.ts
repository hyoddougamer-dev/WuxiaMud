// ============================================
// GAME TYPES - Central Type Definitions
// ============================================

import type { ElementType } from '../data/elementSystem';
import type { SkillCombo, ComboProgress } from '../data/comboSystem';
import type { EffectState } from '../data/buffDebuffEngine';
import type { PlayerQuestLog } from '../data/questSystem';

// ============================================
// PLAYER TYPES
// ============================================

export interface PlayerStats {
  str: number;
  dex: number;
  con: number;
  spi: number;
  wil: number;
}

export interface PlayerEquipment {
  weapon: EquippedItem | null;
  ring: EquippedItem | null;
  necklace: EquippedItem | null;
}

export interface EquippedItem {
  id: string;
  name: string;
  type: string;
  slot: string;
  rarity: string;
  tier: number;
  stats: Partial<PlayerStats>;
  durability?: number;
  maxDurability?: number;
  element?: ElementType;
  desc?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'consumable' | 'material' | 'quest' | 'gear' | 'trash';
  count?: number;
  effect?: 'hp' | 'qi';
  amount?: number;
  iconType?: string;
  desc?: string;
  rarity?: string;
  tier?: number;
  stats?: Partial<PlayerStats>;
  slot?: string;
  questId?: string; // For quest items
}

export interface BestiaryProgress {
  claimedDiscovery: number[];
  claimedMobMilestones: Record<number, number[]>;
  claimedRealmMastery: string[];
  claimedTagMastery: Record<string, number[]>;
}

export interface PityState {
  dropKillsWithoutDrop: number;
  craftFailures: number;
  reforgeFailures: number;
  legendaryEssence: number;
}

export interface PassiveState {
  classId: number;
  passiveName: string;
  stacks: number;
  cooldown: number;
  triggered: boolean;
  data: Record<string, any>;
}

export interface Player {
  name: string;
  title: string;
  level: number;
  realm: string;
  hp: number;
  maxHp: number;
  qi: number;
  maxQi: number;
  exp: number;
  ap: number;
  totalAPEarned: number;
  baseStats: PlayerStats;
  stats: PlayerStats;
  avatar: string;
  equipment: PlayerEquipment;
  skills: string[];
  learnedSkills: string[];
  skillCooldowns: Record<string, number>;
  unlockedUltimates: string[];
  spiritStones: number;
  contribution: number;
  visited: string[];
  lastCombatTime: number;
  isMeditating: boolean;
  selectedClass: number | null;
  passiveState: PassiveState | null;
  pityState: PityState;
  killCounter: Record<number, number>;
  bestiaryProgress: BestiaryProgress;
  tutorialCompleted: boolean;
  characterCreated: boolean;
  inventory: InventoryItem[];
  bank: InventoryItem[];
  questLog: PlayerQuestLog;
  autoCombatTimeUsedToday: number;
  autoCombatLastReset: number;
}

// ============================================
// COMBAT TYPES
// ============================================

export interface CombatEnemy {
  id: number;
  name: string;
  level: number;
  quality: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  exp: number;
  stones: number;
  drop: string;
  element?: ElementType;
  tags?: string[];
}

export interface CombatState {
  active: boolean;
  enemy: CombatEnemy | null;
  playerTurn: boolean;
  round: number;
  log: CombatLogEntry[];
}

export interface CombatLogEntry {
  text: string;
  type: 'damage' | 'heal' | 'skill' | 'system' | 'effect' | 'success' | 'warning' | 'danger';
  timestamp?: number;
}

export interface FloatingDamage {
  id: number;
  target: 'player' | 'enemy';
  value: number | string;
  type: 'damage' | 'heal' | 'crit' | 'miss' | 'dodge' | 'effect';
  color?: string;
  element?: ElementType;
}

export interface CombatAnimations {
  playerAttacking: boolean;
  enemyAttacking: boolean;
  playerSkillEffect: { element: ElementType; active: boolean } | null;
  enemyHit: boolean;
  playerHit: boolean;
  skillParticles: Array<{ id: number; element: ElementType; x: number; y: number }>;
}

// ============================================
// AUTO-COMBAT TYPES
// ============================================

export interface AutoCombatSettings {
  autoPotEnabled: boolean;
  autoPotHpThreshold: number;
  autoPotQiThreshold: number;
  stopOnLowHp: boolean;
  lowHpThreshold: number;
  autoLoot: boolean;
  skipLootModal: boolean;
  preferredSkillRotation: string[];
  useUltimatesAutomatically: boolean;
}

export interface AutoCombatSessionStats {
  startTime: number;
  monstersKilled: number;
  expGained: number;
  stonesGained: number;
  lootCollected: string[];
  pillsUsed: number;
  deaths: number;
  skillsUsed: number;
}

// ============================================
// UI STATE TYPES
// ============================================

export type TabType = 'world' | 'character' | 'inventory' | 'forge' | 'bestiary' | 'cultivation';

export type GameState = 'loading' | 'character-select' | 'character-creation' | 'tutorial' | 'game';

export interface LootModalState {
  isOpen: boolean;
  loot: InventoryItem[];
  spiritStones: number;
  mobName: string;
}

export interface DeathModalState {
  isOpen: boolean;
  penalty: {
    xpLost: number;
    xpPercent: number;
    durabilityLost: number;
    damagedGear: { slot: string; name: string; newDurability: number }[];
    killedBy: string;
  } | null;
}

// ============================================
// GAME LOG TYPES
// ============================================

export interface GameLogEntry {
  text: string;
  type: 'system' | 'combat' | 'quest' | 'loot' | 'success' | 'warning' | 'danger' | 'info';
  timestamp?: number;
}

// ============================================
// COORDINATES
// ============================================

export interface Coordinates {
  x: number;
  y: number;
}

// ============================================
// COMBO TYPES (re-export for convenience)
// ============================================

export type { SkillCombo, ComboProgress };
export type { EffectState };

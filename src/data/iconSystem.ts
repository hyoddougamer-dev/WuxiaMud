/**
 * =========================================
 * ICON SYSTEM - Centralized Icon Registry
 * =========================================
 * 
 * This system centralizes all icon paths and provides
 * components/helpers for displaying icons with emoji fallbacks.
 * 
 * Use this instead of hardcoded emojis throughout the codebase.
 */

// ==========================================
// ICON PATH CONSTANTS
// ==========================================

export const ICONS = {
  // === COMBAT ICONS ===
  combat: {
    player_attack: '/assets/icons/combat/player_attack.png',
    enemy_attack: '/assets/icons/combat/enemy_attack.png',
    player_crit: '/assets/icons/combat/player_crit.png',
    enemy_crit: '/assets/icons/combat/enemy_crit.png',
    heal: '/assets/icons/combat/heal.png',
    buff: '/assets/icons/combat/buff.png',
    debuff: '/assets/icons/combat/debuff.png',
    passive: '/assets/icons/combat/passive.png',
    victory: '/assets/icons/combat/victory.png',
    flee: '/assets/icons/combat/flee.png',
    warning: '/assets/icons/combat/warning.png',
    system: '/assets/icons/combat/system.png',
  },
  
  // === ELEMENT ICONS (Generated!) ===
  elements: {
    fire: '/assets/icons/elements/element_fire.png',
    ice: '/assets/icons/elements/element_ice.png',
    lightning: '/assets/icons/elements/element_lightning.png',
    nature: '/assets/icons/elements/element_nature.png',
    wood: '/assets/icons/elements/element_nature.png', // Alias
    poison: '/assets/icons/elements/element_poison.png',
    void: '/assets/icons/elements/element_void.png',
  },
  
  // === ACTION ICONS (Generated!) ===
  actions: {
    block: '/assets/icons/actions/action_block.png',
    counter: '/assets/icons/actions/action_counter.png',
    dodge: '/assets/icons/actions/action_dodge.png',
    parry: '/assets/icons/actions/action_parry.png',
  },
  
  // === RESOURCE ICONS (Generated!) ===
  resources: {
    exp: '/assets/icons/resources/resource_exp.png',
    hp: '/assets/icons/resources/resource_hp.png',
    qi: '/assets/icons/resources/resource_qi.png',
    spiritStone: '/assets/icons/cultivation/spirit_stone_crystal.png',
  },
  
  // === STATUS EFFECT ICONS (Pending generation) ===
  status: {
    burning: '/assets/icons/status/status_burning.png',
    frozen: '/assets/icons/status/status_frozen.png',
    stunned: '/assets/icons/status/status_stunned.png',
    poisoned: '/assets/icons/status/status_poisoned.png',
    entangled: '/assets/icons/status/status_entangled.png',
    bleeding: '/assets/icons/status/status_bleeding.png',
    shielded: '/assets/icons/status/status_shielded.png',
    regenerating: '/assets/icons/status/status_regenerating.png',
  },
  
  // === UI ICONS ===
  ui: {
    character_frame: '/assets/icons/ui/character_portrait_frame.png',
    dialog_box: '/assets/icons/ui/dialog_box_frame.png',
    hp_bar: '/assets/icons/ui/hp_bar_frame.png',
    inventory_slot: '/assets/icons/ui/inventory_slot_frame.png',
    modal_window: '/assets/icons/ui/modal_window_frame.png',
    panel_header: '/assets/icons/ui/panel_header_frame.png',
    qi_bar: '/assets/icons/ui/qi_bar_frame.png',
    skill_button: '/assets/icons/ui/skill_button_frame.png',
    skill_hotbar: '/assets/icons/ui/skill_hotbar_slot.png',
    tooltip: '/assets/icons/ui/tooltip_frame.png',
  },
  
  // === CULTIVATION ICONS ===
  cultivation: {
    bamboo_scroll: '/assets/icons/cultivation/bamboo_scroll.png',
    cauldron: '/assets/icons/cultivation/cultivation_cauldron.png',
    enlightenment: '/assets/icons/cultivation/enlightment_halo.png',
    jade_pendant: '/assets/icons/cultivation/jade_pendant.png',
    meditation: '/assets/icons/cultivation/medidation_lotus_pose.png',
    qi_energy: '/assets/icons/cultivation/qi_energy_swirl.png',
    spirit_stone: '/assets/icons/cultivation/spirit_stone_crystal.png',
    yin_yang: '/assets/icons/cultivation/yin_yang_symbol.png',
  },
  
  // === QUEST ICONS ===
  quests: {
    achievement: '/assets/icons/quests/achievement_star.png',
    bounty: '/assets/icons/quests/bounty.png',
    main_quest: '/assets/icons/quests/main_quest.png',
    quest_scroll: '/assets/icons/quests/quest_scroll.png',
    side_quest: '/assets/icons/quests/side_quest.png',
  },
  
  // === COLLECTIBLES (placeholder for future) ===
  collectibles: {
    // Add as they are created
  },
} as const;

// ==========================================
// EMOJI FALLBACKS (when icons don't exist)
// ==========================================

export const EMOJI_FALLBACKS = {
  // Combat actions
  attack: '⚔️',
  crit: '💥',
  heal: '💚',
  buff: '⬆️',
  debuff: '⬇️',
  passive: '✨',
  
  // Combat status
  victory: '🏆',
  defeat: '💀',
  flee: '🏃',
  warning: '⚠️',
  system: '📜',
  
  // Elements
  fire: '🔥',
  ice: '❄️',
  lightning: '⚡',
  poison: '☠️',
  nature: '🌿',
  void: '🌑',
  
  // Status effects
  burning: '🔥',
  frozen: '❄️',
  entangled: '🌿',
  stunned: '⚡',
  corrupted: '☠️',
  
  // Combat defense
  dodge: '💨',
  block: '🛡️',
  counter: '⚔️',
  resist: '🛡️',
  
  // Resources
  gold: '🪙',
  spiritStone: '💎',
  qi: '✨',
  hp: '❤️',
  
  // Misc
  selected: '✨',
  new: '🌟',
  achievement: '⭐',
  quest: '📜',
  target: '🎯',
  
  // Cultivation
  breakthrough: '🌟',
  cultivation: '🧘',
  meditation: '🧘',
  
  // UI indicators
  expand: '▶',
  collapse: '▼',
  pause: '⏸',
  play: '▶',
  delete: '🗑',
  
  // Default
  default: '•',
} as const;

// ==========================================
// ELEMENT ICON MAP (with image paths!)
// ==========================================

export const ELEMENT_ICONS: Record<string, { emoji: string; color: string; icon: string }> = {
  fire: { emoji: '🔥', color: '#ff6b35', icon: '/assets/icons/elements/element_fire.png' },
  ice: { emoji: '❄️', color: '#00d4ff', icon: '/assets/icons/elements/element_ice.png' },
  lightning: { emoji: '⚡', color: '#c084fc', icon: '/assets/icons/elements/element_lightning.png' },
  poison: { emoji: '☠️', color: '#4ade80', icon: '/assets/icons/elements/element_poison.png' },
  nature: { emoji: '🌿', color: '#22c55e', icon: '/assets/icons/elements/element_nature.png' },
  wood: { emoji: '🌿', color: '#4ade80', icon: '/assets/icons/elements/element_nature.png' },
  void: { emoji: '🌑', color: '#a855f7', icon: '/assets/icons/elements/element_void.png' },
};

// ==========================================
// STATUS EFFECT ICONS (with image paths!)
// ==========================================

export const STATUS_EFFECT_ICONS: Record<string, { emoji: string; color: string; icon: string }> = {
  burning: { emoji: '🔥', color: '#ff6b35', icon: '/assets/icons/status/status_burning.png' },
  frozen: { emoji: '❄️', color: '#00d4ff', icon: '/assets/icons/status/status_frozen.png' },
  entangled: { emoji: '🌿', color: '#22c55e', icon: '/assets/icons/status/status_entangled.png' },
  stunned: { emoji: '⚡', color: '#c084fc', icon: '/assets/icons/status/status_stunned.png' },
  corrupted: { emoji: '☠️', color: '#22c55e', icon: '/assets/icons/status/status_poisoned.png' },
  poisoned: { emoji: '☠️', color: '#4ade80', icon: '/assets/icons/status/status_poisoned.png' },
  bleeding: { emoji: '🩸', color: '#dc2626', icon: '/assets/icons/status/status_bleeding.png' },
  regenerating: { emoji: '💚', color: '#22c55e', icon: '/assets/icons/status/status_regenerating.png' },
  shielded: { emoji: '🛡️', color: '#3b82f6', icon: '/assets/icons/status/status_shielded.png' },
};

// ==========================================
// ACTION ICONS (with image paths!)
// ==========================================

export const ACTION_ICONS: Record<string, { emoji: string; color: string; icon: string }> = {
  dodge: { emoji: '💨', color: '#60a5fa', icon: '/assets/icons/actions/action_dodge.png' },
  block: { emoji: '🛡️', color: '#fbbf24', icon: '/assets/icons/actions/action_block.png' },
  counter: { emoji: '⚔️', color: '#ef4444', icon: '/assets/icons/actions/action_counter.png' },
  parry: { emoji: '⚔️', color: '#a855f7', icon: '/assets/icons/actions/action_parry.png' },
};

// ==========================================
// RESOURCE ICONS (with image paths!)
// ==========================================

export const RESOURCE_ICONS: Record<string, { emoji: string; color: string; icon: string; label: string }> = {
  hp: { emoji: '❤️', color: '#ef4444', icon: '/assets/icons/resources/resource_hp.png', label: 'HP' },
  qi: { emoji: '✨', color: '#3b82f6', icon: '/assets/icons/resources/resource_qi.png', label: 'QI' },
  exp: { emoji: '⭐', color: '#22c55e', icon: '/assets/icons/resources/resource_exp.png', label: 'EXP' },
  spiritStone: { emoji: '💎', color: '#a855f7', icon: '/assets/icons/cultivation/spirit_stone_crystal.png', label: 'Spirit Stones' },
  gold: { emoji: '🪙', color: '#fbbf24', icon: '/assets/icons/cultivation/spirit_stone_crystal.png', label: 'Gold' },
};

// ==========================================
// COMBAT LOG TYPE MAPPINGS
// ==========================================

export type CombatLogType = 
  | 'player_attack' | 'enemy_attack' 
  | 'player_crit' | 'enemy_crit'
  | 'heal' | 'buff' | 'debuff' | 'passive'
  | 'element_advantage' | 'element_disadvantage'
  | 'victory' | 'defeat' | 'flee'
  | 'warning' | 'system'
  | 'defense' | 'info';

export const COMBAT_LOG_TO_ICON: Record<CombatLogType, keyof typeof ICONS.combat | null> = {
  player_attack: 'player_attack',
  enemy_attack: 'enemy_attack',
  player_crit: 'player_crit',
  enemy_crit: 'enemy_crit',
  heal: 'heal',
  buff: 'buff',
  debuff: 'debuff',
  passive: 'passive',
  element_advantage: 'buff',
  element_disadvantage: 'debuff',
  victory: 'victory',
  defeat: 'enemy_crit', // Reuse for now
  flee: 'flee',
  warning: 'warning',
  system: 'system',
  defense: 'buff',
  info: 'system',
};

export const COMBAT_LOG_EMOJI_FALLBACK: Record<CombatLogType, string> = {
  player_attack: '⚔️',
  enemy_attack: '💢',
  player_crit: '💥',
  enemy_crit: '☠️',
  heal: '💚',
  buff: '⬆️',
  debuff: '⬇️',
  passive: '✨',
  element_advantage: '🔥',
  element_disadvantage: '🛡️',
  victory: '🏆',
  defeat: '💀',
  flee: '🏃',
  warning: '⚠️',
  system: '📜',
  defense: '🛡️',
  info: '📜',
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get combat icon path, returns null if icon doesn't exist
 */
export function getCombatIconPath(type: keyof typeof ICONS.combat): string {
  return ICONS.combat[type];
}

/**
 * Get icon path for combat log type
 */
export function getCombatLogIconPath(type: CombatLogType): string | null {
  const iconKey = COMBAT_LOG_TO_ICON[type];
  return iconKey ? ICONS.combat[iconKey] : null;
}

/**
 * Get emoji fallback for combat log type
 */
export function getCombatLogEmoji(type: CombatLogType): string {
  return COMBAT_LOG_EMOJI_FALLBACK[type] || EMOJI_FALLBACKS.default;
}

/**
 * Get status effect display info
 */
export function getStatusEffectDisplay(effect: string): { emoji: string; color: string } {
  return STATUS_EFFECT_ICONS[effect] || { emoji: '✨', color: '#fbbf24' };
}

/**
 * Get element display info
 */
export function getElementDisplay(element: string): { emoji: string; color: string } {
  return ELEMENT_ICONS[element] || { emoji: '✨', color: '#fbbf24' };
}

/**
 * Format status effect for display in combat log
 */
export function formatStatusEffect(effectType: string, duration: number): string {
  const display = getStatusEffectDisplay(effectType);
  return `${display.emoji} ${effectType.toUpperCase()}(${Math.ceil(duration)}s)`;
}

// ==========================================
// ICONS THAT NEED TO BE GENERATED
// ==========================================

/**
 * This list tracks emojis that should eventually be replaced with icons.
 * Generate these images and add paths to ICONS constant.
 * 
 * Priority 1 (Combat):
 * - Element icons: fire, ice, lightning, poison, nature, void
 * - Status effect icons: burning, frozen, entangled, stunned, corrupted, bleeding
 * - Defense icons: dodge, block, counter
 * 
 * Priority 2 (UI):
 * - Resource icons: gold_coin, spirit_stone, heart, qi_orb
 * - Action icons: attack, defend, run, use_item
 * 
 * Priority 3 (Misc):
 * - Notification icons: new, selected, locked, unlocked
 * - Navigation icons: arrows, expand, collapse
 */
export const MISSING_ICONS = [
  // Elements
  'element_fire', 'element_ice', 'element_lightning', 'element_poison', 'element_nature', 'element_void',
  // Status effects
  'status_burning', 'status_frozen', 'status_entangled', 'status_stunned', 'status_corrupted', 'status_bleeding',
  // Defense
  'action_dodge', 'action_block', 'action_counter',
  // Resources
  'resource_gold', 'resource_hp', 'resource_qi',
] as const;

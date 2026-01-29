// ============================================
// PLAYER DATA SERVICE - Server-Side Authority
// Secure save/load with Supabase
// ============================================

import { supabase } from './supabase';
import type { Player, InventoryItem, PlayerStats, PlayerEquipment, PassiveState, PityState, BestiaryProgress } from '../types/game';
import type { PlayerQuestLog } from '../data/questSystem';

// ============================================
// TYPES
// ============================================

export interface CharacterSlot {
  id: string;
  slot_index: number;
  name: string;
  level: number;
  realm: string;
  avatar: string;
  selected_class: number;
  last_played_at: string;
}

export interface SaveResult {
  success: boolean;
  error?: string;
}

export interface LoadResult {
  success: boolean;
  data?: Player;
  error?: string;
}

// ============================================
// CHARACTER SLOT MANAGEMENT
// ============================================

/**
 * Get all character slots for the current user
 */
export async function getCharacterSlots(): Promise<CharacterSlot[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('characters')
    .select('id, slot_index, name, level, realm, avatar, selected_class, last_played_at')
    .eq('user_id', user.id)
    .order('slot_index');

  if (error) {
    console.error('Error loading character slots:', error);
    return [];
  }

  return data || [];
}

/**
 * Delete a character from a slot
 */
export async function deleteCharacter(characterId: string): Promise<SaveResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting character:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// SAVE PLAYER DATA
// ============================================

/**
 * Save player data to Supabase
 * The database triggers will validate the data
 */
export async function savePlayerData(
  player: Player,
  slotIndex: number,
  characterId?: string
): Promise<SaveResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Prepare character data
    const characterData = {
      user_id: user.id,
      slot_index: slotIndex,
      
      // Basic Info
      name: player.name,
      title: player.title || '',
      avatar: player.avatar,
      selected_class: player.selectedClass || 1,
      
      // Stats
      level: player.level,
      realm: player.realm,
      exp: player.exp,
      ap: player.ap,
      total_ap_earned: player.totalAPEarned,
      
      // Resources
      hp: player.hp,
      max_hp: player.maxHp,
      qi: player.qi,
      max_qi: player.maxQi,
      spirit_stones: player.spiritStones,
      contribution: player.contribution,
      
      // Base Stats
      base_stats: player.baseStats,
      
      // Equipment (store IDs, not full objects)
      equipment: {
        weapon: player.equipment.weapon ? {
          id: player.equipment.weapon.id,
          name: player.equipment.weapon.name,
          type: player.equipment.weapon.type,
          slot: player.equipment.weapon.slot,
          rarity: player.equipment.weapon.rarity,
          tier: player.equipment.weapon.tier,
          stats: player.equipment.weapon.stats,
          durability: player.equipment.weapon.durability,
          maxDurability: player.equipment.weapon.maxDurability,
          element: player.equipment.weapon.element,
        } : null,
        ring: player.equipment.ring ? {
          id: player.equipment.ring.id,
          name: player.equipment.ring.name,
          type: player.equipment.ring.type,
          slot: player.equipment.ring.slot,
          rarity: player.equipment.ring.rarity,
          tier: player.equipment.ring.tier,
          stats: player.equipment.ring.stats,
          durability: player.equipment.ring.durability,
          maxDurability: player.equipment.ring.maxDurability,
        } : null,
        necklace: player.equipment.necklace ? {
          id: player.equipment.necklace.id,
          name: player.equipment.necklace.name,
          type: player.equipment.necklace.type,
          slot: player.equipment.necklace.slot,
          rarity: player.equipment.necklace.rarity,
          tier: player.equipment.necklace.tier,
          stats: player.equipment.necklace.stats,
          durability: player.equipment.necklace.durability,
          maxDurability: player.equipment.necklace.maxDurability,
        } : null,
      },
      
      // Skills
      skills: player.skills || [],
      learned_skills: player.learnedSkills || [],
      skill_cooldowns: player.skillCooldowns || {},
      unlocked_ultimates: player.unlockedUltimates || [],
      
      // Progress
      visited: player.visited || [],
      kill_counter: player.killCounter || {},
      bestiary_progress: player.bestiaryProgress || {
        claimedDiscovery: [],
        claimedMobMilestones: {},
        claimedRealmMastery: [],
        claimedTagMastery: {},
      },
      quest_log: player.questLog || {
        activeQuests: [],
        completedQuests: [],
        failedQuests: [],
      },
      
      // State
      passive_state: player.passiveState,
      pity_state: player.pityState || {
        dropKillsWithoutDrop: 0,
        craftFailures: 0,
        reforgeFailures: 0,
        legendaryEssence: 0,
      },
      
      // Flags
      tutorial_completed: player.tutorialCompleted,
      is_meditating: player.isMeditating,
      last_combat_time: player.lastCombatTime,
      auto_combat_time_used_today: player.autoCombatTimeUsedToday || 0,
      auto_combat_last_reset: player.autoCombatLastReset || 0,
    };

    let savedCharacterId = characterId;

    // Upsert character data
    if (characterId) {
      // Update existing character
      const { error } = await supabase
        .from('characters')
        .update(characterData)
        .eq('id', characterId)
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      // Insert new character
      const { data, error } = await supabase
        .from('characters')
        .insert(characterData)
        .select('id')
        .single();

      if (error) throw error;
      savedCharacterId = data.id;
    }

    // Save inventory separately
    if (savedCharacterId) {
      await saveInventory(savedCharacterId, user.id, player.inventory, 'inventory');
      await saveInventory(savedCharacterId, user.id, player.bank, 'bank');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error saving player data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save inventory items to Supabase
 */
async function saveInventory(
  characterId: string,
  userId: string,
  items: InventoryItem[],
  location: 'inventory' | 'bank'
): Promise<void> {
  // Delete existing items in this location
  await supabase
    .from('inventory')
    .delete()
    .eq('character_id', characterId)
    .eq('location', location);

  if (items.length === 0) return;

  // Insert all items
  const inventoryRows = items.map(item => ({
    character_id: characterId,
    user_id: userId,
    item_id: item.id,
    item_name: item.name,
    item_type: item.type,
    count: item.count || 1,
    rarity: item.rarity,
    tier: item.tier,
    stats: item.stats,
    slot: item.slot,
    durability: (item as any).durability,
    max_durability: (item as any).maxDurability,
    element: (item as any).element,
    effect: item.effect,
    amount: item.amount,
    icon_type: item.iconType,
    description: item.desc,
    quest_id: item.questId,
    location: location,
  }));

  const { error } = await supabase
    .from('inventory')
    .insert(inventoryRows);

  if (error) {
    console.error(`Error saving ${location}:`, error);
  }
}

// ============================================
// LOAD PLAYER DATA
// ============================================

/**
 * Load player data from Supabase
 */
export async function loadPlayerData(characterId: string): Promise<LoadResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Load character data
    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .eq('user_id', user.id)
      .single();

    if (charError) throw charError;
    if (!character) return { success: false, error: 'Character not found' };

    // Load inventory
    const { data: inventoryItems, error: invError } = await supabase
      .from('inventory')
      .select('*')
      .eq('character_id', characterId)
      .eq('user_id', user.id);

    if (invError) throw invError;

    // Separate inventory and bank
    const inventory: InventoryItem[] = [];
    const bank: InventoryItem[] = [];

    (inventoryItems || []).forEach(item => {
      const inventoryItem: InventoryItem = {
        id: item.item_id,
        name: item.item_name,
        type: item.item_type as any,
        count: item.count,
        rarity: item.rarity,
        tier: item.tier,
        stats: item.stats,
        slot: item.slot,
        effect: item.effect as any,
        amount: item.amount,
        iconType: item.icon_type,
        desc: item.description,
        questId: item.quest_id,
      };

      if (item.location === 'bank') {
        bank.push(inventoryItem);
      } else {
        inventory.push(inventoryItem);
      }
    });

    // Convert database format to Player format
    const player: Player = {
      name: character.name,
      title: character.title || '',
      level: character.level,
      realm: character.realm,
      hp: character.hp,
      maxHp: character.max_hp,
      qi: character.qi,
      maxQi: character.max_qi,
      exp: character.exp,
      ap: character.ap,
      totalAPEarned: character.total_ap_earned,
      baseStats: character.base_stats as PlayerStats,
      stats: character.base_stats as PlayerStats, // Will be recalculated with equipment
      avatar: character.avatar,
      equipment: character.equipment as PlayerEquipment,
      skills: character.skills || [],
      learnedSkills: character.learned_skills || [],
      skillCooldowns: character.skill_cooldowns || {},
      unlockedUltimates: character.unlocked_ultimates || [],
      spiritStones: character.spirit_stones,
      contribution: character.contribution,
      visited: character.visited || [],
      lastCombatTime: character.last_combat_time,
      isMeditating: character.is_meditating,
      selectedClass: character.selected_class,
      passiveState: character.passive_state as PassiveState | null,
      pityState: character.pity_state as PityState,
      killCounter: character.kill_counter || {},
      bestiaryProgress: character.bestiary_progress as BestiaryProgress,
      tutorialCompleted: character.tutorial_completed,
      characterCreated: true,
      inventory: inventory,
      bank: bank,
      questLog: character.quest_log as PlayerQuestLog,
      autoCombatTimeUsedToday: character.auto_combat_time_used_today,
      autoCombatLastReset: character.auto_combat_last_reset,
    };

    return { success: true, data: player };
  } catch (error: any) {
    console.error('Error loading player data:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// AUTO-SAVE FUNCTIONALITY
// ============================================

let autoSaveTimer: ReturnType<typeof setInterval> | null = null;
let lastSaveTime = 0;
const AUTOSAVE_INTERVAL = 60000; // 60 seconds
const MIN_SAVE_INTERVAL = 5000; // 5 seconds minimum between saves

/**
 * Start auto-save timer
 */
export function startAutoSave(
  getPlayer: () => Player,
  getSlotIndex: () => number,
  getCharacterId: () => string | undefined
): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }

  autoSaveTimer = setInterval(async () => {
    const now = Date.now();
    if (now - lastSaveTime < MIN_SAVE_INTERVAL) return;

    const player = getPlayer();
    const slotIndex = getSlotIndex();
    const characterId = getCharacterId();

    if (player && player.characterCreated) {
      const result = await savePlayerData(player, slotIndex, characterId);
      if (result.success) {
        lastSaveTime = now;
        console.log('[AutoSave] Character saved successfully');
      } else {
        console.error('[AutoSave] Failed:', result.error);
      }
    }
  }, AUTOSAVE_INTERVAL);
}

/**
 * Stop auto-save timer
 */
export function stopAutoSave(): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
}

/**
 * Force an immediate save (debounced)
 */
export async function forceSave(
  player: Player,
  slotIndex: number,
  characterId?: string
): Promise<SaveResult> {
  const now = Date.now();
  if (now - lastSaveTime < MIN_SAVE_INTERVAL) {
    return { success: true }; // Skip, too soon
  }

  lastSaveTime = now;
  return await savePlayerData(player, slotIndex, characterId);
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate player data before sending to server
 * Returns cleaned/corrected data
 */
export function validatePlayerData(player: Player): Player {
  const validated = { ...player };

  // Ensure values are within bounds
  validated.hp = Math.max(0, Math.min(player.hp, player.maxHp));
  validated.qi = Math.max(0, Math.min(player.qi, player.maxQi));
  validated.exp = Math.max(0, player.exp);
  validated.level = Math.max(1, Math.min(100, player.level));
  validated.spiritStones = Math.max(0, player.spiritStones);
  validated.ap = Math.max(0, player.ap);

  // Validate base stats
  const maxStatPerLevel = 99;
  validated.baseStats = {
    str: Math.max(1, Math.min(maxStatPerLevel, player.baseStats.str)),
    dex: Math.max(1, Math.min(maxStatPerLevel, player.baseStats.dex)),
    con: Math.max(1, Math.min(maxStatPerLevel, player.baseStats.con)),
    spi: Math.max(1, Math.min(maxStatPerLevel, player.baseStats.spi)),
    wil: Math.max(1, Math.min(maxStatPerLevel, player.baseStats.wil)),
  };

  return validated;
}

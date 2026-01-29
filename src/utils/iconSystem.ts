// ============================================
// ICON SYSTEM - WuxiaMUD
// Centralized icon mapping for all game items
// ============================================

// Base paths for icons
const ICON_BASE = '/icons';
const ASSETS_BASE = '/assets/icons';

// ============================================
// ELEMENT ICONS
// ============================================
export const elementIcons: Record<string, string> = {
  fire: `${ASSETS_BASE}/elements/element_fire.png`,
  ice: `${ASSETS_BASE}/elements/element_ice.png`,
  lightning: `${ASSETS_BASE}/elements/element_lightning.png`,
  nature: `${ASSETS_BASE}/elements/element_nature.png`,
  poison: `${ASSETS_BASE}/elements/element_poison.png`,
  void: `${ASSETS_BASE}/elements/element_void.png`,
  // Aliases for compatibility
  wood: `${ASSETS_BASE}/elements/element_nature.png`,
  thunder: `${ASSETS_BASE}/elements/element_lightning.png`,
};

// ============================================
// ACTION ICONS
// ============================================
export const actionIcons: Record<string, string> = {
  block: `${ASSETS_BASE}/actions/action_block.png`,
  counter: `${ASSETS_BASE}/actions/action_counter.png`,
  dodge: `${ASSETS_BASE}/actions/action_dodge.png`,
  parry: `${ASSETS_BASE}/actions/action_parry.png`,
};

// ============================================
// RESOURCE ICONS
// ============================================
export const resourceIcons: Record<string, string> = {
  exp: `${ASSETS_BASE}/resources/resource_exp.png`,
  hp: `${ASSETS_BASE}/resources/resource_hp.png`,
  qi: `${ASSETS_BASE}/resources/resource_qi.png`,
  spiritStone: `${ASSETS_BASE}/cultivation/spirit_stone_crystal.png`,
};

// ============================================
// STATUS EFFECT ICONS
// ============================================
export const statusIcons: Record<string, string> = {
  burning: `${ASSETS_BASE}/status/status_burning.png`,
  frozen: `${ASSETS_BASE}/status/status_frozen.png`,
  stunned: `${ASSETS_BASE}/status/status_stunned.png`,
  poisoned: `${ASSETS_BASE}/status/status_poisoned.png`,
  entangled: `${ASSETS_BASE}/status/status_entangled.png`,
  bleeding: `${ASSETS_BASE}/status/status_bleeding.png`,
  shielded: `${ASSETS_BASE}/status/status_shielded.png`,
  regenerating: `${ASSETS_BASE}/status/status_regenerating.png`,
  // Aliases for code compatibility
  burn: `${ASSETS_BASE}/status/status_burning.png`,
  freeze: `${ASSETS_BASE}/status/status_frozen.png`,
  stun: `${ASSETS_BASE}/status/status_stunned.png`,
  poison: `${ASSETS_BASE}/status/status_poisoned.png`,
  bleed: `${ASSETS_BASE}/status/status_bleeding.png`,
  shield: `${ASSETS_BASE}/status/status_shielded.png`,
  regen: `${ASSETS_BASE}/status/status_regenerating.png`,
  heal: `${ASSETS_BASE}/status/status_regenerating.png`,
};

// ============================================
// UI FRAME ICONS
// ============================================
export const uiFrameIcons = {
  skillButton: `${ASSETS_BASE}/ui/skill_button_frame.png`,
  hpBar: `${ASSETS_BASE}/ui/hp_bar_frame.png`,
  qiBar: `${ASSETS_BASE}/ui/qi_bar_frame.png`,
  inventorySlot: `${ASSETS_BASE}/ui/inventory_slot_frame.png`,
  portrait: `${ASSETS_BASE}/ui/character_portrait_frame.png`,
  dialogBox: `${ASSETS_BASE}/ui/dialog_box_frame.png`,
  tooltip: `${ASSETS_BASE}/ui/tooltip_frame.png`,
  hotbarSlot: `${ASSETS_BASE}/ui/skill_hotbar_slot.png`,
  panelHeader: `${ASSETS_BASE}/ui/panel_header_frame.png`,
  modalWindow: `${ASSETS_BASE}/ui/modal_window_frame.png`,
};

// ============================================
// QUEST ICONS
// ============================================
export const questIcons = {
  main: `${ASSETS_BASE}/quests/main_quest.png`,
  scroll: `${ASSETS_BASE}/quests/quest_scroll.png`,
  side: `${ASSETS_BASE}/quests/side_quest.png`,
  bounty: `${ASSETS_BASE}/quests/bounty.png`,
  achievement: `${ASSETS_BASE}/quests/achievement_star.png`,
};

// ============================================
// CULTIVATION ICONS
// ============================================
export const cultivationIcons = {
  meditation: `${ASSETS_BASE}/cultivation/medidation_lotus_pose.png`,
  qiEnergy: `${ASSETS_BASE}/cultivation/qi_energy_swirl.png`,
  yinYang: `${ASSETS_BASE}/cultivation/yin_yang_symbol.png`,
  bambooScroll: `${ASSETS_BASE}/cultivation/bamboo_scroll.png`,
  jadePendant: `${ASSETS_BASE}/cultivation/jade_pendant.png`,
  spiritStone: `${ASSETS_BASE}/cultivation/spirit_stone_crystal.png`,
  cauldron: `${ASSETS_BASE}/cultivation/cultivation_cauldron.png`,
  enlightenment: `${ASSETS_BASE}/cultivation/enlightment_halo.png`,
};

// ============================================
// WEAPON ICONS (12 total: 3 types × 4 tiers)
// ============================================
export const weaponIcons: Record<string, Record<number, string>> = {
  sword: {
    1: `${ICON_BASE}/weapons/wp_sword_t1.png`,
    2: `${ICON_BASE}/weapons/wp_sword_t2.png`,
    3: `${ICON_BASE}/weapons/wp_sword_t3.png`,
    4: `${ICON_BASE}/weapons/wp_sword_t4.png`,
  },
  saber: {
    1: `${ICON_BASE}/weapons/wp_saber_t1.png`,
    2: `${ICON_BASE}/weapons/wp_saber_t2.png`,
    3: `${ICON_BASE}/weapons/wp_saber_t3.png`,
    4: `${ICON_BASE}/weapons/wp_saber_t4.png`,
  },
  zither: {
    1: `${ICON_BASE}/weapons/wp_zither_t1.png`,
    2: `${ICON_BASE}/weapons/wp_zither_t2.png`,
    3: `${ICON_BASE}/weapons/wp_zither_t3.png`,
    4: `${ICON_BASE}/weapons/wp_zither_t4.png`,
  },
};

// ============================================
// ACCESSORY ICONS (8 total: 2 types × 4 tiers)
// ============================================
export const accessoryIcons: Record<string, Record<number, string>> = {
  ring: {
    1: `${ICON_BASE}/accessories/ac_ring_t1.png`,
    2: `${ICON_BASE}/accessories/ac_ring_t2.png`,
    3: `${ICON_BASE}/accessories/ac_ring_t3.png`,
    4: `${ICON_BASE}/accessories/ac_ring_t4.png`,
  },
  necklace: {
    1: `${ICON_BASE}/accessories/ac_necklace_t1.png`,
    2: `${ICON_BASE}/accessories/ac_necklace_t2.png`,
    3: `${ICON_BASE}/accessories/ac_necklace_t3.png`,
    4: `${ICON_BASE}/accessories/ac_necklace_t4.png`,
  },
};

// ============================================
// CONSUMABLE ICONS (4 total)
// ============================================
export const consumableIcons: Record<string, string> = {
  hp_pill: `${ICON_BASE}/consumables/cons_hp_pill.png`,
  qi_pill: `${ICON_BASE}/consumables/cons_qi_pill.png`,
  foundation_pill: `${ICON_BASE}/consumables/cons_foundation_pill.png`,
  golden_pill: `${ICON_BASE}/consumables/cons_golden_pill.png`,
  // ID-based mappings
  CONS_HP_001: `${ICON_BASE}/consumables/cons_hp_pill.png`,
  CONS_QI_001: `${ICON_BASE}/consumables/cons_qi_pill.png`,
};

// ============================================
// MATERIAL ICONS (13 total)
// Maps material IDs to icon paths
// ============================================
export const materialIcons: Record<string, string> = {
  // Tier 1
  MAT_T1_001: `${ICON_BASE}/materials/mat_ore_t1.png`,       // Spirit Iron Ore
  MAT_T1_002: `${ICON_BASE}/materials/mat_qi_t1.png`,        // Qi Fragment
  // Tier 2
  MAT_T2_001: `${ICON_BASE}/materials/mat_crystal_t2.png`,   // Azure Crystal
  MAT_T2_002: `${ICON_BASE}/materials/mat_stone_t2.png`,     // Foundation Stone
  // Tier 3
  MAT_T3_001: `${ICON_BASE}/materials/mat_thunder_t3.png`,   // Thunder Essence
  MAT_T3_002: `${ICON_BASE}/materials/mat_iron_t3.png`,      // Sky Iron Ingot
  // Tier 4
  MAT_T4_001: `${ICON_BASE}/materials/mat_core_t4.png`,      // Golden Core Fragment
  MAT_T4_002: `${ICON_BASE}/materials/mat_essence_t4.png`,   // Core Qi Essence
  // Special
  MAT_SP_001: `${ICON_BASE}/materials/mat_bloodsteel.png`,   // Bloodsteel
  MAT_SP_002: `${ICON_BASE}/materials/mat_jade_legendary.png`, // Immortal Jade
  // Class Tokens
  MAT_SP_003: `${ICON_BASE}/tokens/token_sword.png`,         // Sword Dao Token
  MAT_SP_004: `${ICON_BASE}/tokens/token_saber.png`,         // Saber Intent Fragment
  MAT_SP_005: `${ICON_BASE}/tokens/token_zither.png`,        // Harmonic Zither String
};

// ============================================
// MATERIAL ICON BY iconType (for dropSystem compatibility)
// ============================================
export const materialIconsByType: Record<string, string> = {
  material_ore: `${ICON_BASE}/materials/mat_ore_t1.png`,
  material_essence: `${ICON_BASE}/materials/mat_qi_t1.png`,
  material_crystal: `${ICON_BASE}/materials/mat_crystal_t2.png`,
  material_stone: `${ICON_BASE}/materials/mat_stone_t2.png`,
  material_core: `${ICON_BASE}/materials/mat_core_t4.png`,
  material_special: `${ICON_BASE}/materials/mat_bloodsteel.png`,
  material_jade: `${ICON_BASE}/materials/mat_jade_legendary.png`,
  token_sword: `${ICON_BASE}/tokens/token_sword.png`,
  token_saber: `${ICON_BASE}/tokens/token_saber.png`,
  token_zither: `${ICON_BASE}/tokens/token_zither.png`,
};

// ============================================
// JUNK/VENDOR ICONS (12 total)
// ============================================
export const junkIcons: Record<string, string> = {
  junk_rat_tail: `${ICON_BASE}/junk/junk_rat_tail.png`,
  junk_spider_silk: `${ICON_BASE}/junk/junk_spider_silk.png`,
  junk_poison_fang: `${ICON_BASE}/junk/junk_poison_fang.png`,
  junk_phoenix_feather: `${ICON_BASE}/junk/junk_phoenix_feather.png`,
  junk_dragon_scale: `${ICON_BASE}/junk/junk_dragon_scale.png`,
  junk_bone: `${ICON_BASE}/junk/junk_bone.png`,
  junk_cloth: `${ICON_BASE}/junk/junk_cloth.png`,
  junk_crystal: `${ICON_BASE}/junk/junk_crystal.png`,
  junk_coin: `${ICON_BASE}/junk/junk_coin.png`,
  junk_scroll: `${ICON_BASE}/junk/junk_scroll.png`,
  junk_demon_core: `${ICON_BASE}/junk/junk_demon_core.png`,
  currency_spirit_stone: `${ICON_BASE}/junk/currency_spirit_stone.png`,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get weapon type from item (sword, saber, or zither)
 */
export const getWeaponType = (item: any): 'sword' | 'saber' | 'zither' => {
  const name = item?.name?.toLowerCase() || '';
  const subtype = item?.subtype?.toLowerCase() || '';
  const classId = item?.classId;
  
  // Check by classId first (most reliable for gearItems)
  if (classId) {
    if (classId >= 1 && classId <= 4) return 'sword';
    if (classId >= 5 && classId <= 8) return 'saber';
    if (classId >= 9 && classId <= 12) return 'zither';
  }
  
  // Fallback to name/subtype
  if (subtype === 'sword' || name.includes('sword') || name.includes('blade')) return 'sword';
  if (subtype === 'saber' || name.includes('saber')) return 'saber';
  if (subtype === 'zither' || name.includes('zither') || name.includes('melody') || name.includes('instrument')) return 'zither';
  
  return 'sword'; // Default
};

/**
 * Get accessory type from item (ring or necklace)
 */
export const getAccessoryType = (item: any): 'ring' | 'necklace' => {
  const name = item?.name?.toLowerCase() || '';
  const type = item?.type?.toLowerCase() || '';
  const slot = item?.slot?.toLowerCase() || '';
  
  if (type === 'ring' || slot === 'ring' || name.includes('ring')) return 'ring';
  return 'necklace';
};

/**
 * Get icon path for any item in the game
 */
export const getItemIconPath = (item: any): string | null => {
  if (!item) return null;
  
  const type = item.type?.toLowerCase() || '';
  const tier = item.tier || 1;
  const iconType = item.iconType || '';
  
  // Weapon (from gearItems)
  if (type === 'weapon') {
    const weaponType = getWeaponType(item);
    return weaponIcons[weaponType]?.[tier] || weaponIcons.sword[1];
  }
  
  // Accessories
  if (type === 'ring' || type === 'necklace') {
    return accessoryIcons[type]?.[tier] || accessoryIcons.ring[1];
  }
  
  // Consumables
  if (type === 'consumable') {
    const id = String(item.id || '');
    const itemId = item.itemId || '';
    const name = String(item.name || '').toLowerCase();
    const iconType = item.iconType || '';
    
    // Direct ID match first
    if (consumableIcons[id]) return consumableIcons[id];
    if (consumableIcons[itemId]) return consumableIcons[itemId];
    
    // Check by iconType
    if (iconType === 'hp_pill') return consumableIcons.hp_pill;
    if (iconType === 'qi_pill') return consumableIcons.qi_pill;
    
    // Fallback to name check
    if (name.includes('hp') || name.includes('health')) return consumableIcons.hp_pill;
    if (name.includes('qi')) return consumableIcons.qi_pill;
    if (name.includes('foundation')) return consumableIcons.foundation_pill;
    if (name.includes('golden')) return consumableIcons.golden_pill;
    return consumableIcons.hp_pill;
  }
  
  // Spirit Stones (currency)
  if (item.id === 'spirit_stone' || iconType === 'currency_spirit_stone') {
    return junkIcons.currency_spirit_stone;
  }
  
  // Materials (by ID first)
  if (item.id && materialIcons[item.id]) {
    return materialIcons[item.id];
  }
  
  // Materials (by iconType - for materials from dropSystem)
  if (iconType && materialIconsByType[iconType]) {
    return materialIconsByType[iconType];
  }
  
  // Junk/Vendor items (by iconType)
  if (iconType && junkIcons[iconType]) {
    return junkIcons[iconType];
  }
  
  return null;
};

/**
 * Get large preview icon for Forge (128x128)
 * For now uses same path - can add /preview/ subfolder later
 */
export const getWeaponPreviewPath = (weaponType: 'sword' | 'saber' | 'zither', tier: number): string => {
  // If you create a preview folder with 128x128 images, change to:
  // return `${ICON_BASE}/weapons/preview/wp_${weaponType}_t${tier}.png`;
  return weaponIcons[weaponType]?.[tier] || weaponIcons.sword[1];
};

// ============================================
// ITEM COUNT SUMMARY
// ============================================
export const ITEM_COUNTS = {
  weapons: 12,      // 3 types × 4 tiers (visual icons, not 48 items)
  accessories: 8,   // 2 types × 4 tiers
  consumables: 4,   // HP, QI, Foundation, Golden pills
  materials: 10,    // 8 tier mats + 2 special (Bloodsteel, Immortal Jade)
  tokens: 3,        // Sword, Saber, Zither tokens
  junk: 12,         // 12 iconTypes for 40 junk items
  TOTAL: 49,        // Total unique icons needed
};

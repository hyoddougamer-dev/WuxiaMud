// ============================================
// COMBAT ASSETS - Visual Combat System
// Maps game entities to their sprite images
// ============================================

// ============================================
// PLAYER CLASS SPRITES
// ============================================
export const classSprites: Record<number, string> = {
  1: '/assets/combat/characters/player/class_1_blazing_sword.png',
  2: '/assets/combat/characters/player/class_2_glacial_shadow.png',
  3: '/assets/combat/characters/player/class_3_spellfire_duelist.png',
  4: '/assets/combat/characters/player/class_4_toxic_viper.png',
  5: '/assets/combat/characters/player/class_5_asura_of_war.png',
  6: '/assets/combat/characters/player/class_6_frozen_steel_guard.png',
  7: '/assets/combat/characters/player/class_7_verdant_blade_monarch.png',
  8: '/assets/combat/characters/player/class_8_wilderness_stalker.png',
  9: '/assets/combat/characters/player/class_9_phoenix_cry.png',
  10: '/assets/combat/characters/player/class_10_divine_melody.png',
  11: '/assets/combat/characters/player/class_11_phantom_musician.png',
  12: '/assets/combat/characters/player/class_12_unbreakable_sage.png',
};

// ============================================
// MONSTER SPRITES
// Maps mob ID to sprite path
// ============================================
export const mobSprites: Record<number, string> = {
  // Qi Condensation (Level 1-9)
  1: '/assets/combat/characters/enemies/mob_spirit_rat.png',
  2: '/assets/combat/characters/enemies/mob_garden_spider.png',
  3: '/assets/combat/characters/enemies/mob_sect_servant.png',
  4: '/assets/combat/characters/enemies/mob_training_dummy.png',
  5: '/assets/combat/characters/enemies/mob_pestilent_worm.png',
  6: '/assets/combat/characters/enemies/mob_herb_spirit.png',
  7: '/assets/combat/characters/enemies/mob_novice_cultivator.png',
  8: '/assets/combat/characters/enemies/mob_meditation_monk.png',
  9: '/assets/combat/characters/enemies/mob_sect_guard.png',
  10: '/assets/combat/characters/enemies/mob_junior_disciple.png',
  11: '/assets/combat/characters/enemies/mob_bandit_thug.png',
  12: '/assets/combat/characters/enemies/mob_bandit_archer.png',
  13: '/assets/combat/characters/enemies/mob_mountain_ape.png',
  14: '/assets/combat/characters/enemies/mob_poison_spider.png',
  15: '/assets/combat/characters/enemies/mob_rock_serpent.png',
  16: '/assets/combat/characters/enemies/mob_bandit_captain.png',
  17: '/assets/combat/characters/enemies/mob_corrupted_disciple.png',
  18: '/assets/combat/characters/enemies/mob_crystal_golem.png',
  19: '/assets/combat/characters/enemies/mob_forest_guardian.png',
  20: '/assets/combat/characters/enemies/mob_frost_wolf.png',
  
  // Foundation Establishment (Level 10-19)
  21: '/assets/combat/characters/enemies/mob_ghost_cultivator.png',
  22: '/assets/combat/characters/enemies/mob_corrupted_monk.png',
  23: '/assets/combat/characters/enemies/mob_iron_claw_chief.png',
  24: '/assets/combat/characters/enemies/mob_shadow_assassin.png',
  25: '/assets/combat/characters/enemies/mob_stone_guardian.png',
  26: '/assets/combat/characters/enemies/mob_abyssal_serpent.png',
  27: '/assets/combat/characters/enemies/mob_ancient_lich.png',
  28: '/assets/combat/characters/enemies/mob_celestial_phoenix.png',
  29: '/assets/combat/characters/enemies/mob_corrupted_elder_tree.png',
  30: '/assets/combat/characters/enemies/mob_cursed_jade_guardian.png',
  31: '/assets/combat/characters/enemies/mob_flame_demon.png',
  32: '/assets/combat/characters/enemies/mob_ice_queen.png',
  33: '/assets/combat/characters/enemies/mob_lightning_elemental.png',
  34: '/assets/combat/characters/enemies/mob_divine_beast.png',
  35: '/assets/combat/characters/enemies/mob_shadow_lord.png',
  36: '/assets/combat/characters/enemies/mob_soul_reaver.png',
  
  // Golden Core (Level 20+)
  37: '/assets/combat/characters/enemies/mob_void_beast.png',
  38: '/assets/combat/characters/enemies/mob_stone_colossus.png',
  39: '/assets/combat/characters/enemies/mob_thunder_dragon_whelp.png',
  40: '/assets/combat/characters/enemies/mob_infernal_phoenix.png',
  41: '/assets/combat/characters/enemies/mob_eternal_guardian.png',
  42: '/assets/combat/characters/enemies/mob_void_sovereign.png',
  43: '/assets/combat/characters/enemies/mob_three_headed_dragon.png',
  44: '/assets/combat/characters/enemies/mob_undead_emperor.png',
};

// ============================================
// BACKGROUND IMAGES
// Maps zone coordinates to background
// ============================================
export const zoneBackgrounds: Record<string, string> = {
  // Safe Zones
  '0,0': '/assets/combat/backgrounds/bg_azure_cloud_main_hall.jpg',
  '0,1': '/assets/combat/backgrounds/bg_spirit_herb_garden.jpg',
  '1,0': '/assets/combat/backgrounds/bg_martial_training_grounds.jpg',
  '-1,0': '/assets/combat/backgrounds/bg_alchemy_pavilion.jpg',
  '0,-1': '/assets/combat/backgrounds/bg_outer_disciple_quarters.jpg',
  
  // Transition Zones
  '0,2': '/assets/combat/backgrounds/bg_north_gate.jpg',
  '0,-2': '/assets/combat/backgrounds/bg_south_gate.jpg',
  '-2,0': '/assets/combat/backgrounds/bg_west_ruins.jpg',
  '2,0': '/assets/combat/backgrounds/bg_bamboo_forest.jpg',
  
  // Combat Zones
  '0,3': '/assets/combat/backgrounds/bg_rocky_path.jpg',
  '-1,3': '/assets/combat/backgrounds/bg_iron_claw_bandit_camp.jpg',
  '0,4': '/assets/combat/backgrounds/bg_abandoned_spirit_mine.jpg',
  '0,5': '/assets/combat/backgrounds/bg_thunder_peak_base.jpg',
  '0,6': '/assets/combat/backgrounds/bg_thunder_peak_summit.jpg',
  '0,-3': '/assets/combat/backgrounds/bg_misty_poison_swamp.jpg',
  '0,-4': '/assets/combat/backgrounds/bg_blackwater_lake.jpg',
  '-1,-4': '/assets/combat/backgrounds/bg_hermits_hut.jpg',
  '-3,0': '/assets/combat/backgrounds/bg_haunted_graveyard.jpg',
  '-4,0': '/assets/combat/backgrounds/bg_ancient_tomb_entrance.jpg',
  '-4,1': '/assets/combat/backgrounds/bg_inner_tomb_chambers.jpg',
  '-5,0': '/assets/combat/backgrounds/bg_tomb_inner_sanctum.jpg',
  '3,0': '/assets/combat/backgrounds/bg_spirit_beast_den.jpg',
  '4,0': '/assets/combat/backgrounds/bg_elders_peak.jpg',
};

// Default background for zones without specific art
export const defaultBackground = '/assets/combat/backgrounds/bg_bamboo_forest.jpg';

// Get background for a zone
export function getZoneBackground(zoneKey: string): string {
  return zoneBackgrounds[zoneKey] || defaultBackground;
}

// Get player sprite for class
export function getPlayerSprite(classId: number): string {
  return classSprites[classId] || classSprites[1];
}

// Get mob sprite
export function getMobSprite(mobId: number): string {
  return mobSprites[mobId] || mobSprites[1];
}

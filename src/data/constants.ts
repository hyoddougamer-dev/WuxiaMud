// Game Data & Constants
// Zone Images - Use local combat backgrounds for consistency
export const zoneImages = {
    sectHall: "/assets/combat/backgrounds/bg_azure_cloud_main_hall.jpg",
    herbGarden: "/assets/combat/backgrounds/bg_spirit_herb_garden.jpg",
    training: "/assets/combat/backgrounds/bg_martial_training_grounds.jpg",
    alchemy: "/assets/combat/backgrounds/bg_alchemy_pavilion.jpg",
    quarters: "/assets/combat/backgrounds/bg_outer_disciple_quarters.jpg",
    northGate: "/assets/combat/backgrounds/bg_north_gate.jpg",
    rocky: "/assets/combat/backgrounds/bg_rocky_path.jpg",
    bandit: "/assets/combat/backgrounds/bg_iron_claw_bandit_camp.jpg",
    mine: "/assets/combat/backgrounds/bg_abandoned_spirit_mine.jpg",
    thunderBase: "/assets/combat/backgrounds/bg_thunder_peak_base.jpg",
    thunderSummit: "/assets/combat/backgrounds/bg_thunder_peak_summit.jpg",
    southGate: "/assets/combat/backgrounds/bg_south_gate.jpg",
    swamp: "/assets/combat/backgrounds/bg_misty_poison_swamp.jpg",
    blackwater: "/assets/combat/backgrounds/bg_blackwater_lake.jpg",
    hut: "/assets/combat/backgrounds/bg_hermits_hut.jpg",
    westRuins: "/assets/combat/backgrounds/bg_west_ruins.jpg",
    graveyard: "/assets/combat/backgrounds/bg_haunted_graveyard.jpg",
    tombEntrance: "/assets/combat/backgrounds/bg_ancient_tomb_entrance.jpg",
    tombInner: "/assets/combat/backgrounds/bg_inner_tomb_chambers.jpg",
    bamboo: "/assets/combat/backgrounds/bg_bamboo_forest.jpg",
    beastDen: "/assets/combat/backgrounds/bg_spirit_beast_den.jpg",
    elder: "/assets/combat/backgrounds/bg_elders_peak.jpg",
    paperMap: "/assets/world_map.png"
};

export const mobImages = {
    "Garden Spider": "https://files.fm/thumb.php?i=mrfpgcrsux&v=0",
    "Herb Spirit": "https://files.fm/thumb.php?i=43j69bnpca&v=0",
    "Junior Disciple": "https://files.fm/thumb.php?i=y8r7x2t5na&v=0",
    "Meditation Monk": "https://files.fm/thumb.php?i=m2kam7w4ms&v=0",
    "Novice Cultivator": "https://files.fm/thumb.php?i=a944p5ty7p&v=0",
    "Pestilent Worm": "https://files.fm/thumb.php?i=38ct4pfcmq&v=0",
    "Sect Guard": "https://files.fm/thumb.php?i=3a6edhqppk&v=0",
    "Sect Servant": "https://files.fm/thumb.php?i=q27rpquayu&v=0",
    "Spirit Rat": "https://files.fm/thumb.php?i=dcndspevwx&v=0",
    "Training Dummy": "https://files.fm/thumb.php?i=2jpfw7waf5&v=0",
    "Bandit Archer": "https://files.fm/thumb.php?i=4nqpb5b6x8&v=0",
    "Bandit Captain": "https://files.fm/thumb.php?i=d3trc2hjhd&v=0",
    "Bandit Thug": "https://files.fm/thumb.php?i=fckvxcz6dp&v=0",
    "Corrupted Disciple": "https://files.fm/thumb.php?i=d6ztdq55vp&v=0",
    "Corrupted Monk": "https://files.fm/thumb.php?i=jj4hcbd75f&v=0",
    "Crystal Golem": "https://files.fm/thumb.php?i=kcbdxrjeq2&v=0",
    "Forest Guardian": "https://files.fm/thumb.php?i=babzuq5rem&v=0",
    "Frost Wolf": "https://files.fm/thumb.php?i=xgkfku42js&v=0",
    "Ghost Cultivator": "https://files.fm/thumb.php?i=n9kwsvf4xg&v=0",
    "Iron Claw Chief": "https://files.fm/thumb.php?i=f6nd7p662g&v=0",
    "Mountain Ape": "https://files.fm/thumb.php?i=7beez9zf77&v=0",
    "Poison Spider": "https://files.fm/thumb.php?i=h7rjzrg9dc&v=0",
    "Rock Serpent": "https://files.fm/thumb.php?i=tp4e27gau7&v=0",
    "Shadow Assassin": "https://files.fm/thumb.php?i=hgqvkcn2fw&v=0",
    "Stone Guardian": "https://files.fm/thumb.php?i=8k5ghke73f&v=0",
    "Abyssal Serpent": "https://files.fm/thumb.php?i=tp4e27gau7&v=0",
    "Ancient Lich": "https://files.fm/thumb.php?i=3h7b3xmxs3&v=0",
    "Celestial Phoenix": "https://files.fm/thumb.php?i=59xwg66c2n&v=0",
    "Corrupted Elder Tree": "https://files.fm/thumb.php?i=7cqeak3cjv&v=0",
    "Cursed Jade Guardian": "https://files.fm/thumb.php?i=zt2qdr32pb&v=0",
    "Divine Beast": "https://files.fm/thumb.php?i=cbm66crzsr&v=0",
    "Flame Demon": "https://files.fm/thumb.php?i=hpjfzynb6s&v=0",
    "Infernal Phoenix": "https://files.fm/thumb.php?i=59xwg66c2n&v=0",
    "Ice Queen": "https://files.fm/thumb.php?i=ggqreuz84e&v=0",
    "Lightning Elemental": "https://files.fm/thumb.php?i=xwrf2eu62g&v=0",
    "Shadow Lord": "https://files.fm/thumb.php?i=dyktd66nb7&v=0",
    "Soul Reaver": "https://files.fm/thumb.php?i=9k6fa2dpme&v=0",
    "Stone Colossus": "https://files.fm/thumb.php?i=nuvg5q83qx&v=0",
    "Three-Headed Thunder Dragon": "https://files.fm/thumb.php?i=yjws533zat&v=0",
    "Thunder Dragon Whelp": "https://files.fm/thumb.php?i=7ttgrgzhae&v=0",
    "Undead Emperor": "https://files.fm/thumb.php?i=699z7veu5e&v=0",
    "Void Beast": "https://files.fm/thumb.php?i=p8x4kcu3gn&v=0",
    "Void Sovereign": "https://files.fm/thumb.php?i=p8x4kcu3gn&v=0"
};

export const classDefinitions = [
    // SWORD CLASSES (4)
    { id: 1, name: "Blazing Sword Immortal", wpn: "Sword", stat1: "dex", stat2: "spi", element: "Fire", desc: "Speed and Fire Damage." },
    { id: 2, name: "Glacial Shadow", wpn: "Sword", stat1: "dex", stat2: "str", element: "Ice", desc: "Evasion and Crit Control." },
    { id: 3, name: "Spellfire Duelist", wpn: "Sword", stat1: "spi", stat2: "dex", element: "Fire", desc: "Hybrid Magic Sword." },
    { id: 4, name: "Toxic Viper", wpn: "Sword", stat1: "dex", stat2: "wil", element: "Wood", desc: "DoT and Mobility." },
    // SABER CLASSES (4)
    { id: 5, name: "Asura of War", wpn: "Saber", stat1: "str", stat2: "con", element: "Fire", desc: "High Damage at Low HP." },
    { id: 6, name: "Frozen Steel Guard", wpn: "Saber", stat1: "con", stat2: "str", element: "Ice", desc: "Tank with Crowd Control." },
    { id: 7, name: "Verdant Blade Monarch", wpn: "Saber", stat1: "str", stat2: "spi", element: "Wood", desc: "Lifesteal and Sustain." },
    { id: 8, name: "Wilderness Stalker", wpn: "Saber", stat1: "str", stat2: "dex", element: "Wood", desc: "Speed and Tracking." },
    // ZITHER CLASSES (4)
    { id: 9, name: "Phoenix Cry Cultivator", wpn: "Zither", stat1: "spi", stat2: "wil", element: "Fire", desc: "AoE Fire and Qi Control." },
    { id: 10, name: "Divine Melody Healer", wpn: "Zither", stat1: "spi", stat2: "wil", element: "Lightning", desc: "Group Healing and Support." },
    { id: 11, name: "Phantom Musician", wpn: "Zither", stat1: "spi", stat2: "dex", element: "Void", desc: "Evasion and Control." },
    { id: 12, name: "Unbreakable Spirit Sage", wpn: "Zither", stat1: "con", stat2: "wil", element: "Void", desc: "Tank Caster." },
];

export const itemDatabase = [
    // CONSUMABLES (these are the only items used - weapons come from gearItems.ts, accessories from accessoryItems.ts)
    { id: "CONS_HP_001", name: "HP Restoring Pill", type: "consumable", tier: 1, stats: {}, desc: "Restores 50 HP instantly.", rarity: "Common", effect: "hp", amount: 50, iconType: 'hp_pill' },
    { id: "CONS_QI_001", name: "QI Restoring Pill", type: "consumable", tier: 1, stats: {}, desc: "Restores 30 QI instantly.", rarity: "Common", effect: "qi", amount: 30, iconType: 'qi_pill' },
    // NOTE: Weapons are in gearItems.ts, Rings and Necklaces are in accessoryItems.ts
];

// Element types for mobs based on their nature/theme
export type MobElement = 'Fire' | 'Ice' | 'Lightning' | 'Wood' | 'Void' | 'None';

export const mobDefinitions = [
    // ============================================
    // QI CONDENSATION REALM (Levels 1-9)
    // Low HP/Atk, meant for early players
    // ============================================
    
    // Lvl 1-3: Starter Mobs (HP: 100-350)
    { id: 1, name: "Spirit Rat", level: 1, quality: "Normal", hp: 100, atk: 6, def: 5, exp: 15, stones: 8, drop: "Rat Tail", element: "None" as MobElement },
    { id: 2, name: "Garden Spider", level: 1, quality: "Normal", hp: 110, atk: 7, def: 4, exp: 12, stones: 7, drop: "Spider Silk", element: "Wood" as MobElement },
    { id: 3, name: "Sect Servant", level: 2, quality: "Normal", hp: 140, atk: 10, def: 7, exp: 25, stones: 12, drop: "Broom", element: "None" as MobElement },
    { id: 4, name: "Training Dummy", level: 2, quality: "Normal", hp: 160, atk: 4, def: 8, exp: 15, stones: 10, drop: "Wood Scraps", element: "None" as MobElement },
    { id: 5, name: "Pestilent Worm", level: 2, quality: "Normal", hp: 170, atk: 11, def: 9, exp: 30, stones: 15, drop: "Poison Sac", element: "Wood" as MobElement },
    { id: 6, name: "Herb Spirit", level: 3, quality: "Normal", hp: 220, atk: 13, def: 10, exp: 40, stones: 20, drop: "Spirit Essence", element: "Wood" as MobElement },
    
    // Lvl 4-6: Early Students (HP: 250-480)
    { id: 7, name: "Novice Cultivator", level: 4, quality: "Normal", hp: 260, atk: 15, def: 11, exp: 50, stones: 24, drop: "Cultivation Manual", element: "None" as MobElement },
    { id: 8, name: "Meditation Monk", level: 4, quality: "Normal", hp: 280, atk: 14, def: 12, exp: 48, stones: 22, drop: "Meditation Stone", element: "None" as MobElement },
    { id: 9, name: "Sect Guard", level: 5, quality: "Normal", hp: 340, atk: 18, def: 14, exp: 70, stones: 32, drop: "Guard Badge", element: "None" as MobElement },
    { id: 10, name: "Junior Disciple", level: 5, quality: "Trainee", hp: 380, atk: 21, def: 15, exp: 75, stones: 35, drop: "Disciple Token", element: "None" as MobElement },
    
    // Lvl 6-8: Bandits & Nature (HP: 420-700)
    { id: 11, name: "Bandit Thug", level: 6, quality: "Normal", hp: 420, atk: 24, def: 16, exp: 90, stones: 40, drop: "Stolen Purse", element: "None" as MobElement },
    { id: 12, name: "Bandit Archer", level: 6, quality: "Trainee", hp: 450, atk: 28, def: 13, exp: 95, stones: 42, drop: "Arrowhead", element: "None" as MobElement },
    { id: 13, name: "Mountain Ape", level: 6, quality: "Normal", hp: 480, atk: 26, def: 15, exp: 88, stones: 38, drop: "Ape Hide", element: "None" as MobElement },
    { id: 14, name: "Poison Spider", level: 7, quality: "Normal", hp: 520, atk: 30, def: 17, exp: 110, stones: 48, drop: "Poison Fang", element: "Wood" as MobElement },
    { id: 15, name: "Rock Serpent", level: 7, quality: "Normal", hp: 540, atk: 29, def: 18, exp: 115, stones: 50, drop: "Serpent Scale", element: "None" as MobElement },
    { id: 16, name: "Bandit Captain", level: 7, quality: "Trainee", hp: 580, atk: 34, def: 19, exp: 120, stones: 55, drop: "Captain's Insignia", element: "None" as MobElement },
    { id: 17, name: "Corrupted Disciple", level: 8, quality: "Trainee", hp: 640, atk: 36, def: 20, exp: 130, stones: 58, drop: "Corrupted Essence", element: "Void" as MobElement },
    { id: 18, name: "Crystal Golem", level: 8, quality: "Elite", hp: 700, atk: 32, def: 28, exp: 150, stones: 68, drop: "Crystal Shard", element: "Ice" as MobElement },
    
    // Lvl 9: Peak of Qi Condensation (HP: 750-850)
    { id: 19, name: "Forest Guardian", level: 9, quality: "Elite", hp: 800, atk: 40, def: 30, exp: 180, stones: 82, drop: "Guardian Core", element: "Wood" as MobElement },
    { id: 20, name: "Frost Wolf", level: 9, quality: "Elite", hp: 750, atk: 42, def: 26, exp: 170, stones: 78, drop: "Frost Fang", element: "Ice" as MobElement },
    
    // ============================================
    // FOUNDATION ESTABLISHMENT REALM (Levels 10-19)
    // Medium-High HP/Atk, for experienced players
    // ============================================
    
    // Lvl 10-12: Early Foundation (HP: 900-1200)
    { id: 21, name: "Ghost Cultivator", level: 10, quality: "Elite", hp: 900, atk: 48, def: 32, exp: 200, stones: 95, drop: "Spirit Essence", element: "Void" as MobElement },
    { id: 22, name: "Corrupted Monk", level: 10, quality: "Elite", hp: 950, atk: 50, def: 31, exp: 210, stones: 98, drop: "Dark Scepter", element: "Void" as MobElement },
    { id: 23, name: "Iron Claw Chief", level: 11, quality: "Elite", hp: 1050, atk: 55, def: 35, exp: 240, stones: 110, drop: "Iron Claw", element: "None" as MobElement },
    { id: 24, name: "Shadow Assassin", level: 11, quality: "Elite", hp: 900, atk: 60, def: 28, exp: 250, stones: 115, drop: "Shadow Dagger", element: "Void" as MobElement },
    { id: 25, name: "Stone Guardian", level: 12, quality: "Elite", hp: 1150, atk: 50, def: 45, exp: 270, stones: 125, drop: "Stone Heart", element: "None" as MobElement },
    { id: 26, name: "Abyssal Serpent", level: 12, quality: "Elite", hp: 1200, atk: 62, def: 36, exp: 280, stones: 130, drop: "Abyssal Venom", element: "Void" as MobElement },
    
    // Lvl 13-15: Mid Foundation (HP: 1250-1550)
    { id: 27, name: "Ancient Lich", level: 13, quality: "Epic", hp: 1300, atk: 68, def: 40, exp: 310, stones: 145, drop: "Lich Crown", element: "Void" as MobElement },
    { id: 28, name: "Celestial Phoenix", level: 14, quality: "Epic", hp: 1450, atk: 72, def: 42, exp: 350, stones: 165, drop: "Phoenix Feather", element: "Fire" as MobElement },
    { id: 29, name: "Corrupted Elder Tree", level: 14, quality: "Elite", hp: 1380, atk: 60, def: 44, exp: 330, stones: 155, drop: "Elder Bark", element: "Wood" as MobElement },
    { id: 30, name: "Cursed Jade Guardian", level: 15, quality: "Epic", hp: 1520, atk: 70, def: 48, exp: 380, stones: 180, drop: "Jade Stone", element: "None" as MobElement },
    
    // Lvl 16-18: High Foundation (HP: 1600-1850)
    { id: 31, name: "Flame Demon", level: 16, quality: "Epic", hp: 1600, atk: 75, def: 44, exp: 410, stones: 195, drop: "Flame Core", element: "Fire" as MobElement },
    { id: 32, name: "Ice Queen", level: 16, quality: "Epic", hp: 1650, atk: 72, def: 46, exp: 420, stones: 200, drop: "Ice Scepter", element: "Ice" as MobElement },
    { id: 33, name: "Lightning Elemental", level: 17, quality: "Epic", hp: 1700, atk: 78, def: 42, exp: 440, stones: 210, drop: "Thunder Core", element: "Lightning" as MobElement },
    { id: 34, name: "Divine Beast", level: 18, quality: "Epic", hp: 1850, atk: 82, def: 48, exp: 470, stones: 225, drop: "Divine Horn", element: "None" as MobElement },
    
    // Lvl 19: Peak of Foundation (HP: 1900-2000)
    { id: 35, name: "Shadow Lord", level: 19, quality: "Epic", hp: 1950, atk: 88, def: 50, exp: 500, stones: 240, drop: "Shadow Essence", element: "Void" as MobElement },
    { id: 36, name: "Soul Reaver", level: 19, quality: "Epic", hp: 2000, atk: 90, def: 48, exp: 510, stones: 245, drop: "Soul Fragment", element: "Void" as MobElement },
    
    // ============================================
    // GOLDEN CORE REALM (Levels 20-29)
    // Very High HP/Atk, endgame content
    // ============================================
    
    // Lvl 20-22: Early Golden Core (HP: 2100-2400)
    { id: 37, name: "Void Beast", level: 20, quality: "Legendary", hp: 2150, atk: 95, def: 52, exp: 550, stones: 260, drop: "Void Matter", element: "Void" as MobElement },
    { id: 38, name: "Stone Colossus", level: 21, quality: "Legendary", hp: 2350, atk: 92, def: 62, exp: 600, stones: 285, drop: "Granite Heart", element: "None" as MobElement },
    { id: 39, name: "Thunder Dragon Whelp", level: 22, quality: "Epic", hp: 2400, atk: 105, def: 50, exp: 650, stones: 310, drop: "Dragon Scale", element: "Lightning" as MobElement },
    
    // Lvl 23-26: Mid Golden Core (HP: 2450-2750)
    { id: 40, name: "Infernal Phoenix", level: 23, quality: "Legendary", hp: 2500, atk: 110, def: 54, exp: 700, stones: 335, drop: "Phoenix Heart", element: "Fire" as MobElement },
    { id: 41, name: "Eternal Guardian", level: 24, quality: "Legendary", hp: 2600, atk: 108, def: 60, exp: 750, stones: 360, drop: "Guardian Heart", element: "None" as MobElement },
    
    // These remaining slots are filled with duplicates/variants for now
    // In full implementation would have more unique legendaries
    { id: 42, name: "Void Sovereign", level: 25, quality: "Legendary", hp: 2700, atk: 115, def: 56, exp: 800, stones: 380, drop: "Void Crown", element: "Void" as MobElement },
    { id: 43, name: "Three-Headed Thunder Dragon", level: 26, quality: "Legendary", hp: 2850, atk: 130, def: 58, exp: 900, stones: 430, drop: "Dragon Heart", element: "Lightning" as MobElement },
    { id: 44, name: "Undead Emperor", level: 28, quality: "Legendary", hp: 3100, atk: 135, def: 64, exp: 1000, stones: 480, drop: "Emperor's Crown", element: "Void" as MobElement }
];

export const levelingTable = [
    { lvl: 1, req: 2200, realm: "Qi Condensation", layer: "Stage 1", apPerLevel: 4 },
    { lvl: 2, req: 5640, realm: "Qi Condensation", layer: "Stage 2", apPerLevel: 4 },
    { lvl: 3, req: 9960, realm: "Qi Condensation", layer: "Stage 3", apPerLevel: 4 },
    { lvl: 4, req: 15030, realm: "Qi Condensation", layer: "Stage 4", apPerLevel: 4 },
    { lvl: 5, req: 20760, realm: "Qi Condensation", layer: "Stage 5", apPerLevel: 4 },
    { lvl: 6, req: 27100, realm: "Qi Condensation", layer: "Stage 6", apPerLevel: 4 },
    { lvl: 7, req: 34000, realm: "Qi Condensation", layer: "Stage 7", apPerLevel: 4 },
    { lvl: 8, req: 41430, realm: "Qi Condensation", layer: "Stage 8", apPerLevel: 4 },
    { lvl: 9, req: 55000, realm: "Qi Condensation", layer: "Stage 9", apPerLevel: 4, breakthrough: "Foundation Pill" },
    { lvl: 10, req: 75000, realm: "Foundation Est.", layer: "Early", apPerLevel: 6 },
    { lvl: 11, req: 100000, realm: "Foundation Est.", layer: "Early", apPerLevel: 6 },
    { lvl: 12, req: 130000, realm: "Foundation Est.", layer: "Mid", apPerLevel: 6 },
    { lvl: 13, req: 165000, realm: "Foundation Est.", layer: "Mid", apPerLevel: 6 },
    { lvl: 14, req: 205000, realm: "Foundation Est.", layer: "Mid", apPerLevel: 6 },
    { lvl: 15, req: 250000, realm: "Foundation Est.", layer: "Late", apPerLevel: 6 },
    { lvl: 16, req: 300000, realm: "Foundation Est.", layer: "Late", apPerLevel: 6 },
    { lvl: 17, req: 360000, realm: "Foundation Est.", layer: "Late", apPerLevel: 6 },
    { lvl: 18, req: 430000, realm: "Foundation Est.", layer: "Late", apPerLevel: 6 },
    { lvl: 19, req: 520000, realm: "Foundation Est.", layer: "Peak", apPerLevel: 6, breakthrough: "Golden Pill" },
    { lvl: 20, req: 650000, realm: "Golden Core", layer: "Early", apPerLevel: 8 },
    { lvl: 21, req: 800000, realm: "Golden Core", layer: "Early", apPerLevel: 8 },
    { lvl: 22, req: 980000, realm: "Golden Core", layer: "Mid", apPerLevel: 8 },
    { lvl: 23, req: 1200000, realm: "Golden Core", layer: "Mid", apPerLevel: 8 },
    { lvl: 24, req: 1450000, realm: "Golden Core", layer: "Mid", apPerLevel: 8 },
    { lvl: 25, req: 1750000, realm: "Golden Core", layer: "Late", apPerLevel: 8 },
    { lvl: 26, req: 2100000, realm: "Golden Core", layer: "Late", apPerLevel: 8 },
    { lvl: 27, req: 2500000, realm: "Golden Core", layer: "Late", apPerLevel: 8 },
    { lvl: 28, req: 3000000, realm: "Golden Core", layer: "Peak", apPerLevel: 8 },
    { lvl: 29, req: 3600000, realm: "Golden Core", layer: "Peak", apPerLevel: 8 }
];

export const avatarList = [
    // Male Avatars (10)
    "/assets/avatars/male/avatar_male_001.png",
    "/assets/avatars/male/avatar_male_002.png",
    "/assets/avatars/male/avatar_male_003.png",
    "/assets/avatars/male/avatar_male_004.png",
    "/assets/avatars/male/avatar_male_005.png",
    "/assets/avatars/male/avatar_male_006.png",
    "/assets/avatars/male/avatar_male_007.png",
    "/assets/avatars/male/avatar_male_008.png",
    "/assets/avatars/male/avatar_male_009.png",
    "/assets/avatars/male/avatar_male_010.png",
    // Female Avatars (10)
    "/assets/avatars/female/avatar_female_001.png",
    "/assets/avatars/female/avatar_female_002.png",
    "/assets/avatars/female/avatar_female_003.png",
    "/assets/avatars/female/avatar_female_004.png",
    "/assets/avatars/female/avatar_female_005.png",
    "/assets/avatars/female/avatar_female_006.png",
    "/assets/avatars/female/avatar_female_007.png",
    "/assets/avatars/female/avatar_female_008.png",
    "/assets/avatars/female/avatar_female_009.png",
    "/assets/avatars/female/avatar_female_010.png",
];

export const worldMap = {
    // ============================================
    // AZURE CLOUD SECT (Safe Zone - No Combat)
    // The player's home sect, peaceful cultivation grounds
    // ============================================
    "0,0": { name: "Azure Cloud Main Hall", tier: 1, quality: 0, desc: "The heart of the Azure Cloud Sect. Elders meditate on the jade platform.", img: zoneImages.sectHall, exits: ['n', 's', 'e', 'w'], safeZone: true },
    "0,1": { name: "Spirit Herb Garden", tier: 1, quality: 0, desc: "Disciples tend to precious medicinal herbs under Elder Wang's guidance.", img: zoneImages.herbGarden, exits: ['s', 'n'], safeZone: true },
    "1,0": { name: "Martial Training Grounds", tier: 1, quality: 0, desc: "The sound of wooden swords echoes. Disciples spar under watchful eyes.", img: zoneImages.training, exits: ['w', 'e'], safeZone: true },
    "-1,0": { name: "Alchemy Pavilion", tier: 1, quality: 0, desc: "Smoke rises from pill furnaces. Apprentices learn the Dao of Pills.", img: zoneImages.alchemy, exits: ['e', 'w'], safeZone: true },
    "0,-1": { name: "Outer Disciple Quarters", tier: 1, quality: 0, desc: "Simple huts for cultivation and rest. Your journey begins here.", img: zoneImages.quarters, exits: ['n', 's'], safeZone: true },
    
    // ============================================
    // SECT BORDERS (Transition Zones)
    // ============================================
    "0,2": { name: "North Gate", tier: 2, quality: 1, desc: "The border to the wilderness. Beyond lies danger and opportunity.", img: zoneImages.northGate, exits: ['s', 'n'] },
    "0,-2": { name: "South Gate", tier: 2, quality: 1, desc: "Path to the misty swamps. Few return unchanged.", img: zoneImages.southGate, exits: ['n', 's'] },
    "-2,0": { name: "West Ruins", tier: 2, quality: 1, desc: "Ancient pillars from a forgotten era. Restless spirits linger.", img: zoneImages.westRuins, exits: ['e', 'w'] },
    "2,0": { name: "Bamboo Forest", tier: 2, quality: 1, desc: "Peaceful yet dangerous. Spirit beasts make their home here.", img: zoneImages.bamboo, exits: ['w', 'e'] },
    
    // ============================================
    // OUTER TERRITORIES (Combat Zones)
    // ============================================
    "0,3": { name: "Rocky Path", tier: 2, quality: 1, desc: "Uneven terrain leads deeper into the mountains.", img: zoneImages.rocky, exits: ['s', 'n', 'w'] },
    "-1,3": { name: "Iron Claw Bandit Camp", tier: 2, quality: 1, desc: "Bandits have made camp here. They prey on traveling cultivators.", img: zoneImages.bandit, exits: ['e'] },
    "0,4": { name: "Abandoned Spirit Mine", tier: 2, quality: 2, desc: "Rich in spirit crystals. Golems guard these depths.", img: zoneImages.mine, exits: ['s', 'n'] },
    "0,5": { name: "Thunder Peak Base", tier: 3, quality: 2, desc: "The air crackles with lightning Qi. Dragon territory.", img: zoneImages.thunderBase, exits: ['s', 'n'] },
    "0,6": { name: "Thunder Peak Summit", tier: 3, quality: 4, desc: "Where dragons gather for Heavenly Tribulation. Ultimate danger.", img: zoneImages.thunderSummit, exits: ['s'] },
    "0,-3": { name: "Misty Poison Swamp", tier: 2, quality: 1, desc: "Toxic fog obscures vision. Venomous creatures thrive.", img: zoneImages.swamp, exits: ['n', 's'] },
    "0,-4": { name: "Blackwater Lake", tier: 3, quality: 2, desc: "Dark waters conceal ancient serpents. Do not disturb.", img: zoneImages.blackwater, exits: ['n', 'w'] },
    "-1,-4": { name: "Hermit's Hut", tier: 2, quality: 3, desc: "A strange cultivator lives in seclusion. He offers wisdom... for a price.", img: zoneImages.hut, exits: ['e'], safeZone: true },
    "-3,0": { name: "Haunted Graveyard", tier: 2, quality: 1, desc: "Restless spirits of fallen cultivators. Ghost Qi permeates.", img: zoneImages.graveyard, exits: ['e', 'w'] },
    "-4,0": { name: "Ancient Tomb Entrance", tier: 3, quality: 2, desc: "Sealed for centuries. The Undead Emperor's domain.", img: zoneImages.tombEntrance, exits: ['e', 'n', 'w'] },
    "-4,1": { name: "Inner Tomb Chambers", tier: 3, quality: 4, desc: "Ancient treasures and curses await.", img: zoneImages.tombInner, exits: ['s'] },
    "-5,0": { name: "Tomb Inner Sanctum", tier: 3, quality: 5, desc: "The final resting place of the Undead Emperor. Only the strongest dare enter.", img: zoneImages.tombInner, exits: ['e'] },
    "3,0": { name: "Spirit Beast Den", tier: 2, quality: 2, desc: "Roars echo through the forest. Apex predators rule here.", img: zoneImages.beastDen, exits: ['w', 'e'] },
    "4,0": { name: "Elder's Peak", tier: 3, quality: 5, desc: "Dense spiritual energy gathers. A hidden immortal once cultivated here.", img: zoneImages.elder, exits: ['w'] },
};

export const bestiaryMap = {
    // ============================================
    // AZURE CLOUD SECT - SAFE ZONES (No Combat)
    // NPCs, shops, training - zero hostiles
    // ============================================
    // "0,0" - Main Hall (Safe Zone)
    // "0,1" - Spirit Herb Garden (Safe Zone)
    // "1,0" - Martial Training Grounds (Safe Zone)
    // "-1,0" - Alchemy Pavilion (Safe Zone)
    // "0,-1" - Outer Disciple Quarters (Safe Zone)
    
    // ============================================
    // SECT GATES - Transition Zones
    // Lvl 1-5: Starter mobs for new cultivators
    // ============================================
    "0,2": [1, 2, 7],               // North Gate - Spirit Rat, Garden Spider, Novice Cultivator
    "0,-2": [1, 5, 8],              // South Gate - Spirit Rat, Pestilent Worm, Meditation Monk
    "-2,0": [3, 4, 6],              // West Ruins - Sect Servant, Training Dummy, Herb Spirit
    "2,0": [2, 5, 6],               // Bamboo Forest - Garden Spider, Pestilent Worm, Herb Spirit
    
    // ============================================
    // OUTER TERRITORIES - Mid Zones
    // Lvl 4-9: Growing stronger
    // ============================================
    "0,3": [7, 9, 10],              // Rocky Path - Novice Cultivator, Sect Guard, Junior Disciple
    "-1,3": [11, 12, 16],           // Bandit Camp - Bandit Thug, Bandit Archer, Bandit Captain
    "0,4": [15, 17, 18],            // Spirit Mine - Rock Serpent, Corrupted Disciple, Crystal Golem
    "3,0": [13, 14, 19],            // Beast Den - Mountain Ape, Poison Spider, Forest Guardian
    "-3,0": [8, 10, 17],            // Haunted Graveyard - Meditation Monk, Junior Disciple, Corrupted Disciple
    "0,-3": [5, 14, 20],            // Poison Swamp - Pestilent Worm, Poison Spider, Frost Wolf
    
    // ============================================
    // DANGER ZONES - Advanced Areas
    // Lvl 10-16: Foundation Establishment territory
    // ============================================
    "0,5": [19, 20, 21],            // Thunder Peak Base - Forest Guardian, Frost Wolf, Ghost Cultivator
    "-4,0": [22, 23, 25],           // Tomb Entrance - Corrupted Monk, Iron Claw Chief, Stone Guardian
    "4,0": [24, 26, 27],            // Elder's Peak Approach - Shadow Assassin, Abyssal Serpent, Ancient Lich
    "0,-4": [23, 24, 26],           // Blackwater Lake - Iron Claw Chief, Shadow Assassin, Abyssal Serpent
    "-4,1": [27, 29, 30],           // Inner Tomb - Ancient Lich, Corrupted Elder Tree, Cursed Jade Guardian
    
    // ============================================
    // BOSS ZONES - High Danger
    // Lvl 16-26: Golden Core territory
    // ============================================
    "0,6": [28, 31, 32, 33, 39],    // Thunder Summit - Phoenix, Flame Demon, Ice Queen, Lightning Elem, Dragon Whelp
    "-5,0": [34, 35, 36, 37, 38, 40, 41, 42, 43, 44] // Tomb Sanctum - All endgame bosses
};

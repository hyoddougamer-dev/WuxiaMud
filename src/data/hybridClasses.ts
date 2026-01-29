// ============================================
// HYBRID CLASS SYSTEM - TypeScript Implementation
// Complete 12-Class System with Passives & Gear
// ============================================

export interface PassiveSkill {
    name: string;
    description: string;
    mechanic: string;
    triggerType: 'onHit' | 'onCast' | 'onDamage' | 'passive' | 'onDodge' | 'onResist';
}

export interface GearSet {
    tier: 1 | 2 | 3 | 4 | 5;
    levelRange: string;
    setName: string;
    bonus: number;
    requiredItems: string[];
    bonusDescription: string;
}

export interface HybridClass {
    id: number;
    name: string;
    weapon: 'Sword' | 'Saber' | 'Zither';
    element: 'Fire' | 'Ice' | 'Wood' | 'Lightning' | 'Void';
    description: string;
    role: string;
    archetype: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    
    // Stat Template (for AP allocation)
    statTemplate: {
        str: number;
        dex: number;
        con: number;
        spi: number;
        wil: number;
    };
    
    // Unique Passive
    passive: PassiveSkill;
    
    // Gear Progression (5 tiers)
    gearSets: GearSet[];
}

// ============================================
// SWORD CLASSES (4)
// ============================================

export const blazingSwordImmmortal: HybridClass = {
    id: 1,
    name: "Blazing Sword Immortal",
    weapon: "Sword",
    element: "Fire",
    description: "Speed and Fire Damage.",
    role: "Pure DPS / Speed",
    archetype: "Physical Attacker",
    difficulty: "Easy",
    
    statTemplate: {
        str: 43,
        dex: 60,
        con: 26,
        spi: 34,
        wil: 9
    },
    
    passive: {
        name: "Burning Blade",
        description: "After 3 consecutive hits, next attack deals +40% damage and applies Burn (3s, -10% enemy damage)",
        mechanic: "Track hit counter (resets on miss/skill use). 3rd hit triggers cooldown. 4th hit within 8s = bonus damage + burn. Cooldown: 5 seconds between procs",
        triggerType: 'onHit'
    },
    
    gearSets: [
        {
            tier: 1,
            levelRange: "5-9",
            setName: "Novice Flame Garb",
            bonus: 5,
            requiredItems: ["Flaming Robe", "Warmth Ring", "Fire Charm"],
            bonusDescription: "+1 DEX, +5% Fire Damage"
        },
        {
            tier: 2,
            levelRange: "10-14",
            setName: "Disciple's Burning Edge",
            bonus: 10,
            requiredItems: ["Fire Robes", "Flame Band", "Ignition Stone"],
            bonusDescription: "+2 DEX, +3 SPI, +10% Fire Damage"
        },
        {
            tier: 3,
            levelRange: "15-19",
            setName: "Expert Inferno Set",
            bonus: 15,
            requiredItems: ["Inferno Cloak", "Blazing Ring", "Pyrekeeper", "Fire Boots"],
            bonusDescription: "+3 DEX, +2 SPI, +15% Fire Damage, +5% Attack Speed"
        },
        {
            tier: 4,
            levelRange: "20-24",
            setName: "Master Wildfire Set",
            bonus: 20,
            requiredItems: ["Wildfire Coat", "Phoenix Ring", "Flame Heart", "Igneous Boots"],
            bonusDescription: "+5 DEX, +3 SPI, +20% Fire Damage, +10% Attack Speed"
        },
        {
            tier: 5,
            levelRange: "25-29",
            setName: "Legendary Eternal Flame",
            bonus: 25,
            requiredItems: ["Eternal Flame Mantle", "Solar Ring", "Primal Fire Core", "Magma Boots"],
            bonusDescription: "+8 DEX, +5 SPI, +25% Fire Damage, +15% Attack Speed, +2% Max HP per Fire Damage"
        }
    ]
};

export const glacialShadow: HybridClass = {
    id: 2,
    name: "Glacial Shadow",
    weapon: "Sword",
    element: "Ice",
    description: "Evasion and Crit Control.",
    role: "DPS / Control Hybrid",
    archetype: "Physical Attacker + Crowd Control",
    difficulty: "Medium",
    
    statTemplate: {
        str: 43,
        dex: 52,
        con: 34,
        spi: 17,
        wil: 26
    },
    
    passive: {
        name: "Frostbite",
        description: "Every hit applies Chill stack (max 3). At 3 stacks, enemy is Frozen for 1s and takes -30% damage during Freeze",
        mechanic: "Each attack adds 1 Chill (lasts 8s). At 3 Chill = auto-Freeze (1s duration). During Freeze, enemy damage reduced 30%. After Freeze ends, Chill resets to 0. Cooldown: 8 seconds between Freeze procs",
        triggerType: 'onHit'
    },
    
    gearSets: [
        {
            tier: 1,
            levelRange: "5-9",
            setName: "Novice Frostbind",
            bonus: 5,
            requiredItems: ["Frost Robe", "Winter Ring", "Chill Charm"],
            bonusDescription: "+1 DEX, +3% Freeze Duration"
        },
        {
            tier: 2,
            levelRange: "10-14",
            setName: "Disciple's Glacial Set",
            bonus: 10,
            requiredItems: ["Ice Robes", "Frozen Band", "Rime Stone"],
            bonusDescription: "+2 DEX, +2 STR, +5% Freeze Duration, +10% Chill Apply Rate"
        },
        {
            tier: 3,
            levelRange: "15-19",
            setName: "Expert Blizzard Armor",
            bonus: 15,
            requiredItems: ["Blizzard Coat", "Permafrost Ring", "Snowkeep", "Icy Boots"],
            bonusDescription: "+3 DEX, +2 STR, +8% Freeze Duration, +15% Chill Apply Rate"
        },
        {
            tier: 4,
            levelRange: "20-24",
            setName: "Master Tundra Set",
            bonus: 20,
            requiredItems: ["Tundra Mantle", "Glacial Ring", "Frozen Heart", "Frost Boots"],
            bonusDescription: "+5 DEX, +3 STR, +12% Freeze Duration, +20% Chill Apply Rate, Frozen enemies +50% damage taken"
        },
        {
            tier: 5,
            levelRange: "25-29",
            setName: "Legendary Eternal Winter",
            bonus: 25,
            requiredItems: ["Eternal Frost Mantle", "Absolute Zero Ring", "Primordial Ice Core", "Glacial Boots"],
            bonusDescription: "+8 DEX, +5 STR, +15% Freeze Duration, +25% Chill Apply Rate, Frozen enemies CCable again immediately"
        }
    ]
};

export const spellfireDuelist: HybridClass = {
    id: 3,
    name: "Spellfire Duelist",
    weapon: "Sword",
    element: "Lightning",
    description: "Hybrid Magic Sword.",
    role: "Hybrid Magic/Physical",
    archetype: "Magical Attacker + Physical Synergy",
    difficulty: "Medium",
    
    statTemplate: {
        str: 26,
        dex: 43,
        con: 26,
        spi: 60,
        wil: 17
    },
    
    passive: {
        name: "Arcane Edge",
        description: "After casting a spell, next physical attack deals +50% damage and applies Burning (3s, -15% enemy damage). Physical attacks reduce spell cooldowns by 1s",
        mechanic: "Cast spell → mark 'Spell Cast' for 10s. Next physical attack during mark = bonus damage + burn. Physical attacks reset spell cooldown counter. Encourages spell → attack → spell rotation",
        triggerType: 'onCast'
    },
    
    gearSets: [
        {
            tier: 1,
            levelRange: "5-9",
            setName: "Novice Spellblade",
            bonus: 5,
            requiredItems: ["Arcane Robe", "Mystic Ring", "Spell Charm"],
            bonusDescription: "+1 SPI, +2% Spell Power"
        },
        {
            tier: 2,
            levelRange: "10-14",
            setName: "Disciple's Arcanist Set",
            bonus: 10,
            requiredItems: ["Arcanist Robes", "Spellfire Band", "Mana Stone"],
            bonusDescription: "+2 SPI, +2 DEX, +5% Spell Power, -0.5s Spell Cooldown"
        },
        {
            tier: 3,
            levelRange: "15-19",
            setName: "Expert Enchanter Armor",
            bonus: 15,
            requiredItems: ["Enchanter Coat", "Arcane Ring", "Runekeeper", "Spell Boots"],
            bonusDescription: "+3 SPI, +2 DEX, +8% Spell Power, -1s Spell Cooldown, +3% Crit"
        },
        {
            tier: 4,
            levelRange: "20-24",
            setName: "Master Spellbinder Set",
            bonus: 20,
            requiredItems: ["Spellbinder Mantle", "Runic Ring", "Spell Heart", "Arcane Boots"],
            bonusDescription: "+5 SPI, +3 DEX, +12% Spell Power, -1.5s Spell Cooldown, +5% Crit, Spells restore 5 QI"
        },
        {
            tier: 5,
            levelRange: "25-29",
            setName: "Legendary Eternal Arcanum",
            bonus: 25,
            requiredItems: ["Eternal Spell Mantle", "Infinite Ring", "Primordial Mana Core", "Ethereal Boots"],
            bonusDescription: "+8 SPI, +5 DEX, +15% Spell Power, -2s Spell Cooldown, +8% Crit, Spells restore 10 QI, +10% Arcane Edge damage"
        }
    ]
};

export const toxicViper: HybridClass = {
    id: 4,
    name: "Toxic Viper",
    weapon: "Sword",
    element: "Wood",
    description: "DoT and Mobility.",
    role: "DoT DPS / Control",
    archetype: "Poison Specialist",
    difficulty: "Medium",
    
    statTemplate: {
        str: 34,
        dex: 52,
        con: 26,
        spi: 17,
        wil: 43
    },
    
    passive: {
        name: "Poison Cloud",
        description: "Each hit applies 1 Poison stack (max 5). At 5 stacks, enemy takes +50% damage and spreads poison to nearby enemies. Each poison stack increases your damage by 5%",
        mechanic: "Each attack adds 1 Poison stack (lasts 12s). At 5 stacks: AOE cloud appears, spreads to nearby mobs. Each stack gives you +5% damage (max +25% at 5 stacks). Poison explosion doesn't reset stacks, extends duration. Cooldown: 3 seconds between explosive spreads",
        triggerType: 'onHit'
    },
    
    gearSets: [
        {
            tier: 1,
            levelRange: "5-9",
            setName: "Novice Venom Garb",
            bonus: 5,
            requiredItems: ["Venomous Robe", "Toxin Ring", "Poison Charm"],
            bonusDescription: "+1 DEX, +5% Poison Damage"
        },
        {
            tier: 2,
            levelRange: "10-14",
            setName: "Disciple's Venomous Set",
            bonus: 10,
            requiredItems: ["Venom Robes", "Plague Band", "Toxin Stone"],
            bonusDescription: "+2 DEX, +2 WIL, +10% Poison Damage, +10% Stack Apply Rate"
        },
        {
            tier: 3,
            levelRange: "15-19",
            setName: "Expert Plague Armor",
            bonus: 15,
            requiredItems: ["Plague Coat", "Miasma Ring", "Toxkeeper", "Poison Boots"],
            bonusDescription: "+3 DEX, +2 WIL, +15% Poison Damage, +15% Stack Apply Rate, +2s Stack Duration"
        },
        {
            tier: 4,
            levelRange: "20-24",
            setName: "Master Venom Set",
            bonus: 20,
            requiredItems: ["Venom Mantle", "Plague Ring", "Toxin Heart", "Contagion Boots"],
            bonusDescription: "+5 DEX, +3 WIL, +20% Poison Damage, +20% Stack Apply Rate, +3s Stack Duration, Spread radius +50%"
        },
        {
            tier: 5,
            levelRange: "25-29",
            setName: "Legendary Eternal Plague",
            bonus: 25,
            requiredItems: ["Eternal Toxin Mantle", "Infinite Plague Ring", "Primordial Venom Core", "Pestilence Boots"],
            bonusDescription: "+8 DEX, +5 WIL, +25% Poison Damage, +25% Stack Apply Rate, +5s Stack Duration, Spread damage +50%, +10% per stack"
        }
    ]
};

// ============================================
// SABER CLASSES (4)
// ============================================

export const asuraOfWar: HybridClass = {
    id: 5,
    name: "Asura of War",
    weapon: "Saber",
    element: "Fire",
    description: "High Damage at Low HP.",
    role: "Aggressive Glass Cannon",
    archetype: "High-Risk Physical Attacker",
    difficulty: "Hard",
    
    statTemplate: {
        str: 69,
        dex: 34,
        con: 26,
        spi: 26,
        wil: 17
    },
    
    passive: {
        name: "Desperate Power",
        description: "For every 5% of HP lost below 100%, gain +2% damage (max +50% at 1 HP). When HP drops below 20%, gain +1% attack speed per 1% HP lost",
        mechanic: "At 95% HP = +2% damage. At 50% HP = +20% damage. At 1% HP = +50% damage (extremely powerful!). Below 20% HP: also gain scaling attack speed. Creates risk/reward gameplay (lower HP = stronger)",
        triggerType: 'passive'
    },
    
    gearSets: [
        {
            tier: 1,
            levelRange: "5-9",
            setName: "Novice Warrior Garb",
            bonus: 5,
            requiredItems: ["Battle Robe", "War Ring", "Combat Charm"],
            bonusDescription: "+1 STR, +5% Attack Damage"
        },
        {
            tier: 2,
            levelRange: "10-14",
            setName: "Disciple's War Set",
            bonus: 10,
            requiredItems: ["War Robes", "Battle Band", "War Stone"],
            bonusDescription: "+2 STR, +2 DEX, +10% Attack Damage, +3% HP Regen"
        },
        {
            tier: 3,
            levelRange: "15-19",
            setName: "Expert Berserker Armor",
            bonus: 15,
            requiredItems: ["Berserker Coat", "Conflict Ring", "Warkeeper", "Battle Boots"],
            bonusDescription: "+3 STR, +2 DEX, +15% Attack Damage, +5% HP Regen, +10% Desperate Power scaling"
        },
        {
            tier: 4,
            levelRange: "20-24",
            setName: "Master Carnage Set",
            bonus: 20,
            requiredItems: ["Carnage Mantle", "Slaughter Ring", "War Heart", "Blood Boots"],
            bonusDescription: "+5 STR, +3 DEX, +20% Attack Damage, +8% HP Regen, +15% Desperate Power scaling, Take 10% less damage at low HP"
        },
        {
            tier: 5,
            levelRange: "25-29",
            setName: "Legendary Eternal Wrath",
            bonus: 25,
            requiredItems: ["Eternal War Mantle", "Infinite Carnage Ring", "Primal War Core", "Bloodlust Boots"],
            bonusDescription: "+8 STR, +5 DEX, +25% Attack Damage, +12% HP Regen, +25% Desperate Power scaling, Survive lethal damage 1x/30s at 1 HP"
        }
    ]
};

export const frozenSteelGuard: HybridClass = {
    id: 6,
    name: "Frozen Steel Guard",
    weapon: "Saber",
    element: "Ice",
    description: "Tank with Crowd Control.",
    role: "Tank / Crowd Control",
    archetype: "Defensive Protector",
    difficulty: "Medium",
    
    statTemplate: {
        str: 43,
        dex: 26,
        con: 60,
        spi: 9,
        wil: 34
    },
    
    passive: {
        name: "Glacial Barrier",
        description: "Block one incoming attack every 20s (barrier lasts 6s). Blocked attack resets cooldown. Blocked attacks trigger a Counter with 200% damage and apply Chill to attacker",
        mechanic: "Activate barrier passively (no button needed). First incoming damage = absorbed, cooldown starts. If barrier is up when attacked = damage blocked + counter. Counter deals 200% weapon damage. Cooldown resets if you successfully block. Incentivizes tanking for damage output",
        triggerType: 'onDamage'
    },
    
    gearSets: [
        {
            tier: 1,
            levelRange: "5-9",
            setName: "Novice Guardian Plate",
            bonus: 5,
            requiredItems: ["Guardian Robes", "Protection Ring", "Shield Charm"],
            bonusDescription: "+1 CON, +5% Block Chance"
        },
        {
            tier: 2,
            levelRange: "10-14",
            setName: "Disciple's Defense Set",
            bonus: 10,
            requiredItems: ["Defense Robes", "Barrier Band", "Ward Stone"],
            bonusDescription: "+2 CON, +2 STR, +10% Block Chance, -3s Barrier Cooldown"
        },
        {
            tier: 3,
            levelRange: "15-19",
            setName: "Expert Fortress Armor",
            bonus: 15,
            requiredItems: ["Fortress Coat", "Aegis Ring", "Protector", "Guard Boots"],
            bonusDescription: "+3 CON, +2 STR, +15% Block Chance, -5s Barrier Cooldown, +50% Counter Damage"
        },
        {
            tier: 4,
            levelRange: "20-24",
            setName: "Master Bastion Set",
            bonus: 20,
            requiredItems: ["Bastion Mantle", "Sentinel Ring", "Fortress Heart", "Guardian Boots"],
            bonusDescription: "+5 CON, +3 STR, +20% Block Chance, -8s Barrier Cooldown, +100% Counter Damage, Blocked attacks heal 10% HP"
        },
        {
            tier: 5,
            levelRange: "25-29",
            setName: "Legendary Eternal Shield",
            bonus: 25,
            requiredItems: ["Eternal Guardian Mantle", "Infinite Protection Ring", "Primal Shield Core", "Unbreakable Boots"],
            bonusDescription: "+8 CON, +5 STR, +25% Block Chance, -10s Barrier Cooldown, +150% Counter Damage, Blocked attacks heal 20% HP, Reflect 50% damage"
        }
    ]
};

export const verdantBladeMonarch: HybridClass = {
    id: 7,
    name: "Verdant Blade Monarch",
    weapon: "Saber",
    element: "Wood",
    description: "Lifesteal and Sustain.",
    role: "Sustain DPS / Hybrid",
    archetype: "Lifesteal Warrior",
    difficulty: "Medium",
    
    statTemplate: {
        str: 60,
        dex: 26,
        con: 34,
        spi: 43,
        wil: 9
    },
    
    passive: {
        name: "Lifesteal Aura",
        description: "Every attack heals you for 1% of damage dealt + 1% per unique enemy hit (max 15%). Healing restores QI at 50% rate. When at full HP, gain +20% damage to all attacks",
        mechanic: "Base: 1% lifesteal per attack. Bonus: +1% per enemy hit in last 5s (stacks up to 15 enemies). Healing also restores QI (50% efficiency). Full HP bonus: +20% damage (encourages continuous combat). AOE attacks count each enemy hit",
        triggerType: 'onHit'
    },
    
    gearSets: [
        {
            tier: 1,
            levelRange: "5-9",
            setName: "Novice Life Weaver",
            bonus: 5,
            requiredItems: ["Life Robe", "Vitality Ring", "Growth Charm"],
            bonusDescription: "+1 STR, +3% Lifesteal"
        },
        {
            tier: 2,
            levelRange: "10-14",
            setName: "Disciple's Nature Set",
            bonus: 10,
            requiredItems: ["Nature Robes", "Growth Band", "Vital Stone"],
            bonusDescription: "+2 STR, +2 SPI, +6% Lifesteal, +20% Healing per enemy"
        },
        {
            tier: 3,
            levelRange: "15-19",
            setName: "Expert Verdant Armor",
            bonus: 15,
            requiredItems: ["Verdant Coat", "Nature Ring", "Lifekeeper", "Vitality Boots"],
            bonusDescription: "+3 STR, +2 SPI, +9% Lifesteal, +40% Healing per enemy, +5% Full HP damage"
        },
        {
            tier: 4,
            levelRange: "20-24",
            setName: "Master Bloom Set",
            bonus: 20,
            requiredItems: ["Bloom Mantle", "Vitality Ring", "Life Heart", "Growth Boots"],
            bonusDescription: "+5 STR, +3 SPI, +12% Lifesteal, +60% Healing per enemy, +10% Full HP damage, Healing reduces cooldowns by 0.5s"
        },
        {
            tier: 5,
            levelRange: "25-29",
            setName: "Legendary Eternal Growth",
            bonus: 25,
            requiredItems: ["Eternal Life Mantle", "Infinite Vitality Ring", "Primal Growth Core", "Regeneration Boots"],
            bonusDescription: "+8 STR, +5 SPI, +15% Lifesteal, +80% Healing per enemy, +15% Full HP damage, Lifesteal triggers area heal, No cooldown on lifesteal"
        }
    ]
};

export const wildernessStalker: HybridClass = {
    id: 8,
    name: "Wilderness Stalker",
    weapon: "Saber",
    element: "Wood",
    description: "Stealth and Tracking.",
    role: "Rogue DPS / Assassination",
    archetype: "Physical Assassin",
    difficulty: "Medium",
    
    statTemplate: {
        str: 52,
        dex: 52,
        con: 26,
        spi: 17,
        wil: 26
    },
    
    passive: {
        name: "Predator's Mark",
        description: "Mark enemy on first hit (lasts 10s). Marked enemies take +30% damage from you and +50% from other sources. Killing marked enemies resets cooldown and extends to nearby enemies",
        mechanic: "First attack marks enemy (automatic). Marked = +30% your damage, +50% total damage. Marked enemies spread on kill (nearby mobs). Each mark extends duration. Encourages focusing marked targets",
        triggerType: 'onHit'
    },
    
    gearSets: [
        {
            tier: 1,
            levelRange: "5-9",
            setName: "Novice Hunter Garb",
            bonus: 5,
            requiredItems: ["Hunter Robe", "Tracker Ring", "Prey Charm"],
            bonusDescription: "+1 DEX, +5% Mark Damage"
        },
        {
            tier: 2,
            levelRange: "10-14",
            setName: "Disciple's Stalker Set",
            bonus: 10,
            requiredItems: ["Stalker Robes", "Hunt Band", "Tracker Stone"],
            bonusDescription: "+2 DEX, +2 STR, +10% Mark Damage, +5% Mark Duration"
        },
        {
            tier: 3,
            levelRange: "15-19",
            setName: "Expert Predator Armor",
            bonus: 15,
            requiredItems: ["Predator Coat", "Target Ring", "Hunterkeeper", "Stalker Boots"],
            bonusDescription: "+3 DEX, +2 STR, +15% Mark Damage, +8% Mark Duration, +3% Crit on marked"
        },
        {
            tier: 4,
            levelRange: "20-24",
            setName: "Master Hunter Set",
            bonus: 20,
            requiredItems: ["Hunter Mantle", "Predator Ring", "Hunt Heart", "Tracker Boots"],
            bonusDescription: "+5 DEX, +3 STR, +20% Mark Damage, +12% Mark Duration, +5% Crit on marked, Mark spread radius +50%"
        },
        {
            tier: 5,
            levelRange: "25-29",
            setName: "Legendary Eternal Hunt",
            bonus: 25,
            requiredItems: ["Eternal Hunter Mantle", "Infinite Tracker Ring", "Primal Hunt Core", "Apex Predator Boots"],
            bonusDescription: "+8 DEX, +5 STR, +25% Mark Damage, +15% Mark Duration, +8% Crit on marked, Mark spread radius +100%, Kill marked = +30% all damage 5s"
        }
    ]
};

// ============================================
// ZITHER CLASSES (4)
// ============================================

export const phoenixCryCultivator: HybridClass = {
    id: 9,
    name: "Phoenix Cry Cultivator",
    weapon: "Zither",
    element: "Fire",
    description: "AoE Fire and Qi Control.",
    role: "Offensive Mage / AoE",
    archetype: "Magical Attacker",
    difficulty: "Hard",
    
    statTemplate: {
        str: 17,
        dex: 26,
        con: 26,
        spi: 69,
        wil: 34
    },
    
    passive: {
        name: "Rebirth Flame",
        description: "When HP drops below 20%, automatically restore 30% HP and gain 3s Immunity (once per combat). After using Rebirth, gain +50% spell damage for 10s. Spell damage from Rebirth stacks (up to 5 stacks)",
        mechanic: "Auto-trigger at <20% HP. Restore 30% HP + full immunity 3s. Cooldown: Once per combat (resets on new enemy). After use: +50% spell damage (can stack 5 times = +250%). Encourages aggressive spell spam after survival",
        triggerType: 'passive'
    },
    
    gearSets: [
        {
            tier: 1,
            levelRange: "5-9",
            setName: "Novice Flame Weaver",
            bonus: 5,
            requiredItems: ["Flame Robes", "Rebirth Ring", "Phoenix Charm"],
            bonusDescription: "+1 SPI, +5% Spell Power"
        },
        {
            tier: 2,
            levelRange: "10-14",
            setName: "Disciple's Inferno Set",
            bonus: 10,
            requiredItems: ["Inferno Robes", "Rebirth Band", "Flame Stone"],
            bonusDescription: "+2 SPI, +2 WIL, +10% Spell Power, +0.5s Immunity Duration"
        },
        {
            tier: 3,
            levelRange: "15-19",
            setName: "Expert Phoenix Armor",
            bonus: 15,
            requiredItems: ["Phoenix Coat", "Rebirth Ring", "Lifekeeper", "Phoenix Boots"],
            bonusDescription: "+3 SPI, +2 WIL, +15% Spell Power, +1s Immunity Duration, +50% Rebirth heal"
        },
        {
            tier: 4,
            levelRange: "20-24",
            setName: "Master Inferno Set",
            bonus: 20,
            requiredItems: ["Inferno Mantle", "Phoenix Ring", "Rebirth Heart", "Flame Boots"],
            bonusDescription: "+5 SPI, +3 WIL, +20% Spell Power, +1.5s Immunity Duration, +100% Rebirth heal, +25% Spell damage bonus"
        },
        {
            tier: 5,
            levelRange: "25-29",
            setName: "Legendary Eternal Phoenix",
            bonus: 25,
            requiredItems: ["Eternal Phoenix Mantle", "Infinite Rebirth Ring", "Primal Phoenix Core", "Rising Flame Boots"],
            bonusDescription: "+8 SPI, +5 WIL, +25% Spell Power, +2s Immunity Duration, +150% Rebirth heal, +50% Spell damage bonus, Rebirth damages nearby enemies"
        }
    ]
};

export const divineMelodyHealer: HybridClass = {
    id: 10,
    name: "Divine Melody Healer",
    weapon: "Zither",
    element: "Wood",
    description: "Group Healing and Support.",
    role: "Support / Healing",
    archetype: "Healer",
    difficulty: "Easy",
    
    statTemplate: {
        str: 9,
        dex: 26,
        con: 26,
        spi: 52,
        wil: 60
    },
    
    passive: {
        name: "Healing Aria",
        description: "Each heal cast grants +15% damage buff to healed target for 8s (stacks with multiple heals). Heals restore 10% of healed amount to you as QI. When 3+ allies are healed in 10s, next heal heals for +50% and restores 20% HP to you",
        mechanic: "Cast heal → target gets +15% damage. Stacks: 2 heals = +30%, 3+ = +45%. Healing = heal amount × 10% as QI to you. Track ally heals: 3 different allies in 10s = buff next heal. Incentivizes spread healing vs single focus",
        triggerType: 'onCast'
    },
    
    gearSets: [
        {
            tier: 1,
            levelRange: "5-9",
            setName: "Novice Mender's Garb",
            bonus: 5,
            requiredItems: ["Mender Robes", "Life Ring", "Healing Charm"],
            bonusDescription: "+1 WIL, +5% Healing Power"
        },
        {
            tier: 2,
            levelRange: "10-14",
            setName: "Disciple's Healer Set",
            bonus: 10,
            requiredItems: ["Healer Robes", "Support Band", "Vitality Stone"],
            bonusDescription: "+2 WIL, +2 SPI, +10% Healing Power, +0.5s Buff Duration"
        },
        {
            tier: 3,
            levelRange: "15-19",
            setName: "Expert Priest Armor",
            bonus: 15,
            requiredItems: ["Priest Coat", "Grace Ring", "Caretaker", "Holy Boots"],
            bonusDescription: "+3 WIL, +2 SPI, +15% Healing Power, +1s Buff Duration, +25% Multi-heal damage buff"
        },
        {
            tier: 4,
            levelRange: "20-24",
            setName: "Master Radiant Set",
            bonus: 20,
            requiredItems: ["Radiant Mantle", "Blessing Ring", "Grace Heart", "Saint Boots"],
            bonusDescription: "+5 WIL, +3 SPI, +20% Healing Power, +1.5s Buff Duration, +50% Multi-heal damage buff, Heals reduce ally cooldowns by 0.5s"
        },
        {
            tier: 5,
            levelRange: "25-29",
            setName: "Legendary Eternal Grace",
            bonus: 25,
            requiredItems: ["Eternal Grace Mantle", "Infinite Blessing Ring", "Primal Healing Core", "Celestial Boots"],
            bonusDescription: "+8 WIL, +5 SPI, +25% Healing Power, +2s Buff Duration, +75% Multi-heal damage buff, Heals restore 20% ally QI, Heals trigger group shield"
        }
    ]
};

export const phantomMusician: HybridClass = {
    id: 11,
    name: "Phantom Musician",
    weapon: "Zither",
    element: "Ice",
    description: "Evasion and Control.",
    role: "Control / Evasion",
    archetype: "Control Mage",
    difficulty: "Hard",
    
    statTemplate: {
        str: 9,
        dex: 52,
        con: 26,
        spi: 52,
        wil: 34
    },
    
    passive: {
        name: "Ethereal Form",
        description: "Dodge cooldown reduced by 30%. Each successful dodge triggers auto-cast of frost bolt (free, instant). Dodging restores 5% QI. When you dodge 3+ attacks in 10s, gain +25% spell damage and Untargetable for 2s",
        mechanic: "Dodge cooldown normally 6s, reduce to 4.2s. Dodge auto-casts frost bolt (no QI cost). Dodging = +5% QI. Track dodge counter: 3 dodges in 10s = buff. Buff = +25% spell damage + 2s untargetable (OP! But rare). Encourages reactive evasion gameplay",
        triggerType: 'onDodge'
    },
    
    gearSets: [
        {
            tier: 1,
            levelRange: "5-9",
            setName: "Novice Phantom Garb",
            bonus: 5,
            requiredItems: ["Phantom Robes", "Evasion Ring", "Escape Charm"],
            bonusDescription: "+1 DEX, +5% Dodge Chance"
        },
        {
            tier: 2,
            levelRange: "10-14",
            setName: "Disciple's Phantom Set",
            bonus: 10,
            requiredItems: ["Phantom Robes", "Phantom Band", "Drift Stone"],
            bonusDescription: "+2 DEX, +2 SPI, +10% Dodge Chance, +15% Frost Bolt Damage"
        },
        {
            tier: 3,
            levelRange: "15-19",
            setName: "Expert Ghost Armor",
            bonus: 15,
            requiredItems: ["Ghost Coat", "Phantom Ring", "Elusion", "Ghost Boots"],
            bonusDescription: "+3 DEX, +2 SPI, +15% Dodge Chance, +25% Frost Bolt Damage, +0.5s Untargetable buff"
        },
        {
            tier: 4,
            levelRange: "20-24",
            setName: "Master Specter Set",
            bonus: 20,
            requiredItems: ["Specter Mantle", "Ghost Ring", "Spirit Heart", "Wraith Boots"],
            bonusDescription: "+5 DEX, +3 SPI, +20% Dodge Chance, +35% Frost Bolt Damage, +1s Untargetable buff, Dodges reduce spell cooldowns by 0.5s"
        },
        {
            tier: 5,
            levelRange: "25-29",
            setName: "Legendary Eternal Phantom",
            bonus: 25,
            requiredItems: ["Eternal Phantom Mantle", "Infinite Ghost Ring", "Primal Evasion Core", "Shadow Boots"],
            bonusDescription: "+8 DEX, +5 SPI, +25% Dodge Chance, +50% Frost Bolt Damage, +1.5s Untargetable buff, Dodges restore 10% QI, Dodge counter resets every dodge"
        }
    ]
};

export const unbreakableSpiritSage: HybridClass = {
    id: 12,
    name: "Unbreakable Spirit Sage",
    weapon: "Zither",
    element: "Ice",
    description: "Debuff Master.",
    role: "Debuff Tank / Support",
    archetype: "Debuff Specialist",
    difficulty: "Medium",
    
    statTemplate: {
        str: 9,
        dex: 17,
        con: 52,
        spi: 34,
        wil: 60
    },
    
    passive: {
        name: "Fortified Mind",
        description: "Resist all debuffs applied to you. Each resisted debuff grants +5% DEF (stacks, max +50% at 10 resists). Resisting debuffs slows enemies by 30% for 4s. When 5+ debuffs are resisted in 20s, gain Unstoppable (immune to CC, +30% damage) for 5s",
        mechanic: "Automatic debuff resistance (passive). Each resist = +5% DEF stacking. Resist = enemy slow 30% for 4s. Track resists: 5 in 20s = unstoppable buff. Buff = CC immune + 30% damage (powerful!). Incentivizes fighting debuff-heavy enemies",
        triggerType: 'onResist'
    },
    
    gearSets: [
        {
            tier: 1,
            levelRange: "5-9",
            setName: "Novice Spirit Weaver",
            bonus: 5,
            requiredItems: ["Spirit Robes", "Will Ring", "Resolve Charm"],
            bonusDescription: "+1 WIL, +5% Debuff Resistance"
        },
        {
            tier: 2,
            levelRange: "10-14",
            setName: "Disciple's Sage Set",
            bonus: 10,
            requiredItems: ["Sage Robes", "Wisdom Band", "Mind Stone"],
            bonusDescription: "+2 WIL, +2 CON, +10% Debuff Resistance, +5% Resist DEF gain"
        },
        {
            tier: 3,
            levelRange: "15-19",
            setName: "Expert Stoic Armor",
            bonus: 15,
            requiredItems: ["Stoic Coat", "Resolve Ring", "Mindkeeper", "Sage Boots"],
            bonusDescription: "+3 WIL, +2 CON, +15% Debuff Resistance, +10% Resist DEF gain, +2s Slow Duration"
        },
        {
            tier: 4,
            levelRange: "20-24",
            setName: "Master Unbreakable Set",
            bonus: 20,
            requiredItems: ["Unbreakable Mantle", "Fortitude Ring", "Will Heart", "Bastion Boots"],
            bonusDescription: "+5 WIL, +3 CON, +20% Debuff Resistance, +15% Resist DEF gain, +3s Slow Duration, Resists restore 5% HP"
        },
        {
            tier: 5,
            levelRange: "25-29",
            setName: "Legendary Eternal Will",
            bonus: 25,
            requiredItems: ["Eternal Will Mantle", "Infinite Fortitude Ring", "Primal Resolve Core", "Immutable Boots"],
            bonusDescription: "+8 WIL, +5 CON, +25% Debuff Resistance, +20% Resist DEF gain, +4s Slow Duration, Resists restore 10% HP, Unstoppable lasts 7s"
        }
    ]
};

// ============================================
// EXPORT ALL CLASSES AS ARRAY
// ============================================

export const hybridClassSystem: HybridClass[] = [
    blazingSwordImmmortal,
    glacialShadow,
    spellfireDuelist,
    toxicViper,
    asuraOfWar,
    frozenSteelGuard,
    verdantBladeMonarch,
    wildernessStalker,
    phoenixCryCultivator,
    divineMelodyHealer,
    phantomMusician,
    unbreakableSpiritSage
];

// Stat Templates for Quick Reference
export const classStatTemplates = {
    1: { str: 43, dex: 60, con: 26, spi: 34, wil: 9 },      // Blazing Sword Immortal
    2: { str: 43, dex: 52, con: 34, spi: 17, wil: 26 },     // Glacial Shadow
    3: { str: 26, dex: 43, con: 26, spi: 60, wil: 17 },     // Spellfire Duelist
    4: { str: 34, dex: 52, con: 26, spi: 17, wil: 43 },     // Toxic Viper
    5: { str: 69, dex: 34, con: 26, spi: 26, wil: 17 },     // Asura of War
    6: { str: 43, dex: 26, con: 60, spi: 9, wil: 34 },      // Frozen Steel Guard
    7: { str: 60, dex: 26, con: 34, spi: 43, wil: 9 },      // Verdant Blade Monarch
    8: { str: 52, dex: 52, con: 26, spi: 17, wil: 26 },     // Wilderness Stalker
    9: { str: 17, dex: 26, con: 26, spi: 69, wil: 34 },     // Phoenix Cry Cultivator
    10: { str: 9, dex: 26, con: 26, spi: 52, wil: 60 },     // Divine Melody Healer
    11: { str: 9, dex: 52, con: 26, spi: 52, wil: 34 },     // Phantom Musician
    12: { str: 9, dex: 17, con: 52, spi: 34, wil: 60 },     // Unbreakable Spirit Sage
};

# 🎭 HYBRID CLASS SYSTEM - COMPLETE IMPLEMENTATION GUIDE

---

## 📋 STRUCTURE OVERVIEW

### Class Definition Structure
```typescript
interface ClassDef {
    // Identity
    id: number;
    name: string;
    description: string;
    weapon: "Sword" | "Saber" | "Zither";
    element: "Fire" | "Ice" | "Wood" | "Lightning" | "Void";
    
    // Stat Template
    statTemplate: {
        str: number;      // Recommended allocation %
        dex: number;
        con: number;
        spi: number;
        wil: number;
    };
    
    // Gear Sets (5 progression tiers)
    gearSets: GearSet[];
    
    // Unique Passive
    passive: {
        name: string;
        description: string;
        mechanic: string; // For developer reference
    };
}

interface GearSet {
    tier: 1 | 2 | 3 | 4 | 5;
    levelRange: string;        // "5-9", "10-14", etc
    setName: string;
    bonus: number;             // Bonus % (5, 10, 15, 20, 25)
    requiredItems: string[];   // Item IDs for full set
    bonusDescription: string;
}
```

---

## ⚔️ SWORD CLASSES (4 TOTAL)

### CLASS 1: BLAZING SWORD IMMORTAL

**Identity**
| Property | Value |
|----------|-------|
| **ID** | 1 |
| **Name** | Blazing Sword Immortal |
| **Weapon** | Sword |
| **Element** | Fire |
| **Role** | Pure DPS / Speed |
| **Archetype** | Physical Attacker |

**Stat Template** (172 AP Distribution)
| Stat | Allocation | % | Points | Purpose |
|------|-----------|---|--------|---------|
| **DEX** | Primary | 35% | 60 | Attack speed, crit |
| **SPI** | Secondary | 20% | 34 | Magic synergy, element |
| **STR** | Tertiary | 25% | 43 | Physical damage |
| **CON** | Utility | 15% | 26 | Survivability |
| **WIL** | Dump | 5% | 9 | Minimal investment |

**Passive Skill: "Burning Blade"**
- **Description**: After 3 consecutive hits, next attack deals +40% damage and applies Burn (3s, -10% enemy damage)
- **Mechanic**: 
  - Track hit counter (resets on miss/skill use)
  - 3rd hit triggers cooldown
  - 4th hit within 8s = bonus damage + burn
  - Cooldown: 5 seconds between procs
- **Playstyle**: Aggressive spam-hitting for damage bursts
- **Counterplay**: Enemies can dodge to reset counter

**Gear Progression Sets**

| Tier | Level | Set Name | Required Items | Bonus | Full Set Effect |
|------|-------|----------|-----------------|-------|-----------------|
| 1 | 5-9 | Novice Flame Garb | Flaming Robe, Warmth Ring, Fire Charm | +5% | +1 DEX, +5% Fire Damage |
| 2 | 10-14 | Disciple's Burning Edge | Fire Robes, Flame Band, Ignition Stone | +10% | +2 DEX, +3 SPI, +10% Fire Damage |
| 3 | 15-19 | Expert Inferno Set | Inferno Cloak, Blazing Ring, Pyrekeeper, Fire Boots | +15% | +3 DEX, +2 SPI, +15% Fire Damage, +5% Attack Speed |
| 4 | 20-24 | Master Wildfire Set | Wildfire Coat, Phoenix Ring, Flame Heart, Igneous Boots | +20% | +5 DEX, +3 SPI, +20% Fire Damage, +10% Attack Speed |
| 5 | 25-29 | Legendary Eternal Flame | Eternal Flame Mantle, Solar Ring, Primal Fire Core, Magma Boots | +25% | +8 DEX, +5 SPI, +25% Fire Damage, +15% Attack Speed, +2% Max HP per Fire Damage |

---

### CLASS 2: GLACIAL SHADOW

**Identity**
| Property | Value |
|----------|-------|
| **ID** | 2 |
| **Name** | Glacial Shadow |
| **Weapon** | Sword |
| **Element** | Ice |
| **Role** | DPS / Control Hybrid |
| **Archetype** | Physical Attacker + Crowd Control |

**Stat Template** (172 AP Distribution)
| Stat | Allocation | % | Points | Purpose |
|------|-----------|---|--------|---------|
| **DEX** | Primary | 30% | 52 | Attack speed, defense |
| **STR** | Secondary | 25% | 43 | Physical damage |
| **CON** | Tertiary | 20% | 34 | Survivability, tankiness |
| **WIL** | Utility | 15% | 26 | Control resistance |
| **SPI** | Dump | 10% | 17 | Minimal investment |

**Passive Skill: "Frostbite"**
- **Description**: Every hit applies Chill stack (max 3). At 3 stacks, enemy is Frozen for 1s and takes -30% damage during Freeze
- **Mechanic**:
  - Each attack adds 1 Chill (lasts 8s)
  - At 3 Chill = auto-Freeze (1s duration)
  - During Freeze, enemy damage reduced 30%
  - After Freeze ends, Chill resets to 0
  - Cooldown: 8 seconds between Freeze procs
- **Playstyle**: Control-oriented DPS, freeze enemies for breathing room
- **Counterplay**: Cleanse/dispel removes Chill stacks

**Gear Progression Sets**

| Tier | Level | Set Name | Required Items | Bonus | Full Set Effect |
|------|-------|----------|-----------------|-------|-----------------|
| 1 | 5-9 | Novice Frostbind | Frost Robe, Winter Ring, Chill Charm | +5% | +1 DEX, +3% Freeze Duration |
| 2 | 10-14 | Disciple's Glacial Set | Ice Robes, Frozen Band, Rime Stone | +10% | +2 DEX, +2 STR, +5% Freeze Duration, +10% Chill Apply Rate |
| 3 | 15-19 | Expert Blizzard Armor | Blizzard Coat, Permafrost Ring, Snowkeep, Icy Boots | +15% | +3 DEX, +2 STR, +8% Freeze Duration, +15% Chill Apply Rate |
| 4 | 20-24 | Master Tundra Set | Tundra Mantle, Glacial Ring, Frozen Heart, Frost Boots | +20% | +5 DEX, +3 STR, +12% Freeze Duration, +20% Chill Apply Rate, Frozen enemies +50% damage taken |
| 5 | 25-29 | Legendary Eternal Winter | Eternal Frost Mantle, Absolute Zero Ring, Primordial Ice Core, Glacial Boots | +25% | +8 DEX, +5 STR, +15% Freeze Duration, +25% Chill Apply Rate, Frozen enemies CCable again immediately |

---

### CLASS 3: SPELLFIRE DUELIST

**Identity**
| Property | Value |
|----------|-------|
| **ID** | 3 |
| **Name** | Spellfire Duelist |
| **Weapon** | Sword |
| **Element** | Fire |
| **Role** | Hybrid Magic/Physical |
| **Archetype** | Magical Attacker + Physical Synergy |

**Stat Template** (172 AP Distribution)
| Stat | Allocation | % | Points | Purpose |
|------|-----------|---|--------|---------|
| **SPI** | Primary | 35% | 60 | Magic damage, spells |
| **DEX** | Secondary | 25% | 43 | Attack speed, crit |
| **STR** | Tertiary | 15% | 26 | Physical damage synergy |
| **CON** | Utility | 15% | 26 | Survivability |
| **WIL** | Dump | 10% | 17 | Minimal investment |

**Passive Skill: "Arcane Edge"**
- **Description**: After casting a spell, next physical attack deals +50% damage and applies Burning (3s, -15% enemy damage). Physical attacks reduce spell cooldowns by 1s
- **Mechanic**:
  - Cast spell → mark "Spell Cast" for 10s
  - Next physical attack during mark = bonus damage + burn
  - Physical attacks reset spell cooldown counter
  - Encourages spell → attack → spell rotation
- **Playstyle**: Weaving spells and attacks for maximum burst
- **Counterplay**: Long gaps between spells reduce synergy

**Gear Progression Sets**

| Tier | Level | Set Name | Required Items | Bonus | Full Set Effect |
|------|-------|----------|-----------------|-------|-----------------|
| 1 | 5-9 | Novice Spellblade | Arcane Robe, Mystic Ring, Spell Charm | +5% | +1 SPI, +2% Spell Power |
| 2 | 10-14 | Disciple's Arcanist Set | Arcanist Robes, Spellfire Band, Mana Stone | +10% | +2 SPI, +2 DEX, +5% Spell Power, -0.5s Spell Cooldown |
| 3 | 15-19 | Expert Enchanter Armor | Enchanter Coat, Arcane Ring, Runekeeper, Spell Boots | +15% | +3 SPI, +2 DEX, +8% Spell Power, -1s Spell Cooldown, +3% Crit |
| 4 | 20-24 | Master Spellbinder Set | Spellbinder Mantle, Runic Ring, Spell Heart, Arcane Boots | +20% | +5 SPI, +3 DEX, +12% Spell Power, -1.5s Spell Cooldown, +5% Crit, Spells restore 5 QI |
| 5 | 25-29 | Legendary Eternal Arcanum | Eternal Spell Mantle, Infinite Ring, Primordial Mana Core, Ethereal Boots | +25% | +8 SPI, +5 DEX, +15% Spell Power, -2s Spell Cooldown, +8% Crit, Spells restore 10 QI, +10% Arcane Edge damage |

---

### CLASS 4: TOXIC VIPER

**Identity**
| Property | Value |
|----------|-------|
| **ID** | 4 |
| **Name** | Toxic Viper |
| **Weapon** | Sword |
| **Element** | Wood |
| **Role** | DoT DPS / Control |
| **Archetype** | Poison Specialist |

**Stat Template** (172 AP Distribution)
| Stat | Allocation | % | Points | Purpose |
|------|-----------|---|--------|---------|
| **DEX** | Primary | 30% | 52 | Attack speed, poison apply |
| **WIL** | Secondary | 25% | 43 | Control, resistance |
| **STR** | Tertiary | 20% | 34 | Physical damage |
| **CON** | Utility | 15% | 26 | Survivability |
| **SPI** | Dump | 10% | 17 | Minimal investment |

**Passive Skill: "Poison Cloud"**
- **Description**: Each hit applies 1 Poison stack (max 5). At 5 stacks, enemy takes +50% damage and spreads poison to nearby enemies. Each poison stack increases your damage by 5%
- **Mechanic**:
  - Each attack adds 1 Poison stack (lasts 12s)
  - At 5 stacks: AOE cloud appears, spreads to nearby mobs
  - Each stack gives you +5% damage (max +25% at 5 stacks)
  - Poison explosion doesn't reset stacks, extends duration
  - Cooldown: 3 seconds between explosive spreads
- **Playstyle**: Stack poison for scaling damage, AoE control
- **Counterplay**: Cleanse removes all stacks instantly

**Gear Progression Sets**

| Tier | Level | Set Name | Required Items | Bonus | Full Set Effect |
|------|-------|----------|-----------------|-------|-----------------|
| 1 | 5-9 | Novice Venom Garb | Venomous Robe, Toxin Ring, Poison Charm | +5% | +1 DEX, +5% Poison Damage |
| 2 | 10-14 | Disciple's Venomous Set | Venom Robes, Plague Band, Toxin Stone | +10% | +2 DEX, +2 WIL, +10% Poison Damage, +10% Stack Apply Rate |
| 3 | 15-19 | Expert Plague Armor | Plague Coat, Miasma Ring, Toxkeeper, Poison Boots | +15% | +3 DEX, +2 WIL, +15% Poison Damage, +15% Stack Apply Rate, +2s Stack Duration |
| 4 | 20-24 | Master Venom Set | Venom Mantle, Plague Ring, Toxin Heart, Contagion Boots | +20% | +5 DEX, +3 WIL, +20% Poison Damage, +20% Stack Apply Rate, +3s Stack Duration, Spread radius +50% |
| 5 | 25-29 | Legendary Eternal Plague | Eternal Toxin Mantle, Infinite Plague Ring, Primordial Venom Core, Pestilence Boots | +25% | +8 DEX, +5 WIL, +25% Poison Damage, +25% Stack Apply Rate, +5s Stack Duration, Spread damage +50%, +10% per stack |

---

## 🗡️ SABER CLASSES (4 TOTAL)

### CLASS 5: ASURA OF WAR

**Identity**
| Property | Value |
|----------|-------|
| **ID** | 5 |
| **Name** | Asura of War |
| **Weapon** | Saber |
| **Element** | Fire |
| **Role** | Aggressive Glass Cannon |
| **Archetype** | High-Risk Physical Attacker |

**Stat Template** (172 AP Distribution)
| Stat | Allocation | % | Points | Purpose |
|------|-----------|---|--------|---------|
| **STR** | Primary | 40% | 69 | Maximum physical damage |
| **CON** | Secondary | 15% | 26 | Minimal survivability |
| **DEX** | Tertiary | 20% | 34 | Attack speed |
| **SPI** | Utility | 15% | 26 | Some elemental synergy |
| **WIL** | Dump | 10% | 17 | Minimal investment |

**Passive Skill: "Desperate Power"**
- **Description**: For every 5% of HP lost below 100%, gain +2% damage (max +50% at 1 HP). When HP drops below 20%, gain +1% attack speed per 1% HP lost
- **Mechanic**:
  - At 95% HP = +2% damage
  - At 50% HP = +20% damage
  - At 1% HP = +50% damage (extremely powerful!)
  - Below 20% HP: also gain scaling attack speed
  - Creates risk/reward gameplay (lower HP = stronger)
- **Playstyle**: Aggressive low-HP fighting for maximum damage
- **Counterplay**: One-shots kill before scaling benefits apply

**Gear Progression Sets**

| Tier | Level | Set Name | Required Items | Bonus | Full Set Effect |
|------|-------|----------|-----------------|-------|-----------------|
| 1 | 5-9 | Novice Warrior Garb | Battle Robe, War Ring, Combat Charm | +5% | +1 STR, +5% Attack Damage |
| 2 | 10-14 | Disciple's War Set | War Robes, Battle Band, War Stone | +10% | +2 STR, +2 DEX, +10% Attack Damage, +3% HP Regen |
| 3 | 15-19 | Expert Berserker Armor | Berserker Coat, Conflict Ring, Warkeeper, Battle Boots | +15% | +3 STR, +2 DEX, +15% Attack Damage, +5% HP Regen, +10% Desperate Power scaling |
| 4 | 20-24 | Master Carnage Set | Carnage Mantle, Slaughter Ring, War Heart, Blood Boots | +20% | +5 STR, +3 DEX, +20% Attack Damage, +8% HP Regen, +15% Desperate Power scaling, Take 10% less damage at low HP |
| 5 | 25-29 | Legendary Eternal Wrath | Eternal War Mantle, Infinite Carnage Ring, Primal War Core, Bloodlust Boots | +25% | +8 STR, +5 DEX, +25% Attack Damage, +12% HP Regen, +25% Desperate Power scaling, Survive lethal damage 1x/30s at 1 HP |

---

### CLASS 6: FROZEN STEEL GUARD

**Identity**
| Property | Value |
|----------|-------|
| **ID** | 6 |
| **Name** | Frozen Steel Guard |
| **Weapon** | Saber |
| **Element** | Ice |
| **Role** | Tank / Crowd Control |
| **Archetype** | Defensive Protector |

**Stat Template** (172 AP Distribution)
| Stat | Allocation | % | Points | Purpose |
|------|-----------|---|--------|---------|
| **CON** | Primary | 35% | 60 | Maximum defense |
| **STR** | Secondary | 25% | 43 | Counter damage |
| **WIL** | Tertiary | 20% | 34 | Control resistance |
| **DEX** | Utility | 15% | 26 | Block chance |
| **SPI** | Dump | 5% | 9 | Minimal investment |

**Passive Skill: "Glacial Barrier"**
- **Description**: Block one incoming attack every 20s (barrier lasts 6s). Blocked attack resets cooldown. Blocked attacks trigger a Counter with 200% damage and apply Chill to attacker
- **Mechanic**:
  - Activate barrier passively (no button needed)
  - First incoming damage = absorbed, cooldown starts
  - If barrier is up when attacked = damage blocked + counter
  - Counter deals 200% weapon damage
  - Cooldown resets if you successfully block
  - Incentivizes tanking for damage output
- **Playstyle**: Defensive tanking with offensive counters
- **Counterplay**: Mages attack while barrier on cooldown

**Gear Progression Sets**

| Tier | Level | Set Name | Required Items | Bonus | Full Set Effect |
|------|-------|----------|-----------------|-------|-----------------|
| 1 | 5-9 | Novice Guardian Plate | Guardian Robes, Protection Ring, Shield Charm | +5% | +1 CON, +5% Block Chance |
| 2 | 10-14 | Disciple's Defense Set | Defense Robes, Barrier Band, Ward Stone | +10% | +2 CON, +2 STR, +10% Block Chance, -3s Barrier Cooldown |
| 3 | 15-19 | Expert Fortress Armor | Fortress Coat, Aegis Ring, Protector, Guard Boots | +15% | +3 CON, +2 STR, +15% Block Chance, -5s Barrier Cooldown, +50% Counter Damage |
| 4 | 20-24 | Master Bastion Set | Bastion Mantle, Sentinel Ring, Fortress Heart, Guardian Boots | +20% | +5 CON, +3 STR, +20% Block Chance, -8s Barrier Cooldown, +100% Counter Damage, Blocked attacks heal 10% HP |
| 5 | 25-29 | Legendary Eternal Shield | Eternal Guardian Mantle, Infinite Protection Ring, Primal Shield Core, Unbreakable Boots | +25% | +8 CON, +5 STR, +25% Block Chance, -10s Barrier Cooldown, +150% Counter Damage, Blocked attacks heal 20% HP, Reflect 50% damage |

---

### CLASS 7: VERDANT BLADE MONARCH

**Identity**
| Property | Value |
|----------|-------|
| **ID** | 7 |
| **Name** | Verdant Blade Monarch |
| **Weapon** | Saber |
| **Element** | Wood |
| **Role** | Sustain DPS / Hybrid |
| **Archetype** | Lifesteal Warrior |

**Stat Template** (172 AP Distribution)
| Stat | Allocation | % | Points | Purpose |
|------|-----------|---|--------|---------|
| **STR** | Primary | 35% | 60 | Physical damage |
| **SPI** | Secondary | 25% | 43 | Healing & lifesteal |
| **CON** | Tertiary | 20% | 34 | Survivability |
| **DEX** | Utility | 15% | 26 | Attack speed |
| **WIL** | Dump | 5% | 9 | Minimal investment |

**Passive Skill: "Lifesteal Aura"**
- **Description**: Every attack heals you for 1% of damage dealt + 1% per unique enemy hit (max 15%). Healing restores QI at 50% rate. When at full HP, gain +20% damage to all attacks
- **Mechanic**:
  - Base: 1% lifesteal per attack
  - Bonus: +1% per enemy hit in last 5s (stacks up to 15 enemies)
  - Healing also restores QI (50% efficiency)
  - Full HP bonus: +20% damage (encourages continuous combat)
  - AOE attacks count each enemy hit
- **Playstyle**: Endless combat warrior who never stops fighting
- **Counterplay**: Prevention (cc/burst) before sustain kicks in

**Gear Progression Sets**

| Tier | Level | Set Name | Required Items | Bonus | Full Set Effect |
|------|-------|----------|-----------------|-------|-----------------|
| 1 | 5-9 | Novice Life Weaver | Life Robe, Vitality Ring, Growth Charm | +5% | +1 STR, +3% Lifesteal |
| 2 | 10-14 | Disciple's Nature Set | Nature Robes, Growth Band, Vital Stone | +10% | +2 STR, +2 SPI, +6% Lifesteal, +20% Healing per enemy |
| 3 | 15-19 | Expert Verdant Armor | Verdant Coat, Nature Ring, Lifekeeper, Vitality Boots | +15% | +3 STR, +2 SPI, +9% Lifesteal, +40% Healing per enemy, +5% Full HP damage |
| 4 | 20-24 | Master Bloom Set | Bloom Mantle, Vitality Ring, Life Heart, Growth Boots | +20% | +5 STR, +3 SPI, +12% Lifesteal, +60% Healing per enemy, +10% Full HP damage, Healing reduces cooldowns by 0.5s |
| 5 | 25-29 | Legendary Eternal Growth | Eternal Life Mantle, Infinite Vitality Ring, Primal Growth Core, Regeneration Boots | +25% | +8 STR, +5 SPI, +15% Lifesteal, +80% Healing per enemy, +15% Full HP damage, Lifesteal triggers area heal, No cooldown on lifesteal |

---

### CLASS 8: WILDERNESS STALKER

**Identity**
| Property | Value |
|----------|-------|
| **ID** | 8 |
| **Name** | Wilderness Stalker |
| **Weapon** | Saber |
| **Element** | Wood |
| **Role** | Rogue DPS / Assassination |
| **Archetype** | Physical Assassin |

**Stat Template** (172 AP Distribution)
| Stat | Allocation | % | Points | Purpose |
|------|-----------|---|--------|---------|
| **STR** | Primary | 30% | 52 | Physical damage |
| **DEX** | Secondary | 30% | 52 | Attack speed, crit |
| **WIL** | Tertiary | 15% | 26 | Stealth/evasion |
| **CON** | Utility | 15% | 26 | Survivability |
| **SPI** | Dump | 10% | 17 | Minimal investment |

**Passive Skill: "Predator's Mark"**
- **Description**: Mark enemy on first hit (lasts 10s). Marked enemies take +30% damage from you and +50% from other sources. Killing marked enemies resets cooldown and extends to nearby enemies
- **Mechanic**:
  - First attack marks enemy (automatic)
  - Marked = +30% your damage, +50% total damage
  - Marked enemies spread on kill (nearby mobs)
  - Each mark extends duration
  - Encourages focusing marked targets
- **Playstyle**: Hunt priority targets, spread marks for team benefit
- **Counterplay**: Avoid marked enemies or cleanse mark

**Gear Progression Sets**

| Tier | Level | Set Name | Required Items | Bonus | Full Set Effect |
|------|-------|----------|-----------------|-------|-----------------|
| 1 | 5-9 | Novice Hunter Garb | Hunter Robe, Tracker Ring, Prey Charm | +5% | +1 DEX, +5% Mark Damage |
| 2 | 10-14 | Disciple's Stalker Set | Stalker Robes, Hunt Band, Tracker Stone | +10% | +2 DEX, +2 STR, +10% Mark Damage, +5% Mark Duration |
| 3 | 15-19 | Expert Predator Armor | Predator Coat, Target Ring, Hunterkeeper, Stalker Boots | +15% | +3 DEX, +2 STR, +15% Mark Damage, +8% Mark Duration, +3% Crit on marked |
| 4 | 20-24 | Master Hunter Set | Hunter Mantle, Predator Ring, Hunt Heart, Tracker Boots | +20% | +5 DEX, +3 STR, +20% Mark Damage, +12% Mark Duration, +5% Crit on marked, Mark spread radius +50% |
| 5 | 25-29 | Legendary Eternal Hunt | Eternal Hunter Mantle, Infinite Tracker Ring, Primal Hunt Core, Apex Predator Boots | +25% | +8 DEX, +5 STR, +25% Mark Damage, +15% Mark Duration, +8% Crit on marked, Mark spread radius +100%, Kill marked = +30% all damage 5s |

---

## 🎵 ZITHER CLASSES (4 TOTAL)

### CLASS 9: PHOENIX CRY CULTIVATOR

**Identity**
| Property | Value |
|----------|-------|
| **ID** | 9 |
| **Name** | Phoenix Cry Cultivator |
| **Weapon** | Zither |
| **Element** | Fire |
| **Role** | Offensive Mage / AoE |
| **Archetype** | Magical Attacker |

**Stat Template** (172 AP Distribution)
| Stat | Allocation | % | Points | Purpose |
|------|-----------|---|--------|---------|
| **SPI** | Primary | 40% | 69 | Maximum spell damage |
| **WIL** | Secondary | 20% | 34 | Control power |
| **CON** | Tertiary | 15% | 26 | Survivability |
| **DEX** | Utility | 15% | 26 | Attack speed |
| **STR** | Dump | 10% | 17 | Minimal investment |

**Passive Skill: "Rebirth Flame"**
- **Description**: When HP drops below 20%, automatically restore 30% HP and gain 3s Immunity (once per combat). After using Rebirth, gain +50% spell damage for 10s. Spell damage from Rebirth stacks (up to 5 stacks)
- **Mechanic**:
  - Auto-trigger at <20% HP
  - Restore 30% HP + full immunity 3s
  - Cooldown: Once per combat (resets on new enemy)
  - After use: +50% spell damage (can stack 5 times = +250%)
  - Encourages aggressive spell spam after survival
- **Playstyle**: Aggressive mage who survives through power
- **Counterplay**: Kill before <20% HP or finish during immunity

**Gear Progression Sets**

| Tier | Level | Set Name | Required Items | Bonus | Full Set Effect |
|------|-------|----------|-----------------|-------|-----------------|
| 1 | 5-9 | Novice Flame Weaver | Flame Robes, Rebirth Ring, Phoenix Charm | +5% | +1 SPI, +5% Spell Power |
| 2 | 10-14 | Disciple's Inferno Set | Inferno Robes, Rebirth Band, Flame Stone | +10% | +2 SPI, +2 WIL, +10% Spell Power, +0.5s Immunity Duration |
| 3 | 15-19 | Expert Phoenix Armor | Phoenix Coat, Rebirth Ring, Lifekeeper, Phoenix Boots | +15% | +3 SPI, +2 WIL, +15% Spell Power, +1s Immunity Duration, +50% Rebirth heal |
| 4 | 20-24 | Master Inferno Set | Inferno Mantle, Phoenix Ring, Rebirth Heart, Flame Boots | +20% | +5 SPI, +3 WIL, +20% Spell Power, +1.5s Immunity Duration, +100% Rebirth heal, +25% Spell damage bonus |
| 5 | 25-29 | Legendary Eternal Phoenix | Eternal Phoenix Mantle, Infinite Rebirth Ring, Primal Phoenix Core, Rising Flame Boots | +25% | +8 SPI, +5 WIL, +25% Spell Power, +2s Immunity Duration, +150% Rebirth heal, +50% Spell damage bonus, Rebirth damages nearby enemies |

---

### CLASS 10: DIVINE MELODY HEALER

**Identity**
| Property | Value |
|----------|-------|
| **ID** | 10 |
| **Name** | Divine Melody Healer |
| **Weapon** | Zither |
| **Element** | Wood |
| **Role** | Support / Healing |
| **Archetype** | Healer |

**Stat Template** (172 AP Distribution)
| Stat | Allocation | % | Points | Purpose |
|------|-----------|---|--------|---------|
| **WIL** | Primary | 35% | 60 | Healing power |
| **SPI** | Secondary | 30% | 52 | Spell power |
| **CON** | Tertiary | 15% | 26 | Survivability |
| **DEX** | Utility | 15% | 26 | Attack speed |
| **STR** | Dump | 5% | 9 | Minimal investment |

**Passive Skill: "Healing Aria"**
- **Description**: Each heal cast grants +15% damage buff to healed target for 8s (stacks with multiple heals). Heals restore 10% of healed amount to you as QI. When 3+ allies are healed in 10s, next heal heals for +50% and restores 20% HP to you
- **Mechanic**:
  - Cast heal → target gets +15% damage
  - Stacks: 2 heals = +30%, 3+ = +45%
  - Healing = heal amount × 10% as QI to you
  - Track ally heals: 3 different allies in 10s = buff next heal
  - Incentivizes spread healing vs single focus
- **Playstyle**: Support mage who buffs allies and sustains
- **Counterplay**: Cleanse buffs or burst target before healing applies

**Gear Progression Sets**

| Tier | Level | Set Name | Required Items | Bonus | Full Set Effect |
|------|-------|----------|-----------------|-------|-----------------|
| 1 | 5-9 | Novice Mender's Garb | Mender Robes, Life Ring, Healing Charm | +5% | +1 WIL, +5% Healing Power |
| 2 | 10-14 | Disciple's Healer Set | Healer Robes, Support Band, Vitality Stone | +10% | +2 WIL, +2 SPI, +10% Healing Power, +0.5s Buff Duration |
| 3 | 15-19 | Expert Priest Armor | Priest Coat, Grace Ring, Caretaker, Holy Boots | +15% | +3 WIL, +2 SPI, +15% Healing Power, +1s Buff Duration, +25% Multi-heal damage buff |
| 4 | 20-24 | Master Radiant Set | Radiant Mantle, Blessing Ring, Grace Heart, Saint Boots | +20% | +5 WIL, +3 SPI, +20% Healing Power, +1.5s Buff Duration, +50% Multi-heal damage buff, Heals reduce ally cooldowns by 0.5s |
| 5 | 25-29 | Legendary Eternal Grace | Eternal Grace Mantle, Infinite Blessing Ring, Primal Healing Core, Celestial Boots | +25% | +8 WIL, +5 SPI, +25% Healing Power, +2s Buff Duration, +75% Multi-heal damage buff, Heals restore 20% ally QI, Heals trigger group shield |

---

### CLASS 11: PHANTOM MUSICIAN

**Identity**
| Property | Value |
|----------|-------|
| **ID** | 11 |
| **Name** | Phantom Musician |
| **Weapon** | Zither |
| **Element** | Ice |
| **Role** | Control / Evasion |
| **Archetype** | Control Mage |

**Stat Template** (172 AP Distribution)
| Stat | Allocation | % | Points | Purpose |
|------|-----------|---|--------|---------|
| **SPI** | Primary | 30% | 52 | Spell power |
| **DEX** | Secondary | 30% | 52 | Attack speed, dodge |
| **WIL** | Tertiary | 20% | 34 | Control power |
| **CON** | Utility | 15% | 26 | Survivability |
| **STR** | Dump | 5% | 9 | Minimal investment |

**Passive Skill: "Ethereal Form"**
- **Description**: Dodge cooldown reduced by 30%. Each successful dodge triggers auto-cast of frost bolt (free, instant). Dodging restores 5% QI. When you dodge 3+ attacks in 10s, gain +25% spell damage and Untargetable for 2s
- **Mechanic**:
  - Dodge cooldown normally 6s, reduce to 4.2s
  - Dodge auto-casts frost bolt (no QI cost)
  - Dodging = +5% QI
  - Track dodge counter: 3 dodges in 10s = buff
  - Buff = +25% spell damage + 2s untargetable (OP! But rare)
  - Encourages reactive evasion gameplay
- **Playstyle**: Dodging defensive mage who counters through evasion
- **Counterplay**: AOE or guaranteed hits (unavoidable attacks)

**Gear Progression Sets**

| Tier | Level | Set Name | Required Items | Bonus | Full Set Effect |
|------|-------|----------|-----------------|-------|-----------------|
| 1 | 5-9 | Novice Phantom Garb | Phantom Robes, Evasion Ring, Escape Charm | +5% | +1 DEX, +5% Dodge Chance |
| 2 | 10-14 | Disciple's Phantom Set | Phantom Robes, Phantom Band, Drift Stone | +10% | +2 DEX, +2 SPI, +10% Dodge Chance, +15% Frost Bolt Damage |
| 3 | 15-19 | Expert Ghost Armor | Ghost Coat, Phantom Ring, Elusion, Ghost Boots | +15% | +3 DEX, +2 SPI, +15% Dodge Chance, +25% Frost Bolt Damage, +0.5s Untargetable buff |
| 4 | 20-24 | Master Specter Set | Specter Mantle, Ghost Ring, Spirit Heart, Wraith Boots | +20% | +5 DEX, +3 SPI, +20% Dodge Chance, +35% Frost Bolt Damage, +1s Untargetable buff, Dodges reduce spell cooldowns by 0.5s |
| 5 | 25-29 | Legendary Eternal Phantom | Eternal Phantom Mantle, Infinite Ghost Ring, Primal Evasion Core, Shadow Boots | +25% | +8 DEX, +5 SPI, +25% Dodge Chance, +50% Frost Bolt Damage, +1.5s Untargetable buff, Dodges restore 10% QI, Dodge counter resets every dodge |

---

### CLASS 12: UNBREAKABLE SPIRIT SAGE

**Identity**
| Property | Value |
|----------|-------|
| **ID** | 12 |
| **Name** | Unbreakable Spirit Sage |
| **Weapon** | Zither |
| **Element** | Ice |
| **Role** | Debuff Tank / Support |
| **Archetype** | Debuff Specialist |

**Stat Template** (172 AP Distribution)
| Stat | Allocation | % | Points | Purpose |
|------|-----------|---|--------|---------|
| **WIL** | Primary | 35% | 60 | Control resistance |
| **CON** | Secondary | 30% | 52 | Tankiness |
| **SPI** | Tertiary | 20% | 34 | Spell power |
| **DEX** | Utility | 10% | 17 | Attack speed |
| **STR** | Dump | 5% | 9 | Minimal investment |

**Passive Skill: "Fortified Mind"**
- **Description**: Resist all debuffs applied to you. Each resisted debuff grants +5% DEF (stacks, max +50% at 10 resists). Resisting debuffs slows enemies by 30% for 4s. When 5+ debuffs are resisted in 20s, gain Unstoppable (immune to CC, +30% damage) for 5s
- **Mechanic**:
  - Automatic debuff resistance (passive)
  - Each resist = +5% DEF stacking
  - Resist = enemy slow 30% for 4s
  - Track resists: 5 in 20s = unstoppable buff
  - Buff = CC immune + 30% damage (powerful!)
  - Incentivizes fighting debuff-heavy enemies
- **Playstyle**: Control tank who grows stronger against debuffs
- **Counterplay**: Use guaranteed damage (burst) before resist stacking

**Gear Progression Sets**

| Tier | Level | Set Name | Required Items | Bonus | Full Set Effect |
|------|-------|----------|-----------------|-------|-----------------|
| 1 | 5-9 | Novice Spirit Weaver | Spirit Robes, Will Ring, Resolve Charm | +5% | +1 WIL, +5% Debuff Resistance |
| 2 | 10-14 | Disciple's Sage Set | Sage Robes, Wisdom Band, Mind Stone | +10% | +2 WIL, +2 CON, +10% Debuff Resistance, +5% Resist DEF gain |
| 3 | 15-19 | Expert Stoic Armor | Stoic Coat, Resolve Ring, Mindkeeper, Sage Boots | +15% | +3 WIL, +2 CON, +15% Debuff Resistance, +10% Resist DEF gain, +2s Slow Duration |
| 4 | 20-24 | Master Unbreakable Set | Unbreakable Mantle, Fortitude Ring, Will Heart, Bastion Boots | +20% | +5 WIL, +3 CON, +20% Debuff Resistance, +15% Resist DEF gain, +3s Slow Duration, Resists restore 5% HP |
| 5 | 25-29 | Legendary Eternal Will | Eternal Will Mantle, Infinite Fortitude Ring, Primal Resolve Core, Immutable Boots | +25% | +8 WIL, +5 CON, +25% Debuff Resistance, +20% Resist DEF gain, +4s Slow Duration, Resists restore 10% HP, Unstoppable lasts 7s |

---

## 📊 CLASS COMPARISON MATRIX

| Class | Weapon | Element | Primary | Secondary | Role | Playstyle | Difficulty |
|-------|--------|---------|---------|-----------|------|-----------|-----------|
| 1. Blazing Sword | Sword | Fire | DEX | SPI | Pure DPS | Spam hits for burst | Easy |
| 2. Glacial Shadow | Sword | Ice | DEX | STR | DPS/Control | Freeze enemies | Medium |
| 3. Spellfire Duelist | Sword | Fire | SPI | DEX | Hybrid | Spell → Attack rotation | Medium |
| 4. Toxic Viper | Sword | Wood | DEX | WIL | DoT DPS | Stack poison | Medium |
| 5. Asura of War | Saber | Fire | STR | CON | Glass Cannon | Low HP = High damage | Hard |
| 6. Frozen Steel Guard | Saber | Ice | CON | STR | Tank | Block & counter | Medium |
| 7. Verdant Blade Monarch | Saber | Wood | STR | SPI | Sustain DPS | Lifesteal forever | Medium |
| 8. Wilderness Stalker | Saber | Wood | STR | DEX | Rogue DPS | Mark targets | Medium |
| 9. Phoenix Cry Cultivator | Zither | Fire | SPI | WIL | Offensive Mage | Survive then burst | Hard |
| 10. Divine Melody Healer | Zither | Wood | WIL | SPI | Support | Heal & buff | Easy |
| 11. Phantom Musician | Zither | Ice | SPI | DEX | Control | Dodge & counter | Hard |
| 12. Unbreakable Spirit Sage | Zither | Ice | WIL | CON | Debuff Tank | Resist debuffs | Medium |

---

## 🎯 STAT ALLOCATION TEMPLATES (READY TO IMPLEMENT)

All templates assume 172 total AP to distribute:

```typescript
const classStatTemplates = {
    1: { str: 43, dex: 60, con: 26, spi: 34, wil: 9 },      // Blazing Sword
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
```

---

## ✨ SUMMARY

✅ **12 Complete Classes**  
✅ **All with unique passives**  
✅ **60 Gear Sets total (5 per class)**  
✅ **Balanced distribution (4 per weapon, all elements, all stats as primary)**  
✅ **Ready for implementation**  

Next: Implement in constants.ts and create selection UI!

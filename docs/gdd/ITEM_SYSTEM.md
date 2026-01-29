# 🎮 WuxiaMUD - Item System GDD

**Version:** 1.0  
**Last Updated:** January 19, 2026  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Equipment Slots](#equipment-slots)
3. [Weapons (48 Items)](#weapons-48-items)
4. [Accessories (8 Items)](#accessories-8-items)
5. [Materials (15 Items)](#materials-15-items)
6. [Acquisition Methods](#acquisition-methods)
7. [Crafting Recipes](#crafting-recipes)
8. [Stat Scaling Analysis](#stat-scaling-analysis)
9. [Full Item List](#full-item-list)

---

## 🎯 System Overview

### Core Design Philosophy
- **3 Equipment Slots:** Weapon (class-specific) + Ring + Necklace (generic)
- **4 Tiers:** Matching the 29-level cap across 3 realms
- **5 Rarities:** Common → Uncommon → Rare → Epic → Legendary
- **Semi-Hardcore:** Meaningful grind, pity systems prevent frustration

### Tier → Level Mapping

| Tier | Realm | Level Range | Content Difficulty |
|------|-------|-------------|-------------------|
| T1 | Qi Condensation | 1-9 | Easy |
| T2 | Foundation Est. Early | 10-14 | Medium |
| T3 | Foundation Est. Late | 15-19 | Hard |
| T4 | Golden Core | 20-29 | Endgame |

---

## 🎒 Equipment Slots

### Current Implementation (v1.0)

| Slot | Type | Items Available | Class-Specific? |
|------|------|----------------|-----------------|
| **Weapon** | Main Hand | 48 (12 classes × 4 tiers) | ✅ Yes |
| **Ring** | Accessory | 4 (1 per tier) | ❌ No |
| **Necklace** | Accessory | 4 (1 per tier) | ❌ No |

### Future Slots (Reserved)

| Slot | Planned | Notes |
|------|---------|-------|
| Chest | v2.0 | Armor system |
| Legs | v2.0 | Armor system |
| Boots | v2.0 | Movement bonuses |

---

## ⚔️ Weapons (48 Items)

### Stat Distribution Pattern

| Tier | Total Stats | Primary | Secondary | Set Bonus |
|------|-------------|---------|-----------|-----------|
| T1 | ~5 | 3-4 | 1-2 | 5% |
| T2 | ~9 | 5-6 | 3-4 | 10% |
| T3 | ~14 | 8-9 | 5-6 | 15% |
| T4 | ~21 | 12-13 | 8-9 | 22% |

### SWORD CLASSES (Classes 1-4)

#### Class 1: Blazing Sword Immortal
*Fire element, DPS focus (STR/DEX)*

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| SW_T1_001 | 1 | Ember Novice Blade | STR+3, DEX+2 | Uncommon | - |
| SW_T2_001 | 2 | Crimson Flame Sword | STR+5, DEX+4 | Rare | - |
| SW_T3_001 | 3 | Vermillion Immortal Blade | STR+8, DEX+6 | Epic | 15% ignite (20 dmg/turn, 3 turns) |
| SW_T4_001 | 4 | Golden Flame Core Blade | STR+12, DEX+9 | Legendary | 25% ignite, Phoenix Rebirth (30% HP revive) |

#### Class 2: Glacial Shadow
*Ice element, Speed/Evasion focus (DEX/WIL)*

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| SW_T1_002 | 1 | Azure Shadow Blade | DEX+4, WIL+1 | Uncommon | - |
| SW_T2_002 | 2 | Frostbite Dancer | DEX+6, WIL+3 | Rare | - |
| SW_T3_002 | 3 | Winter Moon Shadow | DEX+9, WIL+5 | Epic | 20% freeze (1 turn) |
| SW_T4_002 | 4 | Golden Ice Shadow Sword | DEX+13, WIL+8 | Legendary | 30% freeze, Shadow Step (dodge after crit) |

#### Class 3: Spellfire Duelist
*Fire/Lightning, Hybrid caster (STR/SPI)*

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| SW_T1_003 | 1 | Qi Spark Blade | STR+2, SPI+3 | Uncommon | - |
| SW_T2_003 | 2 | Mystical Flame Dancer | STR+4, SPI+5 | Rare | - |
| SW_T3_003 | 3 | Thunder Flame Duelist | STR+6, SPI+8 | Epic | Spell Echo: 15% double cast |
| SW_T4_003 | 4 | Golden Spellfire Core Sword | STR+9, SPI+12 | Legendary | Spell Echo: 25%, Lightning Reflexes: +20% dodge |

#### Class 4: Toxic Viper
*Wood/Poison, DoT focus (DEX/WIL)*

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| SW_T1_004 | 1 | Venom Snake Blade | DEX+3, WIL+2 | Uncommon | - |
| SW_T2_004 | 2 | Poison Serpent Fang | DEX+5, WIL+4 | Rare | - |
| SW_T3_004 | 3 | Vipers Curse Blade | DEX+8, WIL+6 | Epic | Poison Cloud: 18% stacking poison |
| SW_T4_004 | 4 | Golden Venom Core Sword | DEX+12, WIL+9 | Legendary | Poison Cloud: 30%, Venom Mastery: +100% poison dmg |

---

### SABER CLASSES (Classes 5-8)

#### Class 5: Asura of War
*Fire, Berserker tank (STR/CON)*

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| SB_T1_005 | 1 | Asura Novice Saber | STR+4, CON+2 | Uncommon | - |
| SB_T2_005 | 2 | Demon King Saber | STR+6, CON+4 | Rare | - |
| SB_T3_005 | 3 | Asura War Blade | STR+9, CON+6 | Epic | Asura Rage: +30% ATK below 40% HP |
| SB_T4_005 | 4 | Golden Asura Core Saber | STR+13, CON+9 | Legendary | Asura Rage: +50% ATK, War God: 15% lifesteal |

#### Class 6: Frozen Steel Guard
*Ice, Pure tank (CON/WIL)*

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| SB_T1_006 | 1 | Frost Wall Saber | CON+4, WIL+1 | Uncommon | - |
| SB_T2_006 | 2 | Azure Guardian Saber | CON+6, WIL+2 | Rare | - |
| SB_T3_006 | 3 | Frozen Steel Fortress | CON+9, WIL+4 | Epic | Glacial Barrier: 25% shield (50 absorb) |
| SB_T4_006 | 4 | Golden Ice Guardian Core | CON+13, WIL+6 | Legendary | Glacial Barrier: 40%, Fortress: -20% damage taken |

#### Class 7: Verdant Blade Monarch
*Wood, Sustain (STR/SPI)*

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| SB_T1_007 | 1 | Forest Novice Saber | STR+2, SPI+3 | Uncommon | - |
| SB_T2_007 | 2 | Green Sovereign Blade | STR+4, SPI+5 | Rare | - |
| SB_T3_007 | 3 | Verdant Monarch Saber | STR+6, SPI+8 | Epic | Nature's Blessing: Heal 15 HP/2 turns |
| SB_T4_007 | 4 | Golden Nature Core Blade | STR+9, SPI+12 | Legendary | Nature's Blessing: 30 HP/turn, +30% healing |

#### Class 8: Wilderness Stalker
*Wood, Speed hunter (DEX/CON)*

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| SB_T1_008 | 1 | Beast Hunter Saber | DEX+4, CON+1 | Uncommon | - |
| SB_T2_008 | 2 | Wilderness Predator | DEX+6, CON+2 | Rare | - |
| SB_T3_008 | 3 | Wild Stalker Saber | DEX+9, CON+4 | Epic | Beast Hunt: +50% dmg to <30% HP targets |
| SB_T4_008 | 4 | Golden Beast Core King | DEX+13, CON+6 | Legendary | Beast Hunt: +100%, Hunter Instinct: Crit heals 25 HP |

---

### ZITHER CLASSES (Classes 9-12)

#### Class 9: Phoenix Cry Cultivator
*Fire, AoE caster (SPI/WIL)*

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| ZT_T1_009 | 1 | Flame Song Zither | SPI+4, WIL+2 | Uncommon | - |
| ZT_T2_009 | 2 | Phoenix Cry Instrument | SPI+6, WIL+4 | Rare | - |
| ZT_T3_009 | 3 | Fire Phoenix Zither | SPI+9, WIL+6 | Epic | Phoenix Rebirth: Heal to 40% at 0 HP (once) |
| ZT_T4_009 | 4 | Golden Phoenix Core Zither | SPI+13, WIL+9 | Legendary | Phoenix Rebirth: 60%, Flame Aura: 10 dmg/turn |

#### Class 10: Divine Melody Healer
*Lightning, Support (SPI/CON)*

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| ZT_T1_010 | 1 | Healing Hymn Zither | SPI+4, CON+2 | Uncommon | - |
| ZT_T2_010 | 2 | Divine Grace Melody | SPI+6, CON+4 | Rare | - |
| ZT_T3_010 | 3 | Celestial Healer Zither | SPI+9, CON+6 | Epic | Divine Grace: +50% healing |
| ZT_T4_010 | 4 | Golden Divine Core Melody | SPI+13, CON+9 | Legendary | Divine Grace: +80%, Celestial Protection: -15% dmg |

#### Class 11: Phantom Musician
*Void, Control/Evasion (DEX/WIL)*

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| ZT_T1_011 | 1 | Shadow Song Zither | DEX+3, WIL+3 | Uncommon | - |
| ZT_T2_011 | 2 | Phantom Dance Melody | DEX+5, WIL+5 | Rare | - |
| ZT_T3_011 | 3 | Void Phantom Zither | DEX+8, WIL+8 | Epic | Shadow Step: 20% full evasion (1 turn) |
| ZT_T4_011 | 4 | Golden Shadow Core Phantom | DEX+12, WIL+12 | Legendary | Shadow Step: 35%, Void Strike: -50% enemy DEF |

#### Class 12: Unbreakable Spirit Sage
*Void, Tank caster (CON/WIL)*

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| ZT_T1_012 | 1 | Spirit Guardian Zither | CON+4, WIL+2 | Uncommon | - |
| ZT_T2_012 | 2 | Sage Spirit Shield | CON+6, WIL+4 | Rare | - |
| ZT_T3_012 | 3 | Unbreakable Sage Zither | CON+9, WIL+6 | Epic | Spirit Fortitude: +20% max HP |
| ZT_T4_012 | 4 | Golden Spirit Core Fortress | CON+13, WIL+9 | Legendary | Spirit Fortitude: +35%, Immune to stun/freeze |

---

## 💍 Accessories (8 Items)

### Rings (Generic - All Classes)

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| RING_T1_001 | 1 | Jade Spirit Ring | STR+1, DEX+1, CON+1 | Uncommon | - |
| RING_T2_001 | 2 | Azure Cloud Ring | STR+2, DEX+2, CON+2 | Rare | - |
| RING_T3_001 | 3 | Heavenly Thunder Ring | STR+4, DEX+3, CON+3 | Epic | Lightning Surge: 10% bonus lightning dmg |
| RING_T4_001 | 4 | Golden Core Immortal Ring | STR+6, DEX+5, CON+4 | Legendary | Core Resonance: +8% stats at >70% HP, Immune to instant death |

### Necklaces (Generic - All Classes)

| ID | Tier | Name | Stats | Rarity | Special Effects |
|----|------|------|-------|--------|-----------------|
| NECK_T1_001 | 1 | Qi Gathering Pendant | SPI+2, WIL+1 | Uncommon | - |
| NECK_T2_001 | 2 | Foundation Jade Amulet | SPI+4, WIL+2 | Rare | - |
| NECK_T3_001 | 3 | Nine Yang Pendant | SPI+6, WIL+4 | Epic | Yang Protection: -15% ice damage taken |
| NECK_T4_001 | 4 | Celestial Jade Necklace | SPI+8, WIL+6, CON+2 | Legendary | Heavenly Insight: +15% skill success, Dao Heart: 2% HP regen/turn |

### Set Bonuses (Matching Tier Ring + Necklace)

| Tier | Set Name | Bonus Stats | Bonus Effect |
|------|----------|-------------|--------------|
| T1 | Novice Cultivator | +1 all stats | - |
| T2 | Foundation Seeker | +2 all stats | +5% EXP gain |
| T3 | Heaven's Chosen | +3 all stats | +10% damage resistance |
| T4 | Golden Immortal | +5 all stats | +20% damage dealt |

---

## 🧪 Materials (15 Items)

### Tier 1 Materials (Lv 1-9)

| ID | Name | Rarity | Drop Rate | Source |
|----|------|--------|-----------|--------|
| MAT_T1_001 | Spirit Iron Ore | Common | 15% | Qi Condensation mobs |
| MAT_T1_002 | Qi Fragment | Common | 12% | Qi Condensation mobs |

### Tier 2 Materials (Lv 10-14)

| ID | Name | Rarity | Drop Rate | Source |
|----|------|--------|-----------|--------|
| MAT_T2_001 | Azure Crystal | Uncommon | 15% | Foundation Est. mobs |
| MAT_T2_002 | Foundation Stone | Uncommon | 10% | Foundation Est. mobs |

### Tier 3 Materials (Lv 15-19)

| ID | Name | Rarity | Drop Rate | Source |
|----|------|--------|-----------|--------|
| MAT_T3_001 | Thunder Essence | Rare | 15% | Late Foundation mobs |
| MAT_T3_002 | Sky Iron Ingot | Rare | 8% | Late Foundation mobs |

### Tier 4 Materials (Lv 20-29)

| ID | Name | Rarity | Drop Rate | Source |
|----|------|--------|-----------|--------|
| MAT_T4_001 | Golden Core Fragment | Epic | 10% | Golden Core mobs |
| MAT_T4_002 | Core Qi Essence | Epic | 7% | Golden Core mobs |

### Special Materials (Boss Drops)

| ID | Name | Rarity | Drop Rate | Source |
|----|------|--------|-----------|--------|
| MAT_SP_001 | Bloodsteel | Epic | 5% | All bosses |
| MAT_SP_002 | Immortal Jade | Legendary | 2% | Lv 20+ bosses |
| MAT_SP_003 | Class Token - Sword | Rare | 3% | Sword-wielding bosses |
| MAT_SP_004 | Class Token - Saber | Rare | 3% | Saber-wielding bosses |
| MAT_SP_005 | Class Token - Zither | Rare | 3% | Zither-wielding bosses |

---

## 🎯 Acquisition Methods

### How to Get Full Set (3 Slots)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FULL SET ACQUISITION PATH                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WEAPON (Class-Specific)                                        │
│  ├── Drop: 2% from mobs matching your tier (35% from bosses)   │
│  ├── Craft: Requires tier materials + class token (T4)         │
│  └── Reforge: Upgrade rarity (Common → Legendary)              │
│                                                                 │
│  RING (Generic)                                                 │
│  ├── Drop: 1% from any mob (shared accessory pool)             │
│  ├── Craft: Requires tier materials (no class token)           │
│  └── Reforge: Same as weapons                                  │
│                                                                 │
│  NECKLACE (Generic)                                             │
│  ├── Drop: 1% from any mob (shared accessory pool)             │
│  ├── Craft: Requires tier materials (no class token)           │
│  └── Reforge: Same as weapons                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Progression Path Example (Blazing Sword Immortal)

```
TIER 1 (Level 1-9):
├── Farm: Spirit Rats, Garden Spiders, Sect Servants
├── Goal: Spirit Iron Ore ×10, Qi Fragment ×5
├── Craft: Ember Novice Blade + Jade Spirit Ring + Qi Gathering Pendant
└── Time: ~2-4 hours

TIER 2 (Level 10-14):
├── Farm: Ghost Cultivators, Iron Claw Chiefs
├── Goal: Azure Crystal ×15, Foundation Stone ×8
├── Craft: Crimson Flame Sword + Azure Cloud Ring + Foundation Jade Amulet
└── Time: ~4-6 hours

TIER 3 (Level 15-19):
├── Farm: Flame Demons, Lightning Elementals
├── Goal: Thunder Essence ×20, Sky Iron ×10
├── Craft: Vermillion Immortal Blade + Heavenly Thunder Ring + Nine Yang Pendant
└── Time: ~8-12 hours

TIER 4 (Level 20-29):
├── Farm: Void Beasts, Thunder Dragons, Undead Emperor
├── Goal: Golden Core Fragment ×20, Core Qi ×10, Bloodsteel ×2, Sword Token ×1
├── Craft: Golden Flame Core Blade + Golden Core Ring + Celestial Jade Necklace
├── Reforge: Common → Legendary (requires Bloodsteel, Immortal Jade)
└── Time: ~20-40 hours
```

---

## 🔨 Crafting Recipes

### Weapon Crafting Costs

| Tier | Materials Required | Spirit Stones | Success Rate |
|------|-------------------|---------------|--------------|
| T1 | Spirit Iron ×10, Qi Fragment ×5 | 500 | 85% |
| T2 | Azure Crystal ×15, Foundation Stone ×8, Spirit Iron ×5 | 2,500 | 75% |
| T3 | Thunder Essence ×20, Sky Iron ×10, Azure Crystal ×8 | 10,000 | 65% |
| T4 | Core Fragment ×20, Core Qi ×10, Bloodsteel ×2, Class Token ×1 | 50,000 | 60% |

### Accessory Crafting Costs

| Tier | Ring Materials | Necklace Materials | Stones | Success |
|------|----------------|-------------------|--------|---------|
| T1 | Spirit Iron ×8, Qi Fragment ×4 | Qi Fragment ×8, Spirit Iron ×4 | 400 | 90% |
| T2 | Azure Crystal ×12, Foundation Stone ×6 | Foundation Stone ×12, Azure Crystal ×6 | 2,000 | 80% |
| T3 | Thunder Essence ×15, Sky Iron ×8 | Sky Iron ×15, Thunder Essence ×8 | 8,000 | 70% |
| T4 | Core Fragment ×15, Core Qi ×8, Immortal Jade ×1 | Core Qi ×15, Core Fragment ×8, Immortal Jade ×1 | 40,000 | 65% |

### Reforging Costs

| Upgrade Path | Bloodsteel | Immortal Jade | Stones | Success | On Fail |
|--------------|------------|---------------|--------|---------|---------|
| Common → Uncommon | 3 | 0 | 5,000 | 80% | Keep |
| Uncommon → Rare | 8 | 0 | 15,000 | 60% | Downgrade |
| Rare → Epic | 15 | 1 | 35,000 | 40% | Downgrade |
| Epic → Legendary | 30 | 3 | 100,000 | 20% | DESTROY |

---

## 📊 Stat Scaling Analysis

### Player Stats at Key Levels

| Level | Base Stats | AP Earned | Total Points | Realm |
|-------|------------|-----------|--------------|-------|
| 1 | 50 (10×5) | 0 | 50 | Qi Condensation |
| 9 | 50 | 36 | 86 | Qi Condensation Peak |
| 10 | 50 | 40 | 90 | Foundation Est. |
| 19 | 50 | 100 | 150 | Foundation Peak |
| 20 | 50 | 108 | 158 | Golden Core |
| 29 | 50 | 176 | 226 | Golden Core Peak |

### Equipment Contribution (Full T4 Set)

| Slot | Stats | % of Total |
|------|-------|------------|
| Weapon (T4 Legendary) | ~21-24 | ~9-10% |
| Ring (T4 Legendary) | ~15 | ~6-7% |
| Necklace (T4 Legendary) | ~16 | ~7% |
| **Total Equipment** | **~52-55** | **~22-24%** |

### Combat Stats at Level 29 (Full T4 Legendary)

**Example: Blazing Sword Immortal with optimized build**

| Stat | Base | Equipment | Total | Combat Value |
|------|------|-----------|-------|--------------|
| STR | 60 | +18 | 78 | pAtk: ~120 |
| DEX | 50 | +14 | 64 | Crit: 32%, Dodge: 25.6% |
| CON | 40 | +5 | 45 | DEF: ~90, HP: ~550 |
| SPI | 40 | +8 | 48 | mAtk: ~80 |
| WIL | 36 | +7 | 43 | Resistance: +43% |

### Mob Comparison (Endgame)

| Mob | Level | HP | ATK | DEF | Difficulty |
|-----|-------|----|----|-----|------------|
| Void Beast | 20 | 2150 | 95 | 52 | Challenging |
| Void Sovereign | 25 | 2700 | 115 | 56 | Hard |
| Thunder Dragon | 26 | 2850 | 130 | 58 | Very Hard |
| Undead Emperor | 28 | 3100 | 135 | 64 | Boss |

**Conclusion:** With 3 slots (T4 Legendary), players have sufficient stats to complete all content up to level 28-29. The system is balanced for challenging but achievable endgame.

---

## 📋 Full Item List (71 Total)

### Weapons: 48 Items

| Type | Classes | Items/Class | Total |
|------|---------|-------------|-------|
| Sword | 4 | 4 tiers | 16 |
| Saber | 4 | 4 tiers | 16 |
| Zither | 4 | 4 tiers | 16 |

### Accessories: 8 Items

| Type | Tiers | Total |
|------|-------|-------|
| Rings | 4 | 4 |
| Necklaces | 4 | 4 |

### Materials: 15 Items

| Category | Count |
|----------|-------|
| Tier 1 | 2 |
| Tier 2 | 2 |
| Tier 3 | 2 |
| Tier 4 | 2 |
| Special | 5 |
| Legacy (itemDatabase) | 2 consumables + extra |

---

## 📁 Source Files

```
src/data/
├── gearItems.ts       # 48 class-specific weapons
├── accessoryItems.ts  # 8 generic accessories (rings + necklaces)
├── materials.ts       # 15 crafting materials
├── craftingSystem.ts  # All crafting & reforging recipes
├── pitySystem.ts      # Anti-frustration mechanics
└── constants.ts       # Classes, mobs, zones, legacy items
```

---

*Document generated for WuxiaMUD v1.0 - January 2026*

# 🧘 LEVEL SCALING SYSTEM - GAME DESIGN DOCUMENT

---

## 📊 GAME OVERVIEW

| Metric | Value |
|--------|-------|
| **Game Type** | Semi-Idle Grinding Economy |
| **Target Playtime** | 300-350 hours to Level 29 |
| **Progression Type** | Gradual Attribute Growth + AP Allocation |
| **Max Level** | 29 |
| **Total Realms** | 3 (Qi Condensation → Foundation → Golden Core) |

---

## ⚡ STARTING STATS (LEVEL 1)

| Stat | Base Value | Purpose |
|------|-----------|---------|
| **HP** | 100 | Health pool |
| **QI** | 50 | Spiritual energy / Mana |
| **STR** | 10 | Physical damage scaling |
| **DEX** | 10 | Attack speed, Crit, Dodge |
| **CON** | 10 | Health & Defense |
| **SPI** | 10 | Magic damage & QI pool |
| **WIL** | 10 | Focus & Resilience |

---

## 🎯 ABILITY POINT (AP) ALLOCATION SYSTEM

### AP Acquisition Schedule

| Realm | Level Range | AP Per Level | Cumulative AP | Notes |
|-------|------------|-------------|---------------|-------|
| **Qi Condensation** | 1-9 | 4 AP | 32 AP | Quick progression, story phase |
| **Foundation Establishment** | 10-19 | 6 AP | 92 AP total | Moderate pace, mid-game |
| **Golden Core** | 20-29 | 8 AP | 172 AP total | Full maturity, endgame |

### 💡 CLASS BUILD TEMPLATES (AP Distribution at Level 29)

**Physical DPS Build**
| STR | DEX | CON | SPI | WIL | Total |
|-----|-----|-----|-----|-----|-------|
| 50 | 40 | 30 | 20 | 12 | 152 AP |

**Magic DPS Build**
| STR | DEX | CON | SPI | WIL | Total |
|-----|-----|-----|-----|-----|-------|
| 20 | 20 | 25 | 50 | 35 | 150 AP |

**Tank Build**
| STR | DEX | CON | SPI | WIL | Total |
|-----|-----|-----|-----|-----|-------|
| 45 | 18 | 60 | 14 | 20 | 157 AP |

**Support/Healer Build**
| STR | DEX | CON | SPI | WIL | Total |
|-----|-----|-----|-----|-----|-------|
| 0 | 20 | 12 | 40 | 50 | 122 AP |

---

## 📈 HP & QI SCALING FORMULAS

### Health Point (HP) Scaling Formula
```
Max HP = 100 + (CON × 7.5) + (Level × 2)
```

| Level | CON | Base | CON Bonus | Level Bonus | **Total HP** |
|-------|-----|------|-----------|-------------|---------|
| 1 | 10 | 100 | 75 | 2 | **177 HP** |
| 5 | 12 | 100 | 90 | 10 | **200 HP** |
| 10 | 15 | 100 | 112.5 | 20 | **232 HP** |
| 15 | 18 | 100 | 135 | 30 | **265 HP** |
| 20 | 22 | 100 | 165 | 40 | **305 HP** |
| 25 | 28 | 100 | 210 | 50 | **360 HP** |
| **29** | **35** | **100** | **262.5** | **58** | **420 HP** |

---

### Spiritual Energy (QI) Scaling Formula
```
Max QI = 50 + (SPI × 5) + (Level × 1.5)
```

| Level | SPI | Base | SPI Bonus | Level Bonus | **Total QI** |
|-------|-----|------|-----------|-------------|----------|
| 1 | 10 | 50 | 50 | 1.5 | **101 QI** |
| 5 | 11 | 50 | 55 | 7.5 | **112 QI** |
| 10 | 13 | 50 | 65 | 15 | **130 QI** |
| 15 | 15 | 50 | 75 | 22.5 | **147 QI** |
| 20 | 18 | 50 | 90 | 30 | **170 QI** |
| 25 | 22 | 50 | 110 | 37.5 | **197 QI** |
| **29** | **28** | **50** | **140** | **43.5** | **233 QI** |

---

### 🗡️ Physical Attack (pATK) Formula
```
pATK = (STR × 1.5) + (SPI × 0.2) + Weapon Bonus
```

| Level | STR | SPI | Base pATK | With Weapon | Notes |
|-------|-----|-----|-----------|------------|-------|
| 1 | 10 | 10 | 16 | 17 | Starter damage |
| 10 | 15 | 13 | 24 | 25 | Early game |
| 20 | 25 | 18 | 39 | 41 | Mid game |
| **29** | **35** | **28** | **54** | **58** | Peak damage |

---

### 🔮 Magical Attack (mATK) Formula
```
mATK = (SPI × 1.5) + (STR × 0.2) + Staff Bonus
```

| Level | SPI | STR | Base mATK | With Staff | Notes |
|-------|-----|-----|-----------|-----------|-------|
| 1 | 10 | 10 | 16 | 17 | Starter magic |
| 10 | 13 | 15 | 22 | 22.5 | Early game |
| 20 | 18 | 25 | 30 | 32 | Mid game |
| **29** | **28** | **35** | **42** | **49** | Peak magic |

---

### 🛡️ Defense (DEF) Formula
```
DEF = CON × 2
```

| Level | CON | **DEF** | Damage Reduction | Notes |
|-------|-----|---------|-----------------|-------|
| 1 | 10 | 20 | Low | Easy damage |
| 10 | 15 | 30 | Moderate | Decent defense |
| 20 | 22 | 44 | Good | Tank phase |
| **29** | **35** | **70** | Excellent | Full tank |

---

### 💥 Secondary Stats

| Stat | Formula | Level 1 | Level 29 |
|------|---------|---------|----------|
| **Critical Chance** | DEX × 0.5% | 5% | 17.5% |
| **Dodge Chance** | DEX × 0.4% | 4% | 14% |
| **QI Recovery** | 3% of Max QI/round | ~3 QI | ~7 QI |
| **HP Recovery** | 2% of Max HP/round | ~3 HP | ~8 HP |

---

## ⚡ DAMAGE CALCULATION & COMBAT EXAMPLES

### Damage Formula
```
Damage = (Attacker ATK - Defender DEF) × Random(0.9 to 1.1)
Minimum Damage = 1
```

### 👶 Early Game: Level 1 vs Spirit Rat (Lvl 1)
| Stat | Player | Spirit Rat | Difference |
|------|--------|------------|-----------|
| ATK | 17 pATK | 6 ATK | +11 advantage |
| DEF | 20 DEF | 5 DEF | +15 advantage |
| **Damage Taken** | 1 | 12-13 | Player wins |
| **Fights to Win** | 8-10 | 1 | Beginner friendly |

### 🎮 Mid Game: Level 15 vs Iron Claw Chief (Lvl 11)
| Stat | Player | Iron Claw | Difference |
|------|--------|-----------|-----------|
| ATK | 37 pATK | 55 ATK | -18 disadvantage |
| DEF | 39 DEF | 35 DEF | +4 advantage |
| **Damage Dealt** | 3-4 | 15-20 | Enemy wins |
| **Fights Duration** | 45-60s | 20-30s | Skill needed |

### 👑 Endgame: Level 29 vs Undead Emperor (Lvl 28)
| Stat | Player | Undead Emperor | Difference |
|------|--------|----------------|-----------|
| ATK | 58 pATK | 135 ATK | -77 disadvantage |
| DEF | 77 DEF | 64 DEF | +13 advantage |
| **Damage Dealt** | 1-2 | 50-60 | Extreme danger |
| **Fights Duration** | 90-120s | 5-8s | Skill essential |

---

## 📊 COMPLETE PROGRESSION TABLE (LEVELS 1-29)

| Lvl | XP Req | Cumul. XP | Realm | Layer | AP | HP | QI | pATK | DEF | Difficulty |
|-----|--------|-----------|-------|-------|-----|-----|-----|------|-----|-----------|
| **1** | 2,200 | 2,200 | Qi Cond. | Stage 1 | 4 | 177 | 101 | 17 | 20 | ⭐ Easy |
| **2** | 5,640 | 7,840 | Qi Cond. | Stage 2 | 4 | 179 | 103 | 18 | 21 | ⭐ Easy |
| **3** | 9,960 | 17,800 | Qi Cond. | Stage 3 | 4 | 181 | 104 | 19 | 21 | ⭐ Easy |
| **4** | 15,030 | 32,830 | Qi Cond. | Stage 4 | 4 | 183 | 106 | 20 | 22 | ⭐ Easy |
| **5** | 20,760 | 53,590 | Qi Cond. | Stage 5 | 4 | 185 | 107 | 21 | 23 | ⭐⭐ Normal |
| **6** | 27,100 | 80,690 | Qi Cond. | Stage 6 | 4 | 187 | 109 | 22 | 24 | ⭐⭐ Normal |
| **7** | 34,000 | 114,690 | Qi Cond. | Stage 7 | 4 | 189 | 110 | 23 | 25 | ⭐⭐ Normal |
| **8** | 41,430 | 156,120 | Qi Cond. | Stage 8 | 4 | 191 | 112 | 24 | 26 | ⭐⭐ Normal |
| **9** | 250,000 | 406,120 | Qi Cond. | Stage 9 | 4 | 193 | 113 | 25 | 27 | ⭐⭐ Normal |
| **10** | 278,000 | 684,120 | Foundation | Early | 6 | 198 | 118 | 27 | 29 | ⭐⭐ Normal |
| **11** | 318,000 | 1,002,120 | Foundation | Early | 6 | 203 | 122 | 29 | 31 | ⭐⭐⭐ Hard |
| **12** | 370,000 | 1,372,120 | Foundation | Mid | 6 | 208 | 127 | 31 | 33 | ⭐⭐⭐ Hard |
| **13** | 440,000 | 1,812,120 | Foundation | Mid | 6 | 213 | 131 | 33 | 35 | ⭐⭐⭐ Hard |
| **14** | 520,000 | 2,332,120 | Foundation | Mid | 6 | 218 | 136 | 35 | 37 | ⭐⭐⭐⭐ Very Hard |
| **15** | 610,000 | 2,942,120 | Foundation | Late | 6 | 223 | 140 | 37 | 39 | ⭐⭐⭐⭐ Very Hard |
| **16** | 710,000 | 3,652,120 | Foundation | Late | 6 | 228 | 145 | 39 | 41 | ⭐⭐⭐⭐ Very Hard |
| **17** | 820,000 | 4,472,120 | Foundation | Late | 6 | 233 | 149 | 41 | 43 | ⭐⭐⭐⭐ Very Hard |
| **18** | 940,000 | 5,412,120 | Foundation | Late | 6 | 238 | 154 | 43 | 45 | ⭐⭐⭐⭐⭐ Nightmare |
| **19** | 1,200,000 | 6,612,120 | Foundation | Peak | 6 | 243 | 158 | 45 | 47 | ⭐⭐⭐⭐⭐ Nightmare |
| **20** | 1,500,000 | 8,112,120 | Golden Core | Early | 8 | 251 | 166 | 48 | 50 | ⭐⭐⭐⭐⭐ Nightmare |
| **21** | 1,800,000 | 9,912,120 | Golden Core | Early | 8 | 259 | 173 | 51 | 53 | ⭐⭐⭐⭐⭐ Nightmare |
| **22** | 2,150,000 | 12,062,120 | Golden Core | Mid | 8 | 267 | 181 | 54 | 56 | ⭐⭐⭐⭐⭐ Nightmare |
| **23** | 2,550,000 | 14,612,120 | Golden Core | Mid | 8 | 275 | 188 | 57 | 59 | ⭐⭐⭐⭐⭐ Nightmare |
| **24** | 3,000,000 | 17,612,120 | Golden Core | Mid | 8 | 283 | 196 | 60 | 62 | ⭐⭐⭐⭐⭐⭐ Impossible |
| **25** | 3,500,000 | 21,112,120 | Golden Core | Late | 8 | 291 | 203 | 63 | 65 | ⭐⭐⭐⭐⭐⭐ Impossible |
| **26** | 4,100,000 | 25,212,120 | Golden Core | Late | 8 | 299 | 211 | 66 | 68 | ⭐⭐⭐⭐⭐⭐ Impossible |
| **27** | 4,750,000 | 29,962,120 | Golden Core | Late | 8 | 307 | 218 | 69 | 71 | ⭐⭐⭐⭐⭐⭐ Impossible |
| **28** | 5,500,000 | 35,462,120 | Golden Core | Peak | 8 | 315 | 226 | 72 | 74 | ⭐⭐⭐⭐⭐⭐ Impossible |
| **29** | 6,500,000 | 41,962,120 | Golden Core | Peak | 8 | 323 | 233 | 75 | 77 | ⭐⭐⭐⭐⭐⭐ Impossible |

---

## 🎮 DIFFICULTY PROGRESSION SYSTEM

### 🌟 Tier 1: Qi Condensation (Levels 1-9)
**Duration**: ~1 hour | **Playstyle**: Semi-AFK Friendly

| Metric | Value | Notes |
|--------|-------|-------|
| **Player HP** | 177-193 | Very squishy |
| **Enemy HP** | 100-750 | One-shot kills common |
| **Fight Duration** | 5-20 seconds | Very fast |
| **Skill Usage** | Optional | Auto-attacks sufficient |
| **XP/Hour** | ~1,500 | Training pace |
| **Target Players** | New/Casual | Super forgiving |

---

### ⚡ Tier 2: Foundation Establishment (Levels 10-19)
**Duration**: ~35-40 hours | **Playstyle**: Casual → Hardcore

| Phase | Levels | Fight Duration | Skill Requirement | XP/Hour |
|-------|--------|--------|-----------------|---------|
| **Early** | 10-14 | 20-40s | Recommended | ~2,000 |
| **Mid** | 14-17 | 40-80s | Mandatory | ~1,500 |
| **Late** | 17-19 | 60-120s | Essential | ~1,000 |

**Progression Mechanics**:
- 💊 Healing becomes necessary (survival mechanic)
- ⚔️ Damage output becomes tight (accuracy matters)
- 🎯 Player mastery determines success

---

### 👑 Tier 3: Golden Core (Levels 20-29)
**Duration**: ~250-300 hours | **Playstyle**: Hardcore Only

| Metric | Value | Notes |
|--------|-------|-------|
| **Player HP** | 251-323 | Still vulnerable |
| **Enemy HP** | 2150-3100 | Epic boss fights |
| **Fight Duration** | 60-180+ seconds | Long battles |
| **Skill Usage** | Perfect timing | One mistake = death |
| **XP/Hour** | 500-1,000 | Ultra slow grind |
| **Target Players** | Hardcore only | Extreme challenge |

---

## 📈 PROGRESSION EFFICIENCY TABLE

| Level Range | Solo Time | Party Bonus | Mobs/Hour | Notes |
|------------|-----------|------------|----------|-------|
| **1-5** | 20 min | N/A | 180 mobs | Tutorial |
| **6-9** | 40 min | 2x faster | 200 mobs | Early grind |
| **10-14** | 3-4 hrs | 3x faster | 150 mobs | Mid start |
| **15-19** | 15-20 hrs | 4x faster | 100 mobs | Late game |
| **20-24** | 100+ hrs | 5x faster | 50 mobs | Endgame |
| **25-29** | 200+ hrs | 5x faster | 30 mobs | Ultimate |

---

### ⚔️ PHYSICAL DPS BUILD (STR/DEX)
| Lvl | AP | STR | DEX | CON | SPI | WIL | HP | pATK | DEF | Style |
|-----|----|----|-----|-----|-----|-----|-----|------|------|-------|
| 1 | 4 | 12 | 12 | 10 | 10 | 10 | 177 | 19 | 20 | Quick start |
| 5 | 20 | 14 | 14 | 10 | 10 | 12 | 185 | 22 | 20 | Damage focus |
| 10 | 44 | 18 | 18 | 12 | 10 | 14 | 198 | 28 | 24 | Early game |
| 15 | 74 | 24 | 22 | 14 | 12 | 16 | 223 | 37 | 28 | Mid grind |
| 20 | 102 | 32 | 28 | 16 | 12 | 18 | 251 | 49 | 32 | Power spike |
| 25 | 142 | 40 | 35 | 20 | 15 | 22 | 291 | 61 | 40 | Late game |
| **29** | **172** | **50** | **40** | **30** | **20** | **12** | **323** | **75** | **60** | **Final form** |

---

### 🔮 MAGIC DPS BUILD (SPI/WIL)
| Lvl | AP | STR | DEX | CON | SPI | WIL | QI | mATK | DEF | Style |
|-----|----|----|-----|-----|-----|-----|-----|------|------|-------|
| 1 | 4 | 10 | 10 | 10 | 12 | 12 | 107 | 19 | 20 | Spell start |
| 5 | 20 | 10 | 10 | 10 | 15 | 15 | 125 | 24 | 20 | QI grows |
| 10 | 44 | 10 | 12 | 12 | 20 | 18 | 150 | 31 | 24 | Magic phase |
| 15 | 74 | 12 | 14 | 15 | 28 | 25 | 185 | 43 | 30 | Strong spells |
| 20 | 102 | 15 | 16 | 18 | 36 | 32 | 220 | 56 | 36 | Mage peak |
| 25 | 142 | 18 | 20 | 22 | 45 | 40 | 265 | 68 | 44 | Ultra mage |
| **29** | **172** | **20** | **20** | **25** | **50** | **35** | **300** | **76** | **50** | **Final caster** |

---

### 🛡️ TANK BUILD (CON/STR)
| Lvl | AP | STR | DEX | CON | SPI | WIL | HP | pATK | DEF | Style |
|-----|----|----|-----|-----|-----|-----|-----|------|------|-------|
| 1 | 4 | 12 | 10 | 12 | 10 | 10 | 190 | 19 | 24 | Tank start |
| 5 | 20 | 14 | 10 | 16 | 10 | 10 | 220 | 22 | 32 | More HP |
| 10 | 44 | 16 | 10 | 20 | 10 | 12 | 250 | 25 | 40 | Solid def |
| 15 | 74 | 22 | 12 | 28 | 10 | 14 | 310 | 34 | 56 | Super tank |
| 20 | 102 | 30 | 14 | 38 | 12 | 16 | 385 | 46 | 76 | War tank |
| 25 | 142 | 38 | 16 | 50 | 14 | 18 | 475 | 59 | 100 | Unkillable |
| **29** | **172** | **45** | **18** | **60** | **14** | **20** | **550** | **69** | **120** | **Boss tank** |

---

### 💚 SUPPORT/HEALER BUILD (WIL/SPI)
| Lvl | AP | STR | DEX | CON | SPI | WIL | HP | mATK | DEF | Healing |
|-----|----|----|-----|-----|-----|-----|-----|------|------|---------|
| 1 | 4 | 10 | 10 | 10 | 12 | 12 | 177 | 19 | 20 | Strong |
| 5 | 20 | 10 | 10 | 10 | 15 | 15 | 185 | 24 | 20 | Better |
| 10 | 44 | 10 | 12 | 12 | 20 | 20 | 200 | 31 | 24 | Excellent |
| 15 | 74 | 12 | 14 | 15 | 28 | 30 | 235 | 43 | 30 | Peak |
| 20 | 102 | 15 | 16 | 18 | 40 | 40 | 280 | 61 | 36 | Masters |
| 25 | 142 | 18 | 20 | 22 | 48 | 50 | 335 | 73 | 44 | Godlike |
| **29** | **172** | **20** | **20** | **25** | **55** | **60** | **390** | **83** | **50** | **Immortal** |

---

## 💻 IMPLEMENTATION REQUIREMENTS

### ✅ Functions to Implement

#### 1️⃣ HP Scaling Function
```typescript
function calculateMaxHP(level: number, constitution: number): number {
    return 100 + (constitution * 7.5) + (level * 2);
}
```

#### 2️⃣ QI Scaling Function
```typescript
function calculateMaxQI(level: number, spirit: number): number {
    return 50 + (spirit * 5) + (level * 1.5);
}
```

#### 3️⃣ Combat Stats (Already Implemented ✅)
```typescript
const combatStats = {
    pAtk: Math.floor(totalStats.str * 1.5 + totalStats.spi * 0.2),
    mAtk: Math.floor(totalStats.spi * 1.5 + totalStats.str * 0.2),
    def: Math.floor(totalStats.con * 2),
    crit: (totalStats.dex * 0.5).toFixed(1),
    dodge: (totalStats.dex * 0.4).toFixed(1)
};
```

### 🔄 Update Flow on Level Up
1. Level increases
2. Recalculate Max HP using new CON value
3. Recalculate Max QI using new SPI value
4. Full health restore (morale boost)
5. Full QI restore (new realm energy)
6. Award AP based on realm

---

## 🎯 KEY BREAKPOINTS

| Breakpoint | Level | Event | Challenge |
|-----------|-------|-------|-----------|
| **Starter** | 1 | Game start | Very easy |
| **Early Gate** | 9 → 10 | Foundation Pill | 250K XP jump |
| **Mid Gate** | 19 → 20 | Golden Pill | 1.2M XP jump |
| **Endgame** | 25+ | Legendary mobs | Boss battles |
| **Max Cap** | 29 | Ceiling | 6.5M total XP |

---

## 📊 SUMMARY STATISTICS

### Total Progression Range
| Stat | Level 1 | Level 29 | Growth |
|------|---------|----------|--------|
| **HP** | 177 | 323 | **+146 HP** |
| **QI** | 101 | 233 | **+132 QI** |
| **pATK** | 17 | 75 | **+58 ATK** |
| **mATK** | 17 | 76 | **+59 ATK** |
| **DEF** | 20 | 77 | **+57 DEF** |
| **Total AP** | 4 | 172 | **+168 AP** |

### Time Investment
| Phase | Levels | Hours | Cumulative |
|-------|--------|-------|-----------|
| **Tutorial** | 1-5 | 0.5 | 0.5h |
| **Early Game** | 6-9 | 1 | 1.5h |
| **Mid Game** | 10-14 | 5 | 6.5h |
| **Late Game** | 15-19 | 35 | 41.5h |
| **Endgame** | 20-24 | 120 | 161.5h |
| **Ultimate** | 25-29 | 190 | **351.5h** |

---

## 🎮 PLAYER EXPERIENCE BY TIER

### Tier 1: New Players (Lvl 1-9)
- 🎯 **Goal**: Learn mechanics
- ⏱️ **Time**: 1.5 hours
- 💪 **Challenge**: None, learning phase
- 🎲 **Gameplay**: Auto-attack grind
- 🌟 **Feeling**: Empowered, one-shotting mobs

### Tier 2: Dedicated Players (Lvl 10-19)
- 🎯 **Goal**: Master combat
- ⏱️ **Time**: 40 hours
- 💪 **Challenge**: Increasing significantly
- 🎲 **Gameplay**: Skill-based combat
- 🌟 **Feeling**: Competent, balanced fights

### Tier 3: Hardcore Grinders (Lvl 20-29)
- 🎯 **Goal**: Reach maximum power
- ⏱️ **Time**: 310 hours
- 💪 **Challenge**: Extreme, constant danger
- 🎲 **Gameplay**: Perfect execution required
- 🌟 **Feeling**: Legendary, boss-tier difficulty

---

## ✨ DESIGN PHILOSOPHY

✅ **Semi-Idle Friendly**: Auto-attacks viable for early game  
✅ **Skill-Based Scaling**: Skills become mandatory at endgame  
✅ **Gradual Difficulty**: Smooth curve from easy to impossible  
✅ **Long Progression**: 300-350 hours feels meaningful  
✅ **Multiple Viable Builds**: 4+ class archetypes supported  
✅ **Clear Breakpoints**: Breakthrough levels provide gates  
✅ **Balanced Economy**: XP thresholds match difficulty spikes  

---

**Last Updated**: January 18, 2026  
**Version**: 1.0 - Complete Implementation Ready  
**Status**: ✅ Ready for Notion Import

# 📚 WUXIA MUD - GAME DESIGN DOCUMENT INDEX

**Last Updated**: January 19, 2026  
**Project Status**: Phase 3 - Equipment System & Item Polish  
**Documentation Status**: Organized & Centralized

---

## 🎯 Quick Navigation

### 📋 [0_OVERVIEW](./0_OVERVIEW)
Executive summaries, delivery reports, and documentation guides.

- **[EXECUTIVE_SUMMARY.md](./0_OVERVIEW/EXECUTIVE_SUMMARY.md)** - High-level project overview
- **[DELIVERY_COMPLETE.md](./0_OVERVIEW/DELIVERY_COMPLETE.md)** - Completion milestones
- **[RESUMO_PORTUGUES.md](./0_OVERVIEW/RESUMO_PORTUGUES.md)** - Portuguese summary
- **[DOCUMENTATION_INDEX.md](./0_OVERVIEW/DOCUMENTATION_INDEX.md)** - Original documentation guide

---

### 🗡️ [1_CLASS_SYSTEM](./1_CLASS_SYSTEM)
Complete class system design with all 12 Hybrid Classes.

- **[CLASS_SYSTEM_COMPLETE.md](./1_CLASS_SYSTEM/CLASS_SYSTEM_COMPLETE.md)** - Full 12-class definitions with stats, passives, gear
- **[CLASS_SYSTEM_AUDIT.md](./1_CLASS_SYSTEM/CLASS_SYSTEM_AUDIT.md)** - Audit findings and validation
- **[CLASS_SYSTEM_IMPLEMENTATION.md](./1_CLASS_SYSTEM/CLASS_SYSTEM_IMPLEMENTATION.md)** - Implementation guide and code examples
- **[THEORYCRAFTING_SYSTEM_DESIGN.md](./1_CLASS_SYSTEM/THEORYCRAFTING_SYSTEM_DESIGN.md)** - Advanced mechanics and edge cases

**Classes Covered**:
- 🗡️ Sword Classes: Blazing Sword, Glacial Shadow, Spellfire Duelist, Toxic Viper
- ⚔️ Saber Classes: Asura of War, Frozen Steel Guard, Verdant Blade Monarch, Wilderness Stalker
- 🎵 Zither Classes: Phoenix Cry, Divine Melody, Phantom Musician, Spirit Sage

---

### 📈 [2_PROGRESSION](./2_PROGRESSION)
Leveling, scaling, and progression systems.

- **[LEVEL_SCALING_GDD.md](./2_PROGRESSION/LEVEL_SCALING_GDD.md)** - Level requirements, stat scaling, difficulty curves

**Coverage**:
- 29 levels with customized progression curves
- Experience requirements per level
- Realm transitions (Qi Condensation → Foundation → Golden Core)
- Equipment scaling by level

---

### 👹 [3_CONTENT](./3_CONTENT)
World content: mobs, items, and loot tables.

- **[BESTIARY_GDD.md](./3_CONTENT/BESTIARY_GDD.md)** - All 44 mobs with stats, drops, locations
- **[MOB_IMAGE_VALIDATION.md](./3_CONTENT/MOB_IMAGE_VALIDATION.md)** - Image asset validation and fixes

**Coverage**:
- Mob stats by level and zone
- Loot tables and drop rates
- Experience tables
- Boss encounters

---

### ⚙️ [4_SYSTEMS](./4_SYSTEMS)
Game mechanics and system design.

- **[ITEM_SYSTEM.md](./ITEM_SYSTEM.md)** - ⭐ **NEW** Complete item GDD (71 items, 3 slots, acquisition paths)
- **[AUDIT_REPORT.md](./4_SYSTEMS/AUDIT_REPORT.md)** - Complete system audit with 3 critical, 7 high priority issues
- **[FULL_GEAR_SYSTEM_PROPOSAL.md](./4_SYSTEMS/FULL_GEAR_SYSTEM_PROPOSAL.md)** - Original gear system design
- **[UI_OVERHAUL_GDD.md](./4_SYSTEMS/UI_OVERHAUL_GDD.md)** - UI/UX design specifications

**Systems Documented**:
- Item system with 48 weapons + 8 accessories
- Crafting system with 4 tiers
- Reforging and pity systems
- Combat system with element advantages
- Buff/debuff mechanics
- Passive ability system

---

### 🔧 [5_IMPLEMENTATION](./5_IMPLEMENTATION)
Quick reference guides and code integration snippets.

- **[QUICK_REFERENCE.md](./5_IMPLEMENTATION/QUICK_REFERENCE.md)** - Quick lookup tables and formulas
- **[QUICK_INTEGRATION_SNIPPETS.md](./5_IMPLEMENTATION/QUICK_INTEGRATION_SNIPPETS.md)** - Copy-paste code examples
- **[IMPLEMENTATION_PACKAGE.md](./5_IMPLEMENTATION/IMPLEMENTATION_PACKAGE.md)** - Complete implementation guide

---

### 📝 [6_DEV_NOTES](./6_DEV_NOTES)
Development notes, debug guides, and work-in-progress documentation.

- **[TESTING_GUIDE.md](./6_DEV_NOTES/TESTING_GUIDE.md)** - Testing procedures and validation
- **[PASSIVE_DEBUG_GUIDE.md](./6_DEV_NOTES/PASSIVE_DEBUG_GUIDE.md)** - Debugging passive abilities
- **[CRAFTING_FIXES.md](./6_DEV_NOTES/CRAFTING_FIXES.md)** - Crafting system fixes log
- **[COMBAT_VISUAL_ENHANCEMENTS.md](./6_DEV_NOTES/COMBAT_VISUAL_ENHANCEMENTS.md)** - Combat UI improvements

---

### 📦 [7_ARCHIVE](./7_ARCHIVE)
Archived documentation from previous phases.

- **[GAME_VALIDATION_ROADMAP.md](./7_ARCHIVE/GAME_VALIDATION_ROADMAP.md)** - Original validation plan
- **[PRE_TESTING_VALIDATION.md](./7_ARCHIVE/PRE_TESTING_VALIDATION.md)** - Pre-release checklist

---

## 📂 File Structure

```
docs/gdd/
├── INDEX.md (you are here)
├── README.md
├── ITEM_SYSTEM.md          ⭐ NEW - Complete item documentation
├── 0_OVERVIEW/
│   ├── EXECUTIVE_SUMMARY.md
│   ├── DELIVERY_COMPLETE.md
│   ├── RESUMO_PORTUGUES.md
│   └── DOCUMENTATION_INDEX.md
├── 1_CLASS_SYSTEM/
│   ├── CLASS_SYSTEM_COMPLETE.md
│   ├── CLASS_SYSTEM_AUDIT.md
│   ├── CLASS_SYSTEM_IMPLEMENTATION.md
│   └── THEORYCRAFTING_SYSTEM_DESIGN.md
├── 2_PROGRESSION/
│   └── LEVEL_SCALING_GDD.md
├── 3_CONTENT/
│   ├── BESTIARY_GDD.md
│   └── MOB_IMAGE_VALIDATION.md
├── 4_SYSTEMS/
│   ├── AUDIT_REPORT.md
│   ├── FULL_GEAR_SYSTEM_PROPOSAL.md
│   └── UI_OVERHAUL_GDD.md
├── 5_IMPLEMENTATION/
│   ├── QUICK_REFERENCE.md
│   ├── QUICK_INTEGRATION_SNIPPETS.md
│   └── IMPLEMENTATION_PACKAGE.md
├── 6_DEV_NOTES/
│   ├── TESTING_GUIDE.md
│   ├── PASSIVE_DEBUG_GUIDE.md
│   ├── CRAFTING_FIXES.md
│   └── COMBAT_VISUAL_ENHANCEMENTS.md
└── 7_ARCHIVE/
    ├── GAME_VALIDATION_ROADMAP.md
    └── PRE_TESTING_VALIDATION.md
```

---

## 🚀 Phase Implementation Status

### ✅ Phase 1: Complete
- [x] 48 Gear items (12 classes × 4 tiers)
- [x] 8 Accessory items (rings + necklaces)
- [x] Gear system with bonuses
- [x] Passive ability tracking
- [x] Element damage system
- [x] Integration into combat loop

### ✅ Phase 2: Complete
- [x] Buff/Debuff engine (`src/data/buffDebuffEngine.ts`)
- [x] Effect persistence and duration tracking
- [x] Passive ability effect triggers (all 12 classes)
- [x] Effect resistance calculations
- [x] Combat loop integration with effects

### ✅ Phase 3: Complete
- [x] 6-slot equipment system (weapon, ring, necklace active)
- [x] Pity system integration (drops, crafting, reforging)
- [x] Material consumption in crafting
- [x] Accessory crafting recipes
- [x] Item system GDD documentation

### 🔄 Phase 4: Next Steps
- [ ] Equipment UI in CharacterPage
- [ ] Bestiary with kill counters
- [ ] Map with zone visualization
- [ ] Save/Load system polish

---

## 📌 Key Numbers at a Glance

| Category | Count | Status |
|----------|-------|--------|
| Classes | 12 | ✅ Complete |
| Weapon Types | 3 (Sword/Saber/Zither) | ✅ Complete |
| Elements | 5 | ✅ Complete |
| Weapons | 48 | ✅ Complete |
| Accessories | 8 | ✅ NEW |
| Materials | 15 | ✅ Complete |
| Total Items | 71 | ✅ Complete |
| Mobs | 44 | ✅ Complete |
| Levels | 29 | ✅ Complete |
| Passives | 12 | ✅ Complete |
| Equipment Slots | 3 active (6 reserved) | ✅ Complete |

---

## 🎮 How to Use This Documentation

1. **New Feature Development**:
   - Start in [1_CLASS_SYSTEM](./1_CLASS_SYSTEM) for class mechanics
   - Check [4_SYSTEMS](./4_SYSTEMS) for mechanics interactions
   - Reference [5_IMPLEMENTATION](./5_IMPLEMENTATION) for code

2. **Balance Adjustments**:
   - See `src/data/passiveBalance.ts` for detailed specs
   - Reference [4_SYSTEMS/AUDIT_REPORT.md](./4_SYSTEMS/AUDIT_REPORT.md) for known issues

3. **Content Additions**:
   - Check [3_CONTENT](./3_CONTENT) for current content
   - Use [2_PROGRESSION](./2_PROGRESSION) for level scaling

4. **Quick Lookups**:
   - [5_IMPLEMENTATION/QUICK_REFERENCE.md](./5_IMPLEMENTATION/QUICK_REFERENCE.md) for formulas
   - [5_IMPLEMENTATION/QUICK_INTEGRATION_SNIPPETS.md](./5_IMPLEMENTATION/QUICK_INTEGRATION_SNIPPETS.md) for code

---

## 📝 Documentation Standards

All GDD documents follow these conventions:
- **Markdown format** (.md) for version control
- **Clear section hierarchy** with emojis for quick scanning
- **Code examples** in TypeScript (matching project)
- **Data tables** for comparative analysis
- **Portuguese translations** where relevant

---

**Questions or updates needed?** Check the relevant section above and the corresponding document.

Last organized: January 19, 2026

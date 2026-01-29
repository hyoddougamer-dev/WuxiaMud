# 🎮 Wuxia MUD - Browser-Based Martial Arts Game

A React + Vite + TypeScript browser-based MUD (Multi-User Dungeon) set in a Wuxia/Xianxia universe. Fight mobs, level up, master martial arts, and progress through 12 unique hybrid classes with deep combat systems.

## 🎯 Quick Start

```bash
npm install
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

Server runs on `http://localhost:5173`

---

## 📚 Documentation

**All game design documentation is organized in [`docs/gdd/`](./docs/gdd/)**

- 📋 **[docs/gdd/INDEX.md](./docs/gdd/INDEX.md)** - Master index and navigation
- 🎯 **[docs/gdd/0_OVERVIEW/](./docs/gdd/0_OVERVIEW/)** - Project overview and summaries
- 🗡️ **[docs/gdd/1_CLASS_SYSTEM/](./docs/gdd/1_CLASS_SYSTEM/)** - All 12 classes, passives, gear
- 📈 **[docs/gdd/2_PROGRESSION/](./docs/gdd/2_PROGRESSION/)** - Leveling and scaling
- 👹 **[docs/gdd/3_CONTENT/](./docs/gdd/3_CONTENT/)** - Mobs, items, loot
- ⚙️ **[docs/gdd/4_SYSTEMS/](./docs/gdd/4_SYSTEMS/)** - Game mechanics and systems
- 🔧 **[docs/gdd/5_IMPLEMENTATION/](./docs/gdd/5_IMPLEMENTATION/)** - Code references and snippets

---

## 🚀 Current Status

### Phase 1: Complete ✅
- 60 Gear items with stat bonuses
- Gear system with set bonuses
- Passive ability tracking per class
- Element damage system
- Combat integration

### Phase 2: Complete ✅
- Buff/Debuff engine with 5 effect types
- Passive abilities triggering effects
- Effect persistence and duration tracking
- Effect resistance with level scaling
- Combat log with effect information

### Phase 3: In Progress 🔄
- QI/Spell system with cooldowns
- Zither ranged/magic attack patterns
- Mob resistance integration
- Enhanced UI for effects

---

## 🎮 Game Features

### Combat System
- **Real-time 1.5s turn-based combat** with auto-attacks
- **12 unique hybrid classes** with distinct playstyles
- **5 element types** with advantage matrix (Fire beats Ice, etc.)
- **Passive abilities** unique to each class
- **Buff/Debuff system** with 5 status effects
- **Gear progression** with 5 tiers per class

### Classes
```
Swords:     Blazing Sword, Glacial Shadow, Spellfire Duelist, Toxic Viper
Sabers:     Asura of War, Frozen Steel Guard, Verdant Blade, Wilderness Stalker
Zithers:    Phoenix Cry, Divine Melody, Phantom Musician, Spirit Sage
```

### World
- **44 mobs** across multiple zones
- **29 levels** with scaling difficulty
- **Location-based combat** with progression zones
- **Loot system** with randomized drops

---

## 📂 Project Structure

```
src/
├── App.tsx              # Main app with combat loop
├── components/          # UI components
├── data/
│   ├── constants.ts     # Game data (classes, mobs, items)
│   ├── hybridClasses.ts # 12 class definitions
│   ├── gearItems.ts     # 60 gear items
│   ├── gearSystem.ts    # Gear bonus calculation
│   ├── passiveState.ts  # Passive ability tracking
│   ├── buffDebuffEngine.ts # Buff/debuff system
│   ├── elementSystem.ts # Element damage and advantages
│   ├── passiveBalance.ts # Balance reference
│   └── helpers.ts       # Utility functions
└── utils/               # Helper functions
```

---

## 🔑 Key Mechanics

### Passive Abilities
Each class has a unique passive:
- **Class 1 (Blazing Sword)**: Inferno Aura - 8% max HP damage aura, 40% burn proc
- **Class 2 (Glacial Shadow)**: Frostbite Chain - Freeze on crit, -30% damage taken
- ... and 10 more unique mechanics

See [docs/gdd/1_CLASS_SYSTEM/](./docs/gdd/1_CLASS_SYSTEM/) for complete list.

### Buff/Debuff Effects
- **Burning**: 2 DoT/s per stack (max 5 stacks)
- **Frozen**: Enemy takes 30% more damage, movement -50%
- **Entangled**: Movement -25%, max 2 stacks
- **Stunned**: Cannot attack, 50% damage reduction
- **Corrupted**: 1 DoT/s per stack (max 4), longer duration

### Element System
- 5 elements: Fire, Ice, Wood, Lightning, Void
- Advantage matrix with 1.2x-1.3x multipliers
- Level-based resistance scaling (5%-28%)
- Element affinity procs (Burning, Frozen, etc.)

---

## 💻 Tech Stack

- **React 18** with TypeScript
- **Vite** for ultra-fast builds
- **TailwindCSS** for styling
- **Lucide React** for icons
- **LocalStorage** for persistence

---

## 🎮 How to Play

1. **Select a Martial Path** (class) → Initializes passives and equipment
2. **Navigate the world** → Move between zones with different mobs
3. **Fight mobs** → Auto-attack every 1.5s with passive abilities triggering
4. **Gain experience** → Level up to unlock harder zones
5. **Collect gear** → Find better equipment for stat bonuses
6. **Master mechanics** → Learn timing and element advantages

---

## 📊 Current Game Stats

| Metric | Count |
|--------|-------|
| Playable Classes | 12 |
| Weapons | 3 (Sword, Saber, Zither) |
| Elements | 5 (Fire, Ice, Wood, Lightning, Void) |
| Gear Items | 60 (5 tiers per class) |
| Mobs | 44 |
| Levels | 29 |
| Passive Abilities | 12 |
| Status Effects | 5 |
| Buff/Debuff Types | 8 |

---

## 🤝 Contributing

When adding new features:
1. Update relevant documentation in `docs/gdd/`
2. Follow existing code patterns in `src/data/`
3. Test in combat system before merging
4. Run `npm run build` to verify no TypeScript errors

---

## 📖 For Developers

- **Combat Loop**: See [App.tsx](./src/App.tsx) lines 228-360
- **Class Definitions**: [src/data/hybridClasses.ts](./src/data/hybridClasses.ts)
- **Effect System**: [src/data/buffDebuffEngine.ts](./src/data/buffDebuffEngine.ts)
- **Balance Reference**: [src/data/passiveBalance.ts](./src/data/passiveBalance.ts)

---

**Last Updated**: January 19, 2026  
**Phase**: 2/3 Complete  
**Status**: Production-Ready

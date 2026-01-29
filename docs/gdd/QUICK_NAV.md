# 🧭 Quick Navigation Guide for Developers

**Last Updated**: January 19, 2026

---

## ⚡ 30-Second Start

1. **New to project?** → Read [`0_OVERVIEW/EXECUTIVE_SUMMARY.md`](./0_OVERVIEW/EXECUTIVE_SUMMARY.md)
2. **Want to understand classes?** → Check [`1_CLASS_SYSTEM/CLASS_SYSTEM_COMPLETE.md`](./1_CLASS_SYSTEM/CLASS_SYSTEM_COMPLETE.md)
3. **Need code examples?** → See [`5_IMPLEMENTATION/QUICK_INTEGRATION_SNIPPETS.md`](./5_IMPLEMENTATION/QUICK_INTEGRATION_SNIPPETS.md)
4. **Looking for balance data?** → Check `src/data/passiveBalance.ts` in the codebase

---

## 🎯 Find Info By Task

### ❓ "I want to understand..."

| What | Where |
|------|-------|
| Overall game design | [`0_OVERVIEW/EXECUTIVE_SUMMARY.md`](./0_OVERVIEW/EXECUTIVE_SUMMARY.md) |
| Class mechanics | [`1_CLASS_SYSTEM/CLASS_SYSTEM_COMPLETE.md`](./1_CLASS_SYSTEM/CLASS_SYSTEM_COMPLETE.md) |
| Stat scaling | [`2_PROGRESSION/LEVEL_SCALING_GDD.md`](./2_PROGRESSION/LEVEL_SCALING_GDD.md) |
| Mob stats & drops | [`3_CONTENT/BESTIARY_GDD.md`](./3_CONTENT/BESTIARY_GDD.md) |
| Combat system | [`4_SYSTEMS/AUDIT_REPORT.md`](./4_SYSTEMS/AUDIT_REPORT.md) |
| All passive mechanics | `src/data/passiveBalance.ts` |
| Element system | `src/data/elementSystem.ts` |
| Buff/debuff system | `src/data/buffDebuffEngine.ts` |

### 📝 "I need to..."

| Task | Reference |
|------|-----------|
| Add a new class | [`1_CLASS_SYSTEM/CLASS_SYSTEM_IMPLEMENTATION.md`](./1_CLASS_SYSTEM/CLASS_SYSTEM_IMPLEMENTATION.md) + `src/data/hybridClasses.ts` |
| Add a new mob | [`3_CONTENT/BESTIARY_GDD.md`](./3_CONTENT/BESTIARY_GDD.md) + `src/data/constants.ts` |
| Adjust class balance | `src/data/passiveBalance.ts` |
| Fix combat bugs | `src/App.tsx` (lines 228-360) |
| Understand gear system | `src/data/gearSystem.ts` |
| Add new status effect | `src/data/buffDebuffEngine.ts` |
| Modify element advantages | `src/data/elementSystem.ts` |

### 🐛 "There's an issue with..."

| Issue | Check |
|-------|-------|
| Class balance seems off | `src/data/passiveBalance.ts` + [`4_SYSTEMS/AUDIT_REPORT.md`](./4_SYSTEMS/AUDIT_REPORT.md) |
| Passive not triggering | Combat loop in `src/App.tsx` + `src/data/passiveState.ts` |
| Effect not applying | `src/data/buffDebuffEngine.ts` |
| Damage calculation wrong | `src/data/elementSystem.ts` + `src/App.tsx` combat section |
| Mob stats incorrect | `src/data/constants.ts` |
| Leveling feels wrong | [`2_PROGRESSION/LEVEL_SCALING_GDD.md`](./2_PROGRESSION/LEVEL_SCALING_GDD.md) |

---

## 📂 Folder Contents at a Glance

### 0️⃣ Overview
- Big picture project info
- Summaries and reports
- Portuguese translations
- Organization notes

### 1️⃣ Class System
- All 12 class definitions
- Stat templates and passives
- Class audit and validation
- Implementation guide

### 2️⃣ Progression
- Leveling curves
- Stat scaling per level
- Experience requirements
- Difficulty progression

### 3️⃣ Content
- 44 Mob database
- Drop tables
- Image validation
- Location mapping

### 4️⃣ Systems
- Combat mechanics
- Element system
- Buff/debuff engine
- Balance considerations
- Audit findings

### 5️⃣ Implementation
- Code snippets
- Quick references
- Integration guides
- Type definitions

---

## 🔗 Code File Locations

```typescript
// Classes & Abilities
src/data/hybridClasses.ts      // 12 class definitions
src/data/passiveState.ts       // Passive ability logic
src/data/passiveBalance.ts     // Balance reference table

// Combat & Effects
src/data/buffDebuffEngine.ts   // Buff/debuff system
src/data/elementSystem.ts      // Element mechanics
src/App.tsx (lines 228-360)    // Combat loop

// Equipment
src/data/gearItems.ts          // 60 gear items
src/data/gearSystem.ts         // Gear bonus calculation

// World & Mobs
src/data/constants.ts          // Game data (mobs, zones)
src/data/helpers.ts            // Utility functions
```

---

## 🚀 Common Workflows

### Adding a New Feature
1. Check existing related docs (e.g., system design)
2. Find code implementation file
3. Update balance reference if applicable
4. Test in combat loop
5. Run `npm run build` to verify TypeScript

### Debugging a Problem
1. Check [`4_SYSTEMS/AUDIT_REPORT.md`](./4_SYSTEMS/AUDIT_REPORT.md) for known issues
2. Find relevant code file (see Code File Locations above)
3. Check balance table if numbers seem wrong
4. Verify combat loop integration
5. Test with specific class/mob combo

### Playtesting a Feature
1. Read relevant balance doc (`src/data/passiveBalance.ts`)
2. Fight different mobs with different classes
3. Check effect durations and damage values
4. Compare against expected numbers from docs
5. Adjust in code and balance table if needed

---

## 💡 Pro Tips

1. **Search first** - Most questions answered in INDEX.md
2. **Balance table is canon** - `src/data/passiveBalance.ts` has all numbers
3. **Combat loop is complex** - Read it carefully, test thoroughly
4. **Classes are 100% symmetric** - 4 Swords, 4 Sabers, 4 Zithers (by design)
5. **Effects have resistance** - `calculateEffectResistance()` in buffDebuffEngine.ts
6. **Elements are 5-way** - Fire, Ice, Wood, Lightning, Void (not 4-way)
7. **Status effects stack** - Most have max stacks, check per effect

---

## 📞 Quick Reference

| Question | Answer |
|----------|--------|
| How many classes? | 12 (4 per weapon) |
| How many mobs? | 44 across 10 zones |
| How many levels? | 29 with scaling |
| How many elements? | 5: Fire, Ice, Wood, Lightning, Void |
| How many status effects? | 5: Burning, Frozen, Entangled, Stunned, Corrupted |
| Combat tick rate? | 1.5 seconds |
| Crit chance? | 15% base |

---

**Start here, explore methodically, and you'll master the codebase quickly!** 🎮

---

**Questions?** Check INDEX.md or the relevant section above.

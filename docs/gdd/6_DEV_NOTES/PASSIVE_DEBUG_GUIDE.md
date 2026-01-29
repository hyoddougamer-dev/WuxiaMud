# Passive System - Debug Guide

## Expected Passive Icons per Class

| ID | Class Name | Passive Name | Icon | Log Message | Effect |
|----|----|----|----|----|----|
| 1 | Blazing Sword Immortal | Inferno Aura | ✨ | "Inferno Aura triggers! Enemy burning!" | BURNING |
| 2 | Glacial Shadow Dancer | Frostbite Chain | ❄️ | "Frostbite Chain procs! Enemy frozen!" | FROZEN |
| 3 | Spellfire Duelist | Spell Echo | (No Icon) | (No effect log) | Damage Multiplier |
| 4 | Toxic Viper | Poison Cloud | ☠️ | "Poison Cloud bursts! Enemy corrupted!" | CORRUPTED |
| 5 | Asura of War | Asura Rage | (No Icon) | (No effect log) | Damage Buff |
| 6 | Frozen Steel Guard | Glacial Barrier | (No Icon) | (No effect log) | Defense Buff |
| 7 | Verdant Blade | Nature's Blessing | 🌿 | "Nature's Blessing entangles the enemy!" | ENTANGLED |
| 8 | Wilderness Stalker | Beast Hunt | (No Icon) | (No effect log) | Speed Buff |
| 9 | Phoenix Cry Warrior | Phoenix Rebirth | (No Icon) | (No effect log) | Low HP Damage Boost |
| 10 | Divine Melody Keeper | Divine Grace | ⚡ | "Divine Grace stuns the enemy!" | STUNNED |
| 11 | Phantom Musician | Shadow Step | 🌑 | "Shadow Step entangles the enemy!" | ENTANGLED |
| 12 | Spirit Sage | Spirit Fortitude | (No Icon) | (No effect log) | Stacking Defense |

## If You See Wrong Icon

**Problem**: Toxic Viper showing ⚡ instead of ☠️

**Debugging Steps**:
1. Check browser console (F12 → Console tab)
2. Look for log: `[PASSIVE DEBUG] ClassId: 4, Class Name: Toxic Viper`
3. Look for log: `[CASE 4 TRIGGERED] Poison Cloud for class 4`

**Root Causes**:
- [ ] Wrong class selected (check UI shows "Toxic Viper")
- [ ] passiveState not initialized with correct classId
- [ ] classId changed during combat (shouldn't happen)
- [ ] Switch statement routing to wrong case (check code)

**Expected Console Output**:
```
[CLASS SELECTOR] Selected: Toxic Viper
[CLASS SELECTOR] Element: Wood
[CLASS SELECTOR] Passive: Poison Cloud
⚔️ Your Class: Toxic Viper
[PASSIVE DEBUG] ClassId: 4, Class Name: Toxic Viper
[CASE 4 TRIGGERED] Poison Cloud for class 4
☠️ Poison Cloud bursts! Enemy corrupted!
```

## Recent Changes

### Scroll Fix (v1.1)
- Changed from `scrollIntoView()` (page-level) to `parentElement.scrollTo()` (container-level)
- This prevents the entire page from jumping down when new combat log entries appear

### Debug Logging Added
- `[PASSIVE DEBUG]` logs classId and class name on each passive tick
- `[CASE 4 TRIGGERED]` specifically logs when Poison Cloud (class 4) activates
- `[PASSIVE ERROR]` logs if unknown classId reaches default case

### Combat Log Enhancement
- Now shows player's class at start: "⚔️ Your Class: Toxic Viper"
- Makes it obvious if wrong class is selected

## Testing Checklist

After selecting Toxic Viper:
- [ ] UI shows "Toxic Viper" in class selector
- [ ] Combat log shows "⚔️ Your Class: Toxic Viper"
- [ ] Browser console shows `[CLASS SELECTOR] Selected: Toxic Viper`
- [ ] When passive triggers, log shows `☠️ Poison Cloud bursts! Enemy corrupted!`
- [ ] NOT showing `⚡ Divine Grace stuns the enemy!`
- [ ] Combat log doesn't jump page, only scrolls within log container

## Code Location

**Main combat loop**: `src/App.tsx` lines 276-350
**Passive handlers**: `src/data/passiveState.ts` lines 1-331
**Class definitions**: `src/data/hybridClasses.ts` lines 1-922

---

**Last Updated**: 2024-01-19
**Status**: Debugging in progress

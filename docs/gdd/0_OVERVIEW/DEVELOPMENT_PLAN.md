# 🎮 凌云道 (Língyún Dào) - Project Development Plan

**Date:** January 23, 2026  
**Version:** 1.0  
**Status:** Active Development

---

## 📊 Overall Project Status

| Category | Completion | Status |
|----------|------------|--------|
| **Core Systems** | 85% | ✅ Functional |
| **Combat System** | 75% | ⚠️ Needs Enhancement |
| **Content (Mobs/Items)** | 90% | ✅ Complete |
| **UI/UX** | 75% | ⚠️ Improved but needs work |
| **Quest System** | 60% | ⚠️ Partially Implemented |
| **Audio/Visual Polish** | 40% | 🔶 Recently Added |
| **Balance/Polish** | 55% | 🔶 Needs Work |

**Overall Estimate: ~72% Complete**

---

## ✅ Completed Features (This Session)

1. ✅ Login/Register with Supabase authentication
2. ✅ Multi-character system with cloud saves
3. ✅ Video background on login page
4. ✅ Custom logo integrated throughout
5. ✅ Music system (login + game playlist shuffle)
6. ✅ Volume controls in Settings
7. ✅ Custom scrollbars (Wuxia theme)
8. ✅ Custom cursor (sword pointer)
9. ✅ Logout functionality
10. ✅ Flee confirmation modal

---

## 🔴 Top 10 Critical Issues/Improvements Needed

### Priority 1 - CRITICAL (Combat)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | **Combat is passive auto-attack** | Players are spectators, not participants | High |
| 2 | **Skills lack visual feedback** | No animations, screen effects, or sounds | Medium |
| 3 | **Element advantage invisible** | System exists but no UI feedback | Low |
| 4 | **No skill combos** | Skills feel isolated | Medium |
| 5 | **No enemy patterns** | All mobs just auto-attack | High |

### Priority 2 - HIGH (Content)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 6 | **Tier 4 skills unobtainable** | Endgame content locked | Medium |
| 7 | **Quest content minimal** | Little narrative progression | High |
| 8 | **Gear set bonuses not visible** | Players don't know they exist | Low |

### Priority 3 - MEDIUM (Technical)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 9 | **App.tsx is 4400+ lines** | Technical debt, hard to maintain | High |
| 10 | **No sound effects** | Combat feels silent | Medium |

---

## ⚔️ Combat System Deep Analysis

### Current Flow (Why it's "lackluster")
```
1. Click "Attack" → Combat starts
2. Every 1.5s: auto-attack exchange
3. Occasional skill button click
4. Combat ends when HP = 0
```

### What's Missing

| Missing Element | Player Impact |
|-----------------|---------------|
| Active dodge/block | No reaction gameplay |
| Combo system | Skills don't synergize |
| Enemy tells/patterns | No anticipation |
| Qi pressure | Resource management trivial |
| Skill timing windows | No "perfect timing" rewards |
| Critical decisions | No risk/reward moments |
| Status effect buildup | Debuffs feel weak |

---

## 💡 Combat Improvement Roadmap

### Phase 1: Quick Wins (1-2 hours each)

#### 1.1 Element Advantage Feedback
```
Show "🔥 SUPER EFFECTIVE!" when element advantage applies
Color damage numbers by element type
```

#### 1.2 Passive Trigger Animations
```
When passive triggers → show floating icon + name
Add combat log entry with special styling
```

#### 1.3 Skill Impact Effects
```
Screen shake on big hits (>20% HP damage)
Border flash on critical hits
Particle burst on skill use
```

#### 1.4 Combat Log Styling
```
Color-code player vs enemy actions
Add emojis for crits, dodges, status effects
Separate sections for damage dealt vs received
```

### Phase 2: Medium Effort (1-2 days each)

#### 2.1 Combo System
```typescript
// Define combos in skillSystem.ts
const SKILL_COMBOS = [
  {
    id: 'fire_burst',
    name: 'Inferno Chain',
    sequence: [1, 2], // Fire Slash → Flame Strike
    bonus: 1.5, // 50% extra damage on final skill
    window: 3000, // 3 seconds to complete
  },
];
```

#### 2.2 Enemy Special Attacks
```typescript
// Add to mob definitions
specialAttack: {
  name: 'Rage Swipe',
  damage: 1.5, // multiplier
  cooldown: 5, // every 5 turns
  warning: 'The beast prepares to strike!',
  element: 'physical',
}
```

#### 2.3 Block/Dodge Buttons
```
[Block] - 50% damage reduction for 2 seconds, 5s cooldown
[Dodge] - 100% avoidance for next attack, 10s cooldown
```

#### 2.4 Qi Pressure
```
- Reduce combat Qi regen from 1%/tick to 0.3%/tick
- Make players choose skills carefully
- Add "Meditate" option to restore Qi (but take damage)
```

### Phase 3: Major Features (1+ weeks)

#### 3.1 Boss Mechanics
```
Multi-phase fights:
- Phase 1: Normal combat
- Phase 2 (50% HP): Enrage, faster attacks
- Phase 3 (25% HP): Special mechanic (must dodge AoE)

Enrage timer: If fight > 2 minutes, boss gets +100% damage
```

#### 3.2 Skill Mastery
```
- Skills gain proficiency XP with use
- Level 1-10 mastery per skill
- Mastery reduces cooldown, increases damage
- Max mastery unlocks "Evolved" version
```

#### 3.3 Skill Trees
```
Allow skill customization:
- Choose 1 of 3 upgrades per skill
- Specialization paths (offense/defense/utility)
```

---

## 📋 System Status Matrix

### Fully Working ✅

| System | Notes |
|--------|-------|
| Character creation | 12 classes, avatar selection |
| World movement | Grid-based, zone transitions |
| Basic combat | Auto-attack + skills |
| Skill hotbar | 4 slots, cooldowns, Qi cost |
| Inventory | Stack management, sell |
| Equipment | 3 slots, durability |
| Crafting | 4 tiers, success rates |
| Reforging | Rarity upgrades, pity |
| Bestiary | Discovery tracking |
| Death penalty | 5% XP + durability |
| Auto-combat | Time-limited grinding |
| Authentication | Supabase login/register |
| Music system | Playlist shuffle, volume |

### Partially Implemented ⚠️

| System | Status | Missing |
|--------|--------|---------|
| Quest System | Framework done | Content (only ~5 quests) |
| NPC Dialog | UI works | Meaningful conversations |
| Tutorial | Exists | Combat training |
| Gear Set Bonuses | Defined | Combat application |
| Ultimate Skills | Defined | Acquisition quests |
| Faction Reputation | Database exists | Reward vendors |
| Daily Quests | Type defined | Rotation logic |

### Missing Entirely ❌

| Feature | Priority | Effort |
|---------|----------|--------|
| PvP combat | Low | Very High |
| Guilds/Sects | Medium | High |
| Multiplayer | Low | Very High |
| Achievements | Medium | Medium |
| Leaderboards | Low | Medium |
| Combat SFX | High | Medium |
| Mobile layout | Medium | High |
| Localization | Low | Medium |

---

## 🎯 Recommended Development Roadmap

### Sprint 1: Combat Feel (Week 1-2)
**Goal:** Make combat feel responsive and exciting

1. [ ] Add element advantage popup ("SUPER EFFECTIVE!")
2. [ ] Color damage numbers by element
3. [ ] Add screen shake on big hits
4. [ ] Show passive triggers as floating icons
5. [ ] Add "COMBO!" system with 2-skill chains
6. [ ] Implement Block/Dodge buttons

### Sprint 2: Enemy Variety (Week 3)
**Goal:** Make enemies interesting

1. [ ] Add special attacks to Elite+ mobs
2. [ ] Add attack warnings/telegraphs
3. [ ] Create 3 unique boss patterns
4. [ ] Add enrage timers to bosses

### Sprint 3: Audio Polish (Week 4)
**Goal:** Audio feedback

1. [ ] Add combat hit sounds
2. [ ] Add skill use sounds
3. [ ] Add level up fanfare
4. [ ] Add loot drop sounds
5. [ ] Add ambient sounds per zone

### Sprint 4: Content Expansion (Week 5-6)
**Goal:** More to do

1. [ ] Complete main quest chain (15+ quests)
2. [ ] Add Tier 4 skill acquisition quests
3. [ ] Implement daily quest rotation
4. [ ] Add 10+ meaningful NPCs

### Sprint 5: Systems Enhancement (Week 7-8)
**Goal:** Depth

1. [ ] Implement skill mastery progression
2. [ ] Add gear set bonus checking
3. [ ] Create faction reputation rewards
4. [ ] Balance endgame (Golden Core+)

---

## 🛠️ Technical Debt

### App.tsx Refactoring Plan

Current: **4400+ lines** in one file

Proposed structure:
```
src/
├── App.tsx (200 lines - just routing)
├── hooks/
│   ├── useCombat.ts (combat logic)
│   ├── useInventory.ts
│   ├── useMovement.ts
│   ├── useQuests.ts
│   └── usePlayer.ts
├── components/
│   ├── combat/
│   │   ├── CombatArena.tsx
│   │   ├── SkillBar.tsx
│   │   └── CombatLog.tsx
│   ├── world/
│   │   └── ...
│   └── ...
└── services/
    ├── combatService.ts
    ├── questService.ts
    └── ...
```

---

## 🎨 Custom Cursor (Implemented)

**Default cursor:** Golden sword pointer
**Hover cursor:** Red sword pointer (for buttons)

Located in: `src/index.css`

To customize with image files:
1. Create cursor images (32x32 PNG)
2. Place in `public/cursors/`
3. Update CSS:
```css
html, body {
  cursor: url('/cursors/default.png') 0 0, auto;
}
button, a, [role="button"] {
  cursor: url('/cursors/pointer.png') 0 0, pointer;
}
```

**Recommended cursor styles:**
- Default: Simple jade/gold brush stroke
- Pointer: Sword pointing
- Loading: Yin-yang spinning
- Disabled: Broken sword

---

## 📈 Metrics to Track

### Player Engagement
- Average session length
- Combat win/loss ratio
- Most used skills
- Most popular classes
- Drop-off points (where players quit)

### Balance Indicators
- Average level by playtime
- Spirit stones per hour
- Deaths per zone tier
- Gear rarity distribution

---

## 🚀 Launch Checklist

### Pre-Alpha (Current)
- [x] Core gameplay loop
- [x] Authentication
- [x] Cloud saves
- [x] Basic audio

### Alpha
- [ ] Combat improvements
- [ ] 20+ quests
- [ ] Sound effects
- [ ] Mobile responsive

### Beta
- [ ] All skills obtainable
- [ ] Balanced progression
- [ ] No game-breaking bugs
- [ ] Performance optimization

### Launch
- [ ] Tutorial polished
- [ ] New player experience tested
- [ ] Monetization (if applicable)
- [ ] Analytics tracking

---

## 📝 Notes

### Combat "Juice" Ideas
1. **Camera shake** on impacts
2. **Slow motion** on kills
3. **Blood/energy particles** on hits
4. **Victory pose** animation
5. **Skill name callouts** (text popup)
6. **Combo counter** display
7. **Damage number styles** (crit = bigger, DoT = smaller)

### Quick Balance Tweaks
- Reduce Qi regen in combat
- Increase cooldowns slightly
- Make dodge chance matter more
- Add more HP to bosses
- Reduce auto-combat rewards

---

*Document maintained by development team*
*Last updated: January 23, 2026*

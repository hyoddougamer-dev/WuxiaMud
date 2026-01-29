# 🎨 WUXIA MUD - UI OVERHAUL GDD
## Game Design Document - Interface Redesign

---

## 📋 PROBLEMAS IDENTIFICADOS

### **Atual (v1.0)**
❌ **Tela única sobrelotada** - Tudo numa página
❌ **Botões espalhados** - Sem organização clara
❌ **Informação compactada** - Difícil de ler
❌ **Falta hierarquia visual** - Tudo compete por atenção
❌ **Crafting muito compacto** - Só texto, sem visuals
❌ **Sem navegação clara** - Hard to find features
❌ **Mobile unfriendly** - Não responsivo

### **Target (v2.0)**
✅ **Sistema de abas/páginas** - Organização modular
✅ **Visual hierarchy clara** - Importância óbvia
✅ **Crafting visual** - Imagens, animações, feedback
✅ **Navegação intuitiva** - Tab bar / menu lateral
✅ **Responsive design** - Desktop + Mobile
✅ **Visual polish** - Efeitos, transições, polish

---

## 🏗️ ARQUITETURA PROPOSTA

### **ESTRUTURA MODULAR (Tab System)**

```
┌────────────────────────────────────────────────┐
│  HEADER: Avatar | HP/Qi | XP Bar | SS/Pts     │ ← Always visible
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │   MAIN CONTENT AREA (Tab-based)      │     │
│  │                                      │     │
│  │   Tab 1: World (current main view)   │     │
│  │   Tab 2: Character (stats + gear)    │     │
│  │   Tab 3: Inventory (manage items)    │     │
│  │   Tab 4: Forge (craft + reforge)     │     │
│  │   Tab 5: Bestiary (mob info)         │     │
│  │   Tab 6: Map (world overview)        │     │
│  │                                      │     │
│  └──────────────────────────────────────┘     │
│                                                │
├────────────────────────────────────────────────┤
│  BOTTOM TAB BAR: [World][Char][Inv][Forge][+] │ ← Main navigation
└────────────────────────────────────────────────┘
```

---

## 📱 TAB BREAKDOWN

### **TAB 1: WORLD (Exploration)**

**Purpose**: Main gameplay - exploration, combat, travel

**Layout**:
```
┌──────────────────────────────────────────┐
│  ┌──────────────────────────┐            │
│  │  ZONE IMAGE (Large)      │  MiniMap   │
│  │  + Zone info overlay     │  (Top-R)   │
│  │  + Quality stars         │            │
│  │  + Tier badge            │            │
│  └──────────────────────────┘            │
│                                          │
│  [Movement Buttons: W N S E]             │
│  [Hunt Monsters Button (if available)]   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  GAME LOG (Scrollable)           │   │
│  │  - Combat results                │   │
│  │  - Item drops                    │   │
│  │  - Level ups                     │   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

**Features**:
- Larger zone images (immersive)
- Cleaner movement controls
- Game log with filters (Combat/Loot/System)
- Quick actions: Travel, Hunt, Meditate

---

### **TAB 2: CHARACTER (Stats & Progression)**

**Purpose**: Character management, stat allocation, class selection

**Layout**:
```
┌──────────────────────────────────────────┐
│  ┌─────────────┐  CLASS INFO              │
│  │   Avatar    │  Selected: Blazing Sword │
│  │  (Large)    │  Realm: Golden Core      │
│  │             │  Total AP: 172           │
│  └─────────────┘                          │
│                                           │
│  ┌─────────────────────────────────┐     │
│  │  STATS (Visual Bars + Numbers)  │     │
│  │  ████████░░ STR: 50 [+][-]      │     │
│  │  ██████░░░░ DEX: 40 [+][-]      │     │
│  │  ██████████ CON: 60 [+][-]      │     │
│  │  ████░░░░░░ SPI: 30 [+][-]      │     │
│  │  ██████░░░░ WIL: 40 [+][-]      │     │
│  └─────────────────────────────────┘     │
│                                           │
│  [Change Class] [Reset Stats] [Passives] │
│                                           │
│  ┌─────────────────────────────────┐     │
│  │  EQUIPPED GEAR (Visual Slots)   │     │
│  │   [Weapon]  [Armor]  [Ring]     │     │
│  │   [Amulet]  [Artifact]          │     │
│  └─────────────────────────────────┘     │
└──────────────────────────────────────────┘
```

**Features**:
- Large avatar display
- Visual stat bars (easy comparison)
- Gear preview with 3D item icons
- Class info card
- Quick access to passives

---

### **TAB 3: INVENTORY (Item Management)**

**Purpose**: Manage consumables, materials, gear

**Layout**:
```
┌──────────────────────────────────────────┐
│  [Consumables][Materials][Gear] ← Filters │
│                                           │
│  ┌──────────────────────────────────┐    │
│  │  ITEM GRID (4x6 = 24 per page)   │    │
│  │                                   │    │
│  │  [item] [item] [item] [item]     │    │
│  │  [item] [item] [item] [item]     │    │
│  │  [item] [item] [item] [item]     │    │
│  │  [item] [item] [item] [item]     │    │
│  │  [item] [item] [item] [item]     │    │
│  │  [item] [item] [item] [item]     │    │
│  │                                   │    │
│  └──────────────────────────────────┘    │
│                                           │
│  Page 1/3  [<] [>]                        │
│                                           │
│  ┌──────────────────────────────────┐    │
│  │  ITEM DETAILS (Selected item)    │    │
│  │  Name: Golden Flame Core Blade   │    │
│  │  Rarity: Legendary                │    │
│  │  Stats: +12 STR, +9 DEX           │    │
│  │  Effects: Ignite (25%), Phoenix   │    │
│  │                                   │    │
│  │  [Equip] [Reforge] [Sell]        │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

**Features**:
- Category filters (no more tabs, use filters)
- Larger grid (4x6 instead of 4x4)
- Item detail panel on selection
- Quick actions: Equip, Reforge, Sell
- Search/sort options

---

### **TAB 4: FORGE (Crafting Hub)**

**Purpose**: Crafting, reforging, material management

**Layout**:
```
┌──────────────────────────────────────────┐
│  [Craft Gear] [Reforge Gear] ← Sub-tabs  │
│                                           │
│  ┌──────────────┐  RECIPE SELECTION      │
│  │   Weapon     │                         │
│  │   Preview    │  ┌─────────────────┐   │
│  │   (3D Icon)  │  │ Tier 1: Basic   │   │
│  │              │  │ Tier 2: Advanced│ ← Select │
│  │              │  │ Tier 3: Epic    │   │
│  │              │  │ Tier 4: Legendary│  │
│  └──────────────┘  └─────────────────┘   │
│                                           │
│  ┌─────────────────────────────────┐     │
│  │  MATERIALS REQUIRED              │     │
│  │                                   │     │
│  │  [Icon] Spirit Iron Ore x10      │     │
│  │         Have: 15 ✓               │     │
│  │         Drop: Mobs Lv 1-9        │     │
│  │                                   │     │
│  │  [Icon] Qi Fragment x5           │     │
│  │         Have: 2 ✗                │     │
│  │         Drop: Mobs Lv 1-9        │     │
│  │                                   │     │
│  │  Spirit Stones: 500              │     │
│  │         Have: 1200 ✓             │     │
│  └─────────────────────────────────┘     │
│                                           │
│  SUCCESS RATE: 85%  RARITY TABLE ▼       │
│                                           │
│  [FORGE WEAPON] ← Big, visual button     │
└──────────────────────────────────────────┘
```

**Features**:
- 3D weapon preview
- Material cards with icons
- Drop location info
- Visual success rate gauge
- Animated forging process
- Result showcase (rarity reveal animation)

---

### **TAB 5: BESTIARY (Monster Info)**

**Purpose**: Mob database, drop tables, hunting guide

**Layout**:
```
┌──────────────────────────────────────────┐
│  ZONE: [Dropdown selector]               │
│                                           │
│  ┌──────────────────────────────────┐    │
│  │  MOB LIST                         │    │
│  │  [img] Forest Wolf  Lv 1-3        │    │
│  │  [img] Stone Golem  Lv 4-6        │ ← Select │
│  │  [img] Fire Serpent Lv 7-9        │    │
│  └──────────────────────────────────┘    │
│                                           │
│  ┌──────────────────────────────────┐    │
│  │  MOB DETAILS                      │    │
│  │  ┌────────┐                       │    │
│  │  │  IMG   │  Stone Golem          │    │
│  │  └────────┘  Level: 4-6           │    │
│  │              HP: 200-300          │    │
│  │              DEF: 20              │    │
│  │                                   │    │
│  │  DROP TABLE:                      │    │
│  │  • Spirit Iron Ore (15%)          │    │
│  │  • Qi Fragment (10%)              │    │
│  │  • Stone Core (5%)                │    │
│  │                                   │    │
│  │  Location: Misty Forest (2,1)     │    │
│  │                                   │    │
│  │  [Travel to Zone] [Start Hunt]    │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

**Features**:
- Searchable mob database
- Drop rate transparency
- Zone locations
- Quick travel button
- Kill count tracking (future)

---

### **TAB 6: MAP (World Overview)**

**Purpose**: World navigation, zone discovery

**Layout** (já está bom, manter):
```
┌──────────────────────────────────────────┐
│  ┌────────────────────────────────┐      │
│  │   WORLD MAP (Grid view)        │      │
│  │   - Current position marked    │      │
│  │   - Visited zones highlighted  │      │
│  │   - Tier colors                │      │
│  └────────────────────────────────┘      │
│                                           │
│  [Close Map] [Legend]                     │
└──────────────────────────────────────────┘
```

**Features**: (já implementado, keep it)

---

## 🎨 VISUAL DESIGN PRINCIPLES

### **1. Color Coding System**

**Rarities** (já implementado):
- Common: Gray (#9CA3AF)
- Uncommon: Green (#10B981)
- Rare: Blue (#3B82F6)
- Epic: Purple (#A855F7)
- Legendary: Gold (#F59E0B)

**Tiers**:
- Tier 1: Copper (#CD7F32)
- Tier 2: Silver (#C0C0C0)
- Tier 3: Gold (#FFD700)
- Tier 4: Crimson (#DC143C)

**Resources**:
- HP: Red gradient
- Qi: Cyan gradient
- Spirit Stones: Gold
- Materials: Element-based colors

### **2. Typography Hierarchy**

```
H1: 2xl (24px) - Page titles
H2: xl (20px) - Section headers
H3: lg (18px) - Subsections
Body: base (16px) - Normal text
Small: sm (14px) - Secondary info
Tiny: xs (12px) - Metadata
```

### **3. Spacing System**

```
xs: 0.5rem (8px)
sm: 1rem (16px)
md: 1.5rem (24px)
lg: 2rem (32px)
xl: 3rem (48px)
```

### **4. Component Library**

**Cards**:
- Border-radius: 0.5rem
- Border: 2px solid
- Shadow: subtle
- Hover: glow effect

**Buttons**:
- Primary: Gradient (amber to orange)
- Secondary: Outlined
- Danger: Red gradient
- Success: Green gradient

**Inputs**:
- Dark background
- Glowing border on focus
- Clear placeholder text

---

## 🔄 TRANSITION PLAN

### **Phase 1: Core Structure (Week 1)**
- [ ] Create TabBar component
- [ ] Split App.tsx into page components
- [ ] Implement routing/tab switching
- [ ] Migrate World tab (current main view)

### **Phase 2: Character Tab (Week 2)**
- [ ] Create Character page component
- [ ] Visual stat bars
- [ ] Gear slot component redesign
- [ ] Class selector integration

### **Phase 3: Inventory Tab (Week 2-3)**
- [ ] Inventory page component
- [ ] Item filters (category-based)
- [ ] Item detail panel
- [ ] Quick actions (equip, reforge, sell)

### **Phase 4: Forge Tab (Week 3-4)**
- [ ] Forge page component
- [ ] 3D weapon preview system
- [ ] Material cards with icons
- [ ] Animated forging process
- [ ] Rarity reveal animation

### **Phase 5: Bestiary Tab (Week 4)**
- [ ] Bestiary page component
- [ ] Mob database
- [ ] Drop table display
- [ ] Zone integration

### **Phase 6: Polish (Week 5)**
- [ ] Animations & transitions
- [ ] Sound effects
- [ ] Mobile responsive
- [ ] Performance optimization

---

## 🖼️ CRAFTING SYSTEM REDESIGN (Priority)

### **Current Issues**:
❌ Text-only display
❌ Random gear (no choice)
❌ Missing material names
❌ No visual feedback

### **Proposed Redesign**:

**1. Gear Selection Phase**
```
┌─────────────────────────────────────┐
│  SELECT WEAPON TYPE                  │
│                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ [img]│  │ [img]│  │ [img]│       │
│  │ Sword│  │ Saber│  │Zither│       │
│  └──────┘  └──────┘  └──────┘       │
│                                      │
│  Blazing Sword Immortal (Class 1)   │
│  Fire Element | DPS Role             │
│                                      │
│  [Next: Choose Tier]                 │
└─────────────────────────────────────┘
```

**2. Tier Selection Phase**
```
┌─────────────────────────────────────┐
│  CHOOSE TIER                         │
│                                      │
│  ┌─────────────────────────────┐    │
│  │  Tier 1: Ember Blade        │    │
│  │  Stats: +3 STR, +2 DEX      │    │
│  │  Cost: 10 Iron, 5 Qi, 500 SS│ ← Select │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  Tier 2: Crimson Flame      │    │
│  │  Stats: +5 STR, +4 DEX      │    │
│  │  Cost: 15 Azure, 8 Stone... │    │
│  └─────────────────────────────┘    │
│  ...                                 │
│                                      │
│  [Back] [Confirm Selection]          │
└─────────────────────────────────────┘
```

**3. Crafting Confirmation**
```
┌─────────────────────────────────────┐
│  FORGE CONFIRMATION                  │
│                                      │
│  ┌──────────────┐                   │
│  │   Weapon     │  Crimson Flame    │
│  │   Preview    │  Sword            │
│  │   (Rotating) │                   │
│  │              │  Success: 75%     │
│  └──────────────┘                   │
│                                      │
│  Materials:                          │
│  [✓] Azure Crystal x15 (have 20)    │
│  [✓] Foundation Stone x8 (have 10)  │
│  [✗] Spirit Iron x5 (have 2)        │
│                                      │
│  Spirit Stones: 2,500 (have 5,000)  │
│                                      │
│  [Cancel] [FORGE] ← Glowing button  │
└─────────────────────────────────────┘
```

**4. Forging Animation**
```
┌─────────────────────────────────────┐
│  FORGING IN PROGRESS...              │
│                                      │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │      🔨 Hammer Animation     │   │
│  │      ✨ Sparks Flying        │   │
│  │      🔥 Flames               │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │
│  [████████░░] 80%                    │
└─────────────────────────────────────┘
```

**5. Result Reveal**
```
┌─────────────────────────────────────┐
│  SUCCESS!                            │
│                                      │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │   ⭐ LEGENDARY CRAFTED! ⭐   │   │
│  │                              │   │
│  │   Crimson Flame Sword        │   │
│  │   +12 STR, +10 DEX (2x base) │   │
│  │   Special: Ignite (25%)      │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │
│  [Craft Another] [Close]             │
└─────────────────────────────────────┘
```

---

## 📊 TECHNICAL IMPLEMENTATION

### **Component Structure**

```
src/
├── App.tsx (Main container)
├── components/
│   ├── layout/
│   │   ├── TabBar.tsx
│   │   ├── Header.tsx
│   │   └── PageContainer.tsx
│   ├── pages/
│   │   ├── WorldPage.tsx
│   │   ├── CharacterPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── ForgePage.tsx
│   │   ├── BestiaryPage.tsx
│   │   └── MapPage.tsx
│   ├── character/
│   │   ├── StatBar.tsx
│   │   ├── GearSlot.tsx
│   │   └── ClassCard.tsx
│   ├── forge/
│   │   ├── WeaponSelector.tsx
│   │   ├── TierSelector.tsx
│   │   ├── MaterialCard.tsx
│   │   ├── ForgingAnimation.tsx
│   │   └── ResultReveal.tsx
│   └── shared/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       └── Tooltip.tsx
└── data/
    └── (existing files)
```

### **State Management**

Currently: Single `player` state in App.tsx ✅ (good enough)

Future: Consider Zustand for:
- Character state
- Inventory state
- UI state (active tab, modals)

### **Performance**

- Use `React.memo` for heavy components
- Lazy load page components
- Virtual scrolling for large lists
- Debounce search inputs

---

## 🎯 PRIORITY FIXES (Immediate)

### **1. Material Name Display** ✅ (Already fixed)
- Replace IDs with names in error messages

### **2. Crafting Gear Selection** 🔴 (High Priority)
Add weapon type selector:
```tsx
// Before forging, let player choose class-specific gear
<select onChange={(e) => setSelectedClass(e.target.value)}>
  <option value={1}>Blazing Sword (Fire DPS)</option>
  <option value={2}>Glacial Shadow (Ice Speed)</option>
  ...
</select>
```

### **3. Material Source Tooltips** ✅ (Already fixed)
Show "Drop: Mobs Lv X-Y" under each material

### **4. Visual Feedback**
Add:
- Loading spinners
- Success/error toasts
- Progress bars
- Confirmation dialogs

---

## 💡 FUTURE ENHANCEMENTS

### **Quality of Life**
- Auto-sort inventory
- Favorite items (star)
- Quick sell junk
- Batch crafting
- Recipe book (unlock system)

### **Social Features**
- Leaderboards
- Clan system
- Trading (future)
- Chat (future)

### **Monetization** (se relevante)
- Premium avatar frames
- Inventory expansion
- Cosmetic weapon skins
- XP boosters

---

## ✅ ACCEPTANCE CRITERIA

**v2.0 UI is successful if**:
- [ ] Players can find all features within 2 clicks
- [ ] Crafting is intuitive without tutorial
- [ ] Mobile users can play comfortably
- [ ] Load time < 2 seconds
- [ ] Zero confusion about navigation
- [ ] Players enjoy the visual experience

---

## 📅 TIMELINE ESTIMATE

**Total**: 5-6 weeks (1 developer)

**Week 1**: Tab system + World page
**Week 2**: Character + Inventory pages
**Week 3-4**: Forge page (most complex)
**Week 5**: Bestiary + Polish
**Week 6**: Testing + Bug fixes

---

## 🚀 RECOMMENDATION

**Start with**:
1. Fix material name bug ✅ DONE
2. Add class selector to crafting ← NEXT
3. Create TabBar component
4. Migrate existing UI to World tab
5. Build out other tabs iteratively

**Don't**:
- Rebuild everything at once (risky)
- Break existing functionality
- Delay for "perfect" design

**Do**:
- Incremental improvements
- Test each tab separately
- Get user feedback early
- Keep data layer unchanged

---

*Document created: January 19, 2026*
*Target Release: v2.0 - March 2026*

# 🎮 VISUAL COMBAT SYSTEM - Asset Guide

## 📁 Folder Structure to Create

```
public/
└── assets/
    └── combat/
        ├── backgrounds/
        │   ├── forest_arena.png
        │   ├── mountain_arena.png
        │   ├── temple_arena.png
        │   └── cave_arena.png
        ├── characters/
        │   ├── player/
        │   │   ├── idle.png
        │   │   ├── attack.png
        │   │   └── hurt.png
        │   └── enemies/
        │       ├── wolf_idle.png
        │       ├── bandit_idle.png
        │       ├── demon_idle.png
        │       └── ... (one per enemy type)
        ├── effects/
        │   ├── slash_fire.png
        │   ├── slash_ice.png
        │   ├── slash_lightning.png
        │   ├── hit_impact.png
        │   └── heal_glow.png
        └── ui/
            ├── skill_frame.png
            └── hp_bar_frame.png
```

---

## 🎨 Asset Specifications

### Backgrounds (Arena)
| File | Size | Format | Description |
|------|------|--------|-------------|
| forest_arena.png | 1920x600px | PNG | Forest/bamboo backdrop |
| mountain_arena.png | 1920x600px | PNG | Mountain peaks |
| temple_arena.png | 1920x600px | PNG | Ancient temple interior |
| cave_arena.png | 1920x600px | PNG | Dark cave with crystals |

**Style**: Wide panoramic, slightly blurred for depth, wuxia/martial arts aesthetic

---

### Player Character
| File | Size | Format | Description |
|------|------|--------|-------------|
| idle.png | 256x256px | PNG (transparent) | Standing/breathing pose |
| attack.png | 256x256px | PNG (transparent) | Sword swing pose |
| hurt.png | 256x256px | PNG (transparent) | Taking damage pose |

**Style**: Martial artist, Chinese robes, sword/weapon visible

---

### Enemy Characters
| File | Size | Format | Description |
|------|------|--------|-------------|
| wolf_idle.png | 256x256px | PNG (transparent) | Wild wolf monster |
| bandit_idle.png | 256x256px | PNG (transparent) | Human bandit enemy |
| demon_idle.png | 256x256px | PNG (transparent) | Demon/spirit enemy |
| tiger_idle.png | 256x256px | PNG (transparent) | Tiger beast |
| ghost_idle.png | 256x256px | PNG (transparent) | Ghost/spirit |

---

### Effects (Skills/Impacts)
| File | Size | Format | Description |
|------|------|--------|-------------|
| slash_fire.png | 128x128px | PNG (transparent) | Orange/red slash effect |
| slash_ice.png | 128x128px | PNG (transparent) | Blue/cyan slash effect |
| slash_lightning.png | 128x128px | PNG (transparent) | Yellow electric effect |
| slash_wood.png | 128x128px | PNG (transparent) | Green vine/leaf effect |
| slash_void.png | 128x128px | PNG (transparent) | Purple dark effect |
| hit_impact.png | 128x128px | PNG (transparent) | White/yellow hit spark |
| heal_glow.png | 128x128px | PNG (transparent) | Green healing aura |

---

## 🆓 FREE Asset Sources

### Best Free Sources for Wuxia/RPG Assets:

#### 1. **Itch.io** (RECOMMENDED)
- URL: https://itch.io/game-assets/free/tag-2d
- Search terms: 
  - "martial arts character"
  - "chinese warrior"
  - "fantasy RPG character"
  - "oriental background"
  - "VFX effects"

**Specific Recommendations:**
- https://itch.io/game-assets/free/tag-rpg
- https://itch.io/game-assets/free/tag-fantasy

#### 2. **OpenGameArt**
- URL: https://opengameart.org/
- Search: "warrior", "martial arts", "oriental", "chinese"
- License: Various (check CC0 for commercial use)

#### 3. **CraftPix** (Free Section)
- URL: https://craftpix.net/freebies/
- Has high-quality character packs
- Search: "character", "warrior", "fantasy"

#### 4. **Kenney Assets**
- URL: https://kenney.nl/assets
- Great UI elements and effects
- All CC0 (free for commercial use)

#### 5. **Game-Icons.net**
- URL: https://game-icons.net/
- Perfect for skill icons
- All CC BY 3.0

---

## 🤖 AI-Generated Assets

You can use AI to generate custom assets:

### Midjourney / DALL-E Prompts:

**For Player Character:**
```
2D game character sprite, male martial artist wuxia warrior, 
Chinese silk robes, holding sword, idle stance pose, 
full body, transparent background, pixel art style, 
256x256 resolution, side view facing right
```

**For Enemy (Wolf):**
```
2D game sprite, fierce wolf monster, glowing red eyes, 
dark fur, aggressive stance, fantasy RPG style, 
transparent background, 256x256 resolution, side view
```

**For Background (Forest Arena):**
```
2D game background, bamboo forest battle arena, 
wuxia martial arts setting, misty atmosphere, 
Chinese mountains in distance, panoramic wide shot,
1920x600 resolution, digital painting style
```

**For Slash Effect:**
```
2D game VFX, fire sword slash effect, 
orange and red energy trail, dynamic motion blur,
transparent background, 128x128 resolution, 
fantasy RPG style
```

---

## 📋 Priority Order (What to Get First)

### Phase 1: Minimum Viable (Can Test Combat)
1. ✅ 1x Player idle image (256x256 PNG)
2. ✅ 1x Enemy idle image (256x256 PNG)
3. ✅ 1x Background (1920x600 PNG)

### Phase 2: Basic Polish
4. Player attack + hurt poses
5. 2-3 more enemy types
6. Basic slash effect

### Phase 3: Full Visual
7. All elemental effects (fire, ice, lightning, etc.)
8. Multiple backgrounds
9. UI frames and polish

---

## 🛠️ Quick Start Without Assets

The system will work even WITHOUT custom assets!
- Uses placeholder images automatically
- All CSS animations work with any image
- You can add assets gradually

**To test immediately:**
1. Just use the component
2. Placeholder images will show
3. Add real assets when ready

---

## 📝 Asset Naming Convention

Please follow this exact naming:
- All lowercase
- Underscores for spaces
- Format: `type_element.png` or `character_state.png`

Examples:
- ✅ `slash_fire.png`
- ✅ `player_idle.png`
- ✅ `demon_hurt.png`
- ❌ `Slash Fire.png`
- ❌ `PlayerIdle.PNG`

---

## 🎯 My Recommendations

Based on your project, I recommend:

1. **Start with Itch.io** - Best quality free assets
2. **Use AI for custom characters** - Match your game's unique style
3. **Get a consistent art style** - Pick ONE style (anime, pixel, realistic) and stick with it
4. **Effects can be simple** - CSS animations do most of the work

---

## ❓ Need Help?

When you have assets ready, tell me and I can:
1. Help integrate them into the game
2. Adjust animations for your specific sprites
3. Add more visual effects
4. Create sprite sheets if needed

Good luck finding assets! 🎨

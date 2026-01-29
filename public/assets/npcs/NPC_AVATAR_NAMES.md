# NPC Avatar Naming Convention

Each NPC avatar should be a **256x256** pixel PNG file (portrait style).
Transparent background or solid dark background.
Style: Semi-realistic or anime wuxia.

---

## 📁 public/assets/npcs/

| NPC ID | Name | Title | Zone | Current Emoji | Filename |
|--------|------|--------|------|-------------|------------------|
| elder_xuanming | Elder Xuanming | Sect Master | 0,0 | 👴 | `elder_xuanming.png` |
| elder_qingfeng | Elder Qingfeng | Martial Hall Master | 1,0 | 🧙 | `elder_qingfeng.png` |
| alchemist_mei | Alchemist Mei | Pill Pavilion Master | -1,0 | 👩‍🔬 | `alchemist_mei.png` |
| gardener_liu | Gardener Liu | Spirit Garden Keeper | 0,1 | 👨‍🌾 | `gardener_liu.png` |
| disciple_chen | Senior Disciple Chen | Outer Sect Prefect | 0,-1 | 💂 | `disciple_chen.png` |
| hermit_zhang | Hermit Zhang | The Mad Sage | -1,-4 | 🧓 | `hermit_zhang.png` |
| guard_captain_wu | Captain Wu | Gate Commander | 0,2 | 🛡️ | `guard_captain_wu.png` |
| scribe_zhang | Scribe Zhang | Keeper of the Sacred Library | 0,1 | 📚 | `scribe_zhang.png` |
| shadow_elder_moyin | Elder Moyin | Shadow Matriarch | -4,1 | 👻 | `shadow_elder_moyin.png` |
| elder_huoyan_corrupted | Corrupted Huoyan | The Fallen Flame | -5,0 | 🔥 | `elder_huoyan_corrupted.png` |
| disciple_mei_lin | Mei Lin | Senior Sister | 0,1 | 👧 | `disciple_mei_lin.png` |
| alchemist_wang | Alchemist Wang | Pill Master | 0,1 | ⚗️ | `alchemist_wang.png` |

---

## Total: 12 NPCs (7 Original + 5 Arc 2)

---

## Design Notes

### Visual Style:
- **Elder Xuanming**: Old sage with long white beard, elaborate blue Sect Master robes
- **Elder Qingfeng**: Middle-aged muscular man, battle scars, stern expression
- **Alchemist Mei**: Young woman with messy hair, soot stains, mischievous smile
- **Gardener Liu**: Elderly man with straw hat, calm expression but cunning eyes
- **Disciple Chen**: Young man in disciple uniform, friendly but tired expression
- **Hermit Zhang**: Eccentric old man with glazed eyes, disheveled hair, mysterious smile
- **Captain Wu**: Veteran warrior with armor, multiple scars, vigilant gaze
- **Scribe Zhang**: Ancient scholar with reading glasses, formal librarian robes, judgmental look
- **Elder Moyin**: Ethereal shadow woman, ageless, multiple ghostly eyes, semi-transparent
- **Corrupted Huoyan**: Once noble elder now twisted, black flames, corrupted void marks
- **Mei Lin**: Beautiful young woman, competitive expression, elegant sword disciple attire
- **Alchemist Wang**: Middle-aged man, burn marks, enthusiastic mad scientist look

### Colors by Faction:
- **Azure Cloud Sect**: Blues, whites, silver tones
- **Wilderness/Neutral**: Browns, greens, grays
- **Shadow Sect**: Purples, blacks, ethereal grays
- **Void Cult**: Black flames, corrupted reds, void purple

### Dimensions:
- **Avatar (dialogues)**: 256x256 px
- **Portrait (side panel)**: 128x128 px (can be resized)

---

## 🎨 Leonardo AI Prompts

### Technical Settings (All NPCs):
- **Model**: Leonardo Phoenix or Anime XL
- **Size**: 256x256 px (or generate 512x512 and resize)
- **Guidance**: 7-9
- **Alchemy**: ON
- **PhotoReal**: OFF

### Negative Prompt (Use for ALL):
```
3D render, photorealistic, western fantasy, medieval european, sci-fi, modern clothes, blurry, low quality, text, watermark, signature, multiple people, full body, hands
```

---

### 1. elder_xuanming.png
**Prompt**:
```
Portrait of ancient Chinese sect master, elderly wise man with very long flowing white beard, serene enlightened expression, elaborate blue and silver silk robes with cloud patterns, jade hair ornament, glowing faint blue qi aura, traditional wuxia style, bust portrait, dark background, digital painting, Chinese fantasy art
```

---

### 2. elder_qingfeng.png
**Prompt**:
```
Portrait of Chinese martial arts master, middle-aged muscular man, battle scars on face, stern disciplined expression, short gray hair tied back, bare shoulders showing muscles, traditional martial artist training robes in gray and blue, intense focused eyes, wuxia xianxia style, bust portrait, dark background, digital painting
```

---

### 3. alchemist_mei.png
**Prompt**:
```
Portrait of young Chinese female alchemist, messy black hair in loose bun with strands falling out, small soot stains on cheeks, mischievous playful smile, green and white alchemy apprentice robes, bubbling potion flask nearby, curious bright eyes, wuxia fantasy style, cute but capable, bust portrait, dark background, digital painting
```

---

### 4. gardener_liu.png
**Prompt**:
```
Portrait of elderly Chinese gardener sage, wearing traditional straw farmer hat, calm serene expression with cunning knowing eyes, weathered kind face, simple brown and green earth-toned robes, small spirit plant visible near shoulder, connection to nature, wuxia cultivation style, bust portrait, dark background, digital painting
```

---

### 5. disciple_chen.png
**Prompt**:
```
Portrait of young Chinese male cultivator, outer disciple uniform in blue and white, friendly approachable smile but tired eyes, short neat black hair, clean-shaven, modest sect badge on chest, helpful reliable appearance, wuxia fantasy style, young hero archetype, bust portrait, dark background, digital painting
```

---

### 6. hermit_zhang.png
**Prompt**:
```
Portrait of eccentric Chinese hermit sage, wild disheveled gray hair, slightly glazed mystical eyes that see beyond, cryptic knowing smile, tattered dark brown and green robes, mysterious aura, possibly mad or enlightened, swamp hermit appearance, wuxia dark fantasy style, bust portrait, dark swamp background, digital painting
```

---

### 7. guard_captain_wu.png
**Prompt**:
```
Portrait of veteran Chinese warrior captain, battle-worn face with multiple scars, vigilant watchful eyes, close-cropped gray hair, elaborate bronze and blue sect guard armor with cloud motifs, strong jaw, protective stern expression, military discipline, wuxia martial arts style, bust portrait, dark background, digital painting
```

---

### 8. scribe_zhang.png
**Prompt**:
```
Portrait of ancient Chinese scholar librarian, extremely old but sharp intelligent eyes, thin reading spectacles, long thin white beard neatly groomed, formal dark blue librarian robes with scroll patterns, judgmental evaluating expression, surrounded by faint floating text, keeper of knowledge, wuxia cultivation style, bust portrait, dark library background, digital painting
```

---

### 9. shadow_elder_moyin.png
**Prompt**:
```
Portrait of ethereal shadow matriarch, ageless Chinese woman whose form shifts between solid and shadow, multiple pairs of glowing purple eyes visible in her shadowy aura, pale porcelain skin, flowing black and purple robes that dissolve into mist, ancient and unknowable expression, neither good nor evil, wuxia dark fantasy, supernatural entity, bust portrait, void darkness background, digital painting
```

---

### 10. elder_huoyan_corrupted.png
**Prompt**:
```
Portrait of corrupted Chinese fire cultivator, once noble elder now twisted by void energy, face partially consumed by dark corruption marks, eyes burning with black and orange flames, torn and burnt red and black robes, expression of madness and power, black fire qi aura surrounding him, fallen villain appearance, wuxia dark fantasy, bust portrait, flames and void background, digital painting
```

---

### 11. disciple_mei_lin.png
**Prompt**:
```
Portrait of beautiful young Chinese sword disciple woman, confident competitive expression hiding kindness, elegant features with sharp intelligent eyes, long black hair in practical warrior style, blue and white senior disciple robes of high quality, subtle rivalry in her gaze, secretly caring, wuxia cultivation romance style, bust portrait, dark background, digital painting
```

---

### 12. alchemist_wang.png
**Prompt**:
```
Portrait of middle-aged Chinese male alchemist, enthusiastic mad scientist expression, small burn marks and singed eyebrows, goggles pushed up on forehead, excited gleaming eyes, green and white master alchemist robes slightly stained, holding bubbling vial, chaotic energy, comedic genius archetype, wuxia fantasy style, bust portrait, alchemical smoke background, digital painting
```


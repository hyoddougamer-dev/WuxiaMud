# 🎨 PROMPTS LEONARDO.AI - WuxiaMUD (SPRITES)

## ⚠️ VERSÃO CORRIGIDA PARA SPRITES DE COMBATE

---

## 📋 Como Usar no Leonardo.ai

1. Vai a https://leonardo.ai/
2. Cria conta (150 créditos grátis/dia)
3. Clica em "AI Image Generation"
4. Cola o prompt
5. **Configurações para SPRITES:**
   - **Model:** Anime
   - **Style:** Anime General
   - **Contrast:** High
   - **Image Dimensions:** 1:1 (quadrado) - Medium 960x960
   - **Number of Images:** 4

6. **NEGATIVE PROMPT (SEMPRE USAR):**
```
cropped, close up, portrait only, face only, bust shot, 
background details, complex background, scenery, landscape,
blurry, low quality, deformed, bad anatomy, extra limbs
```

7. **Após gerar:** Remove fundo em https://www.remove.bg/ (grátis)

8. **Guarda em:** `public/assets/combat/characters/player/` ou `.../enemies/`

---

## 📁 ESTRUTURA DE PASTAS

```
public/assets/combat/
├── characters/
│   ├── player/
│   │   ├── class_1_blazing_sword.png
│   │   ├── class_2_glacial_shadow.png
│   │   └── ... (12 classes)
│   └── enemies/
│       ├── mob_spirit_rat.png
│       ├── mob_garden_spider.png
│       └── ... (44 mobs)
├── backgrounds/
│   ├── bg_azure_cloud_main_hall.png
│   └── ... (22 mapas)
└── effects/
    └── (efeitos de ataque)
```

---

# ⚔️ CLASSES DO JOGO (12 TOTAL)

## 🗡️ SWORD CLASSES (Espada) - 4 Classes

### Class 1: Blazing Sword Immortal
- **Ficheiro:** `class_1_blazing_sword.png`
- **Weapon:** Sword | **Element:** Fire | **Stats:** DEX + SPI
```
Full body character sprite, young male Chinese martial artist,
wuxia xianxia style, combat ready idle stance facing right,
long dark hair with red ember tips flowing,
crimson and gold hanfu robes with flame phoenix patterns,
holding glowing fire sword in attack position,
flames dancing around blade and body,
2D game sprite art, fighting game character style,
simple solid dark grey background, isolated character,
clean edges, full body visible head to toe,
anime game asset, high quality sprite
```

### Class 2: Glacial Shadow
- **Ficheiro:** `class_2_glacial_shadow.png`
- **Weapon:** Sword | **Element:** Ice | **Stats:** DEX + STR
```
Full body character sprite, mysterious female Chinese assassin,
wuxia xianxia style, agile combat stance facing right,
long silver-white flowing hair with ice crystals,
elegant ice-blue and white silk assassin outfit,
holding crystalline ice sword ready to strike,
frost crystals forming around her body,
2D game sprite art, fighting game character style,
simple solid dark grey background, isolated character,
clean edges, full body visible head to toe,
anime game asset, high quality sprite
```

### Class 3: Spellfire Duelist
- **Ficheiro:** `class_3_spellfire_duelist.png`
- **Weapon:** Sword | **Element:** Fire | **Stats:** SPI + DEX
```
Full body character sprite, elegant Chinese battlemage,
wuxia xianxia style, magical combat stance facing right,
medium black hair with arcane golden streaks,
purple and gold scholar-warrior robes with spell runes,
holding spell-infused flaming sword, arcane symbols floating,
magical fire aura emanating from body,
2D game sprite art, fighting game character style,
simple solid dark grey background, isolated character,
clean edges, full body visible head to toe,
anime game asset, high quality sprite
```

### Class 4: Toxic Viper
- **Ficheiro:** `class_4_toxic_viper.png`
- **Weapon:** Sword | **Element:** Wood | **Stats:** DEX + WIL
```
Full body character sprite, cunning female Chinese poison assassin,
wuxia xianxia style, serpent-like combat stance facing right,
long dark green hair in serpent style,
dark green and black serpent-patterned leather outfit,
holding curved blade dripping with green poison,
venomous green mist swirling around,
2D game sprite art, fighting game character style,
simple solid dark grey background, isolated character,
clean edges, full body visible head to toe,
anime game asset, high quality sprite
```

---

## ⚔️ SABER CLASSES (Sabre) - 4 Classes

### Class 5: Asura of War
- **Ficheiro:** `class_5_asura_of_war.png`
- **Weapon:** Saber | **Element:** Fire | **Stats:** STR + CON
```
Full body character sprite, fierce muscular Chinese berserker warrior,
wuxia xianxia style, aggressive battle stance facing right,
wild spiky black hair with blood-red streaks,
battle-scarred crimson and black demon war armor,
holding massive flame-engulfed heavy saber overhead,
blood-red berserker aura emanating from body,
2D game sprite art, fighting game character style,
simple solid dark grey background, isolated character,
clean edges, full body visible head to toe,
anime game asset, high quality sprite
```

### Class 6: Frozen Steel Guard
- **Ficheiro:** `class_6_frozen_steel_guard.png`
- **Weapon:** Saber | **Element:** Ice | **Stats:** CON + STR
```
Full body character sprite, stoic armored Chinese guardian knight,
wuxia xianxia style, defensive stance facing right,
short silver-white hair with ice crystals,
heavy ice-blue steel plate armor with frost runes,
holding frost-covered saber and ice tower shield,
protective frost barrier around body,
2D game sprite art, fighting game character style,
simple solid dark grey background, isolated character,
clean edges, full body visible head to toe,
anime game asset, high quality sprite
```

### Class 7: Verdant Blade Monarch
- **Ficheiro:** `class_7_verdant_blade_monarch.png`
- **Weapon:** Saber | **Element:** Wood | **Stats:** STR + SPI
```
Full body character sprite, noble Chinese nature emperor,
wuxia xianxia style, regal combat stance facing right,
long flowing brown hair with living leaves woven in,
majestic green and gold nature monarch robes,
holding ancient wooden saber wrapped with living vines,
nature energy and flowers growing around body,
2D game sprite art, fighting game character style,
simple solid dark grey background, isolated character,
clean edges, full body visible head to toe,
anime game asset, high quality sprite
```

### Class 8: Wilderness Stalker
- **Ficheiro:** `class_8_wilderness_stalker.png`
- **Weapon:** Saber | **Element:** Wood | **Stats:** STR + DEX
```
Full body character sprite, agile Chinese wilderness hunter,
wuxia xianxia style, crouching hunter stance facing right,
short messy brown hair with feathers,
light leather and cloth forest ranger hunting outfit,
holding curved hunting saber ready to pounce,
leaves and wind swirling around body,
2D game sprite art, fighting game character style,
simple solid dark grey background, isolated character,
clean edges, full body visible head to toe,
anime game asset, high quality sprite
```

---

## 🎵 ZITHER CLASSES (Cítara/Guqin) - 4 Classes

### Class 9: Phoenix Cry Cultivator
- **Ficheiro:** `class_9_phoenix_cry.png`
- **Weapon:** Zither | **Element:** Fire | **Stats:** SPI + WIL
```
Full body character sprite, graceful Chinese phoenix musician,
wuxia xianxia style, elegant performance stance facing right,
long flowing crimson-red hair,
elegant red and gold phoenix feather-patterned hanfu,
holding ornate golden guqin zither playing fire notes,
phoenix fire wings forming ethereally behind,
2D game sprite art, fighting game character style,
simple solid dark grey background, isolated character,
clean edges, full body visible head to toe,
anime game asset, high quality sprite
```

### Class 10: Divine Melody Healer
- **Ficheiro:** `class_10_divine_melody.png`
- **Weapon:** Zither | **Element:** Lightning | **Stats:** SPI + WIL
```
Full body character sprite, serene Chinese divine healer,
wuxia xianxia style, peaceful casting stance facing right,
long pure white hair in elegant celestial bun,
flowing white and gold celestial healer robes,
holding silver divine zither with glowing strings,
healing divine light and gentle lightning around,
2D game sprite art, fighting game character style,
simple solid dark grey background, isolated character,
clean edges, full body visible head to toe,
anime game asset, high quality sprite
```

### Class 11: Phantom Musician
- **Ficheiro:** `class_11_phantom_musician.png`
- **Weapon:** Zither | **Element:** Void | **Stats:** SPI + DEX
```
Full body character sprite, ethereal Chinese phantom ghost musician,
wuxia xianxia style, ghostly floating stance facing right,
long translucent purple-black ghostly hair,
dark flowing robes fading into shadow mist,
holding ancient spectral zither made of shadows,
ghostly purple void spirits floating around,
2D game sprite art, fighting game character style,
simple solid dark grey background, isolated character,
clean edges, full body visible head to toe,
anime game asset, high quality sprite
```

### Class 12: Unbreakable Spirit Sage
- **Ficheiro:** `class_12_unbreakable_sage.png`
- **Weapon:** Zither | **Element:** Void | **Stats:** CON + WIL
```
Full body character sprite, ancient wise Chinese immortal sage,
wuxia xianxia style, meditative defensive stance facing right,
long grey-white beard and elder hair,
heavy dark purple and black protective meditation robes,
holding massive ancient stone zither with void runes,
protective void barrier and ancient runes floating,
2D game sprite art, fighting game character style,
simple solid dark grey background, isolated character,
clean edges, full body visible head to toe,
anime game asset, high quality sprite
```

---

# 👹 MONSTROS DO JOGO (44 TOTAL)

## 📍 Qi Condensation Realm (Level 1-9)

### Level 1-3: Starter Mobs

#### 1. Spirit Rat (Lvl 1)
- **Ficheiro:** `mob_spirit_rat.png`
```
Full body monster sprite, ethereal spirit rat demon creature,
wuxia xianxia style, aggressive stance facing left,
small glowing red menacing eyes, grey ethereal ghostly fur,
spiritual energy wisps around body, sharp teeth and claws,
ghostly translucent demonic rat, ready to attack,
2D game sprite art, enemy monster style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 2. Garden Spider (Lvl 1)
- **Ficheiro:** `mob_garden_spider.png`
```
Full body monster sprite, giant demonic garden spider,
wuxia xianxia style, hunting stance facing left,
multiple glowing green poison eyes, jade-colored exoskeleton,
poison green markings on body, eight legs spread wide,
venomous dripping fangs, web silk around legs,
2D game sprite art, enemy monster style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 3. Sect Servant (Lvl 2)
- **Ficheiro:** `mob_sect_servant.png`
```
Full body character sprite, possessed corrupted sect servant,
wuxia xianxia style, shambling stance facing left,
disheveled zombie appearance, torn dirty grey robes,
glowing yellow mindless eyes, holding old broom weapon,
dark corruption marks on skin, undead servant,
2D game sprite art, enemy character style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 4. Training Dummy (Lvl 2)
- **Ficheiro:** `mob_training_dummy.png`
```
Full body object sprite, animated possessed training dummy,
wuxia xianxia style, combat stance facing left,
wooden humanoid practice dummy come alive,
glowing red spirit eyes, worn rope bindings,
cracks with spiritual energy leaking, wooden body,
2D game sprite art, enemy object style,
simple solid dark grey background, isolated object,
clean edges, full body visible, anime game asset
```

#### 5. Pestilent Worm (Lvl 2)
- **Ficheiro:** `mob_pestilent_worm.png`
```
Full body monster sprite, giant pestilent poison worm,
wuxia xianxia style, rearing attack stance facing left,
slimy segmented worm body, sickly yellow-green color,
dripping poison slime, multiple small eyes,
poison sac visible, disgusting parasitic creature,
2D game sprite art, enemy monster style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 6. Herb Spirit (Lvl 3)
- **Ficheiro:** `mob_herb_spirit.png`
```
Full body monster sprite, nature herb spirit elemental,
wuxia xianxia style, defensive stance facing left,
small humanoid made of herbs and flowers,
glowing with medicinal herb energy, leaf features,
green nature energy emanating, root tendrils for limbs,
2D game sprite art, enemy elemental style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

### Level 4-6: Early Combat

#### 7. Novice Cultivator (Lvl 4)
- **Ficheiro:** `mob_novice_cultivator.png`
```
Full body character sprite, young rogue novice cultivator,
wuxia xianxia style, basic combat stance facing left,
teenage inexperienced appearance, simple grey robes,
determined young eyes, holding wooden practice sword,
faint weak spiritual aura around body,
2D game sprite art, enemy character style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 8. Meditation Monk (Lvl 4)
- **Ficheiro:** `mob_meditation_monk.png`
```
Full body character sprite, corrupted meditation monk,
wuxia xianxia style, corrupted stance facing left,
bald head with dark corruption veins visible,
stained and torn orange monk robes, possessed eyes,
meditation beads glowing dark energy, fallen monk,
2D game sprite art, enemy character style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 9. Sect Guard (Lvl 5)
- **Ficheiro:** `mob_sect_guard.png`
```
Full body character sprite, hostile sect guard warrior,
wuxia xianxia style, guard stance facing left,
stern military appearance, sect guard armor with badge,
disciplined stance, holding standard guard spear,
loyal soldier ready to fight intruders,
2D game sprite art, enemy character style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 10. Junior Disciple (Lvl 5)
- **Ficheiro:** `mob_junior_disciple.png`
```
Full body character sprite, arrogant junior disciple,
wuxia xianxia style, cocky stance facing left,
young prideful appearance, sect disciple robes,
overconfident smirk, holding iron sword,
weak but arrogant spiritual aura visible,
2D game sprite art, enemy character style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

### Level 6-8: Bandits & Beasts

#### 11. Bandit Thug (Lvl 6)
- **Ficheiro:** `mob_bandit_thug.png`
```
Full body character sprite, Chinese mountain bandit thug,
wuxia xianxia style, threatening stance facing left,
rough scarred criminal face, red bandana,
worn leather and dirty cloth bandit armor,
holding rusty dao blade, intimidating muscular build,
2D game sprite art, enemy character style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 12. Bandit Archer (Lvl 6)
- **Ficheiro:** `mob_bandit_archer.png`
```
Full body character sprite, Chinese bandit archer,
wuxia xianxia style, aiming stance facing left,
lean hunter appearance, one scarred eye,
dark leather archer outfit, quiver on back,
holding crude bow with arrow drawn, sharp eyes,
2D game sprite art, enemy character style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 13. Mountain Ape (Lvl 6)
- **Ficheiro:** `mob_mountain_ape.png`
```
Full body monster sprite, giant mountain ape beast,
wuxia xianxia style, chest beating stance facing left,
massive muscular primate, brown-grey fur,
spiritual markings on body, fierce red eyes,
powerful arms raised, roaring with sharp fangs,
2D game sprite art, enemy beast style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 14. Poison Spider (Lvl 7)
- **Ficheiro:** `mob_poison_spider.png`
```
Full body monster sprite, giant venomous poison spider,
wuxia xianxia style, attack stance facing left,
massive spider larger than human, black exoskeleton,
glowing green poison veins, eight legs with poison barbs,
multiple glowing eyes, fangs dripping venom,
2D game sprite art, enemy monster style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 15. Rock Serpent (Lvl 7)
- **Ficheiro:** `mob_rock_serpent.png`
```
Full body monster sprite, ancient rock serpent snake,
wuxia xianxia style, coiled strike stance facing left,
massive stone-scaled serpent, grey rocky scales,
amber glowing eyes, stone spikes on back,
coiled powerful body ready to strike,
2D game sprite art, enemy monster style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 16. Bandit Captain (Lvl 7)
- **Ficheiro:** `mob_bandit_captain.png`
```
Full body character sprite, Chinese bandit captain leader,
wuxia xianxia style, commanding stance facing left,
battle-hardened veteran commander appearance,
quality dark leather armor with stolen gold ornaments,
holding fine dao sword, facial battle scar,
2D game sprite art, enemy character style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 17. Corrupted Disciple (Lvl 8)
- **Ficheiro:** `mob_corrupted_disciple.png`
```
Full body character sprite, darkness corrupted disciple,
wuxia xianxia style, twisted stance facing left,
young face twisted by dark corruption,
torn sect robes with dark energy veins visible,
dark purple corruption aura, evil glowing eyes,
2D game sprite art, enemy character style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 18. Crystal Golem (Lvl 8)
- **Ficheiro:** `mob_crystal_golem.png`
```
Full body monster sprite, spirit crystal golem construct,
wuxia xianxia style, guardian stance facing left,
massive humanoid made of purple spirit crystals,
no face just glowing gems, powerful crystal fists,
ancient mine guardian construct awakened,
2D game sprite art, enemy construct style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

### Level 9: Peak Qi Condensation

#### 19. Forest Guardian (Lvl 9)
- **Ficheiro:** `mob_forest_guardian.png`
```
Full body monster sprite, ancient forest guardian spirit,
wuxia xianxia style, protective stance facing left,
massive treant nature elemental, body of ancient wood,
glowing green nature eyes, vines as limbs,
moss and flowers growing on wooden body,
2D game sprite art, enemy elemental style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 20. Frost Wolf (Lvl 9)
- **Ficheiro:** `mob_frost_wolf.png`
```
Full body monster sprite, alpha frost wolf ice beast,
wuxia xianxia style, howling stance facing left,
massive wolf larger than horse, silver-white fur,
covered in ice crystals, glowing blue frost eyes,
frost breath visible, ice forming around paws,
2D game sprite art, enemy beast style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

---

## 📍 Foundation Establishment Realm (Level 10-19)

### Level 10-12: Early Foundation

#### 21. Ghost Cultivator (Lvl 10)
- **Ficheiro:** `mob_ghost_cultivator.png`
```
Full body monster sprite, vengeful ghost cultivator spirit,
wuxia xianxia style, floating attack stance facing left,
translucent spectral floating form, tattered ancient robes,
hollow glowing green eyes, spiritual chains binding,
ghostly energy wisps around undead body,
2D game sprite art, enemy ghost style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 22. Corrupted Monk (Lvl 10)
- **Ficheiro:** `mob_corrupted_monk.png`
```
Full body character sprite, fully corrupted evil monk,
wuxia xianxia style, dark stance facing left,
bald with dark corruption tattoos covering head,
black corrupted monk robes, eyes completely black,
dark scepter staff weapon, radiating corruption aura,
2D game sprite art, enemy character style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 23. Iron Claw Chief (Lvl 11)
- **Ficheiro:** `mob_iron_claw_chief.png`
```
Full body character sprite, Iron Claw bandit clan chief,
wuxia xianxia style, war chief stance facing left,
massive scarred veteran warrior, war chief armor,
iron claw gauntlets as weapons, iron claw tribal tattoos,
commanding brutal presence, intimidating leader,
2D game sprite art, enemy boss style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 24. Shadow Assassin (Lvl 11)
- **Ficheiro:** `mob_shadow_assassin.png`
```
Full body character sprite, shadow realm assassin killer,
wuxia xianxia style, striking pose facing left,
body merging with living shadows, dark ninja outfit,
only glowing red eyes visible in darkness,
shadow daggers in hands, smoke-like dark aura,
2D game sprite art, enemy assassin style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 25. Stone Guardian (Lvl 12)
- **Ficheiro:** `mob_stone_guardian.png`
```
Full body monster sprite, ancient stone guardian statue,
wuxia xianxia style, awakened stance facing left,
massive stone warrior statue come alive,
carved ancient armor and stone weapons, glowing rune eyes,
heavy stone body, ancient temple protector,
2D game sprite art, enemy construct style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 26. Abyssal Serpent (Lvl 12)
- **Ficheiro:** `mob_abyssal_serpent.png`
```
Full body monster sprite, abyssal depths serpent dragon,
wuxia xianxia style, rising attack stance facing left,
massive water serpent dragon, dark blue-black scales,
bioluminescent markings glowing, multiple fins,
deep sea monster from the abyss, ancient leviathan,
2D game sprite art, enemy dragon style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

### Level 13-15: Mid Foundation

#### 27. Ancient Lich (Lvl 13)
- **Ficheiro:** `mob_ancient_lich.png`
```
Full body monster sprite, ancient undead lich sorcerer,
wuxia xianxia style, casting stance facing left,
skeletal mage in rotting robes, crown of dark power,
glowing purple soul fire eyes, holding necromancer staff,
undead magic aura swirling around bones,
2D game sprite art, enemy undead style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 28. Celestial Phoenix (Lvl 14)
- **Ficheiro:** `mob_celestial_phoenix.png`
```
Full body monster sprite, young celestial phoenix bird,
wuxia xianxia style, wings spread stance facing left,
majestic divine fire bird, burning golden crimson feathers,
divine sacred flames around body, proud fierce noble eyes,
wings spread with fire trails behind,
2D game sprite art, enemy divine beast style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 29. Corrupted Elder Tree (Lvl 14)
- **Ficheiro:** `mob_corrupted_elder_tree.png`
```
Full body monster sprite, corrupted ancient elder tree,
wuxia xianxia style, attacking stance facing left,
massive twisted evil treant, bark with dark veins,
glowing red evil eyes, gnarled branches as weapons,
once noble nature spirit now corrupted to evil,
2D game sprite art, enemy corrupted style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 30. Cursed Jade Guardian (Lvl 15)
- **Ficheiro:** `mob_cursed_jade_guardian.png`
```
Full body monster sprite, cursed jade statue guardian,
wuxia xianxia style, corrupted stance facing left,
massive jade warrior construct, green jade body,
curse black veins spreading, glowing cursed eyes,
ancient jade armor and sword, temple protector gone wrong,
2D game sprite art, enemy construct style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

### Level 16-19: High Foundation

#### 31. Flame Demon (Lvl 16)
- **Ficheiro:** `mob_flame_demon.png`
```
Full body monster sprite, infernal flame demon lord,
wuxia xianxia style, hellfire stance facing left,
humanoid demon made of hellfire, horned head,
burning ember eyes, molten rock skin,
flames erupting from demonic body, fire armor,
2D game sprite art, enemy demon style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 32. Ice Queen (Lvl 16)
- **Ficheiro:** `mob_ice_queen.png`
```
Full body character sprite, ice realm demon queen ruler,
wuxia xianxia style, regal stance facing left,
beautiful but deadly ice demon woman, pale blue skin,
crown of eternal ice crystals, elegant frozen dress,
blizzard aura swirling around body,
2D game sprite art, enemy boss style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 33. Lightning Elemental (Lvl 17)
- **Ficheiro:** `mob_lightning_elemental.png`
```
Full body monster sprite, pure lightning elemental being,
wuxia xianxia style, crackling stance facing left,
humanoid made of living lightning, no solid form,
constant lightning bolts arcing from electric body,
storm incarnate, pure energy creature,
2D game sprite art, enemy elemental style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 34. Divine Beast (Lvl 18)
- **Ficheiro:** `mob_divine_beast.png`
```
Full body monster sprite, ancient divine beast qilin,
wuxia xianxia style, majestic stance facing left,
mythical qilin creature, scaled body with divine markings,
antlers of light, hooves of fire, mane of clouds,
celestial guardian beast of legend,
2D game sprite art, enemy divine style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 35. Shadow Lord (Lvl 19)
- **Ficheiro:** `mob_shadow_lord.png`
```
Full body character sprite, shadow realm demon lord,
wuxia xianxia style, dark lord stance facing left,
humanoid made of living darkness, crown of shadow thorns,
eyes of void purple, cape of living shadows,
absolute darkness incarnate, terror of the shadows,
2D game sprite art, enemy boss style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 36. Soul Reaver (Lvl 19)
- **Ficheiro:** `mob_soul_reaver.png`
```
Full body monster sprite, soul reaver death entity,
wuxia xianxia style, reaping stance facing left,
spectral reaper of souls, hooded skeletal form,
soul energy swirling around, scythe of soul harvesting,
captured souls orbiting the death entity,
2D game sprite art, enemy reaper style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

---

## 📍 Golden Core Realm (Level 20-29)

#### 37. Void Beast (Lvl 20)
- **Ficheiro:** `mob_void_beast.png`
```
Full body monster sprite, eldritch void beast horror,
wuxia xianxia style, impossible stance facing left,
impossible geometry body form, dark purple black void matter,
multiple eyes in wrong places, reality warping around it,
tentacles of pure darkness, alien horror,
2D game sprite art, enemy eldritch style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 38. Stone Colossus (Lvl 21)
- **Ficheiro:** `mob_stone_colossus.png`
```
Full body monster sprite, ancient stone colossus titan,
wuxia xianxia style, towering stance facing left,
massive stone giant, ancient carved armor,
runes glowing across granite body, primordial titan,
each step causes earthquakes, mountain-sized,
2D game sprite art, enemy titan style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 39. Thunder Dragon Whelp (Lvl 22)
- **Ficheiro:** `mob_thunder_dragon_whelp.png`
```
Full body monster sprite, young thunder dragon whelp,
wuxia xianxia style, flying stance facing left,
Eastern long dragon serpent form, golden blue scales,
crackling with lightning, storm clouds forming around,
young but proud dragon learning its power,
2D game sprite art, enemy dragon style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 40. Infernal Phoenix (Lvl 23)
- **Ficheiro:** `mob_infernal_phoenix.png`
```
Full body monster sprite, infernal phoenix elder bird,
wuxia xianxia style, blazing stance facing left,
massive ancient phoenix of hellfire, body of eternal flames,
wings spread across frame, divine and demonic fire mixed,
reborn countless times, ancient eternal fire,
2D game sprite art, enemy legendary style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 41. Eternal Guardian (Lvl 24)
- **Ficheiro:** `mob_eternal_guardian.png`
```
Full body monster sprite, eternal guardian construct,
wuxia xianxia style, sentinel stance facing left,
massive immortal construct being, celestial metals and jade body,
eternal runes glowing, wielding divine weapons,
protector of sacred grounds for millennia,
2D game sprite art, enemy guardian style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 42. Void Sovereign (Lvl 25)
- **Ficheiro:** `mob_void_sovereign.png`
```
Full body character sprite, void sovereign demon king,
wuxia xianxia style, sovereign stance facing left,
ruler of the void dimension, humanoid wrong proportions,
crown of void matter, reality bends around presence,
absolute void power emanating from body,
2D game sprite art, enemy boss style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

#### 43. Three-Headed Thunder Dragon (Lvl 26)
- **Ficheiro:** `mob_three_headed_dragon.png`
```
Full body monster sprite, three-headed thunder dragon lord,
wuxia xianxia style, legendary stance facing left,
massive ancient Eastern dragon with three heads,
each head different expression, lightning between heads,
golden emperor scales, legendary divine wyrm,
2D game sprite art, enemy legendary style,
simple solid dark grey background, isolated creature,
clean edges, full body visible, anime game asset
```

#### 44. Undead Emperor (Lvl 28)
- **Ficheiro:** `mob_undead_emperor.png`
```
Full body character sprite, ancient undead emperor lich king,
wuxia xianxia style, imperial stance facing left,
skeletal emperor in imperial death robes,
crown of dark imperial power, eyes of eternal undeath,
imperial regalia of the dead, absolute necromantic power,
2D game sprite art, final boss style,
simple solid dark grey background, isolated character,
clean edges, full body visible, anime game asset
```

---

# 🗺️ BACKGROUNDS DE COMBATE (22 MAPAS)

> **Nota:** Para backgrounds usa **16:9** (1024x576) no Leonardo.ai

## 🏯 Azure Cloud Sect - Safe Zones (5)

### Azure Cloud Main Hall
- **Ficheiro:** `bg_azure_cloud_main_hall.png`
```
Wide panoramic game background, Azure Cloud Sect main hall arena,
wuxia xianxia setting, grand Chinese cultivation sect courtyard,
jade platform in center, ornate pillars with cloud motifs,
incense burning, peaceful spiritual atmosphere,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, serene cultivation headquarters
```

### Spirit Herb Garden
- **Ficheiro:** `bg_spirit_herb_garden.png`
```
Wide panoramic game background, spirit herb garden arena,
wuxia xianxia setting, beautiful terraced garden clearing,
glowing medicinal herbs and spiritual plants around edges,
open space in center for combat, healing energy atmosphere,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, magical medicinal garden
```

### Martial Training Grounds
- **Ficheiro:** `bg_martial_training_grounds.png`
```
Wide panoramic game background, martial arts training grounds arena,
wuxia xianxia setting, open courtyard with weapon racks on sides,
wooden training dummies in background, dusty ground,
disciplined training atmosphere, combat ready arena,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, active martial training area
```

### Alchemy Pavilion
- **Ficheiro:** `bg_alchemy_pavilion.png`
```
Wide panoramic game background, alchemy pavilion arena,
wuxia xianxia setting, courtyard near pill refining building,
smoking furnaces in background, colorful smoke rising,
mystical pill crafting atmosphere, alchemical energy,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, magical alchemy workshop exterior
```

### Outer Disciple Quarters
- **Ficheiro:** `bg_outer_disciple_quarters.png`
```
Wide panoramic game background, outer disciple quarters arena,
wuxia xianxia setting, simple wooden huts in background,
humble peaceful cultivation area, simple lifestyle,
open ground for combat, starting point atmosphere,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, humble cultivation beginning
```

---

## 🚪 Sect Gates - Transition Zones (4)

### North Gate
- **Ficheiro:** `bg_north_gate.png`
```
Wide panoramic game background, sect northern gate arena,
wuxia xianxia setting, massive stone gate archway,
wilderness visible beyond gates, danger awaits outside,
guard towers on sides, protective talismans on gates,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, gateway to adventure
```

### South Gate
- **Ficheiro:** `bg_south_gate.png`
```
Wide panoramic game background, sect southern gate arena,
wuxia xianxia setting, gate leading to misty swamps,
fog and mist visible beyond, ominous atmosphere,
fewer guards, less traveled mysterious path,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, path of no return
```

### West Ruins
- **Ficheiro:** `bg_west_ruins.png`
```
Wide panoramic game background, ancient western ruins arena,
wuxia xianxia setting, crumbling stone pillars,
forgotten civilization remains, restless ghost energy,
overgrown with vines, spiritual residue haunted,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, mysterious ancient ruins
```

### Bamboo Forest
- **Ficheiro:** `bg_bamboo_forest.png`
```
Wide panoramic game background, mystical bamboo forest arena,
wuxia xianxia setting, tall dense bamboo grove clearing,
mist between bamboo stalks, serene but dangerous,
natural beauty with hidden threats, filtered green light,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, deceptively peaceful forest
```

---

## ⚔️ Combat Zones (13)

### Rocky Path
- **Ficheiro:** `bg_rocky_path.png`
```
Wide panoramic game background, treacherous rocky path arena,
wuxia xianxia setting, uneven terrain with boulders,
narrow path through rocky outcrops, mountain peaks distant,
harsh environment, danger of ambush from rocks,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, dangerous mountain passage
```

### Iron Claw Bandit Camp
- **Ficheiro:** `bg_iron_claw_bandit_camp.png`
```
Wide panoramic game background, bandit encampment arena,
wuxia xianxia setting, crude tents and campfires around,
stolen goods piled on sides, criminal hideout,
watchtowers in background, dangerous outlaw atmosphere,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, hostile bandit territory
```

### Abandoned Spirit Mine
- **Ficheiro:** `bg_abandoned_spirit_mine.png`
```
Wide panoramic game background, abandoned mine cave arena,
wuxia xianxia setting, underground crystal mine cavern,
glowing purple spirit crystals on walls, mining equipment,
ancient mining operation, rich but dangerous treasure,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, treasure-filled danger zone
```

### Thunder Peak Base
- **Ficheiro:** `bg_thunder_peak_base.png`
```
Wide panoramic game background, thunder peak base arena,
wuxia xianxia setting, mountain base with lightning above,
storm clouds gathering, dragon territory ahead,
lightning striking in background, electric qi in air,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, dragon mountain approach
```

### Thunder Peak Summit
- **Ficheiro:** `bg_thunder_peak_summit.png`
```
Wide panoramic game background, thunder peak summit arena,
wuxia xianxia setting, peak above the clouds,
constant heavenly tribulation lightning striking,
ultimate cultivation trial location, legendary epic,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, legendary dragon summit
```

### Misty Poison Swamp
- **Ficheiro:** `bg_misty_poison_swamp.png`
```
Wide panoramic game background, toxic poison swamp arena,
wuxia xianxia setting, murky waters with poison fog,
dead trees around, venomous green mist,
toxic reducing visibility, dangerous poisonous terrain,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, deadly swamp zone
```

### Blackwater Lake
- **Ficheiro:** `bg_blackwater_lake.png`
```
Wide panoramic game background, dark blackwater lake arena,
wuxia xianxia setting, pitch black still waters,
ancient serpents lurking beneath hinted, ominous ripples,
dead silence atmosphere, ancient evil slumbers below,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, ancient evil slumbers
```

### Hermit's Hut
- **Ficheiro:** `bg_hermits_hut.png`
```
Wide panoramic game background, hermit hut clearing arena,
wuxia xianxia setting, small isolated hut in background,
strange old cultivator decorations, wilderness clearing,
mysterious wisdom atmosphere, odd mystical items around,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, wisdom seeker destination
```

### Haunted Graveyard
- **Ficheiro:** `bg_haunted_graveyard.png`
```
Wide panoramic game background, haunted graveyard arena,
wuxia xianxia setting, tombstones of fallen cultivators,
restless spirits floating in background, ghost qi permeating,
mist and ethereal glow, the dead don't rest here,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, restless dead zone
```

### Ancient Tomb Entrance
- **Ficheiro:** `bg_ancient_tomb_entrance.png`
```
Wide panoramic game background, ancient tomb entrance arena,
wuxia xianxia setting, massive sealed tomb doors behind,
Undead Emperor domain, centuries sealed ominous,
dark carvings and warnings visible, dark power within,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, gateway to ancient evil
```

### Inner Tomb Chambers
- **Ficheiro:** `bg_inner_tomb_chambers.png`
```
Wide panoramic game background, inner tomb chambers arena,
wuxia xianxia setting, treasure filled burial chambers,
ancient artifacts on pedestals, gold and cursed items,
traps everywhere hinted, tomb raiders beware,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, cursed treasure vault
```

### Tomb Inner Sanctum
- **Ficheiro:** `bg_tomb_inner_sanctum.png`
```
Wide panoramic game background, Undead Emperor throne room arena,
wuxia xianxia setting, final resting place of emperor,
massive throne of bones and dark power in center,
ultimate evil atmosphere, final boss arena,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, final boss arena
```

### Spirit Beast Den
- **Ficheiro:** `bg_spirit_beast_den.png`
```
Wide panoramic game background, spirit beast den arena,
wuxia xianxia setting, forest clearing with beast dens,
roars echoing atmosphere, apex predators rule here,
bones of prey scattered, territorial markings visible,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, predator territory
```

### Elder's Peak
- **Ficheiro:** `bg_elders_peak.png`
```
Wide panoramic game background, hidden immortal peak arena,
wuxia xianxia setting, mountain peak with dense spiritual energy,
ancient immortal cultivated here, sacred ground,
waterfalls of qi, legendary cultivation spot,
2D game battle arena background, side-scrolling fighter style,
no characters, empty arena ready for combat,
detailed anime background art, wide aspect ratio 16:9,
high quality, legendary cultivation peak
```

---

# 📝 RESUMO RÁPIDO

## Ficheiros a Criar:

### 👤 Player Classes (12):
| Ficheiro | Classe |
|----------|--------|
| `class_1_blazing_sword.png` | Blazing Sword Immortal |
| `class_2_glacial_shadow.png` | Glacial Shadow |
| `class_3_spellfire_duelist.png` | Spellfire Duelist |
| `class_4_toxic_viper.png` | Toxic Viper |
| `class_5_asura_of_war.png` | Asura of War |
| `class_6_frozen_steel_guard.png` | Frozen Steel Guard |
| `class_7_verdant_blade_monarch.png` | Verdant Blade Monarch |
| `class_8_wilderness_stalker.png` | Wilderness Stalker |
| `class_9_phoenix_cry.png` | Phoenix Cry Cultivator |
| `class_10_divine_melody.png` | Divine Melody Healer |
| `class_11_phantom_musician.png` | Phantom Musician |
| `class_12_unbreakable_sage.png` | Unbreakable Spirit Sage |

### 👹 Priority Mobs (gerar primeiro):
| Ficheiro | Mob |
|----------|-----|
| `mob_spirit_rat.png` | Spirit Rat (Lvl 1) |
| `mob_garden_spider.png` | Garden Spider (Lvl 1) |
| `mob_sect_servant.png` | Sect Servant (Lvl 2) |
| `mob_herb_spirit.png` | Herb Spirit (Lvl 3) |
| `mob_bandit_thug.png` | Bandit Thug (Lvl 6) |
| `mob_frost_wolf.png` | Frost Wolf (Lvl 9) |

### 🗺️ Priority Backgrounds (gerar primeiro):
| Ficheiro | Mapa |
|----------|------|
| `bg_azure_cloud_main_hall.png` | Azure Cloud Main Hall |
| `bg_north_gate.png` | North Gate |
| `bg_rocky_path.png` | Rocky Path |
| `bg_bamboo_forest.png` | Bamboo Forest |

---

# ⚙️ CONFIGURAÇÕES LEONARDO.AI

## Para SPRITES (Classes + Mobs):
- **Model:** Anime
- **Style:** Anime General
- **Dimensions:** 1:1 Medium (960x960)
- **Contrast:** High
- **Generation Mode:** Fast

## Para BACKGROUNDS:
- **Model:** Anime
- **Style:** Anime General  
- **Dimensions:** 16:9 (1024x576)
- **Contrast:** High
- **Generation Mode:** Fast

## NEGATIVE PROMPT (Usar SEMPRE):
```
cropped, close up, portrait only, face only, bust shot,
blurry, low quality, deformed, bad anatomy, extra limbs,
watermark, signature, text, logo
```

## Para SPRITES adicionar:
```
background details, complex background, scenery, landscape
```

---

# 🔧 PÓS-PROCESSAMENTO

1. **Remove Background:** https://www.remove.bg/ (grátis)
2. **Resize se necessário:** Mantém 960x960 para sprites
3. **Guarda em PNG** com transparência
4. **Coloca na pasta correta:**
   - Classes: `public/assets/combat/characters/player/`
   - Mobs: `public/assets/combat/characters/enemies/`
   - Backgrounds: `public/assets/combat/backgrounds/`

---

Boa sorte a gerar! 🎨
wuxia xianxia setting, gate leading to misty swamps,
fog and mist visible beyond, ominous atmosphere,
fewer guards, less traveled path,
mysterious dangerous path atmosphere,
detailed anime background art, fantasy RPG location,
misty ominous lighting, wide aspect ratio 16:9,
high quality, path of no return
```

### West Ruins (-2,0)
```
Wide panoramic landscape, ancient western ruins,
wuxia xianxia setting, crumbling stone pillars,
forgotten civilization remains, restless ghost energy,
overgrown with vines, spiritual residue,
haunted ancient atmosphere,
detailed anime background art, fantasy RPG location,
eerie ghostly lighting, wide aspect ratio 16:9,
high quality, mysterious ancient ruins
```

### Bamboo Forest (2,0)
```
Wide panoramic landscape, mystical bamboo forest,
wuxia xianxia setting, tall dense bamboo grove,
mist between bamboo stalks, spirit beasts hiding,
serene but dangerous, natural beauty with hidden threats,
peaceful danger atmosphere,
detailed anime background art, fantasy RPG location,
filtered green bamboo lighting, wide aspect ratio 16:9,
high quality, deceptively peaceful forest
```

---

## ⚔️ Combat Zones (13)

### Rocky Path (0,3)
```
Wide panoramic landscape, treacherous rocky mountain path,
wuxia xianxia setting, uneven terrain with boulders,
narrow path through rocky outcrops, danger of ambush,
mountain peaks in distance, harsh environment,
challenging journey atmosphere,
detailed anime background art, fantasy RPG location,
harsh mountain lighting, wide aspect ratio 16:9,
high quality, dangerous mountain passage
```

### Iron Claw Bandit Camp (-1,3)
```
Wide panoramic landscape, Iron Claw bandit encampment,
wuxia xianxia setting, crude tents and campfires,
bandits around fires, stolen goods piled,
watchtowers and traps, criminal hideout,
dangerous outlaw atmosphere,
detailed anime background art, fantasy RPG location,
campfire night lighting, wide aspect ratio 16:9,
high quality, hostile bandit territory
```

### Abandoned Spirit Mine (0,4)
```
Wide panoramic landscape, abandoned spirit crystal mine,
wuxia xianxia setting, cave entrance with mining equipment,
glowing spirit crystals visible inside, golem guardians,
ancient mining operation, rich but dangerous,
treasure and danger atmosphere,
detailed anime background art, fantasy RPG location,
crystal purple glow lighting, wide aspect ratio 16:9,
high quality, treasure-filled danger zone
```

### Thunder Peak Base (0,5)
```
Wide panoramic landscape, thunder peak mountain base,
wuxia xianxia setting, mountain crackling with lightning,
storm clouds gathering above, dragon territory ahead,
lightning striking constantly, electric qi in air,
apex predator territory atmosphere,
detailed anime background art, fantasy RPG location,
dramatic lightning storm lighting, wide aspect ratio 16:9,
high quality, dragon mountain approach
```

### Thunder Peak Summit (0,6)
```
Wide panoramic landscape, thunder peak mountain summit,
wuxia xianxia setting, peak above the clouds,
constant heavenly tribulation lightning, dragons gathering,
ultimate cultivation trial location, legendary,
apocalyptic power atmosphere,
detailed anime background art, fantasy RPG location,
epic tribulation lightning lighting, wide aspect ratio 16:9,
high quality, legendary dragon summit
```

### Misty Poison Swamp (0,-3)
```
Wide panoramic landscape, toxic poison swamp,
wuxia xianxia setting, murky waters with poison fog,
dead trees, venomous creatures lurking,
toxic mist reducing visibility, dangerous terrain,
poisonous death trap atmosphere,
detailed anime background art, fantasy RPG location,
sickly green poison fog lighting, wide aspect ratio 16:9,
high quality, deadly swamp zone
```

### Blackwater Lake (0,-4)
```
Wide panoramic landscape, dark blackwater lake,
wuxia xianxia setting, pitch black still waters,
ancient serpents lurking beneath, ominous ripples,
dead silence, do not disturb the depths,
dread and ancient evil atmosphere,
detailed anime background art, fantasy RPG location,
dark ominous water lighting, wide aspect ratio 16:9,
high quality, ancient evil slumbers
```

### Hermit's Hut (-1,-4) [Safe Zone]
```
Wide panoramic landscape, hermit cultivator hut,
wuxia xianxia setting, small isolated hut in wilderness,
strange old cultivator living in seclusion,
mysterious wisdom for a price, odd decorations,
mysterious sage atmosphere,
detailed anime background art, fantasy RPG location,
mysterious dim hut lighting, wide aspect ratio 16:9,
high quality, wisdom seeker destination
```

### Haunted Graveyard (-3,0)
```
Wide panoramic landscape, haunted cultivator graveyard,
wuxia xianxia setting, tombstones of fallen cultivators,
restless spirits floating, ghost qi permeating,
mist and ethereal glow, the dead don't rest,
haunted death atmosphere,
detailed anime background art, fantasy RPG location,
eerie ghostly green lighting, wide aspect ratio 16:9,
high quality, restless dead zone
```

### Ancient Tomb Entrance (-4,0)
```
Wide panoramic landscape, ancient tomb entrance,
wuxia xianxia setting, massive sealed tomb doors,
Undead Emperor's domain, centuries sealed,
ominous carvings and warnings, dark power within,
ancient sealed evil atmosphere,
detailed anime background art, fantasy RPG location,
dark ominous entrance lighting, wide aspect ratio 16:9,
high quality, gateway to ancient evil
```

### Inner Tomb Chambers (-4,1)
```
Wide panoramic landscape, inner tomb treasure chambers,
wuxia xianxia setting, treasure filled burial chambers,
ancient artifacts and curses, traps everywhere,
gold and danger, tomb raiders beware,
deadly treasure atmosphere,
detailed anime background art, fantasy RPG location,
golden treasure torch lighting, wide aspect ratio 16:9,
high quality, cursed treasure vault
```

### Tomb Inner Sanctum (-5,0)
```
Wide panoramic landscape, Undead Emperor throne room,
wuxia xianxia setting, final resting place of emperor,
massive throne of bones and dark power,
only the strongest survive, final boss arena,
ultimate evil atmosphere,
detailed anime background art, fantasy RPG location,
dark necrotic throne lighting, wide aspect ratio 16:9,
high quality, final boss arena
```

### Spirit Beast Den (3,0)
```
Wide panoramic landscape, spirit beast hunting grounds,
wuxia xianxia setting, forest clearing with beast dens,
roars echoing, apex predators rule here,
bones of prey scattered, territorial markings,
savage wilderness atmosphere,
detailed anime background art, fantasy RPG location,
wild forest lighting, wide aspect ratio 16:9,
high quality, predator territory
```

### Elder's Peak (4,0)
```
Wide panoramic landscape, hidden immortal elder peak,
wuxia xianxia setting, mountain peak with dense spiritual energy,
ancient immortal cultivated here, sacred ground,
waterfalls of qi, legendary cultivation spot,
legendary sacred atmosphere,
detailed anime background art, fantasy RPG location,
divine golden spiritual lighting, wide aspect ratio 16:9,
high quality, legendary cultivation peak
```

---

# 📝 DICAS DE USO

## Configurações Leonardo.ai Recomendadas:
- **Model:** Leonardo Anime XL (melhor para estilo anime)
- **Dimensions:** 512x512 para personagens/monstros, 1024x576 para backgrounds
- **Guidance:** 7-8
- **Steps:** 30-40

## Negative Prompt (usar sempre):
```
blurry, low quality, deformed, bad anatomy, extra limbs, disfigured, poorly drawn, ugly, duplicate, watermark, signature, text
```

## Remover Fundo (para personagens):
Usa https://www.remove.bg/ (grátis) após gerar

## Ordem de Prioridade:
1. ⭐ Classes 1-4 (Sword) - Os mais jogados inicialmente
2. ⭐ Monstros Level 1-5 (Starter zone)
3. ⭐ Backgrounds: Main Hall, North Gate, Rocky Path
4. Depois expandir gradualmente

---

Boa sorte! 🎨

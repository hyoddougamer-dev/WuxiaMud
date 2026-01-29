# 🎨 WUXIA VISUAL SYSTEM - Guia de Uso

Sistema de efeitos visuais premium para dar **BANG!** ao jogo.

---

## 📦 COMPONENTES REACT

### Importar:
```tsx
import { 
  WuxiaButton, 
  WuxiaPanel, 
  InventorySlot, 
  ResourceBar, 
  RarityText, 
  WuxiaModal, 
  NotificationBadge, 
  WuxiaDivider 
} from './components/ui/WuxiaUI';
```

### WuxiaButton
```tsx
<WuxiaButton variant="primary" size="md" icon={<Sword />}>
  Attack
</WuxiaButton>

// Variantes: 'primary' | 'spirit' | 'danger' | 'ghost'
// Sizes: 'sm' | 'md' | 'lg'
```

### WuxiaPanel
```tsx
<WuxiaPanel title="Inventory" icon={<Package />} variant="default">
  {children}
</WuxiaPanel>

// Variantes: 'default' | 'spirit' | 'dark'
```

### InventorySlot
```tsx
<InventorySlot 
  item={item} 
  rarity="Spirit" 
  onClick={() => {}} 
  selected={false}
>
  <ItemIcon item={item} />
</InventorySlot>
```

### ResourceBar
```tsx
<ResourceBar current={hp} max={maxHp} type="hp" showText />
<ResourceBar current={qi} max={maxQi} type="qi" size="sm" />
<ResourceBar current={exp} max={expToLevel} type="exp" />
```

### RarityText
```tsx
<RarityText rarity="Immortal" glow>
  Divine Phoenix Blade
</RarityText>
```

---

## 🎨 CLASSES CSS DISPONÍVEIS

### Buttons
| Classe | Descrição |
|--------|-----------|
| `btn-wuxia` | Botão dourado wuxia (principal) |
| `btn-spirit` | Botão roxo mágico (QI/magic) |
| `btn-danger` | Botão vermelho (destruir/cancelar) |

### Panels
| Classe | Descrição |
|--------|-----------|
| `panel-wuxia` | Painel com borda dourada e glow |
| `panel-spirit` | Painel com tema roxo mágico |
| `card-hover` | Card com lift effect ao hover |

### Inventory Slots
| Classe | Descrição |
|--------|-----------|
| `inv-slot` | Slot base de inventário |
| `inv-slot-mortal` | Slot cinza (comum) |
| `inv-slot-earth` | Slot verde (uncommon) |
| `inv-slot-heaven` | Slot azul pulsante (rare) |
| `inv-slot-spirit` | Slot roxo animado (epic) |
| `inv-slot-immortal` | Slot dourado brilhante (legendary) |

### HP/QI Bars
| Classe | Descrição |
|--------|-----------|
| `hp-bar` | Container da barra HP |
| `hp-bar-fill` | Fill da barra HP |
| `hp-bar-fill.hp-low` | Pulso crítico quando HP < 25% |
| `qi-bar` | Container da barra QI |
| `qi-bar-fill` | Fill da barra QI com energia fluindo |

### Shimmer Effects
| Classe | Descrição |
|--------|-----------|
| `shimmer-rare` | Shimmer diagonal para itens raros |
| `sparkle-legendary` | Sparkles nas corners para legendaries |

### Text Effects
| Classe | Descrição |
|--------|-----------|
| `text-legendary` | Texto dourado com gradient animado |
| `text-spirit-glow` | Texto roxo com glow pulsante |

---

## ⚔️ EFEITOS DE COMBATE

| Classe | Descrição |
|--------|-----------|
| `damage-flash` | Shake ao receber dano |
| `attack-swing` | Animação de ataque |
| `dodge-blur` | Blur ao dodge |
| `block-impact` | Impacto ao bloquear |
| `crit-flash` | Flash vermelho ao crit |
| `death-dissolve` | Dissolve ao morrer |
| `victory-burst` | Burst ao vencer |

---

## 🎮 EFEITOS DE LOOT

| Classe | Descrição |
|--------|-----------|
| `loot-drop` | Animação de drop de item |
| `loot-beam-rare` | Beam azul para itens raros |
| `loot-beam-epic` | Beam roxo para epics |
| `loot-beam-legendary` | Beam dourado para legendaries |
| `coin-bounce` | Bounce para coins/gold |

---

## 🧘 EFEITOS DE CULTIVATION

| Classe | Descrição |
|--------|-----------|
| `qi-aura` | Aura de QI circular |
| `breakthrough-surge` | Explosão ao fazer breakthrough |
| `cultivation-glow` | Glow durante cultivation |
| `meditation-pulse` | Pulse durante meditação |

---

## 🎭 EFEITOS ELEMENTAIS

| Classe | Descrição |
|--------|-----------|
| `element-fire` | Flicker de fogo |
| `element-ice` | Shimmer de gelo |
| `element-lightning` | Crackle de raio |
| `element-poison` | Bubble de veneno |

---

## 📜 EFEITOS DE QUEST

| Classe | Descrição |
|--------|-----------|
| `quest-available` | Glow para quest disponível |
| `quest-complete` | Celebração ao completar |
| `scroll-unfurl` | Animação de scroll abrindo |

---

## ✨ UTILITÁRIOS

| Classe | Descrição |
|--------|-----------|
| `fade-in-up` | Fade in com slide up |
| `slide-in-right` | Slide in da direita |
| `float-gentle` | Float suave contínuo |
| `rotate-slow` | Rotação lenta contínua |
| `pulse-ring` | Anel pulsante ao redor |
| `hover-glow` | Glow ao fazer hover |
| `hover-scale` | Scale up ao hover |
| `hover-lift` | Lift com sombra ao hover |
| `level-up-glow` | Explosão de level up |

---

## 📝 EXEMPLOS DE USO

### Item Raro com Beam
```tsx
<div className="relative loot-beam-rare">
  <InventorySlot rarity="Heaven">
    <ItemIcon item={item} />
  </InventorySlot>
</div>
```

### Botão de Skill com Glow
```tsx
<button className="btn-spirit hover-glow">
  <Zap size={16} />
  Qi Blast
</button>
```

### Painel de Combat
```tsx
<div className="panel-wuxia fade-in-up">
  <ResourceBar current={hp} max={maxHp} type="hp" />
  <div className="damage-flash">
    Combat Log...
  </div>
</div>
```

### Item Legendário
```tsx
<div className="inv-slot-immortal sparkle-legendary shimmer-rare">
  <RarityText rarity="Immortal">
    Celestial Dragon Sword
  </RarityText>
</div>
```

---

**🎮 Usa estas classes para dar vida ao jogo!**

---

##  SISTEMA DE ÍCONES

### Importar Ícones:
```tsx
import { 
  GameIcon, 
  CombatLogIcon, 
  StatusEffectIcon, 
  ElementIcon, 
  ResourceIcon, 
  QuestIcon, 
  CultivationIcon,
  TextWithIcon 
} from './components/ui/GameIcon';

import { 
  formatStatusEffect, 
  getStatusEffectDisplay, 
  getElementDisplay,
  ICONS,
  EMOJI_FALLBACKS 
} from './data/iconSystem';
```

### Ícones Disponíveis:
- Combat: player_attack, enemy_attack, player_crit, enemy_crit, heal, buff, debuff, passive, victory, flee, warning, system
- UI: hp_bar, qi_bar, inventory_slot, skill_button, tooltip
- Cultivation: meditation, qi_energy, spirit_stone, enlightenment, cauldron, yin_yang
- Quests: main_quest, side_quest, bounty, achievement, quest_scroll


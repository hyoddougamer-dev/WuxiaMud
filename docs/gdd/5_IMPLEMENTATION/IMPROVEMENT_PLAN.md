# 🎮 凌云道 (Língyún Dào) - Ponto de Situação & Plano de Melhorias

## 📊 ESTADO ATUAL DO JOGO

### ✅ O Que Já Funciona

#### 🗡️ Sistema de Combate
- **12 Classes Híbridas** com passivas únicas (Blazing Sword Immortal, Glacial Shadow, etc.)
- **5 Elementos**: Fire, Ice, Wood, Lightning, Void
- **Sistema de Buff/Debuff** completo com efeitos temporários
- **Combos** (sistema de sequências de skills)
- **Animações básicas** de ataque, hit flash, floating damage
- **Sistema Visual Combat Arena** (componente criado mas não 100% integrado)
- **Feedback de dano elementar** (super effective, resisted)
- **Turn-based** com cooldowns de skills

#### 👤 Sistema de Personagens
- **Multi-character slots** (até 5 personagens)
- **Autenticação** com Supabase (login/register)
- **Progressão de nível** com AP points
- **5 Stats**: STR, DEX, CON, SPI, WIL
- **Equipamento**: Weapon, Ring, Necklace (3 slots)
- **Skills aprendíveis** por tier

#### 🌍 Mundo
- **Mapa visual** com múltiplas zonas
- **NPCs** com diálogos
- **Quests** (sistema completo com objetivos)
- **Bestiary** com progresso e rewards
- **Tutorial** para novos jogadores

#### 🎒 Inventário & Crafting
- **Inventário** com tabs (gear, consumables, materials, junk)
- **Crafting modal** para criar items
- **Reforging** para melhorar raridade
- **Loot system** com pity protection
- **Bank** para guardar items

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 🎨 UI/Interface

| Problema | Impacto | Prioridade |
|----------|---------|------------|
| **Arena de combate** parece "flat" e genérica | Falta imersão visual | 🔴 Alta |
| **Barras de HP/QI** muito simples | Pouca informação visual | 🟡 Média |
| **Skills no hotbar** pequenos e sem destaque | Difícil usar em mobile | 🔴 Alta |
| **Feedback de dano** desaparece rápido | Player perde informação | 🟡 Média |
| **Combat log** é um bloco de texto | Pouco intuitivo | 🟡 Média |
| **Sprites de mobs** podem não existir | Placeholders genéricos | 🔴 Alta |
| **Falta indicador de turno** claro | Confusão sobre quem ataca | 🟡 Média |

### ⚔️ Combate

| Problema | Impacto | Prioridade |
|----------|---------|------------|
| **Auto-combat** muito passivo | Boring to watch | 🟡 Média |
| **Defesas** (block/dodge/counter) pouco usadas | Combate é só "spam skills" | 🟡 Média |
| **Passivas** trigger sem fanfare visual | Player não percebe | 🟡 Média |
| **Elementos** pouco impactantes visualmente | Falta feedback | 🔴 Alta |
| **Combos** difíceis de ver/entender | Sistema subutilizado | 🟡 Média |

### 🎯 Onboarding

| Problema | Impacto | Prioridade |
|----------|---------|------------|
| **Início sem equipamento** (só pills) | Player fraco demais | 🔴 Alta |
| **Tutorial** muito textual | Players pulam | 🟡 Média |
| **Primeira quest** não guia bem | Confusão inicial | 🔴 Alta |
| **Falta "first kill" reward** | Sem dopamina inicial | 🔴 Alta |
| **Classe escolhida mas sem gear** | Frustração | 🔴 Alta |

---

## 🛠️ PLANO DE MELHORIAS

### FASE 1: Starter Kit & Onboarding (Prioridade 🔴)

#### 1.1 Starter Kit por Classe
Cada jogador começa com equipamento básico da sua classe:

```typescript
const STARTER_KITS = {
  // SWORD CLASSES (1, 3, 5, 9)
  sword: {
    weapon: { name: 'Disciple\'s Iron Sword', tier: 1, rarity: 'Common', atk: 5 },
    ring: { name: 'Copper Focus Ring', tier: 1, rarity: 'Common', bonuses: { spi: 2 } },
    necklace: { name: 'Jade Training Pendant', tier: 1, rarity: 'Common', bonuses: { hp: 20 } },
  },
  // SABER CLASSES (2, 4, 6, 8)
  saber: {
    weapon: { name: 'Initiate\'s Steel Saber', tier: 1, rarity: 'Common', atk: 6 },
    ring: { name: 'Iron Will Band', tier: 1, rarity: 'Common', bonuses: { str: 2 } },
    necklace: { name: 'Disciple Amulet', tier: 1, rarity: 'Common', bonuses: { def: 5 } },
  },
  // ZITHER CLASSES (7, 10, 11, 12)
  zither: {
    weapon: { name: 'Apprentice\'s Guqin', tier: 1, rarity: 'Common', atk: 4, spi: 5 },
    ring: { name: 'Meditation Ring', tier: 1, rarity: 'Common', bonuses: { qi: 20 } },
    necklace: { name: 'Harmony Pendant', tier: 1, rarity: 'Common', bonuses: { spi: 3 } },
  },
};
```

#### 1.2 Inventário Inicial Melhorado

```typescript
const STARTER_INVENTORY = [
  // Consumíveis básicos
  { name: 'HP Pill', count: 5, heal: 30 },
  { name: 'QI Pill', count: 3, restore: 20 },
  
  // Material para tutorial de crafting
  { name: 'Spirit Wood Fragment', count: 3, type: 'material' },
  
  // Junk para ensinar sobre venda
  { name: 'Tattered Cloth', count: 2, sellValue: 5 },
  
  // Primeira quest scroll
  { name: 'Elder\'s Mission Scroll', type: 'quest_item' },
];

// Spirit Stones iniciais
spiritStones: 50, // Para comprar primeira upgrade
```

#### 1.3 First Quest - "A Jornada Começa"
Quest automática que guia o jogador:

```
QUEST: "The Path Begins" (Auto-aceite)

OBJETIVOS:
1. ⬜ Fala com Elder Zhang (NPC na zona inicial) - Reward: +10 XP
2. ⬜ Equipa a tua arma - Reward: +5 Spirit Stones
3. ⬜ Derrota um Spirit Rat (mob mais fraco) - Reward: +15 XP, +10 Spirit Stones
4. ⬜ Usa uma HP Pill - Reward: +5 XP
5. ⬜ Visita o Forge (tab) - Reward: Receita de crafting

COMPLETION REWARD:
- Uncommon Ring ou Necklace (escolha do player)
- 100 XP (suficiente para nível 2!)
- Title: "Iniciado"
```

---

### FASE 2: UI do Combate (Prioridade 🔴/🟡)

#### 2.1 Arena Visual Melhorada

```
┌────────────────────────────────────────────────────────────┐
│ [BACKGROUND: Zone-specific artwork with parallax effect]   │
│                                                            │
│  ┌─────────────┐                     ┌─────────────┐       │
│  │  PLAYER     │   VS INDICATOR      │   ENEMY     │       │
│  │  [Sprite]   │      ⚔️             │  [Sprite]   │       │
│  │  (idle anim)│                     │ (idle anim) │       │
│  └─────────────┘                     └─────────────┘       │
│                                                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ❤️ HP ████████████░░░░░░ 847/1000                     │ │
│  │ 💠 QI ██████████████░░░░ 45/60                        │ │
│  │ ⚡ COMBO: 3x (Fire > Ice > Fire)                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────┐┌─────┐┌─────┐┌─────┐  ┌─────┐┌─────┐┌─────┐      │
│  │ 🔥  ││ ❄️  ││ ⚡  ││ 🌿  │  │ 🛡️  ││ 💨  ││ ↩️  │      │
│  │SKILL││SKILL││SKILL││SKILL│  │BLOCK││DODGE││CNTR │      │
│  │  1  ││  2  ││  3  ││  4  │  │ 3s  ││ 4s  ││ 5s  │      │
│  └─────┘└─────┘└─────┘└─────┘  └─────┘└─────┘└─────┘      │
└────────────────────────────────────────────────────────────┘
```

**Melhorias visuais:**
- Sprites maiores (256x256 ou 512x512)
- Animação idle contínua (floating/breathing)
- Background com parallax layers
- Glow effect no personagem ativo
- Partículas elementais quando usa skills

#### 2.2 Combat Log Melhorado

```
┌─ COMBAT LOG ─────────────────────────────┐
│ 🔥 You deal 47 Fire damage! (Critical!)  │
│ 💔 Spirit Rat takes 47 → HP: 23/70       │
│ 🐀 Spirit Rat bites for 12 damage        │
│ ❄️ FROSTBITE chains to nearby enemy!     │
│ ⭐ COMBO COMPLETE: Phoenix Burst! +50%   │
└──────────────────────────────────────────┘
```

**Features:**
- Ícones coloridos por tipo de ação
- Damage highlighting (cores por elemento)
- Combo notifications destacadas
- Scroll automático com pausa on hover
- Timestamps opcionais (settings)

---

### FASE 3: Feedback Visual (Prioridade 🟡)

#### 3.1 Floating Damage Melhorado
- Números maiores e mais visíveis
- Cores por elemento (Fire = orange, Ice = cyan, etc.)
- "CRIT!" text adicional para críticos
- Shake screen em hits grandes
- Stack de números (não sobrepor)

#### 3.2 Element Burst Effects
Quando um ataque é "super effective":
- Flash de cor do elemento na tela inteira (300ms)
- Partículas explosivas
- Sound effect (placeholder para agora)
- Text popup: "🔥 SUPER EFFECTIVE! x1.5"

#### 3.3 Passive Trigger Banner
Quando uma passiva activa:
```
╔══════════════════════════════════════╗
║  🔥 INFERNO AURA TRIGGERED!          ║
║  Bonus fire damage to all enemies!   ║
╚══════════════════════════════════════╝
```
- Banner no topo que slide in/out
- Cor baseada no elemento da passiva
- Duração: 2 segundos

---

### FASE 4: Balance & Progressão (Prioridade 🟢)

#### 4.1 Curva de Dificuldade Inicial
```
Level 1-3: Spirit Rats, Garden Spiders
           - HP: 30-50
           - Damage: 5-10
           - XP: 15-25
           - ALWAYS drop: Pills (30% chance)
           - Starter gear drops (10% chance)

Level 4-6: Sect Servants, Training Dummies
           - HP: 70-100
           - Damage: 12-18
           - XP: 35-50
           - First "real" challenge
           - Uncommon gear chance (5%)
```

#### 4.2 "Power Spike" System
Momentos onde o jogador sente que ficou mais forte:
- **Level 5**: Unlock 2nd skill slot
- **Level 10**: Unlock 3rd skill slot + Class passive upgrade
- **Level 15**: 4th skill slot + Access to Foundation realm gear
- **Level 20**: Ultimate skill unlock (via quest)

---

## 📋 IMPLEMENTAÇÃO RECOMENDADA

### Sprint 1 (Esta Semana) - Onboarding
1. ✅ Criar sistema de Starter Kits por classe
2. ✅ Adicionar equipamento inicial ao `initialPlayerState`
3. ✅ Criar quest "The Path Begins"
4. ✅ Ajustar mobs iniciais para serem mais fáceis

### Sprint 2 (Próxima Semana) - UI Combat
1. 🔲 Melhorar layout da arena de combate
2. 🔲 Criar/integrar sprites (ou usar placeholders bonitos)
3. 🔲 Redesign das skill bars
4. 🔲 Melhorar combat log

### Sprint 3 (Semana 3) - Feedback
1. 🔲 Floating damage redesign
2. 🔲 Element burst effects
3. 🔲 Passive trigger banners
4. 🔲 Screen shake e juice effects

### Sprint 4 (Semana 4) - Polish
1. 🔲 Balance pass nos primeiros 10 níveis
2. 🔲 Tutorial interactivo (não só texto)
3. 🔲 Achievement para primeiras ações
4. 🔲 Sound effects (ou placeholder)

---

## 🎯 MÉTRICAS DE SUCESSO

### Onboarding
- [ ] Player entende controles em < 2 minutos
- [ ] Primeira vitória em combate em < 3 minutos
- [ ] Equipamento inicial permite sobreviver 3 combates sem pills

### Combate
- [ ] Combat log é lido (não ignorado)
- [ ] Players usam defesas além de skills
- [ ] Feedback visual claro para cada ação

### Retenção
- [ ] Player chega a level 5 na primeira sessão
- [ ] Player regressa para 2ª sessão (criar save system cloud)
- [ ] Player experimenta 2+ classes

---

## ✅ CORREÇÕES IMPLEMENTADAS (Session 2)

### Data: Janeiro 2026

#### Bug Fixes
| Issue | Solução | Ficheiro |
|-------|---------|----------|
| Starter kit com items fictícios (ring, necklace, materials) | Removidos items inexistentes, apenas arma + consumíveis | `src/data/starterKits.ts` |
| Equipment bonus mostrando "str/dex" em vez de "Ox Power/Wind Walk" | Mudado labels para OXP/WND/GLD/DAO/HRT com tooltips | `src/components/pages/CharacterPage.tsx` |
| "Set Active" sem explicação | Adicionada secção de Set Bonus com lista de sets e benefícios | `src/components/pages/CharacterPage.tsx` |
| Música não toca ao tirar mute | Melhorada lógica de toggleMute para retomar áudio | `src/contexts/MusicContext.tsx` |
| Materials do inventário não refletem na Forge | Corrigido para usar `materialId` em vez de `id` | `src/App.tsx` |
| Quest tutorial não inicia automaticamente | Criada `createQuestLogWithTutorial()` e usada na criação de personagem | `src/data/questSystem.ts`, `src/App.tsx` |
| Auto-combat não respeitava limite de 30min | Corrigida lógica de reset diário e check de limite na inicialização | `src/App.tsx` |

---

## 🎨 RECOMENDAÇÕES - COMBAT UI IMPROVEMENTS

### Problemas Atuais
1. **Arena visualmente "flat"** - Falta profundidade e elementos temáticos Wuxia
2. **Hotbar de skills pouco destacada** - Difícil de usar em mobile, ícones pequenos
3. **Floating damage básico** - Números desaparecem rápido, pouca diferenciação visual
4. **Combat log é bloco de texto** - Difícil de seguir a ação
5. **Falta de "juice"** - Poucos screen shakes, particle effects, element bursts

### Melhorias Recomendadas

#### 1. Arena Visual Redesign
- [ ] Adicionar moldura decorativa estilo pergaminho/madeira chinesa
- [ ] Aumentar contraste entre personagem e background
- [ ] Adicionar partículas ambientes (folhas, energia, etc.)
- [ ] Ground effects sob os personagens (círculos de energia)

#### 2. Hotbar Wuxia Style
- [ ] Aumentar tamanho dos botões de skill para 64x64px
- [ ] Adicionar bordas douradas/bronze estilo selo chinês
- [ ] Cooldown radial em vez de número
- [ ] Glow effect quando skill está pronta
- [ ] Tooltip ao hover com nome, descrição e custo QI

#### 3. Floating Damage Enhancement
- [ ] Cores por elemento mais vibrantes
- [ ] Críticos com animação "pop" maior
- [ ] Trail effect no número enquanto sobe
- [ ] Ícone do elemento junto ao número
- [ ] Miss/Block/Dodge com texto estilizado

#### 4. Combat Log Redesign
- [ ] Ícones para cada tipo de ação (⚔️ ataque, 🛡️ defesa, ✨ skill)
- [ ] Timestamps opcionais
- [ ] Highlight de eventos críticos (crits, passivas)
- [ ] Pause on hover
- [ ] Filtros por tipo de log

#### 5. Visual Feedback System
- [ ] Screen shake proporcional ao dano
- [ ] Element burst flash (fullscreen flash da cor do elemento)
- [ ] Passive trigger banner (slide-in animado)
- [ ] Turn indicator mais proeminente (YOUR TURN / ENEMY TURN)
- [ ] Combo indicator com contador visível

### Componentes Criados (Prontos para Integração)
Os seguintes componentes foram criados mas precisam de integração no fluxo principal:

1. **EnhancedCombatUI.tsx** - Contém:
   - `EnhancedSkillButton` - Botão de skill com styling de elemento
   - `DefenseButton` - Block/Dodge/Counter buttons
   - `VitalBarEnhanced` - HP/QI bars com animações
   - `TurnIndicator` - Banner de turno
   - `ComboIndicator` - Contador de combo
   - `PassiveTriggerBanner` - Banner de passivas
   - `ElementEffectivenessPopup` - Popup de super effective/resisted

2. **FloatingDamage.tsx** - Contém:
   - `FloatingDamageContainer` - Sistema de números flutuantes
   - `useFloatingDamage` hook - Gestão de estado
   - `triggerScreenShake` - Função de screen shake
   - `FloatingDamageOverlay` - Container overlay

3. **CSS Animations** (index.css):
   - `float-up` - Animação de números subindo
   - `critical-pop` - Animação de crítico
   - `shake-light/medium/heavy` - Screen shakes
   - `element-burst` - Flash de elemento
   - `slideIn/slideDown/popIn` - Animações UI

### Prioridade de Implementação
1. 🔴 **Alta**: Hotbar maior + tooltips de skills
2. 🔴 **Alta**: Floating damage com cores de elemento
3. 🟡 **Média**: Turn indicator proeminente
4. 🟡 **Média**: Screen shake em hits
5. 🟢 **Baixa**: Combat log com ícones
6. 🟢 **Baixa**: Arena decoration

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

1. **Testar correções implementadas** - Verificar se todos os bugs foram resolvidos
2. **Integrar componentes de UI** - Substituir UI existente pelos novos componentes
3. **Melhorar Quest UI** - Adicionar ícones e progress bars nas quests
4. **Expandir Lore** - Conectar NPCs e mobs com a história do mundo
5. **Balance Pass** - Ajustar dificuldade dos primeiros 10 níveis

# 🎮 AUDITORIA COMPLETA - 凌云道 (Língyún Dào)
## Release 1.0 - Testes Intensivos

**Data:** Janeiro 2026  
**Estado Atual:** Beta Funcional  
**Level Cap:** 29 (Golden Core Realm)

---

## 📊 SUMÁRIO EXECUTIVO

### ✅ O que está BOM:
- Sistema de combate funcional
- Bestiary completo e visualmente agradável
- Sistema de classes (12 classes únicas)
- Progressão de gear (4 tiers)
- Cultivation Page (Daily Rewards + Milestones)
- World Map com zonas definidas

### ⚠️ Precisa de MELHORIA:
- UI/UX da criação de personagem
- Tutorial interativo
- World Map visual (imagem desformatada)
- Forge Page layout e explicações
- Tooltips em combate
- Inventory stackable items

### ❌ Precisa de IMPLEMENTAÇÃO:
- Recipe Book (vazio)
- Sistema de Mercado/Trade
- Mais avatares
- Ícones personalizados para classes

---

## 🎨 1. JORNADA INICIAL (Character Creation)

### 1.1 Problemas Identificados:

**Step 1 - Identity:**
- ❌ Muito escuro, não combina com vídeo vibrante de background
- ❌ Ícone de placeholder (pessoa amarela) pouco inspirador
- ❌ Falta sensação "épica" de Wuxia

**Step 2 - Appearance:**
- ❌ Apenas 6 avatares disponíveis
- ❌ Ícone de estrela roxa placeholder
- ❌ Seleção pouco impactante visualmente

**Step 3 - Path (Class Selection):**
- ❌ Classes sem ícones personalizados
- ❌ Skills listadas sem tooltips interativos
- ❌ Falta explicação das mecânicas passivas

### 1.2 Soluções Propostas:

```
STEP 1 - IDENTITY:
┌─────────────────────────────────────────────────┐
│  🔥 Adicionar gradiente dourado/vermelho        │
│  🎭 Novo ícone: Selo/Jade em vez de pessoa      │
│  ✨ Partículas flutuantes (qi energy)           │
│  📜 Quote inspiradora de cultivo                │
└─────────────────────────────────────────────────┘

STEP 2 - APPEARANCE:
┌─────────────────────────────────────────────────┐
│  👤 Expandir para 12-18 avatares                │
│  🖼️ Grid maior com scroll horizontal            │
│  ⭐ Badge "NEW" em avatares recentes            │
│  🎨 Preview maior do avatar selecionado         │
└─────────────────────────────────────────────────┘

STEP 3 - PATH:
┌─────────────────────────────────────────────────┐
│  🗡️ Ícones únicos por classe (já temos assets)│
│  📖 Modal de skills ao hover/click             │
│  🎮 Preview de combate animado                  │
│  ⚔️ Comparação de builds sugeridas             │
└─────────────────────────────────────────────────┘
```

---

## 📚 2. TUTORIAL

### 2.1 Estado Atual:
- ❌ Apenas caixa de texto
- ❌ Sem background apelativo
- ❌ Sem interatividade
- ❌ 7 passos genéricos

### 2.2 Proposta de Redesign:

```
NOVO TUTORIAL INTERATIVO:
┌──────────────────────────────────────────────────┐
│ Passo 1: "Primeiro Combate" (Prático)            │
│ → Forçar o player a atacar um dummy              │
│ → Highlight na hotbar durante explicação         │
│                                                  │
│ Passo 2: "Usar Skill" (Prático)                 │
│ → Obrigar uso da primeira skill                  │
│ → Mostrar cooldown e qi cost                     │
│                                                  │
│ Passo 3: "Curar-se" (Prático)                   │
│ → Usar pill de cura                              │
│ → Mostrar inventário                             │
│                                                  │
│ Passo 4: "Explorar Mapa" (Prático)              │
│ → Mover para zona adjacente                      │
│ → Encontrar primeiro NPC                         │
│                                                  │
│ Passo 5: "Quest" (Prático)                      │
│ → Aceitar primeira quest                         │
│ → Mostrar tracker                                │
│                                                  │
│ Passo 6: "Recompensas" (Info)                   │
│ → Mostrar Daily Rewards                          │
│ → Explicar Cultivation Path                      │
└──────────────────────────────────────────────────┘
```

---

## 🗺️ 3. WORLD MAP

### 3.1 Problemas Identificados:
- ❌ Imagem desfocada
- ❌ Não preenche o modal
- ❌ Grid de fundo visível (quadrados transparentes)
- ❌ Nomes das zonas cortados
- ❌ Zoom inadequado

### 3.2 Soluções:

```css
/* Correções CSS necessárias: */
.world-map-container {
  background-color: #1a1a1a; /* Esconder grid */
  overflow: hidden;
}

.world-map-image {
  object-fit: cover;
  min-width: 100%;
  min-height: 100%;
}
```

**Ações:**
1. Regenerar imagem do mapa com melhor resolução
2. Adicionar labels com nomes das zonas integrados
3. Player marker mais visível
4. Zoom controls funcionais

---

## 🔥 4. CULTIVATION PAGE

### 4.1 Estado Atual: ✅ BOM
- Daily Rewards funcionais
- Milestones bem estruturados
- Visual agradável

### 4.2 Melhorias Pendentes:
- ⚠️ Trocar emojis por ícones Lucide
- ⚠️ Spirit Stones usar `<SpiritStoneIcon>`
- ⚠️ Adicionar animações de claim

**Ícones a substituir:**
```tsx
// ATUAL: 💎 200    → NOVO: <SpiritStoneIcon /> 200
// ATUAL: ✨ 500 EXP → NOVO: <Sparkles /> 500 EXP
// ATUAL: 🎁 +10    → NOVO: <Gift /> +10
```

---

## ⚔️ 5. FORGE PAGE

### 5.1 Problemas:
- ❌ Layout muito escuro
- ❌ Reforging não parece funcional
- ❌ Recipe Book vazio ("coming soon")
- ❌ Sem explicações/tooltips

### 5.2 Melhorias Propostas:

```
NOVO LAYOUT FORGE:
┌─────────────────────────────────────────────────┐
│ ═══════════ DIVINE FORGE ═══════════            │
├──────────────────┬──────────────────────────────┤
│                  │                              │
│  WEAPON CRAFT    │    WEAPON REFORGE            │
│  [Botão]         │    [Lista de armas]          │
│                  │                              │
├──────────────────┴──────────────────────────────┤
│                                                 │
│  🔧 BLACKSMITH REPAIR                           │
│  Status: All equipment in good condition        │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  📖 RECIPE BOOK                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ T1  │ │ T2  │ │ T3  │ │ T4  │ │ ???  │      │
│  │✓ 4/4│ │ 2/4 │ │ 0/4 │ │ 🔒  │ │ 🔒   │      │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
│                                                 │
│  Discovered: 6/16 recipes                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📦 6. INVENTORY PAGE

### 6.1 Estado Atual: ⚠️ OK
- Funcional mas escura
- Falta botão de stack

### 6.2 Melhorias:

```tsx
// Adicionar botão STACK ALL:
<button className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded">
  📦 Stack All Items
</button>

// Lógica:
const stackItems = () => {
  const stacked = inventory.reduce((acc, item) => {
    const existing = acc.find(i => i.name === item.name && i.stackable);
    if (existing) {
      existing.count += item.count || 1;
    } else {
      acc.push({...item});
    }
    return acc;
  }, []);
  setInventory(stacked);
};
```

---

## 👤 7. CHARACTER PAGE

### 7.1 Problemas:
- ⚠️ Frame de tooltip feia (implementada ontem)
- ⚠️ Painel esquerdo menos preenchido
- ⚠️ Validar Set Bonuses aplicados

### 7.2 Melhorias:

```
PAINEL ESQUERDO - Adicionar:
┌─────────────────────────────────────┐
│  🎭 AVATAR + NOME + TÍTULO          │
│  ══════════════════════             │
│  📊 COMBAT STATS RÁPIDOS:           │
│     ATK: 245  DEF: 120              │
│     CRIT: 15%  DODGE: 8%            │
│  ══════════════════════             │
│  🏆 ACHIEVEMENTS RECENTES:          │
│     ✓ First Blood                   │
│     ✓ 100 Kills                     │
│     ○ Dragon Slayer (50%)           │
│  ══════════════════════             │
│  ⏱️ PLAY TIME: 2h 34m               │
└─────────────────────────────────────┘
```

**Tooltips de Gear:**
- ✅ Manter tooltips informativos
- ❌ Remover frame/border extra

---

## 🌍 8. WORLD PAGE

### 8.1 Estado Atual: ✅ BOM
- Combate funcional
- NPC interactions
- Auto-combat

### 8.2 Melhorias Sugeridas:

```
ADICIONAR AO WORLD PAGE:
┌─────────────────────────────────────────────────┐
│  🌄 ZONE INFO PANEL:                            │
│     Current Zone: Rocky Path                    │
│     Danger Level: ⭐⭐☆☆☆                       │
│     Recommended: Lvl 4-6                        │
│     Monsters: 3 types                           │
│                                                 │
│  📍 QUICK TRAVEL (unlocked zones):              │
│     [Main Hall] [Training] [North Gate]         │
│                                                 │
│  🎯 ZONE OBJECTIVES:                            │
│     ○ Kill 10 Bandits (3/10)                    │
│     ○ Find Hidden Chest                         │
│     ✓ Talk to Elder Wang                        │
└─────────────────────────────────────────────────┘
```

---

## ⚔️ 9. COMBAT IMPROVEMENTS

### 9.1 Tooltips Necessários:

```tsx
// Hotbar Skills - Tooltip ao hover:
<Tooltip>
  <h3>🔥 Flame Slash</h3>
  <p>Deals 150% ATK as Fire damage</p>
  <p>QI Cost: 15</p>
  <p>Cooldown: 3 turns</p>
</Tooltip>

// Passive Skills (Dodge, Flee):
<Tooltip>
  <h3>Dodge</h3>
  <p>Chance: 12% (based on DEX)</p>
  <p>Effect: Avoid next attack</p>
</Tooltip>
```

### 9.2 Floating Damage Numbers:
- ✅ Já implementado
- ⚠️ Verificar se está visível com todas as configurações

---

## ⚖️ 10. BALANCEAMENTO

### 10.1 Tabela de Experiência Atual:

| Level | EXP Required | Realm | Est. Tempo (casual) |
|-------|-------------|-------|---------------------|
| 1→2 | 2,200 | Qi Condensation | 15 min |
| 2→3 | 5,640 | Qi Condensation | 25 min |
| 3→4 | 9,960 | Qi Condensation | 40 min |
| 4→5 | 15,030 | Qi Condensation | 1h |
| 5→6 | 20,760 | Qi Condensation | 1h 15min |
| 6→7 | 27,100 | Qi Condensation | 1h 30min |
| 7→8 | 34,000 | Qi Condensation | 2h |
| 8→9 | 41,430 | Qi Condensation | 2h 30min |
| 9→10 | 55,000 | Foundation | 3h |
| ... | ... | ... | ... |
| 28→29 | 3,600,000 | Golden Core | ~30h |

**Tempo Total Estimado (1-29):** ~150-200 horas de gameplay

### 10.2 Player vs Monster Balance:

```
ANÁLISE DE DIFICULDADE:

Level 1 Player:
  HP: 100  ATK: ~15  DEF: ~10

vs Spirit Rat (Lvl 1):
  HP: 100  ATK: 6   DEF: 5
  → Player ganha facilmente (2-3 hits)

Level 5 Player:
  HP: ~200  ATK: ~35  DEF: ~25

vs Sect Guard (Lvl 5):
  HP: 340  ATK: 18  DEF: 14
  → Player ganha com algum esforço

Level 10 Player:
  HP: ~400  ATK: ~60  DEF: ~45

vs Ghost Cultivator (Lvl 10):
  HP: 900  ATK: 48  DEF: 32
  → Desafio equilibrado

CONCLUSÃO: Balanceamento parece adequado.
Mobs não são "overkill".
```

### 10.3 Gear BiS Timeline:

| Tier | Level Range | Drop Chance | Est. Tempo para BiS |
|------|-------------|-------------|---------------------|
| T1 | 5-9 | 5% | ~2-4 horas |
| T2 | 10-14 | 3% | ~8-12 horas |
| T3 | 15-19 | 2% | ~20-30 horas |
| T4 | 20-29 | 1% | ~50-80 horas |

**BiS Completo (Weapon + Ring + Necklace T4 Legendary):**
→ Estimativa: 100-150 horas de farm

---

## 🖼️ 11. ASSETS & IMAGENS

### 11.1 Formas Rápidas de Obter Imagens:

**Opção 1: Leonardo.AI Batch Generation**
```
1. Usar prompts já preparados em LEONARDO_AI_PROMPTS.md
2. Gerar 10-20 imagens por sessão
3. Custo: ~500 tokens por batch
```

**Opção 2: Midjourney Multi-Prompt**
```
/imagine wuxia cultivator avatar, portrait, multiple variations --v 6 --s 250
→ Gera 4 imagens de uma vez
```

**Opção 3: Stable Diffusion Local**
```
Instalar AUTOMATIC1111 WebUI
Usar modelo "GuoFeng3" (estilo chinês)
Batch generate 50+ imagens overnight
```

**Opção 4: Asset Packs Gratuitos**
- OpenGameArt.org (CC0 assets)
- Itch.io (fantasy packs $5-20)
- Kenney.nl (free game assets)

### 11.2 Prompts para Avatares (Batch):

```
"wuxia cultivator portrait, male, sword wielder, traditional chinese robes, 
mystical background, glowing qi energy, digital art, game avatar, 
square format --ar 1:1 --v 6"

Variações: female, young, old, fire element, ice element, wood element...
```

---

## 🛒 12. NOVOS SISTEMAS (Release 1.0)

### 12.1 Sistema de Mercado (Proposta):

```
PLAYER MARKET:
┌─────────────────────────────────────────────────┐
│  🏪 CELESTIAL AUCTION HOUSE                     │
├─────────────────────────────────────────────────┤
│  [Buy] [Sell] [My Listings] [History]           │
├─────────────────────────────────────────────────┤
│  Category: [All] [Weapons] [Materials] [Pills]  │
│  Sort: [Price ↑] [Level] [Rarity]               │
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐   │
│  │ 🗡️ Crimson Flame Sword (Rare)           │   │
│  │    Seller: DragonLord99                  │   │
│  │    Price: 💎 5,000 Spirit Stones         │   │
│  │    [Buy Now]                             │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ 💊 HP Restoring Pill x50                 │   │
│  │    Seller: HerbMaster                    │   │
│  │    Price: 💎 500 Spirit Stones           │   │
│  │    [Buy Now]                             │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 12.2 Outros Sistemas Propostos:

| Sistema | Prioridade | Complexidade | Descrição |
|---------|-----------|--------------|-----------|
| Market | Alta | Média | Compra/Venda entre jogadores |
| Guild System | Média | Alta | Clans com bonuses |
| PvP Arena | Baixa | Alta | Duelos ranked |
| Achievements | Alta | Baixa | Conquistas com rewards |
| Leaderboards | Média | Baixa | Rankings globais |
| Chat System | Média | Média | Global + Whisper |

---

## ✅ 13. CHECKLIST RELEASE 1.0

### Crítico (Bloqueador):
- [x] Corrigir erros de sintaxe (CharacterSelectionScreen) ✅
- [x] World Map imagem corrigida ✅ (Local PNG + CSS melhorado)
- [x] Tooltips em combat hotbar ✅ (Nome, dano, QI cost, cooldown)

### Alta Prioridade:
- [x] Tutorial interativo ✅ (Mockups visuais, steps melhorados)
- [x] Melhorar Character Creation UI ✅ (Gradientes épicos, tabs M/F, partículas)
- [ ] Recipe Book básico
- [x] Stack button no Inventory ✅ (Consolida materials, consumables, junk)
- [ ] Remover frame feia dos tooltips de gear

### Média Prioridade:
- [x] Mais avatares (12-18) ✅ (20 avatares locais: 10M + 10F)
- [ ] Ícones de classe personalizados
- [ ] Zone info panel
- [ ] Animations de claim rewards

### Baixa Prioridade:
- [ ] Market system
- [ ] Achievements expanded
- [ ] Sound effects

---

## 📁 14. ESTRUTURA DE FICHEIROS SUGERIDA

```
public/
├── assets/
│   ├── avatars/
│   │   ├── male/
│   │   │   ├── avatar_m_01.jpg
│   │   │   ├── avatar_m_02.jpg
│   │   │   └── ...
│   │   └── female/
│   │       ├── avatar_f_01.jpg
│   │       └── ...
│   ├── classes/
│   │   ├── icon_blazing_sword.png
│   │   ├── icon_glacial_shadow.png
│   │   └── ...
│   ├── skills/
│   │   ├── skill_ember_slash.png
│   │   └── ...
│   └── ui/
│       ├── frame_gold.png
│       ├── button_primary.png
│       └── ...
```

---

## 🎯 15. PRÓXIMOS PASSOS

### Sprint 1 (Esta Semana):
1. ✅ Corrigir erros de código
2. 🔄 Melhorar Character Creation
3. 🔄 Tutorial interativo básico
4. 🔄 Tooltips de combate

### Sprint 2 (Próxima Semana):
1. World Map corrigido
2. Recipe Book implementado
3. Stack items button
4. Mais avatares

### Sprint 3 (Semana 3):
1. Market system básico
2. Achievements system
3. Polish final
4. Testes intensivos

---

**🎮 Estado Geral: 75% Pronto para Alpha Testing**

O jogo tem uma base sólida. As melhorias propostas são maioritariamente de polish e UX. O core gameplay está funcional e o balanceamento parece adequado para a primeira release.
